import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { Save, ArrowLeft, Plus, Trash2, FileDown, Upload } from "lucide-react";
import api from "../../api/client";

type Item = { id: string; name: string; desc?: string; qty: number; price: number; total: number; };

export default function QuoteEditor() {
  const navigate = useNavigate();
  const { id } = useParams(); // if editing existing
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("My Company Ltd");
  const [clientName, setClientName] = useState("");
  const [items, setItems] = useState<Item[]>([{ id: "i1", name: "Service A", desc: "", qty: 1, price: 0, total: 0 }]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  function calcTotal() {
    return items.reduce((s, it) => s + it.qty * it.price, 0);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const payload = {
        type: 'quotation',
        clientName,
        companyName,
        items: items.map(item => ({
          name: item.name,
          description: item.desc,
          quantity: item.qty,
          unitPrice: item.price
        })),
        notes,
        total: calcTotal(),
      };

      await api.post('/documents', payload);
      navigate("/quotes");
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

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/quotes")} className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{id ? "Edit Quote" : "New Quote"}</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/quotes")}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            {id && (
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Quote"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCompanyLogo(e.target.files?.[0] ?? null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {companyLogo ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <span className="text-sm font-medium">{companyLogo.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Upload className="w-6 h-6" />
                        <span className="text-sm">Upload Logo</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Details</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name or company"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Items</h3>
              </div>

              <div className="space-y-4">
                {items.map((it, i) => (
                  <div key={it.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100 group">
                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        value={it.name}
                        placeholder="Item name"
                        onChange={(e) => handleItemChange(i, { name: e.target.value })}
                      />
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={it.desc}
                        placeholder="Description (optional)"
                        onChange={(e) => handleItemChange(i, { desc: e.target.value })}
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-right"
                        value={it.qty}
                        onChange={(e) => handleItemChange(i, { qty: Number(e.target.value) })}
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-right"
                        value={it.price}
                        onChange={(e) => handleItemChange(i, { price: Number(e.target.value) })}
                      />
                    </div>
                    <div className="w-24 pt-2 text-right font-medium text-gray-900">
                      {(it.qty * it.price).toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(i)}
                      className="p-2 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddItem}
                className="mt-4 flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px]"
                placeholder="Additional notes, terms, or payment details..."
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>

              <div className="border border-gray-100 rounded-lg p-4 space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    {companyLogo ? (
                      <img src={URL.createObjectURL(companyLogo)} alt="logo" className="h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">Logo</div>
                    )}
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-gray-900">{companyName}</h3>
                    <p className="text-xs text-gray-500">Quote Preview</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Bill To:</p>
                  <p className="font-medium text-gray-900">{clientName || "Client Name"}</p>
                </div>

                <div className="space-y-2">
                  {items.map(it => (
                    <div key={it.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{it.name || "Item"} x{it.qty}</span>
                      <span className="font-medium text-gray-900">{(it.qty * it.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-blue-600">{calcTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
