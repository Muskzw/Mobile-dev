import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows, Colors } from '../theme';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.get('/documents');
      return response.data;
    }
  });

  const filteredDocuments = documents?.filter((doc: any) => {
    const matchesSearch =
      doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      activeFilter === 'ALL' ||
      doc.type === activeFilter;

    const matchesStatus =
      activeStatus === 'ALL' ||
      doc.status?.toUpperCase() === activeStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'overdue': return colors.error;
      case 'draft': return colors.gray[500];
      default: return colors.primary[500];
    }
  };

  const FilterTab = ({ title, value }: { title: string, value: string }) => (
    <TouchableOpacity
      onPress={() => setActiveFilter(value)}
      style={[
        styles.filterTab,
        activeFilter === value && styles.filterTabActive
      ]}
    >
      <Text style={[
        styles.filterText,
        activeFilter === value && styles.filterTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const DocumentItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon =
      item.status.toLowerCase() === 'paid' ? 'checkmark-circle' :
        item.status.toLowerCase() === 'pending' ? 'time' :
          item.status.toLowerCase() === 'overdue' ? 'alert-circle' :
            item.status.toLowerCase() === 'draft' ? 'create' : 'document';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => (navigation as any).navigate('DocumentView', { id: item.id })}
      >
        <Card style={styles.documentCard} padding={0}>
          {/* Colored accent bar */}
          <View style={[styles.accentBar, { backgroundColor: statusColor }]} />

          <View style={{ padding: spacing[4] }}>
            <View style={styles.cardHeader}>
              <View style={styles.documentIcon}>
                <LinearGradient
                  colors={[colors.primary[500], colors.primary[700]]}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={item.type === 'invoice' ? 'receipt' : 'document-text'}
                    size={20}
                    color="white"
                  />
                </LinearGradient>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.documentNumber}>{item.document_number}</Text>
                <Text style={styles.clientName}>{item.client?.name || 'Unknown Client'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                <Ionicons name={statusIcon as any} size={14} color={statusColor} style={{ marginRight: 4 }} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
              <View style={styles.footerLeft}>
                <Ionicons name="calendar-outline" size={14} color={colors.gray[400]} style={{ marginRight: 4 }} />
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.amount}>
                {item.currency} {parseFloat(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background.secondary}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity
          style={[styles.filterButton, activeStatus !== 'ALL' && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color={activeStatus !== 'ALL' ? 'white' : colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Ionicons name="search" size={20} color={colors.gray[400]} />}
          style={styles.searchInput}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
          <FilterTab title="All" value="ALL" />
          <FilterTab title="Quotes" value="quotation" />
          <FilterTab title="Invoices" value="invoice" />
          <FilterTab title="POs" value="purchase_order" />
          <FilterTab title="Proforma" value="proforma" />
          <FilterTab title="Delivery" value="delivery_note" />
          <FilterTab title="Receipts" value="receipt" />
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredDocuments || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DocumentItem item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary[500]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="documents-outline" size={48} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>No documents found</Text>
            <Text style={styles.emptySubtitle}>
              Create your first quotation or invoice to get started
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabContainer}
        activeOpacity={0.8}
        onPress={() => setShowCreateModal(true)}
      >
        <LinearGradient
          colors={colors.gradients.primary as any}
          style={styles.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={32} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModalContent}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter Documents</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.statusGrid}>
              {['ALL', 'PAID', 'PENDING', 'OVERDUE', 'DRAFT'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    activeStatus === status && styles.statusOptionActive
                  ]}
                  onPress={() => setActiveStatus(status)}
                >
                  <Text style={[
                    styles.statusOptionText,
                    activeStatus === status && styles.statusOptionTextActive
                  ]}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Apply Filters"
              onPress={() => setShowFilterModal(false)}
              gradient
              style={{ marginTop: spacing[6] }}
            />
            <Button
              title="Reset Filters"
              onPress={() => {
                setActiveStatus('ALL');
                setShowFilterModal(false);
              }}
              variant="ghost"
              style={{ marginTop: spacing[2] }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <View style={styles.createModalContent}>
            <Text style={styles.createModalTitle}>Create New</Text>

            <TouchableOpacity
              style={styles.createOption}
              onPress={() => {
                setShowCreateModal(false);
                (navigation as any).navigate('DocumentCreate', { type: 'QUOTATION' });
              }}
            >
              <View style={[styles.createIcon, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="document-text" size={24} color={colors.primary[600]} />
              </View>
              <Text style={styles.createOptionText}>Quotation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createOption}
              onPress={() => {
                setShowCreateModal(false);
                (navigation as any).navigate('DocumentCreate', { type: 'INVOICE' });
              }}
            >
              <View style={[styles.createIcon, { backgroundColor: colors.secondary[100] }]}>
                <Ionicons name="receipt" size={24} color={colors.secondary[600]} />
              </View>
              <Text style={styles.createOptionText}>Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createOption}
              onPress={() => {
                setShowCreateModal(false);
                (navigation as any).navigate('DocumentCreate', { type: 'PROFORMA' });
              }}
            >
              <View style={[styles.createIcon, { backgroundColor: colors.info[100] }]}>
                <Ionicons name="clipboard" size={24} color={colors.info[600]} />
              </View>
              <Text style={styles.createOptionText}>Proforma Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createOption}
              onPress={() => {
                setShowCreateModal(false);
                (navigation as any).navigate('DocumentCreate', { type: 'DELIVERY_NOTE' });
              }}
            >
              <View style={[styles.createIcon, { backgroundColor: colors.warning[100] }]}>
                <Ionicons name="bus" size={24} color={colors.warning[600]} />
              </View>
              <Text style={styles.createOptionText}>Delivery Note</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createOption}
              onPress={() => {
                setShowCreateModal(false);
                (navigation as any).navigate('DocumentCreate', { type: 'RECEIPT' });
              }}
            >
              <View style={[styles.createIcon, { backgroundColor: colors.success[100] }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success[600]} />
              </View>
              <Text style={styles.createOptionText}>Receipt</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
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
  filters: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  filtersContent: {
    paddingRight: spacing[6],
  },
  filterTab: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    marginRight: spacing[2],
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filterTabActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[24],
  },
  documentCard: {
    marginBottom: spacing[4],
    backgroundColor: colors.background.primary,
    ...shadows.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    marginRight: spacing[4],
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  documentNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  clientName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing[4],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  amount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  createModalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  createModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  createIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  createOptionText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[600],
  },
  filterModalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  filterTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  filterSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    textTransform: 'uppercase',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  statusOption: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.background.primary,
  },
  statusOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  statusOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  statusOptionTextActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
});
