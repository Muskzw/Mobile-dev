# 🔧 THREE FIXES FOR TOMORROW

## 1. ✅ Share Document Screen Fixes

### Issue: Share functionalities not working properly

**Files to fix:** `DocumentViewScreen.tsx`

### Changes Needed:

#### A. Add Premium Check to WhatsApp Share
```tsx
const handleWhatsAppShare = async () => {
  // Check subscription for WhatsApp sharing
  const isFree = !user?.subscription_tier || user.subscription_tier === 'free';
  if (isFree) {
    setShowShareModal(false);
    setUpgradeReason('WhatsApp sharing is a Premium feature. Upgrade to share directly via WhatsApp!');
    setShowUpgradeModal(true);
    return;
  }

  try {
    setDownloadLoading(true);
    setShowShareModal(false);
    
    const fileUri = await downloadPDF();
    if (!fileUri) {
      setDownloadLoading(false);
      return;
    }

    // Share via WhatsApp with PDF
    const docType = document?.type?.charAt(0).toUpperCase() + document?.type?.slice(1).replace('_', ' ') || 'Document';
    const message = `Hello! Please find your ${docType} ${document?.document_number}.\n\nTotal: ${document?.currency} ${parseFloat(document?.total || 0).toFixed(2)}`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      setTimeout(async () => {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share PDF via WhatsApp',
            UTI: 'com.adobe.pdf'
          });
        }
      }, 1000);
    } else {
      Alert.alert('WhatsApp Not Available', 'Please install WhatsApp to use this feature.');
    }
  } catch (error) {
    console.error('WhatsApp share error:', error);
    Alert.alert('Error', 'Failed to share via WhatsApp');
  } finally {
    setDownloadLoading(false);
  }
};
```

#### B. Fix Email & Other Share Functions
- All share functions should have proper loading states
- Use `setDownloadLoading(true)` at start
- Use `setDownloadLoading(false)` in finally block
- Close share modal before starting download

---

## 2. ✅ Clients Screen Design - Show Phone & Email

### Issue: Phone numbers and emails not showing on client cards

**File to fix:** `ClientsScreen.tsx`

### Current Problem:
Client cards only show name and avatar, missing contact details

### Fix Needed:
Update the `ClientItem` component around line 90-150 to include phone and email:

```tsx
const ClientItem = ({ item }: { item: any }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={() => (navigation as any).navigate('ClientView', { clientId: item.id })}
  >
    <Card style={styles.clientCard} padding={0}>
      <View style={{ padding: spacing[4] }}>
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={colors.gradients.ocean as any}
            style={styles.clientAvatar}
          >
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{item.name}</Text>
            
            {/* ADD THESE LINES */}
            {item.email && (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.contactText}>{item.email}</Text>
              </View>
            )}
            
            {item.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.contactText}>{item.phone}</Text>
              </View>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);
```

### Add These Styles:
```tsx
contactRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[1],
  marginTop: spacing[1],
},
contactText: {
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
},
```

---

## 3. ✅ Import Contacts - Prioritize Emails on Top

### Issue: Contacts with emails should appear first

**File to fix:** `ClientsScreen.tsx`

### Current Problem:
Contacts are shown in device order, not sorted by email availability

### Fix Needed:
Update `handleImportFromContacts` function around line 81-110:

```tsx
const handleImportFromContacts = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need contacts permission to import your contacts');
      return;
    }

    setImportingContacts(true);
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
    });

    if (data.length > 0) {
      // SORT: Contacts with emails first
      const sortedContacts = data.sort((a, b) => {
        const aHasEmail = a.emails && a.emails.length > 0;
        const bHasEmail = b.emails && b.emails.length > 0;
        
        // Contacts with email come first
        if (aHasEmail && !bHasEmail) return -1;
        if (!aHasEmail && bHasEmail) return 1;
        
        // If both have or don't have email, sort alphabetically
        const aName = a.name || '';
        const bName = b.name || '';
        return aName.localeCompare(bName);
      });
      
      setDeviceContacts(sortedContacts);
      setShowImportModal(true);
    } else {
      Alert.alert('No Contacts', 'No contacts found on your device');
    }
  } catch (error) {
    console.error('Failed to import contacts:', error);
    Alert.alert('Error', 'Failed to import contacts');
  } finally {
    setImportingContacts(false);
  }
};
```

### Optional Enhancement:
Add a separator/header to show "Contacts with Email" and "Other Contacts" sections

---

## 📋 Testing Checklist

### Share Functions:
- [ ] WhatsApp share asks for premium on free tier
- [ ] Email share works correctly
- [ ] Local download saves PDF
- [ ] All share functions show loading states

### Clients Screen:
- [ ] Client cards show email (if available)
- [ ] Client cards show phone (if available)
- [ ] Clicking client opens detail view
- [ ] Design looks clean with icons

### Contact Import:
- [ ] Contacts with emails appear at top
- [ ] Contacts without emails appear after
- [ ] Sorting is alphabetical within each group
- [ ] Import modal shows correct contact info

---

## 🎯 Implementation Order

1. **Fix Share Functions** (15 min)
   - Add premium check  
   - Fix loading states

2. **Update Client Cards** (10 min)
   - Add email/phone display
   - Add styles

3. **Sort Contacts** (5 min)
   - Add sort logic to import

**Total: ~30 minutes** 🚀

See you tomorrow!
