import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows, Colors } from '../theme';
import { Button } from '../components';
import { Input } from '../components/Input';
import { Card } from '../components/Card';

export default function ClientCreateScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const { currentCompany, logout } = useAuthStore();
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.name) newErrors.name = 'Name is required';
        if (form.email && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        if (!currentCompany) {
            Alert.alert(
                'Error',
                'No company selected. Please relogin to fix this.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Logout',
                        onPress: () => {
                            logout();
                            // Navigation will be handled by App.tsx
                        },
                        style: 'destructive'
                    }
                ]
            );
            return;
        }

        setLoading(true);
        try {
            // Sanitize form data
            const payload: any = {
                name: form.name,
                address: form.address || undefined,
                phone: form.phone || undefined,
            };

            if (form.email) {
                payload.email = form.email;
            }

            console.log('Current Company:', currentCompany);
            console.log('Creating client with payload:', payload);

            await api.post('/clients', payload);

            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

            Alert.alert('Success', 'Client created successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error('Create client error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.error || 'Failed to create client';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={colors.background.secondary}
            />

            <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Client</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Card style={styles.formCard} padding={6}>
                        <Input
                            label="Client Name"
                            placeholder="Company or Person Name"
                            value={form.name}
                            onChangeText={(text) => setForm({ ...form, name: text })}
                            error={errors.name}
                            icon={<Ionicons name="person-outline" size={20} color={colors.gray[500]} />}
                        />

                        <Input
                            label="Email Address"
                            placeholder="client@example.com"
                            value={form.email}
                            onChangeText={(text) => setForm({ ...form, email: text })}
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={<Ionicons name="mail-outline" size={20} color={colors.gray[500]} />}
                        />

                        <Input
                            label="Phone Number"
                            placeholder="+1 234 567 8900"
                            value={form.phone}
                            onChangeText={(text) => setForm({ ...form, phone: text })}
                            keyboardType="phone-pad"
                            icon={<Ionicons name="call-outline" size={20} color={colors.gray[500]} />}
                        />

                        <Input
                            label="Address"
                            placeholder="123 Business St, City"
                            value={form.address}
                            onChangeText={(text) => setForm({ ...form, address: text })}
                            icon={<Ionicons name="location-outline" size={20} color={colors.gray[500]} />}
                            multiline
                            numberOfLines={3}
                            style={{ height: 80, textAlignVertical: 'top' }}
                        />
                    </Card>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
                    <Button
                        title="Create Client"
                        onPress={handleSave}
                        gradient
                        loading={loading}
                        fullWidth
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const createStyles = (colors: Colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[4],
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    backButton: {
        padding: spacing[2],
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    content: {
        padding: spacing[6],
    },
    formCard: {
        backgroundColor: colors.background.primary,
    },
    footer: {
        padding: spacing[4],
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
    },
});
