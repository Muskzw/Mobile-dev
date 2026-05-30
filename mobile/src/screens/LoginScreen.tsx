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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Card } from '../components';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows, Colors } from '../theme';
import * as Haptics from 'expo-haptics';
import { GOOGLE_WEB_CLIENT_ID } from '../config';


export default function LoginScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setAuth, setCurrentCompany } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID Token retrieved');
      }

      const response = await api.post('/auth/google', { idToken });
      const { token, user, companies } = response.data;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAuth(token, user, companies);
      if (companies && companies.length > 0) {
        setCurrentCompany(companies[0]);
      }

      if (!companies || companies.length === 0) {
        setTimeout(() => {
          navigation.navigate('Companies' as never);
        }, 100);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      console.error('Real Google Auth Error:', error);
      
      let errorMsg = 'Google authentication failed.';
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMsg = 'Google Sign-In was cancelled.';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMsg = 'Google Sign-In is already in progress.';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMsg = 'Google Play Services are not available or outdated.';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user, companies } = response.data;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAuth(token, user, companies);
      if (companies.length > 0) {
        setCurrentCompany(companies[0]);
      }

      // Navigate to Companies screen after auth state is set and navigator updates
      if (companies.length === 0) {
        setTimeout(() => {
          navigation.navigate('Companies' as never);
        }, 100);
      }
    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue managing your quotations
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard} padding={6}>
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

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword' as never)}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title={loading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              gradient
              size="lg"
              fullWidth
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Button
                title="Create Account"
                onPress={() => navigation.navigate('Register' as never)}
                variant="ghost"
                size="sm"
              />
            </View>
          </Card>

          {/* Alternative Login */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
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
                <ActivityIndicator size="small" color="#4285F4" style={styles.socialIcon} />
              ) : (
                <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.socialIcon} />
              )}
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    backgroundColor: isDark ? colors.background.primary : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? colors.gray[100] : colors.gray[200],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    ...shadows.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing[2],
    marginBottom: spacing[4],
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
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
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing[4],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  socialButtonsContainer: {
    gap: spacing[3],
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: isDark ? colors.gray[100] : '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  googleButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: isDark ? colors.text.primary : colors.gray[800],
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
