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
} from 'react-native';
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
            {[1, 2, 3].map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.recentItem,
                  index !== 2 && styles.recentItemBorder
                ]}
              >
                <View style={[styles.recentIcon, { backgroundColor: index === 0 ? (isDark ? colors.primary[900] : '#EEF2FF') : (isDark ? colors.secondary[900] : '#F0FDF4') }]}>
                  <Ionicons
                    name={index === 0 ? "document-text" : "checkmark-circle"}
                    size={20}
                    color={index === 0 ? colors.primary[600] : colors.secondary[600]}
                  />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle}>
                    {index === 0 ? 'Quotation #1023 created' : 'Invoice #INV-001 paid'}
                  </Text>
                  <Text style={styles.recentTime}>2 hours ago</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

      </ScrollView>
    </View>
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
