import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import api from '../api/client';
import { Download, Edit, Copy, Mail, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useState } from 'react';

export default function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await api.get(`/documents/${id}`);
      return response.data;
    }
  });

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/documents/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.document_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await api.post(`/documents/${id}/duplicate`);
      toast.success('Document duplicated');
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to duplicate document');
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    setSendingEmail(true);
    try {
      await api.post(`/documents/${id}/send-email`, { email: emailAddress });
      toast.success('Document sent via email');
      setShowEmailModal(false);
      setEmailAddress('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      const response = await api.get(`/documents/${id}/whatsapp-link`);
      window.open(response.data.link, '_blank');
    } catch (error) {
      toast.error('Failed to generate WhatsApp link');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout>
        <div className="text-center py-12">Document not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{document.document_number}</h1>
            <p className="text-gray-600 mt-1 capitalize">{document.type.replace('_', ' ')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleDuplicate}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <Link
              to={`/documents/${id}/edit`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Link>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Send via Email</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="client@example.com"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendingEmail ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          {/* Document Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Issue Date</h3>
              <p className="text-gray-900">{format(new Date(document.issue_date), 'MMMM dd, yyyy')}</p>
            </div>
            {document.due_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
                <p className="text-gray-900">{format(new Date(document.due_date), 'MMMM dd, yyyy')}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                document.status === 'paid' ? 'bg-green-100 text-green-800' :
                document.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                document.status === 'overdue' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {document.status}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Quantity</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {document.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-4 text-right text-gray-900">
                      {parseFloat(item.unit_price) < 0 ? (
                        <span className="text-red-600 font-semibold">
                          -{document.currency} {Math.abs(parseFloat(item.unit_price)).toFixed(2)}
                        </span>
                      ) : (
                        <span>
                          {document.currency} {parseFloat(item.unit_price).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900">
                      {parseFloat(item.total) < 0 ? (
                        <span className="text-red-600 font-bold">
                          -{document.currency} {Math.abs(parseFloat(item.total)).toFixed(2)}
                        </span>
                      ) : (
                        <span>
                          {document.currency} {parseFloat(item.total).toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>{document.currency} {parseFloat(document.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(document.tax_amount) > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Tax ({document.tax_rate}%):</span>
                <span>{document.currency} {parseFloat(document.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{document.currency} {parseFloat(document.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Notes & Terms */}
          {document.notes && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-900 whitespace-pre-line">{document.notes}</p>
            </div>
          )}

          {document.terms && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Terms & Conditions</h3>
              <p className="text-gray-900 whitespace-pre-line">{document.terms}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

