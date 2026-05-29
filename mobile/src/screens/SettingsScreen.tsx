import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { colors, isDark, themePreference, setThemePreference } = useTheme();
  const styles = createStyles(colors);

  const [loading, setLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  });

  const [aiEnabled, setAiEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [editingCompany, setEditingCompany] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(currentCompany?.logo_url ? `${BASE_URL}${currentCompany.logo_url}` : null);

  const [companyForm, setCompanyForm] = useState({
    name: currentCompany?.name || '',
    contactName: currentCompany?.contact_name || '',
    email: currentCompany?.email || '',
    phone: currentCompany?.phone || '',
    address: currentCompany?.address || '',
    addressLine2: currentCompany?.address_line2 || '',
    addressLine3: currentCompany?.address_line3 || '',
    businessLabel: currentCompany?.business_label || 'Tax ID',
    businessNumber: currentCompany?.business_number || '',
    businessCategory: currentCompany?.business_category || '',
    paymentInstructions: currentCompany?.payment_instructions || '',
  });

  // Update form when currentCompany changes
  React.useEffect(() => {
    if (currentCompany) {
      setCompanyForm({
        name: currentCompany.name,
        contactName: currentCompany.contact_name || '',
        email: currentCompany.email || '',
        phone: currentCompany.phone || '',
        address: currentCompany.address || '',
        addressLine2: currentCompany.address_line2 || '',
        addressLine3: currentCompany.address_line3 || '',
        businessLabel: currentCompany.business_label || 'Tax ID',
        businessNumber: currentCompany.business_number || '',
        businessCategory: currentCompany.business_category || '',
        paymentInstructions: currentCompany.payment_instructions || '',
      });
      if (currentCompany.logo_url) {
        setLogoUri(`${BASE_URL}${currentCompany.logo_url}`);
      }
    }
  }, [currentCompany]);

  // Load preferences from backend on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await api.get('/settings');
        const data = response.data || {};
        if (data.aiEnabled !== undefined) setAiEnabled(data.aiEnabled);
        if (data.notifications !== undefined) setNotifications(data.notifications);
      } catch (e) {
        console.error('Failed to load settings from server', e);
      } finally {
        setPreferencesLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const handleToggleAi = async (val: boolean) => {
    setAiEnabled(val);
    try {
      await api.put('/settings', { aiEnabled: val });
    } catch (e) {
      console.error('Failed to save AI setting', e);
      Alert.alert('Error', 'Failed to save preference to server');
      setAiEnabled(!val); // rollback
    }
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotifications(val);
    try {
      await api.put('/settings', { notifications: val });
    } catch (e) {
      console.error('Failed to save notifications setting', e);
      Alert.alert('Error', 'Failed to save preference to server');
      setNotifications(!val); // rollback
    }
  };

  const handleThemePress = () => {
    Alert.alert(
      'Select App Theme',
      'Choose how you want the app interface to look.',
      [
        {
          text: 'Follow System Default',
          onPress: () => setThemePreference('system'),
          style: themePreference === 'system' ? 'destructive' : 'default'
        },
        {
          text: 'Always Light',
          onPress: () => setThemePreference('light'),
          style: themePreference === 'light' ? 'destructive' : 'default'
        },
        {
          text: 'Always Dark',
          onPress: () => setThemePreference('dark'),
          style: themePreference === 'dark' ? 'destructive' : 'default'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Sync profile form when user store details change
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim()) {
      Alert.alert('Error', 'Full Name is required');
      return;
    }
    if (!profileForm.email.trim() || !/\S+@\S+\.\S+/.test(profileForm.email)) {
      Alert.alert('Error', 'A valid email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        fullName: profileForm.fullName,
        email: profileForm.email,
      });

      // Update auth store
      const updatedUser = response.data.user;
      setAuth(useAuthStore.getState().token!, {
        id: user!.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        subscription_tier: user?.subscription_tier,
      }, companies);

      setEditingProfile(false);
      Alert.alert('Success', 'Profile details updated successfully');
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.error || 'Failed to save profile details';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

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
      formData.append('contact_name', companyForm.contactName);
      formData.append('email', companyForm.email);
      formData.append('phone', companyForm.phone);
      formData.append('address', companyForm.address);
      formData.append('address_line2', companyForm.addressLine2);
      formData.append('address_line3', companyForm.addressLine3);
      formData.append('business_label', companyForm.businessLabel);
      formData.append('business_number', companyForm.businessNumber);
      formData.append('business_category', companyForm.businessCategory);
      formData.append('payment_instructions', companyForm.paymentInstructions);

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
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => setEditingProfile(true)}
            style={styles.avatarContainer}
          >
            <LinearGradient
              colors={colors.gradients.primary as any}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            </LinearGradient>
            <View style={styles.editAvatarBadge}>
              <Ionicons name="pencil" size={12} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.planBadge}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.planText}>PRO PLAN</Text>
          </View>
        </View>

        {/* Company Settings */}
        <Text style={styles.sectionTitle}>Company Details</Text>
        <Card style={styles.card} padding={0}>
          {!editingCompany ? (
            <View style={{ padding: spacing[4] }}>
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
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.companyNameDisplay}>{companyForm.name}</Text>
                  <Text style={styles.companyEmailDisplay}>{companyForm.email}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={colors.gray[400]} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyAddressDisplay}>{companyForm.address || 'No address set'}</Text>
                  {companyForm.addressLine2 ? <Text style={styles.companyAddressDisplay}>{companyForm.addressLine2}</Text> : null}
                  {companyForm.addressLine3 ? <Text style={styles.companyAddressDisplay}>{companyForm.addressLine3}</Text> : null}
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={18} color={colors.gray[400]} style={{ marginRight: 8 }} />
                <Text style={styles.companyAddressDisplay}>{companyForm.phone || 'No phone set'}</Text>
              </View>

              {companyForm.businessNumber ? (
                <View style={styles.detailRow}>
                  <Ionicons name="card-outline" size={18} color={colors.gray[400]} style={{ marginRight: 8 }} />
                  <Text style={styles.companyAddressDisplay}>{companyForm.businessLabel}: {companyForm.businessNumber}</Text>
                </View>
              ) : null}

              {companyForm.paymentInstructions ? (
                <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                  <Ionicons name="cash-outline" size={18} color={colors.gray[400]} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={styles.companyAddressDisplay}>{companyForm.paymentInstructions}</Text>
                </View>
              ) : null}

              <Button
                title="Edit Details"
                onPress={() => setEditingCompany(true)}
                variant="outline"
                size="sm"
                style={{ marginTop: spacing[4] }}
                icon={<Ionicons name="create-outline" size={16} color={colors.primary[600]} />}
              />
            </View>
          ) : (
            <View style={{ padding: spacing[4] }}>
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
                label="Address Line 1"
                value={companyForm.address}
                onChangeText={(text) => setCompanyForm({ ...companyForm, address: text })}
              />
              <Input
                label="Address Line 2"
                value={companyForm.addressLine2}
                onChangeText={(text) => setCompanyForm({ ...companyForm, addressLine2: text })}
              />
              <Input
                label="Address Line 3"
                value={companyForm.addressLine3}
                onChangeText={(text) => setCompanyForm({ ...companyForm, addressLine3: text })}
              />
              <Input
                label="Contact Name"
                value={companyForm.contactName}
                onChangeText={(text) => setCompanyForm({ ...companyForm, contactName: text })}
              />
              <Input
                label="Phone Number"
                value={companyForm.phone}
                onChangeText={(text) => setCompanyForm({ ...companyForm, phone: text })}
                keyboardType="phone-pad"
              />
              <View style={{ flexDirection: 'row', gap: spacing[4] }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Business Label (e.g. VAT)"
                    value={companyForm.businessLabel}
                    onChangeText={(text) => setCompanyForm({ ...companyForm, businessLabel: text })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Business Number"
                    value={companyForm.businessNumber}
                    onChangeText={(text) => setCompanyForm({ ...companyForm, businessNumber: text })}
                  />
                </View>
              </View>
              <Input
                label="Business Category"
                value={companyForm.businessCategory}
                onChangeText={(text) => setCompanyForm({ ...companyForm, businessCategory: text })}
              />
              <Input
                label="Payment Instructions"
                value={companyForm.paymentInstructions}
                onChangeText={(text) => setCompanyForm({ ...companyForm, paymentInstructions: text })}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: 'top' }}
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
            onValueChange={handleToggleAi}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Updates & reminders"
            value={notifications}
            onValueChange={handleToggleNotifications}
          />
          <View style={styles.divider} />
          <TouchableOpacity onPress={handleThemePress} activeOpacity={0.7}>
            <SettingItem
              icon="moon"
              title="Dark Mode"
              subtitle={
                themePreference === 'system'
                  ? 'Follows device system settings'
                  : themePreference === 'dark'
                  ? 'Always Dark Mode'
                  : 'Always Light Mode'
              }
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
          <TouchableOpacity onPress={() => (navigation as any).navigate('PrivacyPolicy')}>
            <SettingItem
              icon="shield-checkmark"
              title="Privacy Policy"
              type="link"
            />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity onPress={() => (navigation as any).navigate('TermsOfService')}>
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
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

      {/* Profile Edit Modal */}
      <Modal
        visible={editingProfile}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditingProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard} padding={6}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Input
              label="Full Name"
              value={profileForm.fullName}
              onChangeText={(text) => setProfileForm({ ...profileForm, fullName: text })}
            />
            <Input
              label="Email Address"
              value={profileForm.email}
              onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setEditingProfile(false)}
                variant="ghost"
                style={{ flex: 1, marginRight: spacing[2] }}
              />
              <Button
                title="Save"
                onPress={handleSaveProfile}
                gradient
                style={{ flex: 1 }}
                loading={loading}
              />
            </View>
          </Card>
        </View>
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
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing[4],
  },
  editAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
    ...shadows.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
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
    color: 'white',
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
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  planText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing[3],
    marginTop: spacing[4],
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
    paddingLeft: spacing[2],
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
  companyNameDisplay: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  companyEmailDisplay: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  companyAddressDisplay: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: spacing[6],
  },
  modalCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing[4],
  },
});
