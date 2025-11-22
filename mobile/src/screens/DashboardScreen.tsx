import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows, Colors } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    }
  });

  const { data: chartData } = useQuery({
    queryKey: ['financial-chart'],
    queryFn: async () => {
      try {
        const response = await api.get('/documents?type=invoice&limit=100');
        const docs = response.data || [];

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        const last6Months: { month: string; year: number; value: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          last6Months.push({
            month: months[d.getMonth()],
            year: d.getFullYear(),
            value: 0
          });
        }

        docs.forEach((doc: any) => {
          // Only count invoices that have been paid for accurate income tracking
          if (doc.status === 'paid') {
            const date = new Date(doc.issue_date || doc.created_at);
            const month = months[date.getMonth()];
            const year = date.getFullYear();

            const period = last6Months.find(p => p.month === month && p.year === year);
            if (period) {
              period.value += parseFloat(doc.total);
            }
          }
        });

        return {
          labels: last6Months.map(m => m.month),
          datasets: [{
            data: last6Months.map(m => m.value)
          }]
        };
      } catch (e) {
        console.error('Chart data error', e);
        return null;
      }
    }
  });

  const { data: recentDocuments } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: async () => {
      const response = await api.get('/documents?limit=3&sort=created_at:desc');
      return response.data;
    }
  });

  const StatCard = ({ title, value, icon, gradient }: any) => (
    <TouchableOpacity activeOpacity={0.9}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCard}
      >
        <View style={styles.statIconContainer}>
          <Ionicons name={icon} size={24} color="white" />
        </View>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <View style={styles.statDecoration} />
      </LinearGradient>
    </TouchableOpacity>
  );

  const ActionButton = ({ title, icon, color, onPress }: any) => (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background.secondary}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing[4] }
        ]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary[500]} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] || 'User'} 👋</Text>
            <Text style={styles.subtitle}>Here's your business overview</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Settings' as never)}>
            <LinearGradient
              colors={colors.gradients.primary as any}
              style={styles.profileGradient}
            >
              <Text style={styles.profileInitials}>
                {user?.fullName?.charAt(0) || 'U'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Quotations"
            value={stats?.quotations?.total || 0}
            icon="document-text"
            gradient={colors.gradients.primary as any}
          />
          <StatCard
            title="Invoices"
            value={stats?.invoices?.total || 0}
            icon="receipt"
            gradient={colors.gradients.secondary as any}
          />
          <StatCard
            title="Pending"
            value={stats?.quotations?.pending || 0}
            icon="time"
            gradient={colors.gradients.sunset as any}
          />
          <StatCard
            title="Clients"
            value={stats?.clients?.total || 0}
            icon="people"
            gradient={colors.gradients.ocean as any}
          />
        </View>

        {/* Financial Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Overview</Text>
          <Card style={styles.chartCard} padding={0}>
            {chartData ? (
              <LineChart
                data={chartData}
                width={width - spacing[12]}
                height={220}
                yAxisLabel="$"
                chartConfig={{
                  backgroundColor: colors.background.primary,
                  backgroundGradientFrom: colors.background.primary,
                  backgroundGradientTo: colors.background.primary,
                  decimalPlaces: 0,
                  color: (opacity = 1) => colors.primary[500],
                  labelColor: (opacity = 1) => colors.text.secondary,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: colors.primary[600]
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
            ) : (
              <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.primary[500]} />
              </View>
            )}
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Card style={styles.actionsCard} padding={4}>
            <View style={styles.actionsGrid}>
              <ActionButton
                title="New Quote"
                icon="add-circle"
                color={colors.primary[600]}
                onPress={() => navigation.navigate('DocumentCreate' as never)}
              />
              <ActionButton
                title="New Client"
                icon="person-add"
                color={colors.secondary[600]}
                onPress={() => navigation.navigate('ClientCreate' as never)}
              />
              <ActionButton
                title="Products"
                icon="cube"
                color={colors.info[500]}
                onPress={() => navigation.navigate('Products' as never)}
              />
              <ActionButton
                title="Settings"
                icon="settings"
                color={colors.gray[600]}
                onPress={() => navigation.navigate('Settings' as never)}
              />
            </View>
          </Card>
        </View>

        {/* Recent Activity Placeholder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Documents' as never)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.recentCard} padding={0}>
            {recentDocuments && recentDocuments.length > 0 ? (
              recentDocuments.map((doc: any, index: number) => {
                const isInvoice = doc.type === 'INVOICE';
                const iconName = isInvoice ? 'receipt' : 'document-text';
                const iconColor = isInvoice ? colors.secondary[600] : colors.primary[600];
                const bgColor = isInvoice
                  ? (isDark ? colors.secondary[900] : '#F0FDF4')
                  : (isDark ? colors.primary[900] : '#EEF2FF');

                const timeAgo = (date: string) => {
                  const now = new Date().getTime();
                  const created = new Date(date).getTime();
                  const diff = now - created;
                  const hours = Math.floor(diff / (1000 * 60 * 60));
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

                  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                  return 'Just now';
                };

                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[
                      styles.recentItem,
                      index !== recentDocuments.length - 1 && styles.recentItemBorder
                    ]}
                    onPress={() => (navigation as any).navigate('DocumentView', { id: doc.id })}
                  >
                    <View style={[styles.recentIcon, { backgroundColor: bgColor }]}>
                      <Ionicons name={iconName} size={20} color={iconColor} />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentTitle}>
                        {doc.type} {doc.document_number}
                      </Text>
                      <Text style={styles.recentTime}>{timeAgo(doc.created_at)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ padding: spacing[8], alignItems: 'center' }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.primary[50],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing[4]
                }}>
                  <Ionicons name="document-text" size={32} color={colors.primary[400]} />
                </View>
                <Text style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  marginBottom: spacing[1]
                }}>
                  No recent activity
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: spacing[6]
                }}>
                  Create your first quotation or invoice to get started
                </Text>
                <Button
                  title="Create First Document"
                  size="sm"
                  onPress={() => navigation.navigate('DocumentCreate' as never)}
                />
              </View>
            )}
          </Card>
        </View>

      </ScrollView >
    </View >
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[24],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  greeting: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  profileButton: {
    ...shadows.sm,
  },
  profileGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  statCard: {
    width: (width - spacing[8] - spacing[3]) / 2,
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    height: 110,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.md,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: 'white',
  },
  statTitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: typography.fontWeight.medium,
  },
  statDecoration: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  seeAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  chartCard: {
    backgroundColor: colors.background.primary,
    ...shadows.sm,
    overflow: 'hidden',
    alignItems: 'center',
  },
  actionsCard: {
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: '22%',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: colors.background.primary,
    ...shadows.sm,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  recentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  recentTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
});
