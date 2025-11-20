import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api/client';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Item {
  id: string;
  description: string;
  quantity: string;
  unit_price: string;
}

export default function DocumentCreateScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Queries
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clients');
      return response.data;
    }
  });

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity || '0') * parseFloat(item.unit_price || '0'));
  }, 0);
  const taxRate = 10; // Hardcoded for now, could be dynamic
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Handlers
  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: '1', unit_price: '0' }]);
  };

  const handleUpdateItem = (id: string, field: keyof Item, value: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (!selectedClient) {
      Alert.alert('Error', 'Please select a client');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      await api.post('/documents', {
        type: 'QUOTATION',
        clientId: selectedClient.id,
        date: date.toISOString(),
        items: items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unit_price)
        })),
        currency: 'USD',
        taxRate
      });

      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      Alert.alert('Success', 'Quotation created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Quotation</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Client Section */}
          <Text style={styles.sectionTitle}>Client</Text>
          <TouchableOpacity
            onPress={() => setShowClientModal(true)}
            activeOpacity={0.7}
          >
            <Card style={styles.selectorCard} padding={4}>
              {selectedClient ? (
                <View style={styles.selectedClient}>
                  <View style={styles.clientIcon}>
                    <Ionicons name="person" size={20} color={colors.primary[600]} />
                  </View>
                  <View>
                    <Text style={styles.clientName}>{selectedClient.name}</Text>
                    <Text style={styles.clientEmail}>{selectedClient.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} style={{ marginLeft: 'auto' }} />
                </View>
              ) : (
                <View style={styles.placeholderSelector}>
                  <Text style={styles.placeholderText}>Select Client</Text>
                  <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
                </View>
              )}
            </Card>
          </TouchableOpacity>

          {/* Date Section */}
          <Text style={styles.sectionTitle}>Details</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Card style={styles.selectorCard} padding={4}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.gray[500]} />
                <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
              </View>
            </Card>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event: any, selectedDate?: Date) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Items Section */}
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity onPress={handleAddItem}>
              <Text style={styles.addItemText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <Card key={item.id} style={styles.itemCard} padding={4}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNumber}>Item {index + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>

              <Input
                placeholder="Description"
                value={item.description}
                onChangeText={(text) => handleUpdateItem(item.id, 'description', text)}
                style={styles.itemInput}
              />

              <View style={styles.itemRow}>
                <View style={{ flex: 1, marginRight: spacing[2] }}>
                  <Input
                    placeholder="Qty"
                    value={item.quantity}
                    onChangeText={(text) => handleUpdateItem(item.id, 'quantity', text)}
                    keyboardType="numeric"
                    style={styles.itemInput}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Input
                    placeholder="Price"
                    value={item.unit_price}
                    onChangeText={(text) => handleUpdateItem(item.id, 'unit_price', text)}
                    keyboardType="numeric"
                    icon={<Text style={{ color: colors.gray[500] }}>$</Text>}
                    style={styles.itemInput}
                  />
                </View>
              </View>
            </Card>
          ))}

          {items.length === 0 && (
            <TouchableOpacity onPress={handleAddItem} style={styles.emptyItems}>
              <Ionicons name="add-circle-outline" size={32} color={colors.primary[400]} />
              <Text style={styles.emptyItemsText}>Tap to add items</Text>
            </TouchableOpacity>
          )}

          {/* Summary */}
          <Card style={styles.summaryCard} padding={4}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
              <Text style={styles.summaryValue}>${taxAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </Card>

        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
          <Button
            title="Create Quotation"
            onPress={handleSave}
            gradient
            loading={loading}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>

      {/* Client Modal */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Client</Text>
            <TouchableOpacity onPress={() => setShowClientModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={clients || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.clientItem}
                onPress={() => {
                  setSelectedClient(item);
                  setShowClientModal(false);
                }}
              >
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientInitials}>{item.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.clientListName}>{item.name}</Text>
                  <Text style={styles.clientListEmail}>{item.email}</Text>
                </View>
                {selectedClient?.id === item.id && (
                  <Ionicons name="checkmark" size={24} color={colors.primary[600]} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            )}
          />
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing[6],
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorCard: {
    marginBottom: spacing[6],
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  placeholderSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[2],
  },
  placeholderText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  selectedClient: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  clientEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
  },
  dateText: {
    marginLeft: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  addItemText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  itemCard: {
    marginBottom: spacing[4],
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  itemNumber: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
  },
  itemInput: {
    marginBottom: spacing[2],
    backgroundColor: colors.background.secondary,
    borderWidth: 0,
  },
  itemRow: {
    flexDirection: 'row',
  },
  emptyItems: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    marginBottom: spacing[6],
  },
  emptyItemsText: {
    marginTop: spacing[2],
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  summaryCard: {
    marginTop: spacing[4],
    backgroundColor: colors.background.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  summaryLabel: {
    color: colors.text.secondary,
  },
  summaryValue: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing[2],
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  footer: {
    padding: spacing[4],
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
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
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  clientInitials: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  clientListName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  clientListEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
