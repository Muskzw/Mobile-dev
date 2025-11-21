# Quick Testing Guide - Document Download

## Step-by-Step Testing

### 1. Create a New Document
1. Open the mobile app
2. Navigate to Documents screen
3. Tap the "+" FAB button
4. Select "Quotation" (or another document type)
5. Select a client from the list
6. Add at least one item with description, quantity, and price
7. Tap "Create Quotation"

**Expected Result**:
- Success alert appears
- You are navigated back to Documents screen
- New document appears in the list
- Console shows creation logs

**Console logs to verify**:
```
Creating document with payload: {...}
Document created successfully: {...}
```

---

### 2. View Document Details
1. From Documents list, tap on the newly created document
2. Verify all details are displayed:
   - Document number (e.g., QTE-2025-0001)
   - Client name and email
   - All items listed
   - Correct totals (subtotal, tax, total)

**Expected Result**:
- Document view screen loads
- All information is displayed correctly
- Client information shows (not "Unknown Client")

---

### 3. Download PDF
1. On the Document View screen, tap "Download PDF" button
2. Watch the button for loading indicator
3. Check console logs for download progress

**Expected Result**:
- Button shows loading spinner immediately
- Share dialog appears automatically
- You can share/save the PDF

**Console logs to verify**:
```
Starting PDF download for document: <id>
Token found, preparing download...
File will be saved to: <path>
API Base URL: http://192.168.1.146:5000/api
Download URL: http://192.168.1.146:5000/api/documents/<id>/pdf
Download response status: 200
Download response URI: <path>
PDF downloaded successfully
Sharing available: true
```

---

## Common Error Scenarios to Test

### Scenario 1: Not Authenticated
**Test**: Clear app data and try to download without logging in
**Expected**: Alert: "Not authenticated. Please log in again."

### Scenario 2: Invalid Document ID
**Test**: (Advanced) Modify code temporarily to use invalid ID
**Expected**: Error from backend, clear error message shown

### Scenario 3: Network Error
**Test**: Turn off backend or disconnect network
**Expected**: Clear network error message with details

---

## Before Testing Checklist

- [ ] Backend is running (`docker-compose up`)
- [ ] Mobile app is running (`npm start`)
- [ ] You are logged in to the mobile app
- [ ] At least one client exists in the system
- [ ] API_URL in config.ts matches your IP

---

## Troubleshooting

### Problem: "Document data is not available"
**Solution**: Wait for document data to load, or refresh the screen

### Problem: "Not authenticated"
**Solution**: Log out and log back in

### Problem: Download button stuck loading
**Solution**: Check console for errors, verify backend is running

### Problem: PDF download returns 404
**Solution**: 
- Verify document ID is correct
- Check backend logs for errors
- Ensure `/documents/:id/pdf` route is working

### Problem: Sharing dialog doesn't appear
**Solution**: 
- This is normal on some emulators
- Check device/emulator settings
- App will show file path instead

---

## Backend Verification

Run these commands to verify the backend is working:

### Check if document exists:
```bash
# Replace <token> and <doc-id>
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/documents/<doc-id>
```

### Check if PDF generation works:
```bash
# Replace <token> and <doc-id>
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/documents/<doc-id>/pdf > test.pdf
```

If PDF file is created and contains data, the backend is working correctly.

---

## Success Indicators

✅ Document creation works
✅ Document appears in list immediately
✅ Document details load with client info
✅ Download PDF button shows loading state
✅ PDF downloads successfully
✅ Share dialog appears
✅ Console logs show all steps
✅ Error messages are clear and helpful

---

## Next Steps After Testing

1. If all tests pass, you're good to go!
2. If errors occur, check console logs
3. Compare error messages with solutions in DOCUMENT_DOWNLOAD_FIX.md
4. Report any new issues with full console logs
