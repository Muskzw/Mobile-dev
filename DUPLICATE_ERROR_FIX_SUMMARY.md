# Document Duplication 403 Error - Fix Summary

## Problem Analysis

The mobile app was encountering a **403 Forbidden error** when trying to duplicate documents, but instead of showing the `UpgradeModal`, it was only logging the error to the console.

### Root Cause

**Backend-Frontend Mismatch:**
- The backend was returning a 403 response with `upgradeRequired: true` but **without** the `code: 'SUBSCRIPTION_LIMIT_REACHED'` field
- The frontend error handling was checking specifically for `error.response?.data?.code === 'SUBSCRIPTION_LIMIT_REACHED'`
- Since the code field was missing, the condition failed and showed a generic error instead of the UpgradeModal

## Fixes Applied

### 1. **Backend** - Added `code` field to all subscription limit responses

**Files Modified:**
- `backend/src/routes/documents.ts`

**Changes:**
- ✅ Added `code: 'SUBSCRIPTION_LIMIT_REACHED'` to duplicate endpoint (line 476)
- ✅ Added `code: 'SUBSCRIPTION_LIMIT_REACHED'` to create document endpoint (line 92)
- ✅ Added `code: 'SUBSCRIPTION_LIMIT_REACHED'` to convert document endpoint (line 569)

**Before:**
```typescript
return res.status(403).json({
  error: permissionCheck.reason,
  upgradeRequired: true,
  currentTier: user.subscription_tier,
  documentsUsed: user.documents_created_this_month
});
```

**After:**
```typescript
return res.status(403).json({
  code: 'SUBSCRIPTION_LIMIT_REACHED',
  error: permissionCheck.reason,
  upgradeRequired: true,
  currentTier: user.subscription_tier,
  documentsUsed: user.documents_created_this_month
});
```

### 2. **Frontend** - Improved error handling to be more robust

**Files Modified:**
- `mobile/src/screens/DocumentViewScreen.tsx`

**Changes:**
- ✅ Updated error handling to check for **EITHER** `code === 'SUBSCRIPTION_LIMIT_REACHED'` OR `upgradeRequired === true`
- ✅ Added state variable `documentsUsed` to track the actual count from backend
- ✅ Extract and use the error message from backend response
- ✅ Pass `documentsUsed` from backend to `UpgradeModal` for accurate display

**Before:**
```typescript
if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_LIMIT_REACHED') {
  setUpgradeReason('You have reached the limit of documents for your current plan. Upgrade to create more.');
  setShowUpgradeModal(true);
} else {
  console.error('Duplicate error:', error);
  Alert.alert('Error', 'Failed to duplicate document');
}
```

**After:**
```typescript
// Check for subscription limit errors
if (error.response?.status === 403 && 
    (error.response?.data?.code === 'SUBSCRIPTION_LIMIT_REACHED' || error.response?.data?.upgradeRequired)) {
  const reason = error.response?.data?.error || 'You have reached the limit of documents for your current plan. Upgrade to create more.';
  setUpgradeReason(reason);
  setDocumentsUsed(error.response?.data?.documentsUsed || 0);
  setShowUpgradeModal(true);
} else {
  console.error('Duplicate error:', error);
  Alert.alert('Error', error.response?.data?.error || 'Failed to duplicate document');
}
```

### 3. **UpgradeModal** - Already properly configured

The `UpgradeModal` component was already correctly implemented:
- ✅ Accepts `documentsUsed` prop
- ✅ Displays progress bar showing "X of 5 free documents"
- ✅ Shows custom reason message
- ✅ Beautiful UI with RevenueCat integration

## How It Works Now

1. **User tries to duplicate a document** when they've hit their limit
2. **Backend validates subscription tier** using `canPerformAction(user, 'createDocument')`
3. **Backend returns 403** with all necessary fields:
   - `code: 'SUBSCRIPTION_LIMIT_REACHED'`
   - `error: "You've reached your monthly limit of 5 documents..."`
   - `upgradeRequired: true`
   - `currentTier: 'free'`
   - `documentsUsed: 5`
4. **Frontend catches the error** and checks for either code OR upgradeRequired
5. **Frontend shows UpgradeModal** with:
   - Custom error message from backend
   - Actual document count (e.g., "You've used **5 of 5** free documents")
   - Premium and Business plan options
   - RevenueCat purchase integration

## Testing Recommendations

1. **Test document duplication** when at the free tier limit (5 documents)
2. **Verify UpgradeModal appears** instead of generic error
3. **Check that the document count** displays correctly in the modal
4. **Test the same flow for**:
   - Creating new documents
   - Converting documents
5. **Verify the modal shows** the custom error message from the backend

## Additional Improvements Made

- Error messages now come from the backend (more consistent and maintainable)
- Frontend is more robust (works even if backend doesn't include the `code` field)
- Document count is now dynamic (shows actual usage from backend)
- All document creation endpoints have consistent error responses
