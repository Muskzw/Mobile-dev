# 💰 Payment Integration Guide (RevenueCat)

We are using **RevenueCat** to handle In-App Purchases (IAP) for iOS and Android. This is the industry standard for React Native apps.

## 📋 **Prerequisites**

1.  **RevenueCat Account**: You need to create an account at [revenuecat.com](https://www.revenuecat.com/).
2.  **App Store Connect / Google Play Console**: You need to have your app set up in these stores to create products.

## 🛠️ **Implementation Steps**

### **Phase 1: Mobile App (Frontend)**
1.  **Install SDK**: `npm install react-native-purchases`
2.  **Initialize**: Configure the SDK in `App.tsx` with your RevenueCat Public API Key.
3.  **Fetch Offerings**: Update `UpgradeModal.tsx` to fetch real pricing and products from RevenueCat instead of hardcoded values.
4.  **Purchase Logic**: Implement the `buy` function to trigger the native payment sheet.

### **Phase 2: Backend (Server)**
1.  **Webhooks**: Create a webhook endpoint (`/webhooks/revenuecat`) to receive events (e.g., `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`).
2.  **Sync**: Update the user's `subscription_tier` in the database based on these events. This ensures the backend is the "source of truth".

---

## 🚀 **Action Plan**

1.  **Install Dependencies** ✅ (Done)
2.  **Create Webhook Endpoint** ✅ (Done - `backend/src/routes/webhooks.ts`)
3.  **Update Frontend** (Next Step)

**You will need to:**
-   Get your RevenueCat API Keys.
-   Create products (Monthly/Annual) in App Store/Play Store and sync them to RevenueCat.
