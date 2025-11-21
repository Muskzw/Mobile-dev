import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import { BASE_URL } from '../config';
import { spacing, typography, borderRadius, shadows, Colors } from '../theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, currentCompany, companies, setAuth, setCurrentCompany, logout } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const [loading, setLoading] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [editingCompany, setEditingCompany] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(currentCompany?.logo_url ? `${BASE_URL}${currentCompany.logo_url}` : null);

  const [companyForm, setCompanyForm] = useState({
    name: currentCompany?.name || '',
    address: currentCompany?.address || '',
    email: currentCompany?.email || '',
  });

  // Update form when currentCompany changes
  React.useEffect(() => {
    if (currentCompany) {
      setCompanyForm({
        name: currentCompany.name,
        address: currentCompany.address || '',
        email: currentCompany.email || '',
      });
      if (currentCompany.logo_url) {
        setLogoUri(`${BASE_URL}${currentCompany.logo_url}`);
      }
    }
  }, [currentCompany]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

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
          }
        }
      ]
    );
  };

  const handleSaveCompany = async () => {
    if (!companyForm.name) {
      Alert.alert('Error', 'Company Name is required');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', companyForm.name);
      formData.append('address', companyForm.address);
      formData.append('email', companyForm.email);

      if (logoUri && !logoUri.startsWith('http')) {
        const filename = logoUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // @ts-ignore
        formData.append('logo', {
          uri: logoUri,
          name: filename || 'logo.jpg',
          type,
        });
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      let response;
      if (currentCompany?.id) {
        // Update existing company
        response = await api.put(`/companies/${currentCompany.id}`, formData, config);

        // Update store
        const updatedCompany = response.data;
        setCurrentCompany(updatedCompany);
        // Update in companies list
        const updatedCompanies = companies.map(c => c.id === updatedCompany.id ? updatedCompany : c);
        setAuth(useAuthStore.getState().token!, user!, updatedCompanies);
      } else {
        // Create new company
        response = await api.post('/companies', formData, config);

        // Update store
        const newCompany = response.data;
        setCurrentCompany(newCompany);
        setAuth(useAuthStore.getState().token!, user!, [...companies, newCompany]);
      }

      setEditingCompany(false);
      Alert.alert('Success', 'Company details updated');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save company details');
    } finally {
      setLoading(false);
    }
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
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background.secondary}
      />

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
              <View style={styles.companyHeader}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.companyLogo} />
                ) : (
                  <View style={styles.companyLogoPlaceholder}>
                    <Text style={styles.companyLogoText}>
                      {currentCompany?.name?.charAt(0) || 'C'}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.companyInfoRow}>
                    <Text style={styles.companyLabel}>Name</Text>
                    <Text style={styles.companyValue}>{companyForm.name}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.companyInfoRow}>
                    <Text style={styles.companyLabel}>Email</Text>
                    <Text style={styles.companyValue}>{companyForm.email}</Text>
                  </View>
                </View>
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
              <TouchableOpacity onPress={pickImage} style={styles.logoPicker}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.pickerImage} />
                ) : (
                  <View style={styles.pickerPlaceholder}>
                    <Ionicons name="camera" size={24} color={colors.gray[400]} />
                    <Text style={styles.pickerText}>Upload Logo</Text>
                  </View>
                )}
              </TouchableOpacity>

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
                  loading={loading}
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
              subtitle="Follows your device system settings"
              type="link"
            />
          </TouchableOpacity>
        </Card>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <Card style={styles.card} padding={0}>
          <TouchableOpacity onPress={() => (navigation as any).navigate('ContactUs')}>
            <SettingItem
              icon="help-circle-outline"
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

const createStyles = (colors: Colors) => StyleSheet.create({
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
    marginLeft: spacing[16],
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    marginRight: spacing[4],
  },
  companyLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  companyLogoText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
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
  logoPicker: {
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  pickerImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
  },
  pickerPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
  },
  pickerText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing[2],
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
