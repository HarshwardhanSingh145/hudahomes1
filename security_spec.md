# HUDA HOMES — Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Master Source of Truth

1. **Global Default-Deny Safety Net**: Every path not explicitly matched under `/databases/{database}/documents` is denied (`allow read, write: if false;`).
2. **Bootstrapped & Database-Backed Admin Authority**:
   - Admin identity (`isAdmin()`) requires an authenticated user with `request.auth.token.email_verified == true` and either:
     - Their verified email matches the bootstrapped studio owner email (`ishvarkalwa001@gmail.com`), OR
     - A trusted document exists at `/admins/$(request.auth.uid)`.
3. **Product & Category Integrity (`/products/{productId}`, `/categories/{categoryId}`)**:
   - Public showcase reads (`get`, `list`) are strictly restricted to documents where `resource.data.isPublic == true` (preventing blanket `if true` open reads and enforcing query constraints on `list`).
   - Only verified studio admins (`isAdmin()`) can `create`, `update`, or `delete` products and categories.
   - All writes must pass `isValidProduct(incoming())` or `isValidCategory(incoming())`, enforcing strict `hasAll` / `hasOnly` key allowlists, string length bounds (`maxLength` from `firebase-blueprint.json`), bounded array checks (`size() <= 10`), `authorId == request.auth.uid`, immutable `createdAt` / `id`, and server timestamps (`request.time`).
4. **Customer Enquiry PII Isolation (`/enquiries/{enquiryId}`)**:
   - Enquiries contain sensitive client PII (`phone`, `name`).
   - Reading (`get`, `list`) is strictly restricted to the document owner (`resource.data.authorId == request.auth.uid`) or a verified admin (`isAdmin()`).
   - Creating an enquiry requires `isSignedIn() && isVerified()`, `isValidId(enquiryId)`, `isValidEnquiry(incoming())`, `incoming().authorId == request.auth.uid`, `incoming().status == 'new'`, and `incoming().createdAt == request.time`.
   - Terminal State Locking: Once an enquiry reaches `status == 'completed'`, non-admin updates are permanently locked.

---

## 2. The "Dirty Dozen" Adversarial Payloads

### Payload 1 — Shadow Field Injection on Product Create
```json
{
  "collection": "/products/statuario-marble",
  "operation": "create",
  "auth": { "uid": "admin_1", "email": "ishvarkalwa001@gmail.com", "email_verified": true },
  "payload": {
    "id": "statuario-marble",
    "name": "Statuario Console",
    "category": "console-table",
    "categoryLabel": "Console Table",
    "price": "$4,850",
    "subtitle": "White Carrara",
    "origin": "Italy",
    "finishes": ["Polished"],
    "standardFormat": "180x45x78cm",
    "thickness": "20mm",
    "applications": ["Foyers"],
    "description": "Sculpted marble console.",
    "image": "https://images.unsplash.com/photo-1",
    "detailImage": "https://images.unsplash.com/photo-2",
    "images": ["https://images.unsplash.com/photo-1"],
    "bookmatched": true,
    "featured": true,
    "isPublic": true,
    "authorId": "admin_1",
    "createdAt": "SERVER_TIMESTAMP",
    "updatedAt": "SERVER_TIMESTAMP",
    "isSuperVerified": true
  }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `hasOnly` key guard).

### Payload 2 — Unverified Email Admin Spoof Attack
```json
{
  "collection": "/products/statuario-marble",
  "operation": "delete",
  "auth": { "uid": "attacker_1", "email": "ishvarkalwa001@gmail.com", "email_verified": false }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `request.auth.token.email_verified == true`).

### Payload 3 — Identity Spoofing (`authorId` Mismatch on Enquiry Create)
```json
{
  "collection": "/enquiries/enq_101",
  "operation": "create",
  "auth": { "uid": "user_a", "email": "client@example.com", "email_verified": true },
  "payload": {
    "id": "enq_101",
    "name": "Client A",
    "phone": "+91 9876543210",
    "company": "Studio A",
    "projectType": "Private Residence",
    "material": "Statuario Marble Console Table",
    "quantity": "2 units",
    "message": "Need delivery to Mumbai.",
    "status": "new",
    "authorId": "victim_uid_999",
    "createdAt": "SERVER_TIMESTAMP",
    "updatedAt": "SERVER_TIMESTAMP"
  }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `incoming().authorId == request.auth.uid`).

### Payload 4 — Cross-User PII Leak on `/enquiries/{enquiryId}`
```json
{
  "collection": "/enquiries/enq_101",
  "operation": "get",
  "auth": { "uid": "other_user_b", "email": "other@example.com", "email_verified": true }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `existing().authorId == request.auth.uid || isAdmin()`).

### Payload 5 — Unauthorized Query Scraping (`list` on `/enquiries` without owner filter)
```json
{
  "collection": "/enquiries",
  "operation": "list",
  "auth": { "uid": "other_user_b", "email": "other@example.com", "email_verified": true }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `resource.data.authorId == request.auth.uid || isAdmin()`).

### Payload 6 — Value Poisoning on Product Update (Invalid Type / Oversized Name)
```json
{
  "collection": "/products/statuario-marble",
  "operation": "update",
  "auth": { "uid": "admin_1", "email": "ishvarkalwa001@gmail.com", "email_verified": true },
  "payload": {
    "name": 99999999,
    "updatedAt": "SERVER_TIMESTAMP"
  }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `isValidProduct(incoming())` wrapping the `allow update` block).

### Payload 7 — ID Poisoning Attack (Invalid Regex Characters in Path Variable)
```json
{
  "collection": "/products/invalid$id!with*spaces",
  "operation": "create",
  "auth": { "uid": "admin_1", "email": "ishvarkalwa001@gmail.com", "email_verified": true }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `isValidId(productId)`).

### Payload 8 — Unbounded Array Exhaustion ("Denial of Wallet" on `images`)
```json
{
  "collection": "/products/statuario-marble",
  "operation": "create",
  "auth": { "uid": "admin_1", "email": "ishvarkalwa001@gmail.com", "email_verified": true },
  "payload": {
    "images": ["1","2","3","4","5","6","7","8","9","10","11","12"]
  }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `data.images.size() <= 10`).

### Payload 9 — Immortal Field Mutation (`createdAt` or `id` altered on Update)
```json
{
  "collection": "/products/statuario-marble",
  "operation": "update",
  "auth": { "uid": "admin_1", "email": "ishvarkalwa001@gmail.com", "email_verified": true },
  "payload": {
    "createdAt": "2020-01-01T00:00:00Z",
    "updatedAt": "SERVER_TIMESTAMP"
  }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `incoming().createdAt == existing().createdAt`).

### Payload 10 — Client Timestamp Forgery (`createdAt` != `request.time`)
```json
{
  "collection": "/enquiries/enq_102",
  "operation": "create",
  "auth": { "uid": "user_a", "email": "client@example.com", "email_verified": true },
  "payload": {
    "createdAt": "2099-01-01T00:00:00Z"
  }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by `incoming().createdAt == request.time`).

### Payload 11 — Terminal State Bypass on Completed Enquiry
```json
{
  "collection": "/enquiries/enq_completed",
  "operation": "update",
  "auth": { "uid": "user_a", "email": "client@example.com", "email_verified": true },
  "existingState": { "status": "completed", "authorId": "user_a" },
  "payload": {
    "message": "Trying to reopen a completed enquiry",
    "updatedAt": "SERVER_TIMESTAMP"
  }
}
```
*Expected*: `PERMISSION_DENIED` (blocked by terminal state lock `existing().status != 'completed'`).

### Payload 12 — Self-Assigned Admin Privilege Escalation
```json
{
  "collection": "/admins/attacker_uid",
  "operation": "create",
  "auth": { "uid": "attacker_uid", "email": "attacker@example.com", "email_verified": true },
  "payload": {
    "uid": "attacker_uid",
    "email": "attacker@example.com",
    "createdAt": "SERVER_TIMESTAMP"
  }
}
```
*Expected*: `PERMISSION_DENIED` (only existing verified bootstrapped/registered `isAdmin()` can write to `/admins/{adminUid}`).

---

## 3. Complete Test Runner Specification (`firestore.rules.test.ts`)

```ts
import {
  initializeTestEnvironment,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

describe('HUDA HOMES Fortress Firestore Security Rules — Dirty Dozen Suite', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'avid-faculty-xds98',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('rejects all 12 Dirty Dozen adversarial payloads with PERMISSION_DENIED', async () => {
    const unverifiedSpoofAdmin = testEnv.authenticatedContext('attacker_1', {
      email: 'ishvarkalwa001@gmail.com',
      email_verified: false,
    });
    const verifiedAdmin = testEnv.authenticatedContext('admin_1', {
      email: 'ishvarkalwa001@gmail.com',
      email_verified: true,
    });
    const userA = testEnv.authenticatedContext('user_a', {
      email: 'client@example.com',
      email_verified: true,
    });
    const userB = testEnv.authenticatedContext('user_b', {
      email: 'other@example.com',
      email_verified: true,
    });

    // 1. Shadow field injection on product create
    await assertFails(
      setDoc(doc(verifiedAdmin.firestore(), 'products/statuario-marble'), {
        id: 'statuario-marble',
        name: 'Statuario Console',
        category: 'console-table',
        categoryLabel: 'Console Table',
        price: '$4,850',
        subtitle: 'White Carrara',
        origin: 'Italy',
        finishes: ['Polished'],
        standardFormat: '180x45x78cm',
        thickness: '20mm',
        applications: ['Foyers'],
        description: 'Sculpted marble console.',
        image: 'https://images.unsplash.com/photo-1',
        detailImage: 'https://images.unsplash.com/photo-2',
        images: ['https://images.unsplash.com/photo-1'],
        bookmatched: true,
        featured: true,
        isPublic: true,
        authorId: 'admin_1',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isSuperVerified: true,
      })
    );

    // 2. Unverified email admin spoof
    await assertFails(deleteDoc(doc(unverifiedSpoofAdmin.firestore(), 'products/statuario-marble')));

    // 3. Identity spoofing on enquiry create
    await assertFails(
      setDoc(doc(userA.firestore(), 'enquiries/enq_101'), {
        id: 'enq_101',
        name: 'Client A',
        phone: '+91 9876543210',
        company: 'Studio A',
        projectType: 'Private Residence',
        material: 'Statuario Marble',
        quantity: '2 units',
        message: 'Delivery to Mumbai',
        status: 'new',
        authorId: 'victim_uid_999',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // 4. Cross-user PII read
    await assertFails(getDoc(doc(userB.firestore(), 'enquiries/enq_101')));

    // 5. Unauthorized list scraping on enquiries
    await assertFails(getDocs(collection(userB.firestore(), 'enquiries')));

    // 6. Value poisoning on product update
    await assertFails(
      updateDoc(doc(verifiedAdmin.firestore(), 'products/statuario-marble'), {
        name: 99999999,
        updatedAt: serverTimestamp(),
      })
    );

    // 7. ID poisoning attack
    await assertFails(
      setDoc(doc(verifiedAdmin.firestore(), 'products/invalid$id!'), {
        id: 'invalid$id!',
      })
    );

    // 8. Unbounded array exhaustion
    await assertFails(
      setDoc(doc(verifiedAdmin.firestore(), 'products/statuario-2'), {
        images: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
      })
    );

    // 9. Immortal field mutation (createdAt modified)
    await assertFails(
      updateDoc(doc(verifiedAdmin.firestore(), 'products/statuario-marble'), {
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: serverTimestamp(),
      })
    );

    // 10. Client timestamp forgery
    await assertFails(
      setDoc(doc(userA.firestore(), 'enquiries/enq_102'), {
        id: 'enq_102',
        createdAt: '2099-01-01T00:00:00Z',
      })
    );

    // 11. Terminal state bypass on completed enquiry
    await assertFails(
      updateDoc(doc(userA.firestore(), 'enquiries/enq_completed'), {
        message: 'Reopen completed enquiry',
        updatedAt: serverTimestamp(),
      })
    );

    // 12. Self-assigned admin privilege escalation
    await assertFails(
      setDoc(doc(userB.firestore(), 'admins/user_b'), {
        uid: 'user_b',
        email: 'other@example.com',
        createdAt: serverTimestamp(),
      })
    );
  });
});
```
