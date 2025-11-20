import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface Client {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
}

export default function ClientViewScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const { clientId } = route.params as { clientId: string };

    const [isEditing, setIsEditing] = useState(false);
    const [editedClient, setEditedClient] = useState<Client | null>(null);

    const { data: client, isLoading } = useQuery({
        queryKey: ['client', clientId],
        queryFn: async () => {
            const response = await api.get(`/clients/${clientId}`);
            return response.data as Client;
        },
    });

    useEffect(() => {
        if (client) {
            setEditedClient(client);
        }
    }, [client]);

    const { data: clientDocuments } = useQuery({
        queryKey: ['client-documents', clientId],
        queryFn: async () => {
            const response = await api.get('/documents');
            return response.data.filter((doc: any) => doc.client_id === clientId);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.put(`/clients/${clientId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', clientId] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsEditing(false);
            Alert.alert('Success', 'Client updated successfully');
        },
        onError: (_error: any) => {
            console.error(_error);
            Alert.alert('Error', 'Failed to update client');
        },
    });

    const handleSave = () => {
        if (!editedClient?.name || !editedClient?.email) {
            Alert.alert('Error', 'Name and email are required');
            return;
        }
        updateMutation.mutate(editedClient);
    };

    const handleCall = () => {
        if (client?.phone) {
            Linking.openURL(`tel:${client.phone}`);
        }
    };

    const handleEmail = () => {
        if (client?.email) {
            Linking.openURL(`mailto:${client.email}`);
        }
    };

    if (isLoading || !client) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Client Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Client Details</Text>
                {!isEditing && (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Ionicons name="create-outline" size={24} color={colors.primary[600]} />
                    </TouchableOpacity>
                )}
                {isEditing && <View style={{ width: 40 }} />}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Client Header */}
                <Card style={styles.clientHeader} padding={6}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{client.name.charAt(0)}</Text>
                    </View>
                    {isEditing ? (
                        <>
                            <Input
                                label="Name"
                                value={editedClient?.name}
                                onChangeText={(text) => setEditedClient({ ...editedClient!, name: text })}
                                style={styles.input}
                            />
                            <Input
                                label="Email"
                                value={editedClient?.email}
                                onChangeText={(text) => setEditedClient({ ...editedClient!, email: text })}
                                keyboardType="email-address"
                                style={styles.input}
                            />
                            <Input
                                label="Phone"
                                value={editedClient?.phone || ''}
                                onChangeText={(text) => setEditedClient({ ...editedClient!, phone: text })}
                                keyboardType="phone-pad"
                                style={styles.input}
                            />
                            <Input
                                label="Address"
                                value={editedClient?.address || ''}
                                onChangeText={(text) => setEditedClient({ ...editedClient!, address: text })}
                                multiline
                                numberOfLines={2}
                                style={styles.input}
                            />
                            <View style={styles.editActions}>
                                <Button
                                    title="Cancel"
                                    onPress={() => {
                                        setEditedClient(client);
                                        setIsEditing(false);
                                    }}
                                    variant="outline"
                                    style={{ flex: 1, marginRight: spacing[2] }}
                                />
                                <Button
                                    title="Save"
                                    onPress={handleSave}
                                    gradient
                                    loading={updateMutation.isPending}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.clientName}>{client.name}</Text>
                            <Text style={styles.clientEmail}>{client.email}</Text>
                            {client.phone && <Text style={styles.clientDetail}>{client.phone}</Text>}
                            {client.address && <Text style={styles.clientDetail}>{client.address}</Text>}

                            <View style={styles.quickActions}>
                                <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                                    <Ionicons name="call" size={20} color={colors.primary[600]} />
                                    <Text style={styles.actionText}>Call</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
                                    <Ionicons name="mail" size={20} color={colors.primary[600]} />
                                    <Text style={styles.actionText}>Email</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </Card>

                {/* Documents Section */}
                {!isEditing && (
                    <>
                        <Text style={styles.sectionTitle}>Documents</Text>
                        {clientDocuments && clientDocuments.length > 0 ? (
                            clientDocuments.map((doc: any) => (
                                <TouchableOpacity
                                    key={doc.id}
                                    onPress={() => (navigation as any).navigate('DocumentView', { id: doc.id })}
                                >
                                    <Card style={styles.documentCard} padding={4}>
                                        <View style={styles.documentIcon}>
                                            <Ionicons
                                                name={doc.type === 'INVOICE' ? 'receipt' : 'document-text'}
                                                size={20}
                                                color={colors.primary[600]}
                                            />
                                        </View>
                                        <View style={styles.documentInfo}>
                                            <Text style={styles.documentNumber}>{doc.document_number}</Text>
                                            <Text style={styles.documentDate}>
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <Text style={styles.documentAmount}>
                                            {doc.currency} {parseFloat(doc.total).toFixed(2)}
                                        </Text>
                                    </Card>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="documents-outline" size={48} color={colors.gray[300]} />
                                <Text style={styles.emptyText}>No documents yet</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
    },
    content: {
        padding: spacing[6],
    },
    clientHeader: {
        alignItems: 'center',
        marginBottom: spacing[6],
        backgroundColor: colors.background.primary,
        ...shadows.sm,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
    },
    avatarText: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.primary[700],
    },
    clientName: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing[1],
    },
    clientEmail: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        marginBottom: spacing[1],
    },
    clientDetail: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing[1],
    },
    quickActions: {
        flexDirection: 'row',
        marginTop: spacing[4],
        gap: spacing[4],
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary[50],
        gap: spacing[2],
    },
    actionText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colors.primary[600],
    },
    input: {
        marginBottom: spacing[3],
    },
    editActions: {
        flexDirection: 'row',
        marginTop: spacing[4],
    },
    sectionTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.secondary,
        marginBottom: spacing[3],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    documentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[3],
        backgroundColor: colors.background.primary,
        ...shadows.sm,
    },
    documentIcon: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    documentInfo: {
        flex: 1,
    },
    documentNumber: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: 2,
    },
    documentDate: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    documentAmount: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[12],
    },
    emptyText: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        marginTop: spacing[4],
    },
});
