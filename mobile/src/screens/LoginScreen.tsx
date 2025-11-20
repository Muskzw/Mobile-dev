import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { colors, spacing, typography, borderRadius } from '../theme';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { setAuth, setCurrentCompany } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user, companies } = response.data;

      setAuth(token, user, companies);
      if (companies.length > 0) {
        setCurrentCompany(companies[0]);
      }

      if (companies.length === 0) {
        navigation.navigate('Companies' as never);
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
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={colors.gradients.ocean as any}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="document-text" size={40} color={colors.text.inverse} />
                </LinearGradient>
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

              <TouchableOpacity style={styles.forgotPassword}>
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

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color={colors.text.inverse} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={24} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[600],
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[8],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoContainer: {
    marginBottom: spacing[6],
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  formCard: {
    marginBottom: spacing[6],
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
    marginBottom: spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    marginHorizontal: spacing[4],
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
