import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Card } from '../components';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows, Colors } from '../theme';
import * as Haptics from 'expo-haptics';
import { GOOGLE_WEB_CLIENT_ID } from '../config';


export default function RegisterScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [mockGoogleVisible, setMockGoogleVisible] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const validate = () => {
    const newErrors: { fullName?: string; email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitMockGoogleLogin = async (selectedEmail: string, selectedName: string) => {
    setMockGoogleVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);
    try {
      const mockIdToken = `mock-google-token-${selectedEmail}-${selectedName.replace(/\s+/g, '_')}`;
      const response = await api.post('/auth/google', { idToken: mockIdToken });
      const { token, user, companies } = response.data;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAuth(token, user, companies);
      
      // Auto-navigate to Companies if they have companies, otherwise the main App router handles navigation
      if (!companies || companies.length === 0) {
        setTimeout(() => {
          navigation.navigate('Companies' as never);
        }, 100);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      console.error('Mock Google Auth Error:', error);
      alert(error.response?.data?.error || 'Mock Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Open our premium simulated Google chooser bottom sheet directly (100% Expo Go compatible!)
    setMockGoogleVisible(true);
  };

  const handleRegister = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);
    try {
      console.log('Attempting to register with API...');
      console.log('Request data:', { email, password, fullName });

      const response = await api.post('/auth/register', {
        email,
        password,
        fullName
      });
      console.log('Registration successful:', response.data);
      const { token, user, companies } = response.data;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Set auth - this will automatically trigger navigation to logged-in screens
      setAuth(token, user, companies || []);
    } catch (error: any) {
      console.error('Register error:', error);
      console.error('Error response:', error.response?.data);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.response) {
        const data = error.response.data;

        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map((err: any) => err.msg || err.message).join('\n');
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        errorMessage = error.message || 'Cannot connect to server. Please check your connection.';
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing[6] }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="document-text" size={32} color={colors.primary[600]} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Start creating professional quotations today
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard} padding={6}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setErrors({ ...errors, fullName: undefined });
              }}
              error={errors.fullName}
              icon={<Ionicons name="person-outline" size={20} color={colors.gray[500]} />}
              autoCapitalize="words"
            />

            <Input
              label="Email Address"
              placeholder="john@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              icon={<Ionicons name="mail-outline" size={20} color={colors.gray[500]} />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              icon={<Ionicons name="lock-closed-outline" size={20} color={colors.gray[500]} />}
              rightIcon={
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.gray[500]}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              secureTextEntry={!showPassword}
            />

            <Button
              title={loading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              gradient
              size="lg"
              fullWidth
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Button
                title="Sign In"
                onPress={() => navigation.navigate('Login' as never)}
                variant="ghost"
                size="sm"
              />
            </View>
          </Card>

          {/* Alternative Signup */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or sign up with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Premium Social Auth Buttons */}
          <View style={styles.socialButtonsContainer}>
             <TouchableOpacity
              style={[styles.googleButton, loading && { opacity: 0.6 }]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#EA4335" style={styles.socialIcon} />
              ) : (
                <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.socialIcon} />
              )}
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.appleButton}
              onPress={() => alert('Continue with Apple not yet configured.')}
            >
              <Ionicons name="logo-apple" size={20} color={isDark ? '#000000' : '#FFFFFF'} style={styles.socialIcon} />
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By creating an account, you agree to our{'\n'}
            <Text style={styles.termsLink} onPress={() => navigation.navigate('TermsOfService' as never)}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyPolicy' as never)}>Privacy Policy</Text>
          </Text>
        </ScrollView>

        <Modal
          visible={mockGoogleVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setMockGoogleVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Google Header */}
              <View style={styles.googleHeader}>
                <Ionicons name="logo-google" size={28} color="#4285F4" />
                <Text style={styles.googleTitle}>Choose an account</Text>
                <Text style={styles.googleSubtitle}>to continue to Quotation Maker</Text>
              </View>

              {/* Account Items */}
              <ScrollView style={styles.accountsList} showsVerticalScrollIndicator={false}>
                {/* Account 1 */}
                <TouchableOpacity
                  style={styles.accountRow}
                  onPress={() => submitMockGoogleLogin('esitholezw@gmail.com', 'Elon Musk')}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: '#3B82F6' }]}>
                    <Text style={styles.avatarText}>E</Text>
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>Elon Musk (Admin)</Text>
                    <Text style={styles.accountEmail}>esitholezw@gmail.com</Text>
                  </View>
                </TouchableOpacity>

                {/* Account 2 */}
                <TouchableOpacity
                  style={styles.accountRow}
                  onPress={() => submitMockGoogleLogin('elon@google.com', 'Elon Musk')}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.avatarText}>G</Text>
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>Elon Musk</Text>
                    <Text style={styles.accountEmail}>elon@google.com</Text>
                  </View>
                </TouchableOpacity>

                {/* Custom Account Input Toggle */}
                <TouchableOpacity
                  style={styles.accountRow}
                  onPress={() => setShowCustomInput(!showCustomInput)}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary[600] + '15' }]}>
                    <Ionicons name={showCustomInput ? "chevron-up" : "person-add"} size={16} color={colors.primary[600]} />
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>Use another account</Text>
                    <Text style={styles.accountEmail}>Type custom Google email</Text>
                  </View>
                </TouchableOpacity>

                {showCustomInput && (
                  <View style={styles.customForm}>
                    <TextInput
                      style={styles.customInput}
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      value={customName}
                      onChangeText={setCustomName}
                    />
                    <TextInput
                      style={styles.customInput}
                      placeholder="Google Email (e.g. user@gmail.com)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={customEmail}
                      onChangeText={setCustomEmail}
                    />
                    <TouchableOpacity
                      style={styles.customSubmitBtn}
                      onPress={() => {
                        if (!customEmail || !customName) {
                          alert('Please enter both name and email');
                          return;
                        }
                        submitMockGoogleLogin(customEmail, customName);
                      }}
                    >
                      <Text style={styles.customSubmitText}>Sign Up with Custom Account</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.googleCancelButton}
                onPress={() => setMockGoogleVisible(false)}
              >
                <Text style={styles.googleCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: Colors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0B0F19' : '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[8],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  formCard: {
    marginBottom: spacing[6],
    backgroundColor: isDark ? colors.gray[900] : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? colors.gray[800] : colors.gray[200],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    ...shadows.md,
  },
  button: {
    marginTop: spacing[2],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[6],
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginRight: spacing[2],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: isDark ? colors.gray[800] : colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing[4],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  socialButtonsContainer: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: isDark ? colors.gray[800] : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? colors.gray[700] : colors.gray[200],
    ...shadows.sm,
  },
  googleButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: isDark ? '#FFFFFF' : colors.gray[800],
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: isDark ? '#FFFFFF' : '#000000',
    ...shadows.sm,
  },
  appleButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: isDark ? '#000000' : '#FFFFFF',
  },
  socialIcon: {
    marginRight: spacing[3],
  },
  terms: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
    marginTop: spacing[4],
  },
  termsLink: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing[6],
    maxHeight: '80%',
  },
  googleHeader: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  googleTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing[3],
  },
  googleSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  accountsList: {
    marginBottom: spacing[4],
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: isDark ? colors.gray[800] : colors.gray[100],
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: typography.fontSize.base,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  accountEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  customForm: {
    padding: spacing[4],
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: borderRadius.lg,
    marginTop: spacing[2],
    gap: spacing[3],
    paddingBottom: spacing[6],
  },
  customInput: {
    height: 44,
    borderWidth: 1,
    borderColor: isDark ? colors.gray[700] : colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    backgroundColor: isDark ? colors.gray[900] : '#FFFFFF',
  },
  customSubmitBtn: {
    height: 44,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  customSubmitText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  googleCancelButton: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  googleCancelText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
});
