import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows, Colors } from '../theme';
import { Card } from '../components/Card';

export default function ContactUsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors);

    const handleEmail = () => {
        Linking.openURL('mailto:esitholezw@gmail.com');
    };

    const handlePhone = () => {
        Linking.openURL('tel:+263784840335');
    };

    const handleWebsite = () => {
        Linking.openURL('https://techubzw.lovable.app');
    };

    const ContactOption = ({ icon, title, subtitle, onPress, color }: any) => (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={styles.contactCard} padding={4}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={icon} size={24} color={color} />
                </View>
                <View style={styles.contactInfo}>
                    <Text style={styles.contactTitle}>{title}</Text>
                    <Text style={styles.contactSubtitle}>{subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={colors.background.secondary}
            />

            <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Contact Us</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerSection}>
                    <View style={styles.heroIcon}>
                        <Ionicons name="people" size={48} color={colors.primary[600]} />
                    </View>
                    <Text style={styles.headerTitle}>We're Here to Help</Text>
                    <Text style={styles.headerSubtitle}>
                        Get in touch with our support team for any questions or assistance
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Contact Options</Text>

                <ContactOption
                    icon="mail"
                    title="Email Support"
                    subtitle="esitholezw@gmail.com"
                    onPress={handleEmail}
                    color={colors.primary[600]}
                />

                <ContactOption
                    icon="call"
                    title="Phone Support"
                    subtitle="+263 78 484 0335"
                    onPress={handlePhone}
                    color={colors.secondary[600]}
                />

                <ContactOption
                    icon="globe"
                    title="Website"
                    subtitle="techubzw.lovable.app"
                    onPress={handleWebsite}
                    color={colors.info[500]}
                />

                <Card style={styles.infoCard} padding={4}>
                    <View style={styles.infoHeader}>
                        <Ionicons name="time-outline" size={20} color={colors.gray[600]} />
                        <Text style={styles.infoTitle}>Business Hours</Text>
                    </View>
                    <Text style={styles.infoText}>Monday - Friday: 9:00 AM - 6:00 PM</Text>
                    <Text style={styles.infoText}>Saturday: 10:00 AM - 4:00 PM</Text>
                    <Text style={styles.infoText}>Sunday: Closed</Text>
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
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: spacing[8],
    },
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
    },
    headerTitle: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    headerSubtitle: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        maxWidth: 280,
    },
    sectionTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.secondary,
        marginBottom: spacing[3],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[3],
        backgroundColor: colors.background.primary,
        ...shadows.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    contactInfo: {
        flex: 1,
    },
    contactTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: 2,
    },
    contactSubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    infoCard: {
        marginTop: spacing[6],
        backgroundColor: colors.background.primary,
        ...shadows.sm,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[3],
    },
    infoTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginLeft: spacing[2],
    },
    infoText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing[1],
    },
});
