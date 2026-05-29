import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../api/client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, DollarSign, Plus, Trash2 } from 'lucide-react';

interface DocumentItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

interface DocumentForm {
  type: string;
  clientId?: string;
  issueDate: string;
  dueDate?: string;
  items: DocumentItem[];
  notes?: string;
  terms?: string;
  taxRate: number;
}

export default function DocumentCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const { register, control, handleSubmit, watch, setValue } = useForm<DocumentForm>({
    defaultValues: {
      type: searchParams.get('type') || 'quotation',
      issueDate: new Date().toISOString().split('T')[0],
      items: [{ name: '', quantity: 1, unitPrice: 0 }],
      taxRate: 0
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clients');
      return response.data;
    }
  });

  const items = watch('items');
  const taxRate = watch('taxRate');

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString()));
  }, 0);
  const taxAmount = subtotal * (parseFloat(taxRate.toString()) / 100);
  const total = subtotal + taxAmount;

  const onSubmit = async (data: DocumentForm) => {
    setLoading(true);
    try {
      await api.post('/documents', {
        ...data,
        items: data.items.map(item => ({
          name: item.name,
          description: item.description,
          quantity: parseFloat(item.quantity.toString()),
          unitPrice: parseFloat(item.unitPrice.toString()),
          taxRate: item.taxRate || 0
        }))
      });
      toast.success('Document created successfully!');
      navigate('/documents');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = () => {
    const input = window.prompt("Enter discount amount (e.g. 50 or 10%):");
    if (!input) return;

    const cleanInput = input.trim();
    const isPercentage = cleanInput.endsWith('%');
    const value = parseFloat(isPercentage ? cleanInput.slice(0, -1) : cleanInput);

    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }

    if (isPercentage && value > 100) {
      toast.error("Discount percentage cannot exceed 100%");
      return;
    }

    // Calculate products subtotal for percentage calculation
    const productsSubtotal = items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice?.toString() || '0');
      if (price > 0) {
        return sum + (parseFloat(item.quantity?.toString() || '0') * price);
      }
      return sum;
    }, 0);

    const calculatedAmt = isPercentage ? productsSubtotal * (value / 100) : value;

    if (calculatedAmt > productsSubtotal) {
      toast.error("Discount cannot exceed products subtotal");
      return;
    }

    append({
      name: isPercentage ? `Discount (${value}%)` : 'Discount',
      description: 'Applied discount',
      quantity: 1,
      unitPrice: -parseFloat(calculatedAmt.toFixed(2))
    });

    toast.success("Discount added successfully!");
  };

  const handleAIWrite = async (index: number) => {
    const item = items[index];
    if (!item.name) {
      toast.error('Please enter an item name first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await api.post('/ai/write-description', {
        prompt: `Write a professional description for: ${item.name}`,
        type: 'quotation'
      });
      setValue(`items.${index}.description`, response.data.text);
      toast.success('AI description generated!');
    } catch (error: any) {
      toast.error('Failed to generate description');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIPriceEstimate = async (index: number) => {
    const item = items[index];
    if (!item.name) {
      toast.error('Please enter an item name first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await api.post('/ai/estimate-price', {
        itemName: item.name
      });
      if (response.data.suggestedPrice) {
        setValue(`items.${index}.unitPrice`, response.data.suggestedPrice);
        toast.success(`AI suggested price: ${response.data.suggestedPrice}`);
      }
    } catch (error: any) {
      toast.error('Failed to estimate price');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Document</h1>
          <p className="text-gray-600 mt-1">Create a new quotation, invoice, or receipt</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  {...register('type', { required: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="quotation">Quotation</option>
                  <option value="invoice">Invoice</option>
                  <option value="proforma">Pro-forma Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="delivery_note">Delivery Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <select
                  {...register('clientId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select client...</option>
                  {clients?.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date *
                </label>
                <input
                  type="date"
                  {...register('issueDate', { required: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Discount</span>
                </button>
                <button
                  type="button"
                  onClick={() => append({ name: '', quantity: 1, unitPrice: 0 })}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const isDiscount = items[index] && parseFloat(items[index].unitPrice?.toString() || '0') < 0;
                if (isDiscount) {
                  return (
                    <div key={field.id} className="border border-dashed border-red-300 bg-red-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                          <Plus className="w-5 h-5 transform rotate-45" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block">{items[index].name}</span>
                          <span className="text-sm text-gray-500">{items[index].description || 'Applied discount'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <span className="text-lg font-bold text-red-600">
                          -${parseFloat(Math.abs(parseFloat(items[index].unitPrice?.toString() || '0')).toFixed(2))}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      {/* Hidden inputs to make sure react-hook-form receives the data correctly */}
                      <input type="hidden" {...register(`items.${index}.name`)} />
                      <input type="hidden" {...register(`items.${index}.description`)} />
                      <input type="hidden" {...register(`items.${index}.quantity`)} />
                      <input type="hidden" {...register(`items.${index}.unitPrice`)} />
                    </div>
                  );
                }

                return (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name *
                        </label>
                        <input
                          {...register(`items.${index}.name`, { required: true })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Item or service name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAIWrite(index)}
                            disabled={aiLoading}
                            className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>AI Write</span>
                          </button>
                        </div>
                        <textarea
                          {...register(`items.${index}.description`)}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Item description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.quantity`, { required: true, min: 0.01 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Unit Price *
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAIPriceEstimate(index)}
                            disabled={aiLoading}
                            className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>AI Estimate</span>
                          </button>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`, { required: true })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium">{subtotal.toFixed(2)}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('taxRate', { min: 0, max: 100 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax:</span>
                  <span className="font-medium">{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total:</span>
                <span>{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                {...register('terms')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Payment terms, delivery terms, etc."
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

