import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, Colors } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function ForgotPasswordScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            Alert.alert(
                'Success',
                'Password reset instructions have been sent to your email',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error('Password reset error:', error);
            const message = error.response?.data?.message || 'Failed to send reset email. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={isDark ? ['#1F2937', '#111827'] : colors.gradients.primary as any}
            style={styles.container}
        >
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor="transparent"
                translucent
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={[styles.content, { paddingTop: insets.top + spacing[4] }]}>
                    {/* Back Button */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Ionicons name="lock-closed-outline" size={64} color={colors.primary[500]} />
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>
                            No worries! Enter your email address and we'll send you instructions to reset your password.
                        </Text>
                    </View>

                    {/* Form */}
                    <Card style={styles.card}>
                        <Input
                            label="Email Address"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            icon={<Ionicons name="mail-outline" size={20} color={colors.gray[400]} />}
                            editable={!sent}
                        />

                        <Button
                            title={sent ? "Resend Email" : "Send Reset Link"}
                            onPress={handleResetPassword}
                            loading={loading}
                            gradient
                            style={styles.resetButton}
                            disabled={sent && !loading}
                        />

                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToLogin}>
                            <Ionicons name="arrow-back-outline" size={16} color={colors.primary[600]} />
                            <Text style={styles.backToLoginText}>Back to Login</Text>
                        </TouchableOpacity>
                    </Card>

                    {/* Footer */}
                    <Text style={styles.footerText}>
                        Remember your password?{' '}
                        <Text style={styles.loginLink} onPress={() => navigation.goBack()}>
                            Sign In
                        </Text>
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const createStyles = (colors: Colors) => StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing[6],
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: spacing[4],
        left: spacing[6],
        padding: spacing[2],
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing[8],
    },
    title: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing[4],
        marginBottom: spacing[2],
    },
    subtitle: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: spacing[4],
    },
    card: {
        marginBottom: spacing[6],
    },
    resetButton: {
        marginTop: spacing[4],
    },
    backToLogin: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing[4],
        gap: spacing[2],
    },
    backToLoginText: {
        fontSize: typography.fontSize.sm,
        color: colors.primary[600],
        fontWeight: typography.fontWeight.semibold,
    },
    footerText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    loginLink: {
        color: colors.primary[600],
        fontWeight: typography.fontWeight.semibold,
    },
});
