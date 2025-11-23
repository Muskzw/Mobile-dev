// Subscription limits and features configuration
export const SUBSCRIPTION_LIMITS = {
    free: {
        documentsPerMonth: 5,
        clientsMax: 10,
        productsMax: 20,
        templates: ['modern'],
        contactImports: 5,
        features: {
            whatsapp: false,
            qrCodes: false,
            recurring: false,
            multipleTemplates: false,
            noWatermark: false,
            paymentReminders: false,
        }
    },
    premium: {
        documentsPerMonth: -1, // unlimited
        clientsMax: -1,
        productsMax: -1,
        templates: ['modern', 'classic', 'minimal', 'bold', 'elegant'],
        contactImports: -1,
        features: {
            whatsapp: true,
            qrCodes: true,
            recurring: true,
            multipleTemplates: true,
            noWatermark: true,
            paymentReminders: true,
        }
    },
    business: {
        documentsPerMonth: -1,
        clientsMax: -1,
        productsMax: -1,
        templates: ['modern', 'classic', 'minimal', 'bold', 'elegant'],
        contactImports: -1,
        features: {
            whatsapp: true,
            qrCodes: true,
            recurring: true,
            multipleTemplates: true,
            noWatermark: true,
            paymentReminders: true,
            teamCollaboration: true,
            whiteLabel: true,
            apiAccess: true,
        }
    }
};

// Check if user can perform an action
export function canPerformAction(
    user: any,
    action: 'createDocument' | 'addClient' | 'addProduct' | 'importContact'
): { allowed: boolean; reason?: string } {
    const tier = user.subscription_tier || 'free';
    const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];

    if (!limits) {
        return { allowed: false, reason: 'Invalid subscription tier' };
    }

    switch (action) {
        case 'createDocument':
            if (limits.documentsPerMonth === -1) {
                return { allowed: true };
            }
            if (user.documents_created_this_month >= limits.documentsPerMonth) {
                return {
                    allowed: false,
                    reason: `You've reached your monthly limit of ${limits.documentsPerMonth} documents. Upgrade to Premium for unlimited documents!`
                };
            }
            return { allowed: true };

        case 'addClient':
            if (limits.clientsMax === -1) {
                return { allowed: true };
            }
            // Will need to check current client count
            return { allowed: true };

        case 'addProduct':
            if (limits.productsMax === -1) {
                return { allowed: true };
            }
            return { allowed: true };

        case 'importContact':
            // This would need tracking in user object
            return { allowed: true };

        default:
            return { allowed: false, reason: 'Unknown action' };
    }
}

// Check if user has access to a feature
export function hasFeature(user: any, feature: string): boolean {
    const tier = user.subscription_tier || 'free';
    const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];

    if (!limits) return false;

    return limits.features[feature as keyof typeof limits.features] === true;
}

// Reset monthly counters (should be run daily via cron)
export async function resetMonthlyCounters(pool: any) {
    const today = new Date();

    await pool.query(`
    UPDATE users 
    SET documents_created_this_month = 0,
        last_reset_date = CURRENT_DATE
    WHERE EXTRACT(DAY FROM last_reset_date) != EXTRACT(DAY FROM CURRENT_DATE)
      AND EXTRACT(MONTH FROM last_reset_date) != EXTRACT(MONTH FROM CURRENT_DATE)
  `);
}

// Increment document counter
export async function incrementDocumentCount(pool: any, userId: string) {
    await pool.query(`
    UPDATE users 
    SET documents_created_this_month = documents_created_this_month + 1
    WHERE id = $1
  `, [userId]);
}
