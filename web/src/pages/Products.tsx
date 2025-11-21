import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Plus, Search, Package, Tag, DollarSign, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Products() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery({
        queryKey: ['products', search],
        queryFn: async () => {
            const response = await api.get('/saved-items');
            // Client-side filtering since backend doesn't support search param yet for saved-items
            // Or if it does, we can pass it. The current backend implementation for saved-items 
            // doesn't seem to have search query param in the GET route I saw earlier.
            // It selects all. So we filter here.
            const data = response.data;
            if (search) {
                return data.filter((item: any) =>
                    item.name.toLowerCase().includes(search.toLowerCase()) ||
                    item.description?.toLowerCase().includes(search.toLowerCase())
                );
            }
            return data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/saved-items', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setShowModal(false);
            setEditingProduct(null);
            toast.success('Product created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to create product');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.put(`/saved-items/${editingProduct.id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setShowModal(false);
            setEditingProduct(null);
            toast.success('Product updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to update product');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/saved-items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setConfirmDelete(null);
            toast.success('Product deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to delete product');
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
            unitPrice: parseFloat(formData.get('unitPrice') as string),
            taxRate: parseFloat(formData.get('taxRate') as string || '0'),
            category: formData.get('category')
        };

        if (editingProduct) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (product: any) => {
        setEditingProduct(product);
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
                        <h1 className="text-3xl font-bold">Products & Services</h1>
                        <p className="text-muted-foreground mt-1">Manage your inventory and services</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setShowModal(true);
                        }}
                        className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/25"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Product</span>
                    </button>
                </div>

                {/* Search */}
                <div className="glass-card rounded-xl p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : products?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product: any) => (
                            <div key={product.id} className="glass-card rounded-xl p-6 hover:shadow-lg transition group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition">
                                            <Package className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{product.name}</h3>
                                            {product.category && (
                                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                                                    {product.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-2 hover:bg-primary/10 rounded-lg text-primary transition"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(product.id)}
                                            className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <DollarSign className="w-4 h-4" />
                                            <span>Price</span>
                                        </div>
                                        <span className="font-semibold text-foreground">
                                            {parseFloat(product.unit_price).toFixed(2)}
                                        </span>
                                    </div>
                                    {product.tax_rate > 0 && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Tag className="w-4 h-4" />
                                                <span>Tax Rate</span>
                                            </div>
                                            <span>{product.tax_rate}%</span>
                                        </div>
                                    )}
                                    {product.description && (
                                        <div className="pt-2 border-t border-border mt-2">
                                            <p className="line-clamp-2">{product.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card rounded-xl p-12 text-center border-dashed border-2 border-border">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No products found</h3>
                        <p className="text-muted-foreground mb-6">Add your first product or service to get started</p>
                        <button
                            onClick={() => {
                                setEditingProduct(null);
                                setShowModal(true);
                            }}
                            className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/25"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Product</span>
                        </button>
                    </div>
                )}

                {/* Add/Edit Product Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card bg-background rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
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
                                        defaultValue={editingProduct?.name}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Price *
                                        </label>
                                        <input
                                            type="number"
                                            name="unitPrice"
                                            step="0.01"
                                            defaultValue={editingProduct?.unit_price}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Tax Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            name="taxRate"
                                            step="0.1"
                                            defaultValue={editingProduct?.tax_rate}
                                            className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        defaultValue={editingProduct?.category}
                                        placeholder="e.g., Service, Hardware"
                                        className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        defaultValue={editingProduct?.description}
                                        rows={3}
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
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/25"
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
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
                            <h3 className="text-xl font-bold mb-2">Delete Product</h3>
                            <p className="text-muted-foreground mb-6">
                                Are you sure you want to delete this product? This action cannot be undone.
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
