# 🧪 Quick Testing Guide

## Test Everything in 10 Minutes

### 1. Password Reset (2 min)
```
✓ Open app
✓ Tap "Forgot Password?"
✓ Enter: admin@gmail.com
✓ Check backend console for reset token
✓ Verify email service logs the request
```

### 2. Privacy & Terms (1 min)
```
✓ Open Settings
✓ Tap "Privacy Policy" → Should open
✓ Go back
✓ Tap "Terms of Service" → Should open
✓ Verify content is readable
```

### 3. Create Document (2 min)
```
✓ Go to Documents tab  
✓ Tap + button
✓ Choose "Invoice"
✓ Fill in details
✓ Add line item
✓ Save
✓ Open PDF → Verify it looks professional
```

### 4. Edit Client (1 min)  
```
✓ Go to Clients tab
✓ Tap on a client
✓ Tap three dots → Edit
✓ Change name
✓ Save
✓ Verify fields are full width (not squashed)
```

### 5. Mark as Paid (1 min)
```
✓ Open any document
✓ Tap "More" button
✓ Tap "Mark as Paid"
✓ Verify status changes
✓ Check PDF shows correct status
```

### 6. Dark Mode (1 min)
```
✓ Change device to dark mode
✓ App should switch automatically
✓ All screens should look good
```

### 7. Company Settings (2 min)
```
✓ Go to Settings
✓ Edit company details
✓ Add phone, address, payment instructions
✓ Save
✓ Create new document
✓ Download PDF → Verify all details appear
```

---

## ✅ All Tests Passed?

**Your app is ready to launch!** 🚀

---

## 🐛 Found an Issue?

Note it down and we'll fix it together!

1. What screen?
2. What happened?
3. What should happen?

---

## 🎯 Next Steps

1. [ ] Enable SendGrid (15 min)
2. [ ] TestFlight / Internal Testing
3. [ ] Get 5-10 beta testers
4. [ ] Public launch! 🚀
