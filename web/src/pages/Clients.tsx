import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Plus, Search, User, Mail, Phone, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const params = search ? `?search=${search}` : '';
      const response = await api.get(`/clients${params}`);
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/clients', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      setEditingClient(null);
      toast.success('Client created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create client');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/clients/${editingClient.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      setEditingClient(null);
      toast.success('Client updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update client');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setConfirmDelete(null);
      toast.success('Client deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete client');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      taxNumber: formData.get('taxNumber'),
      notes: formData.get('notes')
    };

    if (editingClient) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client database</p>
          </div>
          <button
            onClick={() => {
              setEditingClient(null);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/25"
          >
            <Plus className="w-5 h-5" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Search */}
        <div className="glass-card rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : clients?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client: any) => (
              <div key={client.id} className="glass-card rounded-xl p-6 hover:shadow-lg transition group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{client.name}</h3>
                    </div>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-2 hover:bg-primary/10 rounded-lg text-primary transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(client.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {client.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="text-muted-foreground mt-2">{client.address}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center border-dashed border-2 border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No clients found</h3>
            <p className="text-muted-foreground mb-6">Add your first client to get started</p>
            <button
              onClick={() => {
                setEditingClient(null);
                setShowModal(true);
              }}
              className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5" />
              <span>Add Client</span>
            </button>
          </div>
        )}

        {/* Add Client Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card bg-background rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingClient?.name}
                    required
                    className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingClient?.email}
                    className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingClient?.phone}
                    className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    defaultValue={editingClient?.address}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex space-x-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-border rounded-xl hover:bg-accent transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/25"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingClient ? 'Update Client' : 'Create Client')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card bg-background rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-2">Delete Client</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete this client? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 border border-border rounded-xl hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-xl hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

