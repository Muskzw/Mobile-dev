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

    // Fetch offerings when modal opens
    useEffect(() => {
        if (visible) {
            loadOfferings();
        }
    }, [visible]);

    const loadOfferings = async () => {
        setLoading(true);
        try {
            const offers = await getOfferings();
            setOfferings(offers);
        } catch (error) {
            console.error('Failed to load offerings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (packageId: string) => {
        if (!offerings?.current?.availablePackages) {
            Alert.alert('Error', 'No packages available');
            return;
        }

        const selectedPackage = offerings.current.availablePackages.find(
            (pkg: any) => pkg.identifier === packageId
        );

        if (!selectedPackage) {
            Alert.alert('Error', 'Package not found');
            return;
        }

        setPurchasing(true);
        try {
            const result = await purchasePackage(selectedPackage);

            if (result.success) {
                // Update backend with new subscription tier
                const newTier = result.isBusiness ? 'business' : result.isPremium ? 'premium' : 'free';

                try {
                    await api.put('/users/subscription', {
                        tier: newTier,
                        subscriptionId: result.customerInfo?.originalAppUserId,
                    });

                    // Update local user state
                    if (user) {
                        useAuthStore.setState({
                            user: {
                                ...user,
                                subscription_tier: newTier,
                            },
                        });
                    }

                    Alert.alert('🎉 Success!', `Welcome to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}!`);
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
            Alert.alert('Error', 'Failed to complete purchase');
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
                    // Update backend
                    await api.put('/users/subscription', {
                        tier: newTier,
                    });

                    Alert.alert('✅ Restored!', `Your ${newTier} subscription has been restored.`);
                    onClose();
                } else {
                    Alert.alert('No Purchases', 'No active subscriptions found.');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases');
        } finally {
            setPurchasing(false);
        }
    };

    // Fallback plans if RevenueCat isn't configured yet
    const fallbackPlans = [
        {
            id: '$rc_monthly_premium',
            name: 'Premium',
            price: '$7.99',
            period: '/month',
            features: [
                'Unlimited documents',
                'No watermarks',
                'WhatsApp sharing',
                'Priority support',
                'Custom branding',
            ],
            gradient: ['#6366f1', '#8b5cf6'],
            popular: true,
        },
        {
            id: '$rc_monthly_business',
            name: 'Business',
            price: '$14.99',
            period: '/month',
            features: [
                'Everything in Premium',
                'Team collaboration',
                'Advanced analytics',
                'API access',
                'White-label options',
            ],
            gradient: ['#f59e0b', '#ef4444'],
            popular: false,
        },
    ];

    const displayPlans = offerings?.current?.availablePackages?.map((pkg: any) => ({
        id: pkg.identifier,
        name: pkg.product.title.includes('Business') ? 'Business' : 'Premium',
        price: pkg.product.priceString,
        period: '/' + (pkg.packageType === 'MONTHLY' ? 'month' : 'year'),
        features: pkg.product.title.includes('Business')
            ? fallbackPlans[1].features
            : fallbackPlans[0].features,
        gradient: pkg.product.title.includes('Business')
            ? fallbackPlans[1].gradient
            : fallbackPlans[0].gradient,
        popular: !pkg.product.title.includes('Business'),
        package: pkg,
    })) || fallbackPlans;

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
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['#6366f1', '#8b5cf6']}
                                style={styles.iconGradient}
                            >
                                <Ionicons name="rocket" size={32} color="#fff" />
                            </LinearGradient>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text.primary }]}>
                        Upgrade to Premium
                    </Text>

                    {/* Reason */}
                    {reason && (
                        <View style={[styles.reasonBadge, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="information-circle" size={18} color={colors.warning} />
                            <Text style={[styles.reasonText, { color: colors.warning }]}>
                                {reason}
                            </Text>
                        </View>
                    )}

                    {/* Documents Used */}
                    {documentsUsed > 0 && (
                        <View style={styles.usageContainer}>
                            <Text style={[styles.usageText, { color: colors.text.secondary }]}>
                                You've used <Text style={{ color: colors.primary[600], fontWeight: '700' }}>{documentsUsed} of 5</Text> free documents
                            </Text>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${(documentsUsed / 5) * 100}%` }
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#6366f1', '#8b5cf6']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Loading or Plans */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary[600]} />
                            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                                Loading offers...
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.plansContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {displayPlans.map((plan: any, index: number) => (
                                <TouchableOpacity
                                    key={index}
                                    activeOpacity={0.9}
                                    style={styles.planCard}
                                    onPress={() => handlePurchase(plan.id)}
                                    disabled={purchasing}
                                >
                                    <LinearGradient
                                        colors={plan.gradient as any}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.planGradient}
                                    >
                                        {plan.popular && (
                                            <View style={styles.popularBadge}>
                                                <Text style={styles.popularText}>MOST POPULAR</Text>
                                            </View>
                                        )}

                                        <View style={styles.planHeader}>
                                            <Text style={styles.planName}>{plan.name}</Text>
                                            <View style={styles.priceContainer}>
                                                <Text style={styles.price}>{plan.price}</Text>
                                                <Text style={styles.period}>{plan.period}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.featuresContainer}>
                                            {plan.features.map((feature: string, i: number) => (
                                                <View key={i} style={styles.featureRow}>
                                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                                    <Text style={styles.featureText}>{feature}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        <View style={styles.ctaButton}>
                                            {purchasing ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Text style={styles.ctaText}>Select {plan.name}</Text>
                                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                                </>
                                            )}
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
                            <Text style={[styles.restoreText, { color: colors.primary[600] }]}>
                                Restore Purchases
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                            Cancel anytime • Secure payment
                        </Text>
                    </View>
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
        borderTopLeftRadius: borderRadius['2xl'],
        borderTopRightRadius: borderRadius['2xl'],
        paddingTop: spacing[6],
        paddingBottom: spacing[8],
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[6],
        marginBottom: spacing[4],
    },
    iconContainer: {
        alignItems: 'center',
    },
    iconGradient: {
        width: 72,
        height: 72,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    closeButton: {
        position: 'absolute',
        right: spacing[6],
        top: 0,
    },
    title: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold as any,
        textAlign: 'center',
        marginBottom: spacing[4],
        paddingHorizontal: spacing[6],
    },
    reasonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        borderRadius: borderRadius.full,
        marginHorizontal: spacing[6],
        marginBottom: spacing[4],
    },
    reasonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium as any,
        flex: 1,
    },
    usageContainer: {
        paddingHorizontal: spacing[6],
        marginBottom: spacing[6],
    },
    usageText: {
        fontSize: typography.fontSize.base,
        textAlign: 'center',
        marginBottom: spacing[3],
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: borderRadius.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: borderRadius.full,
    },
    loadingContainer: {
        padding: spacing[12],
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing[4],
        fontSize: typography.fontSize.base,
    },
    plansContainer: {
        paddingHorizontal: spacing[6],
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
    },
    popularText: {
        color: '#fff',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold as any,
        letterSpacing: 0.5,
    },
    planHeader: {
        marginBottom: spacing[5],
    },
    planName: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
        marginBottom: spacing[2],
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
    },
    period: {
        fontSize: typography.fontSize.lg,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: spacing[1],
    },
    featuresContainer: {
        marginBottom: spacing[5],
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    featureText: {
        fontSize: typography.fontSize.base,
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
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold as any,
        color: '#fff',
    },
    footer: {
        paddingTop: spacing[4],
        alignItems: 'center',
        gap: spacing[2],
    },
    restoreText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold as any,
        marginBottom: spacing[2],
    },
    footerText: {
        fontSize: typography.fontSize.sm,
    },
});
