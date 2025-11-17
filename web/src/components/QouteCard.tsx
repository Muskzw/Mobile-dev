import React from "react";
import { useNavigate } from "react-router-dom";

export default function QuoteCard({ quote }: { quote: any }) {
  const nav = useNavigate();
  return (
    <div className="quote-card" onClick={() => nav(`/quotes/${quote.id}`)}>
      <div className="qc-top">
        <div className="qc-number">{quote.number}</div>
        <div className={`qc-status ${quote.status.toLowerCase()}`}>{quote.status}</div>
      </div>
      <div className="qc-client">{quote.clientName}</div>
      <div className="qc-bottom">
        <div className="qc-date">{quote.createdAt}</div>
        <div className="qc-total">${quote.total.toFixed(2)}</div>
      </div>
    </div>
  );
}
