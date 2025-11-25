import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_API_KEY = Platform.select({
    ios: 'test_CiigBigeYgzLEZJyqEtgvxqDfKD', // Your iOS key
    android: 'test_CiigBigeYgzLEZJyqEtgvxqDfKD', // Use same for now or add Android key later
});

export const initializePurchases = async (userId: string) => {
    try {
        if (!REVENUECAT_API_KEY) {
            console.warn('RevenueCat API key not configured');
            return;
        }

        // Configure and initialize Purchases
        await Purchases.configure({
            apiKey: REVENUECAT_API_KEY,
            appUserID: userId, // Use your database user ID
        });

        console.log('✅ RevenueCat initialized for user:', userId);
    } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
    }
};

export const getOfferings = async () => {
    try {
        const offerings = await Purchases.getOfferings();
        return offerings;
    } catch (error) {
        console.error('Failed to get offerings:', error);
        return null;
    }
};

export const purchasePackage = async (packageToPurchase: any) => {
    try {
        const purchaseResult = await Purchases.purchasePackage(packageToPurchase);

        // Check if user is now entitled to premium features
        const customerInfo = purchaseResult.customerInfo;
        const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
        const isBusiness = customerInfo.entitlements.active['business'] !== undefined;

        return {
            success: true,
            isPremium,
            isBusiness,
            customerInfo,
        };
    } catch (error: any) {
        if (error.userCancelled) {
            return { success: false, cancelled: true };
        }

        console.error('Purchase failed:', error);
        return { success: false, error };
    }
};

export const restorePurchases = async () => {
    try {
        const customerInfo = await Purchases.restorePurchases();
        const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
        const isBusiness = customerInfo.entitlements.active['business'] !== undefined;

        return {
            success: true,
            isPremium,
            isBusiness,
            customerInfo,
        };
    } catch (error) {
        console.error('Restore failed:', error);
        return { success: false, error };
    }
};
