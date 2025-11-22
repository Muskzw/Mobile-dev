import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, Colors } from '../theme';
import { Card } from '../components/Card';

export default function TermsOfServiceScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={colors.background.secondary}
            />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Terms of Service</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.lastUpdated}>Last Updated: November 22, 2025</Text>

                    <Text style={styles.intro}>
                        Please read these Terms of Service carefully before using our invoice and quotation app.
                    </Text>

                    <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
                    <Text style={styles.paragraph}>
                        By accessing or using our app, you agree to be bound by these Terms. If you disagree
                        with any part of the terms, you may not access the service.
                    </Text>

                    <Text style={styles.sectionTitle}>2. Description of Service</Text>
                    <Text style={styles.paragraph}>
                        Our app provides tools for creating, managing, and tracking invoices, quotations, and
                        related business documents. We reserve the right to modify or discontinue the service
                        at any time.
                    </Text>

                    <Text style={styles.sectionTitle}>3. User Accounts</Text>
                    <Text style={styles.paragraph}>
                        You are responsible for:
                    </Text>
                    <Text style={styles.bulletPoint}>• Maintaining the security of your account</Text>
                    <Text style={styles.bulletPoint}>• All activities under your account</Text>
                    <Text style={styles.bulletPoint}>• Providing accurate and complete information</Text>
                    <Text style={styles.bulletPoint}>• Notifying us of unauthorized access</Text>

                    <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
                    <Text style={styles.paragraph}>
                        You agree not to:
                    </Text>
                    <Text style={styles.bulletPoint}>• Use the service for illegal purposes</Text>
                    <Text style={styles.bulletPoint}>• Violate any laws or regulations</Text>
                    <Text style={styles.bulletPoint}>• Infringe on intellectual property rights</Text>
                    <Text style={styles.bulletPoint}>• Transmit malicious code or viruses</Text>
                    <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access</Text>
                    <Text style={styles.bulletPoint}>• Use the service to send spam</Text>

                    <Text style={styles.sectionTitle}>5. Your Content</Text>
                    <Text style={styles.paragraph}>
                        You retain ownership of all content you create using our service. By using the app,
                        you grant us the right to store and process your content to provide the service.
                    </Text>

                    <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
                    <Text style={styles.paragraph}>
                        The service and its original content, features, and functionality are owned by us and
                        are protected by international copyright, trademark, and other intellectual property laws.
                    </Text>

                    <Text style={styles.sectionTitle}>7. Free Trial and Subscriptions</Text>
                    <Text style={styles.paragraph}>
                        New users receive a free trial period. After the trial, continued use requires a paid
                        subscription. You may cancel your subscription at any time from the app settings.
                    </Text>

                    <Text style={styles.sectionTitle}>8. Termination</Text>
                    <Text style={styles.paragraph}>
                        We may terminate or suspend your account immediately, without prior notice, for any
                        breach of these Terms. Upon termination, your right to use the service will immediately cease.
                    </Text>

                    <Text style={styles.sectionTitle}>9. Disclaimer</Text>
                    <Text style={styles.paragraph}>
                        The service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind.
                        We do not guarantee that the service will be uninterrupted, secure, or error-free.
                    </Text>

                    <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
                    <Text style={styles.paragraph}>
                        In no event shall we be liable for any indirect, incidental, special, consequential,
                        or punitive damages arising out of or relating to your use of the service.
                    </Text>

                    <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
                    <Text style={styles.paragraph}>
                        We reserve the right to modify these terms at any time. We will notify users of any
                        material changes. Continued use after changes constitutes acceptance of the new terms.
                    </Text>

                    <Text style={styles.sectionTitle}>12. Governing Law</Text>
                    <Text style={styles.paragraph}>
                        These Terms shall be governed by and construed in accordance with the laws of your
                        jurisdiction, without regard to conflict of law provisions.
                    </Text>

                    <Text style={styles.sectionTitle}>13. Contact</Text>
                    <Text style={styles.paragraph}>
                        For questions about these Terms, please contact us through the Help Center in Settings.
                    </Text>
                </Card>
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
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    content: {
        padding: spacing[6],
        paddingBottom: spacing[12],
    },
    card: {
        backgroundColor: colors.background.primary,
    },
    lastUpdated: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        fontStyle: 'italic',
        marginBottom: spacing[4],
    },
    intro: {
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        fontWeight: typography.fontWeight.semibold,
        marginBottom: spacing[6],
        lineHeight: 24,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing[6],
        marginBottom: spacing[3],
    },
    paragraph: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        lineHeight: 24,
        marginBottom: spacing[3],
    },
    bulletPoint: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        lineHeight: 24,
        marginLeft: spacing[4],
        marginBottom: spacing[2],
    },
});
