import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/Layout";
import { Plus, Search, FileText } from "lucide-react";
import api from "../../api/client";

export default function QuotesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const res = await api.get("/documents?type=quotation");
      return res.data;
    },
  });

  const filteredQuotes = quotes?.filter((q: any) =>
    statusFilter === "all" ? true : (q.status || 'draft').toLowerCase() === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'draft':
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quotes</h1>
            <p className="text-muted-foreground mt-1">Manage and track your client proposals</p>
          </div>
          <button
            onClick={() => navigate("/quotes/new")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition shadow-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Quote
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass-card p-2 rounded-xl">
          <div className="flex p-1 bg-muted rounded-lg">
            {['all', 'draft', 'sent', 'accepted'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${statusFilter === status
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search quotes..."
              className="w-full pl-9 pr-4 py-2 glass-input rounded-lg outline-none focus:ring-2 focus:ring-primary/50 transition text-sm"
            />
          </div>
        </div>

        {/* Quotes List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading quotes...</p>
          </div>
        ) : filteredQuotes?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuotes.map((quote: any) => (
              <div
                key={quote.id}
                onClick={() => navigate(`/quotes/${quote.id}`)}
                className="group glass-card p-6 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg group-hover:bg-primary/20 transition">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(quote.status || 'draft')}`}>
                    {quote.status || 'Draft'}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-1">{quote.client_name || "Untitled Client"}</h3>
                <p className="text-sm text-muted-foreground mb-4">#{quote.document_number}</p>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </div>
                  <div className="font-bold">
                    {quote.currency} {Number(quote.total).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-card rounded-xl border border-dashed border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No quotes found</h3>
            <p className="text-muted-foreground mb-6">Get started by creating your first professional quote.</p>
            <button
              onClick={() => navigate("/quotes/new")}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition font-medium shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5" />
              Create New Quote
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
