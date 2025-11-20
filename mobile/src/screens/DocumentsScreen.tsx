import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Input } from '../components/Input';
import { Card } from '../components/Card';

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

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

    const matchesFilter =
      activeFilter === 'ALL' ||
      doc.status.toUpperCase() === activeFilter;

    return matchesSearch && matchesFilter;
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

  const DocumentItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => (navigation as any).navigate('DocumentView', { id: item.id })}
    >
      <Card style={styles.documentCard} padding={4}>
        <View style={styles.cardHeader}>
          <View style={styles.documentIcon}>
            <Ionicons
              name={item.type === 'INVOICE' ? 'receipt' : 'document-text'}
              size={24}
              color={colors.primary[600]}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.documentNumber}>{item.document_number}</Text>
            <Text style={styles.clientName}>{item.client?.name || 'Unknown Client'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.amount}>
            {item.currency} {parseFloat(item.total).toFixed(2)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.secondary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={colors.primary[600]} />
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
        <View style={styles.filters}>
          <FilterTab title="All" value="ALL" />
          <FilterTab title="Paid" value="PAID" />
          <FilterTab title="Pending" value="PENDING" />
          <FilterTab title="Draft" value="DRAFT" />
        </View>
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
        onPress={() => navigation.navigate('DocumentCreate' as never)}
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
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
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
  date: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  amount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
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
});
