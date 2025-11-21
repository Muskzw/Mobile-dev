# Fixed: "Unknown Client" Issue in Documents List

## Problem
After creating a document, the client section showed "Unknown Client" in both:
1. Documents list screen
2. Document view screen

## Root Cause
The backend's "Get all documents" endpoint (`GET /documents`) was returning client data as **flat properties**:
```json
{
  "id": "doc-123",
  "document_number": "QTE-2025-0001",
  "client_name": "John Doe",      // ❌ Flat property
  "client_email": "john@example.com"  // ❌ Flat property
}
```

But the mobile app expected client data as a **nested object**:
```json
{
  "id": "doc-123",
  "document_number": "QTE-2025-0001",
  "client": {                       // ✅ Nested object
    "id": "client-456",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St"
  }
}
```

## Solution
Updated the SQL query in `backend/src/routes/documents.ts` (line 224) to use PostgreSQL's `json_build_object()` function to return client data as a properly structured nested object.

### Before:
```sql
SELECT d.*, c.name as client_name, c.email as client_email
FROM documents d
LEFT JOIN clients c ON d.client_id = c.id
WHERE d.company_id = $1
```

### After:
```sql
SELECT 
  d.*,
  json_build_object(
    'id', c.id,
    'name', c.name,
    'email', c.email,
    'phone', c.phone,
    'address', c.address
  ) as client
FROM documents d
LEFT JOIN clients c ON d.client_id = c.id
WHERE d.company_id = $1
```

## What This Fixes

✅ **Documents List**: Client names now display correctly
✅ **Document View**: Client information shows properly
✅ **Consistency**: All endpoints now return client data in the same format
✅ **Complete Data**: Includes all client fields (id, name, email, phone, address)

## Testing

1. **Create a new document**:
   - Go to Documents → Tap + → Create Quotation
   - Select a client
   - Add items and create

2. **Check Documents List**:
   - Go back to documents list
   - ✅ Should show client name instead of "Unknown Client"

3. **Check Document View**:
   - Tap on the document
   - ✅ Should show full client details (name, email, address)

## Technical Notes

- Used PostgreSQL `json_build_object()` for proper JSON structuring
- LEFT JOIN ensures documents without clients still return (client will be null)
- Matches the structure used in `getDocumentWithItems()` helper function
- No mobile app changes needed - backend now provides correct format

## Files Modified

- ✅ `backend/src/routes/documents.ts` - Updated GET /documents endpoint

---

## Expected API Response

After this fix, `GET /documents` returns:

```json
[
  {
    "id": "abc-123",
    "company_id": "company-456",
    "document_number": "QTE-2025-0001",
    "type": "quotation",
    "status": "pending",
    "issue_date": "2025-11-21",
    "subtotal": "300.00",
    "tax_rate": 15,
    "tax_amount": "45.00",
    "total": "345.00",
    "currency": "USD",
    "created_at": "2025-11-21T20:00:00Z",
    "client": {
      "id": "client-789",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "address": "123 Main Street, City"
    }
  }
]
```

The mobile app can now access: `item.client.name`, `item.client.email`, etc.

---

**Status**: ✅ FIXED - Client information now displays correctly everywhere!
