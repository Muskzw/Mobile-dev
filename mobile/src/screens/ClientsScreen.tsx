import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Linking,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows, Colors } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components';
import { Card } from '../components/Card';

export default function ClientsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importingContacts, setImportingContacts] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clients');
      return response.data;
    }
  });

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email) {
      Alert.alert('Error', 'Name and Email are required');
      return;
    }

    setLoading(true);
    try {
      const clientData = {
        name: newClient.name.trim(),
        email: newClient.email.trim(),
        phone: newClient.phone.trim() || undefined,
        address: newClient.address.trim() || undefined,
      };

      await api.post('/clients', clientData);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowAddModal(false);
      setNewClient({ name: '', email: '', phone: '', address: '' });
      Alert.alert('Success', 'Client added successfully');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.error || 'Failed to add client';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromContacts = async () => {
    try {
      // Request permission
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need contacts permission to import your contacts');
        return;
      }

      setImportingContacts(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        const contactsWithEmail = data.filter(contact => contact.emails && contact.emails.length > 0);
        setDeviceContacts(contactsWithEmail);
        setShowImportModal(true);
      } else {
        Alert.alert('No Contacts', 'No contacts found on your device');
      }
    } catch (error) {
      console.error('Failed to import contacts:', error);
      Alert.alert('Error', 'Failed to import contacts');
    } finally {
      setImportingContacts(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };

  const handleBulkImport = async () => {
    if (selectedContacts.size === 0) {
      Alert.alert('No Selection', 'Please select at least one contact to import');
      return;
    }

    setLoading(true);
    try {
      const contactsToImport = deviceContacts.filter(c => selectedContacts.has(c.id));

      for (const contact of contactsToImport) {
        const clientData = {
          name: contact.name || 'Unknown',
          email: contact.emails?.[0]?.email || '',
          phone: contact.phoneNumbers?.[0]?.number || undefined,
        };

        try {
          await api.post('/clients', clientData);
        } catch (err) {
          console.warn(`Failed to import ${clientData.name}:`, err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowImportModal(false);
      setSelectedContacts(new Set());
      Alert.alert('Success', `Imported ${selectedContacts.size} contact(s)`);
    } catch (error) {
      Alert.alert('Error', 'Failed to import contacts');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients?.filter((client: any) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const ClientItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => (navigation as any).navigate('ClientView', { clientId: item.id })}
    >
      <Card style={styles.clientCard} padding={0}>
        <View style={{ padding: spacing[4] }}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={colors.gradients.ocean as any}
              style={styles.clientAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={styles.clientName}>{item.name || 'Unknown Client'}</Text>
              <View style={styles.docCountBadge}>
                <Ionicons name="document-text" size={12} color={isDark ? colors.primary[300] : colors.primary[600]} style={{ marginRight: 4 }} />
                <Text style={styles.clientDocs}>
                  {item.documents_count ?? 0} Documents
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[300]} />
          </View>

          {(item.email || item.phone) && (
            <>
              <View style={styles.divider} />
              <View style={styles.contactRow}>
                {item.email && (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => handleEmail(item.email)}
                  >
                    <View style={[styles.contactIcon, { backgroundColor: isDark ? colors.primary[900] + '80' : colors.primary[50] }]}>
                      <Ionicons name="mail" size={16} color={isDark ? colors.primary[300] : colors.primary[600]} />
                    </View>
                    <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
                  </TouchableOpacity>
                )}

                {item.phone && (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => handleCall(item.phone)}
                  >
                    <View style={[styles.contactIcon, { backgroundColor: colors.success + '15' }]}>
                      <Ionicons name="call" size={16} color={colors.success} />
                    </View>
                    <Text style={styles.contactText} numberOfLines={1}>{item.phone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background.secondary}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={styles.title}>Clients</Text>
        <TouchableOpacity
          onPress={handleImportFromContacts}
          style={styles.importButton}
          disabled={importingContacts}
        >
          {importingContacts ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <>
              <Ionicons name="people" size={20} color={colors.primary[600]} />
              <Text style={[styles.importText, { color: colors.primary[600] }]}>
                Import
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Ionicons name="search" size={20} color={colors.gray[400]} />}
          style={styles.searchInput}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredClients || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClientItem item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary[500]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people" size={32} color={isDark ? colors.secondary[300] : colors.secondary[400]} />
            </View>
            <Text style={styles.emptyTitle}>No clients found</Text>
            <Text style={styles.emptySubtitle}>
              Add your first client to start creating quotations
            </Text>
            <Button
              title="Add New Client"
              size="sm"
              onPress={() => setShowAddModal(true)}
              style={{ marginTop: spacing[4] }}
            />
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabContainer}
        activeOpacity={0.8}
        onPress={() => setShowAddModal(true)}
      >
        <LinearGradient
          colors={colors.gradients.secondary as any}
          style={styles.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="person-add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Client Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Client</Text>
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
                label="Client Name"
                placeholder="e.g. John Doe"
                value={newClient.name}
                onChangeText={(text) => setNewClient({ ...newClient, name: text })}
              />

              <Input
                label="Email"
                placeholder="email@example.com"
                value={newClient.email}
                onChangeText={(text) => setNewClient({ ...newClient, email: text })}
                keyboardType="email-address"
              />

              <Input
                label="Phone"
                placeholder="Optional"
                value={newClient.phone}
                onChangeText={(text) => setNewClient({ ...newClient, phone: text })}
                keyboardType="phone-pad"
              />

              <Input
                label="Address"
                placeholder="Optional"
                value={newClient.address}
                onChangeText={(text) => setNewClient({ ...newClient, address: text })}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
              />

              <Button
                title="Add Client"
                onPress={handleAddClient}
                gradient
                loading={loading}
                style={{ marginTop: spacing[4] }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Import Contacts Modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import Contacts</Text>
            <TouchableOpacity onPress={() => {
              setShowImportModal(false);
              setSelectedContacts(new Set());
            }}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: spacing[4], backgroundColor: colors.background.secondary }}>
            <Text style={[styles.importHint, { color: colors.text.secondary }]}>
              Select contacts to import ({selectedContacts.size} selected)
            </Text>
          </View>

          <FlatList
            data={deviceContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleContactSelection(item.id)}
                style={styles.contactItem}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, { color: colors.text.primary }]}>
                    {item.name || 'Unknown'}
                  </Text>
                  <Text style={[styles.contactEmail, { color: colors.text.secondary }]}>
                    {item.emails?.[0]?.email || 'No email'}
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.gray[300] },
                  selectedContacts.has(item.id) && { backgroundColor: colors.primary[600], borderColor: colors.primary[600] }
                ]}>
                  {selectedContacts.has(item.id) && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: spacing[20] }}
          />

          <View style={[styles.modalFooter, { backgroundColor: colors.background.primary }]}>
            <Button
              title={`Import ${selectedContacts.size} Contact(s)`}
              onPress={handleBulkImport}
              gradient
              loading={loading}
              disabled={selectedContacts.size === 0}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: Colors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    backgroundColor: colors.background.primary,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[2],
  },
  searchInput: {
    backgroundColor: colors.background.primary,
    borderWidth: 0,
    ...shadows.sm,
  },
  listContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[24],
  },
  clientCard: {
    marginBottom: spacing[4],
    backgroundColor: colors.background.primary,
    ...shadows.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? colors.gray[800] : colors.gray[100],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: 'white',
  },
  headerInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  clientDocs: {
    fontSize: typography.fontSize.xs,
    color: isDark ? colors.primary[300] : colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  docCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.primary[900] + '80' : colors.primary[50],
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: borderRadius.md,
  },
  divider: {
    height: 1,
    backgroundColor: isDark ? colors.gray[800] : colors.gray[100],
    marginVertical: spacing[4],
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  contactText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: isDark ? colors.secondary[900] + '80' : colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
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
    borderBottomColor: isDark ? colors.gray[800] : colors.gray[100],
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeText: {
    color: colors.primary[600],
    fontSize: typography.fontSize.base,
  },
  modalContent: {
    padding: spacing[6],
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
  },
  importText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  importHint: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? colors.gray[800] : colors.gray[100],
  },
  contactName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[1],
  },
  contactEmail: {
    fontSize: typography.fontSize.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: isDark ? colors.gray[800] : colors.gray[100],
  },
});
