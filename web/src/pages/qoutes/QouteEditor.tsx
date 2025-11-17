import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./quotes.css";

type Item = { id: string; name: string; desc?: string; qty: number; price: number; total: number; };

export default function QuoteEditor() {
  const navigate = useNavigate();
  const { id } = useParams(); // if editing existing
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("My Company Ltd");
  const [clientName, setClientName] = useState("");
  const [items, setItems] = useState<Item[]>([{ id: "i1", name: "Service A", desc: "", qty: 1, price: 0, total: 0 }]);
  const [notes, setNotes] = useState("");

  function handleAddItem() {
    setItems([...items, { id: `i${Date.now()}`, name: "", desc: "", qty: 1, price: 0, total: 0 }]);
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
    // Save quote to backend
    const payload = {
      clientName,
      companyName,
      items,
      notes,
      total: calcTotal(),
    };
    // TODO: replace with POST /api/quotes
    console.log("saving", payload);
    navigate("/quotes");
  }

  return (
    <div className="quote-editor">
      <div className="editor-columns">
        <div className="editor-left">
          <div className="card">
            <label className="logo-input">
              <input type="file" accept="image/*" onChange={(e) => setCompanyLogo(e.target.files?.[0] ?? null)} />
              Upload logo
            </label>
            <div className="form-group">
              <label>Company name</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Client</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name or company"/>
            </div>

            <h3>Items</h3>
            {items.map((it, i) => (
              <div key={it.id} className="item-row">
                <input className="item-name" value={it.name} placeholder="Item or service" onChange={(e) => handleItemChange(i, { name: e.target.value })} />
                <input className="item-desc" value={it.desc} placeholder="Description" onChange={(e) => handleItemChange(i, { desc: e.target.value })} />
                <input type="number" className="item-qty" value={it.qty} onChange={(e) => handleItemChange(i, { qty: Number(e.target.value) })} />
                <input type="number" className="item-price" value={it.price} onChange={(e) => handleItemChange(i, { price: Number(e.target.value) })} />
                <div className="item-total">{(it.qty * it.price).toFixed(2)}</div>
              </div>
            ))}
            <button className="btn ghost" onClick={handleAddItem}>+ Add item</button>

            <div className="form-group">
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="editor-actions">
              <button className="btn" onClick={() => navigate("/quotes")}>Cancel</button>
              <button className="btn primary" onClick={handleSave}>Save & Send</button>
            </div>
          </div>
        </div>

        <aside className="editor-right">
          <div className="preview card">
            <div className="preview-header">
              <div className="logo-preview">{companyLogo ? <img src={URL.createObjectURL(companyLogo)} alt="logo" /> : <div className="logo-placeholder">Logo</div>}</div>
              <div>
                <h2>{companyName}</h2>
                <div className="muted">Quote preview</div>
              </div>
            </div>

            <div className="preview-body">
              <div className="preview-client">To: {clientName || "Client name"}</div>
              <table className="preview-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>
                  {items.map(it => <tr key={it.id}><td>{it.name || "—"}</td><td>{it.qty}</td><td>{it.price.toFixed(2)}</td><td>{(it.qty * it.price).toFixed(2)}</td></tr>)}
                </tbody>
              </table>
              <div className="preview-total">TOTAL: {calcTotal().toFixed(2)}</div>
              <div className="preview-notes">{notes}</div>
            </div>

            <div className="preview-actions">
              <button className="btn" onClick={() => alert("Generate PDF (server or client) TODO")}>Export PDF</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
