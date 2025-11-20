import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function ProductsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', description: '', unitPrice: '' });
    const [loading, setLoading] = useState(false);

    const { data: products, isLoading } = useQuery({
        queryKey: ['saved-items'],
        queryFn: async () => {
            const response = await api.get('/saved-items');
            return response.data;
        }
    });

    const handleAddProduct = async () => {
        if (!newItem.name || !newItem.unitPrice) {
            Alert.alert('Error', 'Name and Price are required');
            return;
        }

        setLoading(true);
        try {
            await api.post('/saved-items', {
                ...newItem,
                unitPrice: parseFloat(newItem.unitPrice)
            });
            queryClient.invalidateQueries({ queryKey: ['saved-items'] });
            setShowAddModal(false);
            setNewItem({ name: '', description: '', unitPrice: '' });
            Alert.alert('Success', 'Product added successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = (id: string) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/saved-items/${id}`);
                            queryClient.invalidateQueries({ queryKey: ['saved-items'] });
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    }
                }
            ]
        );
    };

    const filteredProducts = products?.filter((item: any) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ProductItem = ({ item }: { item: any }) => (
        <Card style={styles.productCard} padding={4}>
            <View style={styles.productHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="cube-outline" size={20} color={colors.primary[600]} />
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>${parseFloat(item.unit_price).toFixed(2)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
            {item.description && (
                <Text style={styles.productDescription} numberOfLines={2}>
                    {item.description}
                </Text>
            )}
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Products & Services</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
                <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    icon={<Ionicons name="search" size={20} color={colors.gray[400]} />}
                    style={styles.searchInput}
                />
            </View>

            <FlatList
                data={filteredProducts || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ProductItem item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={48} color={colors.gray[300]} />
                        <Text style={styles.emptyTitle}>No products found</Text>
                        <Text style={styles.emptySubtitle}>
                            Add products to quickly use them in your quotations
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fabContainer}
                activeOpacity={0.8}
                onPress={() => setShowAddModal(true)}
            >
                <LinearGradient
                    colors={colors.gradients.primary as any}
                    style={styles.fab}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={28} color="white" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Add Product Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>New Product</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <Input
                                label="Product Name"
                                placeholder="e.g. Web Design"
                                value={newItem.name}
                                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                            />

                            <Input
                                label="Unit Price"
                                placeholder="0.00"
                                value={newItem.unitPrice}
                                onChangeText={(text) => setNewItem({ ...newItem, unitPrice: text })}
                                keyboardType="numeric"
                                icon={<Text style={{ color: colors.gray[500] }}>$</Text>}
                            />

                            <Input
                                label="Description"
                                placeholder="Optional description"
                                value={newItem.description}
                                onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                                multiline
                                numberOfLines={3}
                                style={{ height: 80, textAlignVertical: 'top' }}
                            />

                            <Button
                                title="Add Product"
                                onPress={handleAddProduct}
                                gradient
                                loading={loading}
                                style={{ marginTop: spacing[4] }}
                            />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[4],
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    backButton: {
        padding: spacing[2],
    },
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    searchContainer: {
        padding: spacing[4],
    },
    searchInput: {
        backgroundColor: colors.background.primary,
        borderWidth: 0,
        ...shadows.sm,
    },
    listContent: {
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[24],
    },
    productCard: {
        marginBottom: spacing[3],
        backgroundColor: colors.background.primary,
        ...shadows.sm,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    productPrice: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.primary[600],
    },
    productDescription: {
        marginTop: spacing[2],
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        paddingLeft: 52, // Align with text
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing[12],
    },
    emptyTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing[4],
    },
    emptySubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing[2],
        maxWidth: 240,
    },
    fabContainer: {
        position: 'absolute',
        right: spacing[6],
        bottom: spacing[6],
        ...shadows.lg,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing[4],
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    modalTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    closeText: {
        color: colors.primary[600],
        fontSize: typography.fontSize.base,
    },
    modalContent: {
        padding: spacing[6],
    },
});
