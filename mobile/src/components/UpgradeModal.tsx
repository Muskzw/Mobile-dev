import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colors as themeColors, spacing, typography, borderRadius, shadows } from '../theme';
import type { Colors } from '../theme/colors';

interface UpgradeModalProps {
    visible: boolean;
    onClose: () => void;
    currentTier?: string;
    documentsUsed?: number;
    reason?: string;
}

export default function UpgradeModal({
    visible,
    onClose,
    currentTier = 'free',
    documentsUsed = 0,
    reason
}: UpgradeModalProps) {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    const handleUpgradePremium = () => {
        // TODO: Integrate payment (RevenueCat/Stripe)
        console.log('Upgrade to Premium');
        // For now, just close
        alert('Payment integration coming soon! Contact support to upgrade.');
        onClose();
    };

    const handleUpgradeBusiness = () => {
        console.log('Upgrade to Business');
        alert('Payment integration coming soon! Contact support to upgrade.');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="star" size={32} color={colors.primary[600]} />
                        </View>
                        <Text style={styles.title}>Upgrade to Premium</Text>
                        <Text style={styles.subtitle}>
                            {reason || `You've used ${documentsUsed}/5 documents this month`}
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        {/* Premium Tier */}
                        <View style={[styles.tierCard, styles.premiumCard]}>
                            <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedText}>RECOMMENDED</Text>
                            </View>

                            <Text style={styles.tierName}>Premium</Text>
                            <View style={styles.priceContainer}>
                                <Text style={styles.price}>$7.99</Text>
                                <Text style={styles.priceUnit}>/month</Text>
                            </View>
                            <Text style={styles.annualPrice}>or $59.99/year (save 37%)</Text>

                            <View style={styles.featuresList}>
                                <Feature icon="checkmark-circle" text="Unlimited documents" premium />
                                <Feature icon="checkmark-circle" text="No watermark on PDFs" premium />
                                <Feature icon="checkmark-circle" text="Unlimited clients & products" premium />
                                <Feature icon="checkmark-circle" text="WhatsApp sharing" premium />
                                <Feature icon="checkmark-circle" text="3 PDF templates" premium />
                                <Feature icon="checkmark-circle" text="QR code payments" premium />
                                <Feature icon="checkmark-circle" text="Contact import" premium />
                                <Feature icon="checkmark-circle" text="Priority email support" premium />
                            </View>

                            <TouchableOpacity
                                style={[styles.upgradeButton, styles.premiumButton]}
                                onPress={handleUpgradePremium}
                            >
                                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                                <Ionicons name="arrow-forward" size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Business Tier */}
                        <View style={styles.tierCard}>
                            <Text style={styles.tierName}>Business</Text>
                            <View style={styles.priceContainer}>
                                <Text style={styles.price}>$14.99</Text>
                                <Text style={styles.priceUnit}>/month</Text>
                            </View>
                            <Text style={styles.annualPrice}>or $119.99/year (save 33%)</Text>

                            <View style={styles.featuresList}>
                                <Feature icon="checkmark-circle" text="Everything in Premium" />
                                <Feature icon="checkmark-circle" text="Team collaboration" />
                                <Feature icon="checkmark-circle" text="White-label PDFs" />
                                <Feature icon="checkmark-circle" text="Advanced analytics" />
                                <Feature icon="checkmark-circle" text="API access" />
                                <Feature icon="checkmark-circle" text="Priority phone support" />
                            </View>

                            <TouchableOpacity
                                style={styles.upgradeButton}
                                onPress={handleUpgradeBusiness}
                            >
                                <Text style={[styles.upgradeButtonText, { color: colors.primary[600] }]}>
                                    Upgrade to Business
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color={colors.primary[600]} />
                            </TouchableOpacity>
                        </View>

                        {/* Free Tier Comparison */}
                        <View style={styles.freeComparison}>
                            <Text style={styles.freeTitle}>Your Current Plan: Free</Text>
                            <View style={styles.featuresList}>
                                <Feature icon="close-circle" text="5 documents per month" free />
                                <Feature icon="close-circle" text="Watermark on PDFs" free />
                                <Feature icon="close-circle" text="Basic features only" free />
                                <Feature icon="close-circle" text="Email support only" free />
                            </View>
                        </View>

                        {/* Money-back guarantee */}
                        <View style={styles.guarantee}>
                            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                            <Text style={styles.guaranteeText}>
                                30-day money-back guarantee • Cancel anytime
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

interface FeatureProps {
    icon: string;
    text: string;
    premium?: boolean;
    free?: boolean;
}

function Feature({ icon, text, premium, free }: FeatureProps) {
    const { colors } = useTheme();

    const iconColor = premium
        ? colors.primary[600]
        : free
            ? colors.error
            : colors.success;

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
            <Ionicons
                name={icon as any}
                size={20}
                color={iconColor}
                style={{ marginRight: spacing[3] }}
            />
            <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                flex: 1
            }}>
                {text}
            </Text>
        </View>
    );
}

const createStyles = (colors: Colors) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '90%',
    },
    header: {
        alignItems: 'center',
        padding: spacing[6],
        paddingTop: spacing[8],
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: borderRadius.full,
        backgroundColor: `${colors.primary[600]}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
    },
    closeButton: {
        position: 'absolute',
        top: spacing[4],
        right: spacing[4],
        padding: spacing[2],
    },
    title: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    subtitle: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    scrollContainer: {
        padding: spacing[6],
    },
    tierCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        padding: spacing[6],
        marginBottom: spacing[4],
        borderWidth: 2,
        borderColor: colors.gray[200],
        ...shadows.md,
    },
    premiumCard: {
        borderColor: colors.primary[600],
        backgroundColor: `${colors.primary[600]}05`,
    },
    recommendedBadge: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        backgroundColor: colors.primary[600],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
    },
    recommendedText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
        color: 'white',
        letterSpacing: 1,
    },
    tierName: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing[2],
        marginTop: spacing[2],
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: spacing[2],
    },
    price: {
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.primary[600],
    },
    priceUnit: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        marginLeft: spacing[2],
    },
    annualPrice: {
        fontSize: typography.fontSize.sm,
        color: colors.success,
        marginBottom: spacing[6],
    },
    featuresList: {
        marginBottom: spacing[6],
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[4],
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.primary[600],
        gap: spacing[2],
    },
    premiumButton: {
        backgroundColor: colors.primary[600],
        borderColor: colors.primary[600],
    },
    upgradeButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: 'white',
    },
    freeComparison: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        padding: spacing[6],
        marginBottom: spacing[4],
        borderWidth: 1,
        borderColor: colors.gray[200],
    },
    freeTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing[4],
    },
    guarantee: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        padding: spacing[4],
        backgroundColor: `${colors.success}10`,
        borderRadius: borderRadius.lg,
        marginBottom: spacing[6],
    },
    guaranteeText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
    },
});
