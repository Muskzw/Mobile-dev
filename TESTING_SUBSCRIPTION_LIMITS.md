# 🧪 SUBSCRIPTION LIMITS - TESTING GUIDE

## ✅ **Setup Complete!**

Your users are now set to:
- **Tier:** FREE
- **Documents Created:** 0/5
- **Limit:** 5 documents per month

---

## 📝 **Testing Steps:**

### **Step 1: Create Documents 1-5** ✅
```
1. Open your mobile app
2. Go to Documents screen
3. Create Document #1 (Quotation/Invoice)
   ✅ Should work fine
   
4. Create Document #2
   ✅ Should work fine
   
5. Create Document #3
   ✅ Should work fine
   
6. Create Document #4
   ✅ Should work fine
   
7. Create Document #5  
   ✅ Should work fine (this is your limit!)
```

---

### **Step 2: Try Creating Document #6** 🚫

```
8. Try to create Document #6
   ❌ Should FAIL with error message:
   
   "You've reached your monthly limit of 5 documents. 
    Upgrade to Premium for unlimited documents!"
```

**Expected Response:**
```json
{
  "error": "You've reached your monthly limit of 5 documents. Upgrade to Premium for unlimited documents!",
  "upgradeRequired": true,
  "currentTier": "free",
  "documentsUsed": 5
}
```

---

## 🔍 **Check Current Status:**

Run this anytime to see your document count:

```bash
docker-compose exec -T db psql -U postgres -d quotation_maker -c \
  "SELECT email, subscription_tier, documents_created_this_month FROM users WHERE email = 'your@email.com';"
```

---

## 💎 **Upgrade to Premium (For Testing):**

To test premium features:

```bash
docker-compose exec -T db psql -U postgres -d quotation_maker -c \
  "UPDATE users SET subscription_tier = 'premium' WHERE email = 'your@email.com';"
```

Now you can create **UNLIMITED** documents! 🚀

---

## 🔄 **Reset for Another Test:**

```bash
docker-compose exec -T db psql -U postgres -d quotation_maker -c \
  "UPDATE users SET subscription_tier = 'free', documents_created_this_month = 0;"
```

---

## 📊 **What to Watch For:**

### ✅ **Success Indicators:**
1. Documents 1-5 create successfully
2. Counter increments (0 → 1 → 2 → 3 → 4 → 5)
3. Document #6 returns error 403
4. Error message includes "upgrade" prompt
5. Error includes current usage stats

### ❌ **If Something's Wrong:**
1. Check backend logs: `docker-compose logs backend`
2. Verify database: `SELECT * FROM users LIMIT 1;`
3. Check for errors in mobile app console

---

## 🎯 **Expected User Experience:**

**Documents 1-5:**
```
User: *Creates document*
App: ✅ "Document created successfully!"
```

**Document 6:**
```
User: *Tries to create document*
App: ❌ "You've reached your monthly limit of 5 documents."
     [Upgrade to Premium] button appears
```

---

## 💡 **Next Steps After Testing:**

Once you confirm it works:

1. ✅ Add frontend upgrade modal
2. ✅ Add PDF watermark for free users
3. ✅ Add pricing screen
4. ✅ Integrate payment (RevenueCat/Stripe)

---

## 🚀 **GO TEST IT NOW!**

1. Open your mobile app
2. Create 5 documents
3. Try creating the 6th one
4. See the magic happen! 💰

**Report back:** Did it work? You should see the limit kick in! 🎉

---

## 🐛 **Troubleshooting:**

**Problem:** Can create more than 5 documents
**Solution:** 
```bash
# Check if counter is incrementing
docker-compose exec -T db psql -U postgres -d quotation_maker -c \
  "SELECT documents_created_this_month FROM users;"

# Check backend logs
docker-compose logs backend | grep subscription
```

**Problem:** Error 500 instead of 403
**Solution:**
```bash
# Check for subscription.ts import errors
docker-compose logs backend | tail -50
```

---

**Ready to test?** Open your app and start creating documents! 🎯
