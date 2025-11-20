import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function DocumentViewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await api.get(`/documents/${id}`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'overdue': return colors.error;
      default: return colors.gray[500];
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.secondary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Details</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor(document?.status)}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(document?.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(document?.status) }]}>
            {document?.status}
          </Text>
        </View>

        {/* Document Info */}
        <Card style={styles.sectionCard} padding={6}>
          <View style={styles.docHeader}>
            <View>
              <Text style={styles.label}>Document Number</Text>
              <Text style={styles.value}>{document?.document_number}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>
                {new Date(document?.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Client</Text>
          <Text style={styles.clientName}>{document?.client?.name || 'Unknown Client'}</Text>
          <Text style={styles.clientDetail}>{document?.client?.email}</Text>
          {document?.client?.address && (
            <Text style={styles.clientDetail}>{document?.client?.address}</Text>
          )}
        </Card>

        {/* Items */}
        <Text style={styles.sectionTitle}>Items</Text>
        <Card style={styles.sectionCard} padding={0}>
          {document?.items?.map((item: any, index: number) => (
            <View key={index} style={[
              styles.itemRow,
              index !== document.items.length - 1 && styles.itemBorder
            ]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.description}</Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity} x {document.currency} {parseFloat(item.unit_price).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {document.currency} {parseFloat(item.total).toFixed(2)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Totals */}
        <Card style={styles.sectionCard} padding={6}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {document?.currency} {parseFloat(document?.subtotal || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({document?.tax_rate}%)</Text>
            <Text style={styles.totalValue}>
              {document?.currency} {parseFloat(document?.tax_amount || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {document?.currency} {parseFloat(document?.total || 0).toFixed(2)}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Actions Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
        <Button
          title="Download PDF"
          onPress={() => { }}
          variant="outline"
          style={styles.footerButton}
        />
        <Button
          title="Send Email"
          onPress={() => { }}
          gradient
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    backgroundColor: colors.background.secondary,
  },
  backButton: {
    padding: spacing[2],
  },
  menuButton: {
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[6],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginRight: spacing[2],
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  sectionCard: {
    marginBottom: spacing[6],
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing[4],
  },
  clientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  clientDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
    marginLeft: spacing[1],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  itemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  itemQuantity: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  itemTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  grandTotalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  grandTotalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    flexDirection: 'row',
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: spacing[4],
  },
  footerButton: {
    flex: 1,
  },
});
