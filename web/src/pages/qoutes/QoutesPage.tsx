import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QuoteCard from "../../components/QuoteCard";
import "./quotes.css";

type Quote = {
  id: string;
  number: string;
  clientName: string;
  total: number;
  status: "Draft" | "Sent" | "Accepted" | "Rejected";
  createdAt: string;
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: replace with API call to /api/quotes
    setQuotes([
      { id: "1", number: "Q-0001", clientName: "Acme Ltd", total: 1250, status: "Sent", createdAt: "2025-11-01" },
      { id: "2", number: "Q-0002", clientName: "Beta Inc", total: 340, status: "Draft", createdAt: "2025-10-28" },
    ]);
  }, []);

  function handleCreate() {
    navigate("/quotes/new");
  }

  const filtered = quotes.filter(
    (x) =>
      x.number.toLowerCase().includes(q.toLowerCase()) ||
      x.clientName.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="quotes-page">
      <header className="quotes-header">
        <div>
          <h1>Quotes</h1>
          <p className="muted">Create and manage business quotations</p>
        </div>
        <div className="actions">
          <input className="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by client or quote #" />
          <button className="btn primary" onClick={handleCreate}>New Quote</button>
        </div>
      </header>

      <section className="quotes-grid">
        {filtered.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
        {filtered.length === 0 && <div className="empty">No quotes found — create one using “New Quote”.</div>}
      </section>
    </div>
  );
}
