import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QuoteCard from "../../components/QuoteCard";
import Layout from "../../components/Layout";
import { Plus, Search } from "lucide-react";

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
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
            <p className="text-gray-600 mt-1">Create and manage business quotations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search quotes..."
              />
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4" />
              New Quote
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500">No quotes found</p>
              <button onClick={handleCreate} className="text-blue-600 font-medium mt-2 hover:underline">
                Create your first quote
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
