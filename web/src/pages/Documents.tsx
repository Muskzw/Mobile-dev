import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Plus, Search, FileText, Download } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function Documents() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', typeFilter, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/documents?${params.toString()}`);
      return response.data;
    }
  });

  const handleDownloadPDF = async (docId: string, docNumber: string) => {
    try {
      const response = await api.get(`/documents/${docId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-1">Manage your quotations, invoices, and receipts</p>
          </div>
          <Link
            to="/documents/create"
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/25"
          >
            <Plus className="w-5 h-5" />
            <span>Create Document</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg glass-input outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Types</option>
              <option value="quotation">Quotations</option>
              <option value="invoice">Invoices</option>
              <option value="proforma">Pro-forma</option>
              <option value="receipt">Receipts</option>
              <option value="delivery_note">Delivery Notes</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg glass-input outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : documents?.length > 0 ? (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-primary/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-primary/5 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-muted-foreground mr-3" />
                          <div>
                            <div className="text-sm font-medium">{doc.document_number}</div>
                            <div className="text-sm text-muted-foreground capitalize">{doc.type.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{doc.client_name || 'No client'}</div>
                        {doc.client_email && (
                          <div className="text-sm text-muted-foreground">{doc.client_email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(doc.issue_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {doc.currency} {parseFloat(doc.total).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${doc.status === 'paid' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                            doc.status === 'accepted' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                              doc.status === 'overdue' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                doc.status === 'sent' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                                  'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                          }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="text-primary hover:text-primary/80 transition"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDownloadPDF(doc.id, doc.document_number)}
                            className="text-muted-foreground hover:text-foreground transition"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center border-dashed border-2 border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-6">Get started by creating your first document</p>
            <Link
              to="/documents/create"
              className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5" />
              <span>Create Document</span>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

