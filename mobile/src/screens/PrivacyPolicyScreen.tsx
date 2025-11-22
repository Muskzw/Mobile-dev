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

export default function PrivacyPolicyScreen() {
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
                <Text style={styles.title}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.lastUpdated}>Last Updated: November 22, 2025</Text>

                    <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                    <Text style={styles.paragraph}>
                        We collect information you provide directly to us when you:
                    </Text>
                    <Text style={styles.bulletPoint}>• Create an account (email, name)</Text>
                    <Text style={styles.bulletPoint}>• Add company information</Text>
                    <Text style={styles.bulletPoint}>• Create documents, clients, and products</Text>
                    <Text style={styles.bulletPoint}>• Use our services</Text>

                    <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                    <Text style={styles.paragraph}>
                        We use the information we collect to:
                    </Text>
                    <Text style={styles.bulletPoint}>• Provide and maintain our services</Text>
                    <Text style={styles.bulletPoint}>• Process your transactions</Text>
                    <Text style={styles.bulletPoint}>• Send you technical notices and updates</Text>
                    <Text style={styles.bulletPoint}>• Respond to your comments and questions</Text>
                    <Text style={styles.bulletPoint}>• Improve our services</Text>

                    <Text style={styles.sectionTitle}>3. Data Storage and Security</Text>
                    <Text style={styles.paragraph}>
                        Your data is stored securely using industry-standard encryption. We implement
                        appropriate technical and organizational measures to protect your personal information
                        against unauthorized access, alteration, disclosure, or destruction.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Data Sharing</Text>
                    <Text style={styles.paragraph}>
                        We do not sell, trade, or rent your personal information to third parties. We may
                        share your information only in the following circumstances:
                    </Text>
                    <Text style={styles.bulletPoint}>• With your explicit consent</Text>
                    <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
                    <Text style={styles.bulletPoint}>• To protect our rights and safety</Text>

                    <Text style={styles.sectionTitle}>5. Your Rights</Text>
                    <Text style={styles.paragraph}>
                        You have the right to:
                    </Text>
                    <Text style={styles.bulletPoint}>• Access your personal data</Text>
                    <Text style={styles.bulletPoint}>• Correct inaccurate data</Text>
                    <Text style={styles.bulletPoint}>• Request deletion of your data</Text>
                    <Text style={styles.bulletPoint}>• Export your data</Text>
                    <Text style={styles.bulletPoint}>• Withdraw consent at any time</Text>

                    <Text style={styles.sectionTitle}>6. Data Retention</Text>
                    <Text style={styles.paragraph}>
                        We retain your information for as long as your account is active or as needed to
                        provide you services. You may delete your account at any time from the Settings screen.
                    </Text>

                    <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
                    <Text style={styles.paragraph}>
                        Our services are not directed to children under 13. We do not knowingly collect
                        personal information from children under 13.
                    </Text>

                    <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
                    <Text style={styles.paragraph}>
                        We may update this Privacy Policy from time to time. We will notify you of any
                        changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                    </Text>

                    <Text style={styles.sectionTitle}>9. Contact Us</Text>
                    <Text style={styles.paragraph}>
                        If you have questions about this Privacy Policy, please contact us through the
                        Help Center in the app settings.
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
        marginBottom: spacing[6],
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
