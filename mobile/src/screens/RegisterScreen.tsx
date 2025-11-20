import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
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

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { setAuth } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});

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

  const handleRegister = async () => {
    if (!validate()) return;

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
      const { token, user } = response.data;

      // Set auth - this will automatically trigger navigation to logged-in screens
      setAuth(token, user, []);
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
        errorMessage = error.message;
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
        colors={colors.gradients.primary as any}
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

            {/* Terms */}
            <Text style={styles.terms}>
              By creating an account, you agree to our{'\n'}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
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
  terms: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },
  termsLink: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});
