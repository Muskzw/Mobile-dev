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

export default function ClientsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clients');
      return response.data;
    }
  });

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
    <Card style={styles.clientCard} padding={4}>
      <View style={styles.cardHeader}>
        <View style={styles.clientAvatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientDocs}>
            {item.documents_count || 0} Documents
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.contactRow}>
        {item.email && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleEmail(item.email)}
          >
            <View style={[styles.contactIcon, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="mail" size={16} color={colors.primary[600]} />
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
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.secondary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={styles.title}>Clients</Text>
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
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={48} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>No clients found</Text>
            <Text style={styles.emptySubtitle}>
              Add your first client to start creating quotations
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabContainer}
        activeOpacity={0.8}
        onPress={() => (navigation as any).navigate('ClientCreate')}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
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
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  avatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
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
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
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
