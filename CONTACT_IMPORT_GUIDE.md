# 📱 Contact Import Feature - Implementation Guide

## 🎯 **Feature Overview**

Allow users to import contacts from their device directly into the Clients screen!

**Benefits:**
- ✅ Super fast client setup
- ✅ No manual typing
- ✅ Users love this feature
- ✅ Competitive advantage

---

## 📦 **Installation**

```bash
cd mobile
npx expo install expo-contacts
```

---

## 🔧 **Implementation**

### **Step 1: Update app.json Permissions**

Add to `mobile/app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-contacts",
        {
          "contactsPermission": "Allow Quotation Maker to access your contacts to import clients."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSContactsUsageDescription": "This app needs access to your contacts to import clients."
      }
    },
    "android": {
      "permissions": [
        "READ_CONTACTS"
      ]
    }
  }
}
```

---

### **Step 2: Update ClientsScreen.tsx**

Add these imports:

```typescript
import * as Contacts from 'expo-contacts';
import { Alert, Platform } from 'react-native';
```

Add after the existing functions (around line 100):

```typescript
// Import Contact from Device
const handleImportContact = async () => {
  try {
    // Request permission
    const { status } = await Contacts.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant contacts permission to import from your device.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }}
        ]
      );
      return;
    }

    // Get contacts
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Addresses,
      ],
    });

    if (data.length > 0) {
      // Show contact picker modal
      setContactPickerVisible(true);
      setDeviceContacts(data);
    } else {
      Alert.alert('No Contacts', 'No contacts found on your device.');
    }
  } catch (error) {
    console.error('Import contact error:', error);
    Alert.alert('Error', 'Failed to access contacts');
  }
};

// Handle contact selection
const handleSelectContact = async (contact: Contacts.Contact) => {
  try {
    setContactPickerVisible(false);

    const name = contact.name || 'Unknown';
    const email = contact.emails?.[0]?.email || '';
    const phone = contact.phoneNumbers?.[0]?.number || '';
    const address = contact.addresses?.[0] ? 
      `${contact.addresses[0].street || ''}, ${contact.addresses[0].city || ''}, ${contact.addresses[0].country || ''}`.trim() : '';

    // Create client
    const response = await api.post('/clients', {
      name,
      email,
      phone,
      address: address || undefined,
      company_id: currentCompany?.id
    });

    queryClient.invalidateQueries({ queryKey: ['clients'] });
    Alert.alert('Success', `${name} added as a client!`);
  } catch (error: any) {
    console.error('Create client error:', error);
    Alert.alert('Error', error.response?.data?.error || 'Failed to create client');
  }
};
```

Add state variables (around line 35):

```typescript
const [contactPickerVisible, setContactPickerVisible] = React.useState(false);
const [deviceContacts, setDeviceContacts] = React.useState<Contacts.Contact[]>([]);
```

---

### **Step 3: Add Import Button to UI**

Update the header section (around line 150):

```typescript
{/* Header with search and actions */}
<View style={styles.headerContainer}>
  <View style={styles.searchContainer}>
    {/* Existing search UI */}
  </View>
  
  {/* Action Buttons Row */}
  <View style={styles.actionButtons}>
    <TouchableOpacity 
      style={styles.importButton}
      onPress={handleImportContact}
    >
      <Ionicons name="person-add" size={20} color={colors.primary[600]} />
      <Text style={styles.importButtonText}>Import Contact</Text>
    </TouchableOpacity>
    
    <Button
      title="Add Client"
      onPress={() => (navigation as any).navigate('ClientCreate')}
      gradient
      icon={<Ionicons name="add" size={20} color="white" />}
      style={{ flex: 1 }}
    />
  </View>
</View>
```

---

### **Step 4: Add Contact Picker Modal**

Add before the closing `</View>` tag:

```typescript
{/* Contact Picker Modal */}
<Modal
  visible={contactPickerVisible}
  animationType="slide"
  onRequestClose={() => setContactPickerVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={[styles.modalHeader, { paddingTop: insets.top + spacing[4] }]}>
      <TouchableOpacity onPress={() => setContactPickerVisible(false)}>
        <Ionicons name="close" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>Select Contact</Text>
      <View style={{ width: 24 }} />
    </View>

    <ScrollView style={styles.contactList}>
      {deviceContacts.map((contact, index) => (
        <TouchableOpacity
          key={index}
          style={styles.contactItem}
          onPress={() => handleSelectContact(contact)}
        >
          <View style={styles.contactAvatar}>
            <Text style={styles.contactAvatarText}>
              {contact.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.name || 'Unknown'}</Text>
            {contact.phoneNumbers?.[0] && (
              <Text style={styles.contactDetail}>
                {contact.phoneNumbers[0].number}
              </Text>
            )}
            {contact.emails?.[0] && (
              <Text style={styles.contactDetail}>
                {contact.emails[0].email}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
</Modal>
```

---

### **Step 5: Add Styles**

Add to the styles section:

```typescript
actionButtons: {
  flexDirection: 'row',
  gap: spacing[3],
  marginTop: spacing[3],
},
importButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: spacing[3],
  paddingHorizontal: spacing[4],
  backgroundColor: colors.primary[50],
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: colors.primary[200],
  gap: spacing[2],
},
importButtonText: {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: colors.primary[600],
},
modalContainer: {
  flex: 1,
  backgroundColor: colors.background.secondary,
},
modalHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: spacing[4],
  paddingBottom: spacing[4],
  backgroundColor: colors.background.primary,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray[100],
},
modalTitle: {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.bold,
  color: colors.text.primary,
},
contactList: {
  flex: 1,
  padding: spacing[4],
},
contactItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: spacing[4],
  backgroundColor: colors.background.primary,
  borderRadius: borderRadius.lg,
  marginBottom: spacing[3],
  ...shadows.sm,
},
contactAvatar: {
  width: 48,
  height: 48,
  borderRadius: borderRadius.full,
  backgroundColor: colors.primary[100],
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: spacing[3],
},
contactAvatarText: {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.bold,
  color: colors.primary[600],
},
contactInfo: {
  flex: 1,
},
contactName: {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: colors.text.primary,
  marginBottom: spacing[1],
},
contactDetail: {
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
},
```

---

## 🎨 **UI/UX Flow**

1. User taps "Import Contact" button
2. App requests permission (first time only)
3. Contact picker modal opens showing device contacts
4. User selects a contact
5. Client is created automatically with contact info
6. Success message shown
7. Client appears in the list

---

## ✨ **Additional Enhancements**

### **Bulk Import**

Allow selecting multiple contacts at once:

```typescript
const [selectedContacts, setSelectedContacts] = React.useState<Set<number>>(new Set());

const handleBulkImport = async () => {
  for (const index of selectedContacts) {
    const contact = deviceContacts[index];
    await handleSelectContact(contact);
  }
  setSelectedContacts(new Set());
  setContactPickerVisible(false);
};
```

### **Search Contacts**

Add search functionality to the contact picker:

```typescript
const [contactSearch, setContactSearch] = React.useState('');

const filteredContacts = deviceContacts.filter(contact =>
  contact.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
  contact.phoneNumbers?.[0]?.number?.includes(contactSearch) ||
  contact.emails?.[0]?.email?.toLowerCase().includes(contactSearch.toLowerCase())
);
```

---

## 📱 **Testing**

```bash
# Development build (needed for contacts permission)
eas build --profile development --platform android

# Or run on device
expo run:android
expo run:ios
```

---

## 🎯 **Why This Feature Is Awesome**

1. **Saves Time** - No manual typing
2. **Reduces Errors** - Direct import
3. **User Love** - Everyone has this pain point
4. **Competitive Edge** - Most invoice apps don't have this!

---

## 🚀 **Ready to Implement?**

1. Install `expo-contacts`
2. Update `app.json` for permissions
3. Copy the code above
4. Test on a real device (simulator won't show real contacts)
5. **Users will love you!** ❤️

---

Want me to implement this for you now? Just say "implement contact import" and I'll do it! 💪
