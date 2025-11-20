import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, currentCompany, logout } = useAuthStore();

  const [aiEnabled, setAiEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [editingCompany, setEditingCompany] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: currentCompany?.name || '',
    address: currentCompany?.address || '',
    email: currentCompany?.email || '',
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            // Navigation is handled automatically by the auth state listener in App.tsx
            // but we can force it just in case
            // navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      ]
    );
  };

  const handleSaveCompany = () => {
    // Here we would call the API to update company details
    setEditingCompany(false);
    Alert.alert('Success', 'Company details updated');
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
    type = 'switch'
  }: {
    icon: string,
    title: string,
    subtitle?: string,
    value?: boolean,
    onValueChange?: (val: boolean) => void,
    type?: 'switch' | 'link'
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={22} color={colors.primary[600]} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
          thumbColor={'white'}
        />
      )}
      {type === 'link' && (
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planText}>PRO PLAN</Text>
          </View>
        </View>

        {/* Company Settings */}
        <Text style={styles.sectionTitle}>Company Details</Text>
        <Card style={styles.card} padding={4}>
          {!editingCompany ? (
            <>
              <View style={styles.companyInfoRow}>
                <Text style={styles.companyLabel}>Name</Text>
                <Text style={styles.companyValue}>{companyForm.name}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.companyInfoRow}>
                <Text style={styles.companyLabel}>Email</Text>
                <Text style={styles.companyValue}>{companyForm.email}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.companyInfoRow}>
                <Text style={styles.companyLabel}>Address</Text>
                <Text style={styles.companyValue}>{companyForm.address || 'Not set'}</Text>
              </View>
              <Button
                title="Edit Details"
                onPress={() => setEditingCompany(true)}
                variant="outline"
                size="sm"
                style={{ marginTop: spacing[4] }}
              />
            </>
          ) : (
            <View>
              <Input
                label="Company Name"
                value={companyForm.name}
                onChangeText={(text) => setCompanyForm({ ...companyForm, name: text })}
              />
              <Input
                label="Company Email"
                value={companyForm.email}
                onChangeText={(text) => setCompanyForm({ ...companyForm, email: text })}
              />
              <Input
                label="Address"
                value={companyForm.address}
                onChangeText={(text) => setCompanyForm({ ...companyForm, address: text })}
                multiline
                numberOfLines={2}
              />
              <View style={styles.editActions}>
                <Button
                  title="Cancel"
                  onPress={() => setEditingCompany(false)}
                  variant="ghost"
                  style={{ flex: 1, marginRight: spacing[2] }}
                />
                <Button
                  title="Save"
                  onPress={handleSaveCompany}
                  gradient
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </Card>

        {/* App Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.card} padding={0}>
          <SettingItem
            icon="sparkles"
            title="AI Features"
            subtitle="Enable AI writing & insights"
            value={aiEnabled}
            onValueChange={setAiEnabled}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Updates & reminders"
            value={notifications}
            onValueChange={setNotifications}
          />
          <View style={styles.divider} />
          <TouchableOpacity>
            <SettingItem
              icon="moon"
              title="Dark Mode"
              type="link"
            />
          </TouchableOpacity>
        </Card>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <Card style={styles.card} padding={0}>
          <TouchableOpacity>
            <SettingItem
              icon="help-circle"
              title="Help Center"
              type="link"
            />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <SettingItem
              icon="shield-checkmark"
              title="Privacy Policy"
              type="link"
            />
          </TouchableOpacity>
        </Card>

        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          textStyle={{ color: colors.error }}
        />

        <Text style={styles.versionText}>Version 1.0.0</Text>
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
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing[6],
    paddingBottom: spacing[12],
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    borderWidth: 4,
    borderColor: colors.background.primary,
    ...shadows.md,
  },
  avatarText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  planBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  planText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    marginTop: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: spacing[6],
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  settingSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginLeft: spacing[16], // Indent divider to align with text
  },
  companyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  companyLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  companyValue: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing[4],
  },
  editActions: {
    flexDirection: 'row',
    marginTop: spacing[4],
  },
  logoutButton: {
    marginTop: spacing[2],
    borderColor: colors.error,
  },
  versionText: {
    textAlign: 'center',
    marginTop: spacing[6],
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
  },
});
