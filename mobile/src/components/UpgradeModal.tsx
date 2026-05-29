import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius } from '../theme';
import { getOfferings, purchasePackage, restorePurchases } from '../services/revenuecat';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UpgradeModalProps {
    visible: boolean;
    onClose: () => void;
    currentTier: string;
    documentsUsed?: number;
    reason?: string;
}

const FREE_LIMITS = [
    { icon: 'document-text-outline', label: '5 documents / month', hit: true },
    { icon: 'people-outline', label: 'Up to 10 clients', hit: false },
    { icon: 'cube-outline', label: 'Up to 20 products', hit: false },
    { icon: 'image-outline', label: 'Watermark on PDFs', hit: true },
];

const PREMIUM_FEATURES = [
    'Unlimited documents every month',
    'No watermarks on PDFs',
    'WhatsApp sharing',
    'Multiple invoice templates',
    'Priority support',
    'Custom branding',
];

const BUSINESS_FEATURES = [
    'Everything in Premium',
    'Team collaboration',
    'Advanced analytics',
    'API access',
    'White-label options',
];

export default function UpgradeModal({
    visible,
    onClose,
    currentTier,
    documentsUsed = 0,
    reason,
}: UpgradeModalProps) {
    const { colors, isDark } = useTheme();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [offerings, setOfferings] = useState<any>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [revenueCatReady, setRevenueCatReady] = useState(false);

    useEffect(() => {
        if (visible) {
            loadOfferings();
        }
    }, [visible]);

    const loadOfferings = async () => {
        setLoading(true);
        try {
            const offers = await getOfferings();
            if (offers?.current?.availablePackages && offers.current.availablePackages.length > 0) {
                setOfferings(offers);
                setRevenueCatReady(true);
            } else {
                setRevenueCatReady(false);
            }
        } catch (error) {
            console.error('Failed to load offerings:', error);
            setRevenueCatReady(false);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (packageId: string) => {
        if (!offerings?.current?.availablePackages) {
            // Fallback: contact to upgrade
            handleContactUpgrade();
            return;
        }

        const selectedPackage = offerings.current.availablePackages.find(
            (pkg: any) => pkg.identifier === packageId
        );

        if (!selectedPackage) {
            handleContactUpgrade();
            return;
        }

        setPurchasing(true);
        try {
            const result = await purchasePackage(selectedPackage);

            if (result.success) {
                const newTier = result.isBusiness ? 'business' : result.isPremium ? 'premium' : 'free';

                try {
                    await api.put('/users/subscription', {
                        tier: newTier,
                        subscriptionId: result.customerInfo?.originalAppUserId,
                    });

                    if (user) {
                        useAuthStore.setState({
                            user: {
                                ...user,
                                subscription_tier: newTier,
                            },
                        });
                    }

                    Alert.alert(
                        '🎉 Welcome to ' + newTier.charAt(0).toUpperCase() + newTier.slice(1) + '!',
                        'Your account has been upgraded. Enjoy all premium features!'
                    );
                    onClose();
                } catch (apiError) {
                    console.error('Failed to update backend:', apiError);
                    Alert.alert('Warning', 'Purchase successful but failed to sync. Please restart the app.');
                }
            } else if (!result.cancelled) {
                Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            Alert.alert('Error', 'Failed to complete purchase. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setPurchasing(true);
        try {
            const result = await restorePurchases();

            if (result.success) {
                const newTier = result.isBusiness ? 'business' : result.isPremium ? 'premium' : 'free';

                if (newTier !== 'free') {
                    await api.put('/users/subscription', { tier: newTier });
                    Alert.alert('✅ Restored!', `Your ${newTier} subscription has been restored.`);
                    onClose();
                } else {
                    Alert.alert('No Purchases Found', 'We could not find any previous purchases linked to this account.');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    const handleContactUpgrade = () => {
        Alert.alert(
            '📩 Upgrade via Email',
            'Send us an email to upgrade your account and unlock all premium features.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Email',
                    onPress: () => {
                        Linking.openURL(
                            'mailto:esitholezw@gmail.com?subject=Upgrade%20Request&body=Hi%2C%20I%20would%20like%20to%20upgrade%20my%20account%20to%20Premium.'
                        );
                    },
                },
            ]
        );
    };

    const plans = [
        {
            id: '$rc_monthly_premium',
            name: 'Premium',
            price: '$7.99',
            period: '/month',
            features: PREMIUM_FEATURES,
            gradient: ['#6366f1', '#8b5cf6'] as [string, string],
            popular: true,
        },
        {
            id: '$rc_monthly_business',
            name: 'Business',
            price: '$14.99',
            period: '/month',
            features: BUSINESS_FEATURES,
            gradient: ['#f59e0b', '#ef4444'] as [string, string],
            popular: false,
        },
    ];

    const displayPlans = offerings?.current?.availablePackages?.map((pkg: any) => ({
        id: pkg.identifier,
        name: pkg.product.title.includes('Business') ? 'Business' : 'Premium',
        price: pkg.product.priceString,
        period: '/' + (pkg.packageType === 'MONTHLY' ? 'month' : 'year'),
        features: pkg.product.title.includes('Business') ? BUSINESS_FEATURES : PREMIUM_FEATURES,
        gradient: pkg.product.title.includes('Business')
            ? (['#f59e0b', '#ef4444'] as [string, string])
            : (['#6366f1', '#8b5cf6'] as [string, string]),
        popular: !pkg.product.title.includes('Business'),
        package: pkg,
    })) || plans;

    const docsRemaining = Math.max(0, 5 - documentsUsed);
    const progressPct = Math.min(100, (documentsUsed / 5) * 100);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <BlurView intensity={isDark ? 40 : 80} style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
                    {/* Drag handle */}
                    <View style={[styles.dragHandle, { backgroundColor: colors.gray[300] }]} />

                    {/* Close button */}
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text.secondary} />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                        {/* Header */}
                        <View style={styles.headerSection}>
                            <LinearGradient
                                colors={['#6366f1', '#8b5cf6']}
                                style={styles.iconGradient}
                            >
                                <Ionicons name="rocket" size={32} color="#fff" />
                            </LinearGradient>
                            <Text style={[styles.title, { color: colors.text.primary }]}>
                                Unlock Premium Features
                            </Text>
                            {reason ? (
                                <View style={[styles.reasonBadge, { backgroundColor: colors.warning + '20' }]}>
                                    <Ionicons name="information-circle" size={16} color={colors.warning} />
                                    <Text style={[styles.reasonText, { color: colors.warning }]}>
                                        {reason}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Usage Progress */}
                        <View style={[styles.usageCard, { backgroundColor: colors.background.secondary }]}>
                            <View style={styles.usageHeader}>
                                <Text style={[styles.usageTitle, { color: colors.text.primary }]}>
                                    Your Free Plan Usage
                                </Text>
                                <Text style={[
                                    styles.usageBadge,
                                    { color: docsRemaining === 0 ? colors.error : colors.success }
                                ]}>
                                    {docsRemaining === 0 ? 'Limit reached' : `${docsRemaining} left`}
                                </Text>
                            </View>

                            <View style={styles.progressRow}>
                                <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>
                                    Documents this month
                                </Text>
                                <Text style={[styles.progressCount, { color: colors.text.primary }]}>
                                    {documentsUsed} / 5
                                </Text>
                            </View>
                            <View style={[styles.progressBar, { backgroundColor: colors.gray[200] }]}>
                                <LinearGradient
                                    colors={progressPct >= 100 ? ['#ef4444', '#dc2626'] : ['#6366f1', '#8b5cf6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressFill, { width: `${progressPct}%` }]}
                                />
                            </View>

                            {/* Free plan limits */}
                            <View style={styles.limitsGrid}>
                                {FREE_LIMITS.map((limit, i) => (
                                    <View key={i} style={styles.limitItem}>
                                        <Ionicons
                                            name={limit.hit ? 'close-circle' : 'checkmark-circle'}
                                            size={16}
                                            color={limit.hit ? colors.error : colors.success}
                                        />
                                        <Text style={[
                                            styles.limitText,
                                            { color: limit.hit ? colors.error : colors.text.secondary }
                                        ]}>
                                            {limit.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Plans */}
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary[600]} />
                                <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                                    Loading plans...
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.plansSection}>
                                <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                                    CHOOSE YOUR PLAN
                                </Text>
                                {displayPlans.map((plan: any, index: number) => (
                                    <TouchableOpacity
                                        key={index}
                                        activeOpacity={0.9}
                                        style={styles.planCard}
                                        onPress={() => revenueCatReady ? handlePurchase(plan.id) : handleContactUpgrade()}
                                        disabled={purchasing}
                                    >
                                        <LinearGradient
                                            colors={plan.gradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.planGradient}
                                        >
                                            {plan.popular && (
                                                <View style={styles.popularBadge}>
                                                    <Ionicons name="star" size={10} color="#fff" />
                                                    <Text style={styles.popularText}>MOST POPULAR</Text>
                                                </View>
                                            )}

                                            <View style={styles.planHeader}>
                                                <View>
                                                    <Text style={styles.planName}>{plan.name}</Text>
                                                    <View style={styles.priceRow}>
                                                        <Text style={styles.price}>{plan.price}</Text>
                                                        <Text style={styles.period}>{plan.period}</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            <View style={styles.featuresContainer}>
                                                {plan.features.map((feature: string, i: number) => (
                                                    <View key={i} style={styles.featureRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="rgba(255,255,255,0.9)" />
                                                        <Text style={styles.featureText}>{feature}</Text>
                                                    </View>
                                                ))}
                                            </View>

                                            <View style={styles.ctaButton}>
                                                {purchasing ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <>
                                                        <Text style={styles.ctaText}>
                                                            {revenueCatReady ? `Get ${plan.name}` : `Upgrade to ${plan.name}`}
                                                        </Text>
                                                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                                                    </>
                                                )}
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}

                                {/* What happens next info */}
                                {!revenueCatReady && (
                                    <View style={[styles.infoBox, { backgroundColor: colors.primary[50] ?? colors.background.secondary, borderColor: colors.primary[200] ?? colors.primary[600] }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.primary[600]} />
                                        <Text style={[styles.infoText, { color: colors.primary[700] ?? colors.primary[600] }]}>
                                            Tap a plan to contact us and upgrade your account. We'll activate it within 24 hours.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Footer actions */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                onPress={handleRestore}
                                disabled={purchasing}
                                style={styles.restoreButton}
                            >
                                <Text style={[styles.restoreText, { color: colors.primary[600] }]}>
                                    Restore Previous Purchase
                                </Text>
                            </TouchableOpacity>

                            {/* Continue on free plan */}
                            <TouchableOpacity
                                onPress={onClose}
                                style={[styles.freePlanButton, { borderColor: colors.gray[300] }]}
                            >
                                <Text style={[styles.freePlanText, { color: colors.text.secondary }]}>
                                    Continue on Free Plan
                                </Text>
                                <Text style={[styles.freePlanSub, { color: colors.gray[400] }]}>
                                    {docsRemaining > 0
                                        ? `${docsRemaining} document${docsRemaining !== 1 ? 's' : ''} remaining this month`
                                        : 'Upgrade to create more documents'}
                                </Text>
                            </TouchableOpacity>

                            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                                Cancel anytime · Secure payment · No hidden fees
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: spacing[10],
        maxHeight: '92%',
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing[3],
        marginBottom: spacing[2],
    },
    closeButton: {
        position: 'absolute',
        right: spacing[6],
        top: spacing[6],
        zIndex: 10,
        padding: spacing[2],
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: spacing[4],
        paddingHorizontal: spacing[6],
        marginBottom: spacing[5],
    },
    iconGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    title: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold as any,
        textAlign: 'center',
        marginBottom: spacing[3],
    },
    reasonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        borderRadius: borderRadius.full,
    },
    reasonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium as any,
        flex: 1,
    },
    usageCard: {
        marginHorizontal: spacing[6],
        borderRadius: borderRadius.xl,
        padding: spacing[5],
        marginBottom: spacing[5],
    },
    usageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[3],
    },
    usageTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold as any,
    },
    usageBadge: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold as any,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing[2],
    },
    progressLabel: {
        fontSize: typography.fontSize.sm,
    },
    progressCount: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold as any,
    },
    progressBar: {
        height: 8,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
        marginBottom: spacing[4],
    },
    progressFill: {
        height: '100%',
        borderRadius: borderRadius.full,
    },
    limitsGrid: {
        gap: spacing[2],
    },
    limitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    limitText: {
        fontSize: typography.fontSize.sm,
    },
    plansSection: {
        paddingHorizontal: spacing[6],
        marginBottom: spacing[4],
    },
    sectionLabel: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold as any,
        letterSpacing: 1,
        marginBottom: spacing[3],
    },
    loadingContainer: {
        padding: spacing[10],
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing[3],
        fontSize: typography.fontSize.base,
    },
    planCard: {
        marginBottom: spacing[4],
        borderRadius: borderRadius['2xl'],
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    planGradient: {
        padding: spacing[6],
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: spacing[4],
        right: spacing[4],
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    popularText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    planHeader: {
        marginBottom: spacing[4],
    },
    planName: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
        marginBottom: spacing[1],
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 32,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
    },
    period: {
        fontSize: typography.fontSize.base,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: spacing[1],
    },
    featuresContainer: {
        marginBottom: spacing[5],
        gap: spacing[2],
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    featureText: {
        fontSize: typography.fontSize.sm,
        color: '#fff',
        flex: 1,
    },
    ctaButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        paddingVertical: spacing[4],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    ctaText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold as any,
        color: '#fff',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        padding: spacing[4],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        marginTop: spacing[2],
    },
    infoText: {
        fontSize: typography.fontSize.sm,
        flex: 1,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: spacing[6],
        alignItems: 'center',
        gap: spacing[3],
    },
    restoreButton: {
        paddingVertical: spacing[2],
    },
    restoreText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold as any,
    },
    freePlanButton: {
        width: '100%',
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[5],
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        alignItems: 'center',
        gap: spacing[1],
    },
    freePlanText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold as any,
    },
    freePlanSub: {
        fontSize: typography.fontSize.xs,
    },
    footerText: {
        fontSize: typography.fontSize.xs,
        textAlign: 'center',
        paddingTop: spacing[2],
    },
});
