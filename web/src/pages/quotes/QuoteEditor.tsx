import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { Save, ArrowLeft, Plus, Trash2, FileDown, Calendar, CreditCard, Settings, ChevronDown, ChevronUp, Building } from "lucide-react";
import api from "../../api/client";

type Item = { id: string; name: string; desc?: string; qty: number; price: number; total: number; };

export default function QuoteEditor() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Form State
  const [companyLogo, setCompanyLogo] = useState<string | null>(null); // Store as base64 or URL
  const [companyName, setCompanyName] = useState("My Company Ltd");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<Item[]>([{ id: "i1", name: "Service A", desc: "", qty: 1, price: 0, total: 0 }]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // UI State
  const [activeSection, setActiveSection] = useState<string | null>("items");

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    if (id) {
      loadQuote(id);
    }
  }, [id]);

  async function loadQuote(quoteId: string) {
    setIsLoading(true);
    try {
      const res = await api.get(`/documents/${quoteId}`);
      const data = res.data;

      setClientName(data.client_name || "");
      setClientEmail(data.client_email || "");
      // setClientAddress(data.client_address || ""); // Backend doesn't support this yet, but we keep state for UI
      setIssueDate(data.issue_date ? data.issue_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setDueDate(data.due_date ? data.due_date.split('T')[0] : "");
      setCurrency(data.currency || "USD");
      setTaxRate(Number(data.tax_rate) || 0);
      setNotes(data.notes || "");
      setTerms(data.terms || "");

      if (data.metadata) {
        setCompanyLogo(data.metadata.companyLogo || null);
        setClientAddress(data.metadata.clientAddress || "");
      }

      if (data.items && data.items.length > 0) {
        setItems(data.items.map((item: any) => ({
          id: item.id || `i${Math.random()}`,
          name: item.name,
          desc: item.description || "",
          qty: Number(item.quantity),
          price: Number(item.unit_price),
          total: Number(item.total)
        })));
      }
    } catch (error) {
      console.error("Failed to load quote", error);
      alert("Failed to load quote details");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSection(section: string) {
    setActiveSection(activeSection === section ? null : section);
  }

  function handleAddItem() {
    setItems([...items, { id: `i${Date.now()}`, name: "", desc: "", qty: 1, price: 0, total: 0 }]);
  }

  function handleRemoveItem(index: number) {
    const copy = [...items];
    copy.splice(index, 1);
    setItems(copy);
  }

  function handleItemChange(i: number, partial: Partial<Item>) {
    const copy = [...items];
    copy[i] = { ...copy[i], ...partial, total: ((partial.qty ?? copy[i].qty) * (partial.price ?? copy[i].price)) };
    setItems(copy);
  }

  function calcSubtotal() {
    return items.reduce((s, it) => s + it.qty * it.price, 0);
  }

  function calcTax() {
    return calcSubtotal() * (taxRate / 100);
  }

  function calcTotal() {
    return calcSubtotal() + calcTax();
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const payload = {
        type: 'quotation',
        clientName,
        // clientEmail, clientAddress (would need backend update to store these in client table or metadata)
        companyName,
        issueDate,
        dueDate,
        currency,
        taxRate,
        items: items.map(item => ({
          name: item.name,
          description: item.desc,
          quantity: item.qty,
          unitPrice: item.price
        })),
        notes,
        terms,
        total: calcTotal(),
        metadata: {
          companyLogo,
          clientAddress
        }
      };

      if (id) {
        // Update existing
        await api.put(`/documents/${id}`, payload);
        alert("Quote updated successfully!");
      } else {
        // Create new
        const res = await api.post('/documents', payload);
        const newId = res.data.id;
        // Update URL without full reload so user can continue editing/exporting
        navigate(`/quotes/${newId}`, { replace: true });
        alert("Quote created! You can now export it.");
      }
    } catch (error) {
      console.error("Failed to save quote", error);
      alert("Failed to save quote");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExportPdf() {
    if (!id) {
      alert("Please save the quote first before exporting.");
      return;
    }
    try {
      const response = await api.get(`/documents/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quote-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export PDF", error);
      alert("Failed to export PDF");
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/quotes")} className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{id ? "Edit Quote" : "New Quote"}</h1>
              <p className="text-sm text-gray-500">Create a professional quote in seconds</p>
            </div>
          </div>
          <div className="flex gap-3">
            {id && (
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Panel: Editor */}
          <div className="space-y-6">

            {/* Section: Company Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('company')}
                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Company Details</h3>
                    <p className="text-sm text-gray-500">Your business information</p>
                  </div>
                </div>
                {activeSection === 'company' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {activeSection === 'company' && (
                <div className="p-6 space-y-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                    <div className="flex items-center gap-4">
                      {companyLogo && (
                        <div className="relative w-20 h-20 border-2 border-gray-200 rounded-lg overflow-hidden">
                          <img src={companyLogo} alt="Company logo" className="w-full h-full object-contain" />
                          <button
                            onClick={() => setCompanyLogo(null)}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg hover:bg-red-600 transition"
                            type="button"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {companyLogo ? 'Change Logo' : 'Upload Logo'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG or SVG. Max 2MB.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Client Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('client')}
                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Client & Settings</h3>
                    <p className="text-sm text-gray-500">Who is this quote for?</p>
                  </div>
                </div>
                {activeSection === 'client' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {activeSection === 'client' && (
                <div className="p-6 space-y-6 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                      <input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                      <input
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                    <input
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="123 Business St, City, Country"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('items')}
                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Line Items</h3>
                    <p className="text-sm text-gray-500">Products and services</p>
                  </div>
                </div>
                {activeSection === 'items' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {activeSection === 'items' && (
                <div className="p-6 space-y-4 border-t border-gray-200">
                  {items.map((it, i) => (
                    <div key={it.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group relative hover:shadow-sm transition">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 sm:col-span-6">
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Item Name</label>
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={it.name}
                            placeholder="e.g. Web Design"
                            onChange={(e) => handleItemChange(i, { name: e.target.value })}
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Qty</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={it.qty}
                            onChange={(e) => handleItemChange(i, { qty: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Price</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={it.price}
                            onChange={(e) => handleItemChange(i, { price: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-span-12">
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                            value={it.desc}
                            placeholder="Description (optional)"
                            onChange={(e) => handleItemChange(i, { desc: e.target.value })}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(i)}
                        className="absolute -top-2 -right-2 p-1.5 bg-white text-gray-400 hover:text-red-500 shadow-sm rounded-full border border-gray-200 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddItem}
                    className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line Item
                  </button>
                </div>
              )}
            </div>

            {/* Section: Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes & Terms</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] mb-4"
                placeholder="Thank you for your business..."
              />
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] text-sm"
                placeholder="Terms and conditions..."
              />
            </div>
          </div>

          {/* Right Panel: Live Preview */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FileDown className="w-4 h-4" /> Live Preview
                </h2>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">DRAFT</span>
              </div>

              <div className="p-8 bg-white min-h-[600px] text-sm">
                {/* Preview Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    {companyLogo ? (
                      <img src={companyLogo} alt="Company logo" className="h-16 w-16 object-contain mb-2 border border-gray-200 rounded-lg p-1" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 mb-2">Logo</div>
                    )}
                    <h3 className="font-bold text-lg text-gray-900">{companyName}</h3>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-light text-gray-900 mb-2">QUOTATION</h1>
                    <p className="text-gray-500"># {id ? "Q-EDIT" : "Q-NEW"}</p>
                    <p className="text-gray-500">Date: {issueDate}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
                  <p className="font-bold text-gray-900 text-lg">{clientName || "Client Name"}</p>
                  {clientEmail && <p className="text-gray-600">{clientEmail}</p>}
                  {clientAddress && <p className="text-gray-600">{clientAddress}</p>}
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-3 font-bold text-gray-600">Description</th>
                      <th className="text-right py-3 font-bold text-gray-600 w-20">Qty</th>
                      <th className="text-right py-3 font-bold text-gray-600 w-24">Price</th>
                      <th className="text-right py-3 font-bold text-gray-600 w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map(it => (
                      <tr key={it.id}>
                        <td className="py-3">
                          <p className="font-medium text-gray-900">{it.name || "Item Name"}</p>
                          {it.desc && <p className="text-gray-500 text-xs mt-0.5">{it.desc}</p>}
                        </td>
                        <td className="text-right py-3 text-gray-600">{it.qty}</td>
                        <td className="text-right py-3 text-gray-600">{currency} {it.price.toFixed(2)}</td>
                        <td className="text-right py-3 font-medium text-gray-900">{currency} {(it.qty * it.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{currency} {calcSubtotal().toFixed(2)}</span>
                    </div>
                    {taxRate > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Tax ({taxRate}%)</span>
                        <span>{currency} {calcTax().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 border-t-2 border-gray-100 pt-2">
                      <span>Total</span>
                      <span>{currency} {calcTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {(notes || terms) && (
                  <div className="border-t border-gray-100 pt-6 space-y-4">
                    {notes && (
                      <div>
                        <p className="font-bold text-gray-900 mb-1">Notes</p>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{notes}</p>
                      </div>
                    )}
                    {terms && (
                      <div>
                        <p className="font-bold text-gray-900 mb-1">Terms & Conditions</p>
                        <p className="text-gray-600 text-xs whitespace-pre-wrap">{terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
