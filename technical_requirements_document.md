# Technical Requirements Document (TRD)

**Project Name:** AmarSaloon (আমার সেলুন) — Smart Salon & Beauty Parlor Booking & Queue Management Platform  
**Document Version:** 1.0  
**Date:** October 16, 2026  
**Target Engineering Teams:** Frontend (PWA), Backend/API, DevOps, QA  

---

## 1. System Architecture Overview

AmarSaloon is architected as a high-concurrency, low-latency, mobile-first Progressive Web Application (PWA) tailored for 3G/4G network conditions in Bangladesh.

### 1.1 High-Level Architecture Diagram (Logical)

```
[ Mobile Client (PWA) / Desktop Admin ]
          │
          ├── HTTPS (REST / Next.js App Router) ──► [ Cloudflare CDN / WAF ]
          │                                                    │
          └── WSS (Socket.io Real-Time) ──────────► [ Load Balancer (NGINX) ]
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         ▼                                           ▼
                               [ Next.js Frontend ]                     [ NestJS / Node.js API ]
                                         │                                           │
                       ┌─────────────────┼─────────────────┬─────────────────────────┤
                       ▼                 ▼                 ▼                         ▼
             [ PostgreSQL + PostGIS ] [ Redis ]   [ BD SMS Gateway ]      [ S3 / R2 Object Storage ]
              (Primary Relational &    (Pub/Sub,   (OTP & Queue Alerts)    (A4 QR PDFs, Bank Slips,
               Geospatial Store)       OTP TTL,                             Salon Cover Images)
                                       Atomic Queue)
```

### 1.2 Core Technology Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 15 (App Router), React 19, TypeScript | Server-Side Rendering (SSR) for fast initial load and dynamic QR landing pages (`/s/[slug]`). |
| **Styling & UI** | Tailwind CSS, Radix UI (Bottom Sheets/Drawers) | Native-like mobile viewport lock (`max-width: 480px`), hardware-accelerated drawers. |
| **PWA & Offline Sync** | `@serwist/next` (Workbox), `Dexie.js` (IndexedDB) | Persistent top install prompt handling, background sync for offline owner ledger entries. |
| **State & Real-Time** | Zustand + Socket.io Client + TanStack Query | Optimistic UI updates when toggling salon chairs; instant WebSocket synchronization. |
| **Backend Runtime** | Node.js (v22 LTS) with NestJS (TypeScript) | Modular architecture separating Customer, Owner, and Admin domains with strict Guards. |
| **Database** | PostgreSQL 16 + **PostGIS** Extension | ACID compliance for financial ledger entries + native spatial indexing (`GIST`) for "Near Me" queries. |
| **ORM** | Prisma ORM | Type-safe database queries and automated schema migrations. |
| **In-Memory Cache & Pub/Sub** | Redis 7 | Atomic daily token counters (`INCR`), OTP TTL storage ($180\text{ s}$), and Socket.io Redis Adapter. |
| **PDF & QR Engine** | `qrcode` + `@react-pdf/renderer` (or Puppeteer) | Generates crisp 300 DPI vector A4 printable salon QR posters in Bangla and English. |

---

## 2. Database Schema & Geospatial Indexing

### 2.1 Prisma Schema Definition (`schema.prisma`)

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

enum Role {
  CUSTOMER
  OWNER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
}

enum SalonCategory {
  GENTS
  LADIES
  UNISEX
}

enum SalonStatus {
  PENDING
  ACTIVE
  BLOCKED
  DELETED
}

enum BookingType {
  LIVE_QUEUE
  SCHEDULED
}

enum BookingStatus {
  WAITING
  IN_SERVICE
  COMPLETED
  SKIPPED
  CANCELLED
  NO_SHOW
}

enum LedgerType {
  INCOME
  EXPENSE
}

enum PaymentMethod {
  BKASH
  NAGAD
  ROCKET
  BANK
}

enum SubscriptionStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id            String          @id @default(uuid())
  phone         String          @unique @db.VarChar(15)
  name          String?         @db.VarChar(100)
  passwordHash  String?         // Used only for ADMIN role
  role          Role            @default(CUSTOMER)
  languagePref  String          @default("bn") @db.VarChar(5)
  status        UserStatus      @default(ACTIVE)
  pushTokens    String[]        // Web Push VAPID endpoint subscriptions
  saloons       Saloon[]        @relation("OwnerSaloons")
  bookings      Booking[]
  favorites     FavoriteSalon[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([phone])
}

model Saloon {
  id                 String          @id @default(uuid())
  ownerId            String
  owner              User            @relation("OwnerSaloons", fields: [ownerId], references: [id])
  slug               String          @unique @db.VarChar(80)
  nameBn             String          @db.VarChar(150)
  nameEn             String          @db.VarChar(150)
  category           SalonCategory   @default(GENTS)
  isAc               Boolean         @default(false)
  address            String          @db.Text
  phone              String          @db.VarChar(15)
  latitude           Float
  longitude          Float
  totalChairs        Int             @default(3)
  busyChairs         Int             @default(0)
  chairStates        Json            @default("[]") // Array of { chairNo: 1, isBusy: false }
  manualQueueCount   Int             @default(0)    // Walk-in customers not on app
  currentServingToken Int            @default(0)
  status             SalonStatus     @default(ACTIVE)
  trialEndsAt        DateTime
  subscriptionEndsAt DateTime?
  services           SalonService[]
  bookings           Booking[]
  favoritedBy        FavoriteSalon[]
  ledgerEntries      LedgerEntry[]
  subscriptions      Subscription[]
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([ownerId])
  @@index([slug])
  @@index([status, category, isAc])
}

model SalonService {
  id           String   @id @default(uuid())
  saloonId     String
  saloon       Saloon   @relation(fields: [saloonId], references: [id], onDelete: Cascade)
  nameBn       String   @db.VarChar(120)
  nameEn       String   @db.VarChar(120)
  price        Decimal  @db.Decimal(10, 2)
  durationMins Int      @default(25)
  details      String?  @db.Text
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())

  @@index([saloonId, isActive])
}

model Booking {
  id            String        @id @default(uuid())
  saloonId      String
  saloon        Saloon        @relation(fields: [saloonId], references: [id])
  customerId    String?
  customer      User?         @relation(fields: [customerId], references: [id])
  guestName     String?       @db.VarChar(100)
  guestPhone    String        @db.VarChar(15)
  tokenNumber   Int           // Daily sequential number per salon
  bookingDate   DateTime      @db.Date
  bookingType   BookingType   @default(LIVE_QUEUE)
  scheduledAt   DateTime?
  servicesJson  Json          // Snapshot of selected services & rates
  totalAmount   Decimal       @db.Decimal(10, 2)
  totalDuration Int           // Sum of service durations in minutes
  status        BookingStatus @default(WAITING)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@unique([saloonId, bookingDate, tokenNumber])
  @@index([saloonId, bookingDate, status])
  @@index([guestPhone, status])
}

model FavoriteSalon {
  userId    String
  saloonId  String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  saloon    Saloon   @relation(fields: [saloonId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@id([userId, saloonId])
}

model LedgerEntry {
  id        String     @id @default(uuid())
  saloonId  String
  saloon    Saloon     @relation(fields: [saloonId], references: [id], onDelete: Cascade)
  type      LedgerType
  category  String     @db.VarChar(80) // e.g., "Service Sale", "Electricity", "Staff Payout"
  amount    Decimal    @db.Decimal(12, 2)
  note      String?    @db.Text
  entryDate DateTime   @db.Date
  bookingId String?    @unique
  createdAt DateTime   @default(now())

  @@index([saloonId, entryDate, type])
}

model Subscription {
  id            String             @id @default(uuid())
  saloonId      String
  saloon        Saloon             @relation(fields: [saloonId], references: [id])
  planType      String             @db.VarChar(20) // MONTHLY | YEARLY
  amount        Decimal            @db.Decimal(10, 2)
  paymentMethod PaymentMethod
  senderNumber  String?            @db.VarChar(15)
  trxId         String?            @unique @db.VarChar(60)
  receiptUrl    String?            @db.Text
  status        SubscriptionStatus @default(PENDING)
  adminNote     String?
  validUntil    DateTime?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  @@index([saloonId, status])
}
```

### 2.2 Geospatial Raw Query (PostGIS "Near Me" Discovery)

To query active, non-expired salons within a radius $R$ meters sorted by distance:

```sql
SELECT 
  id, slug, "nameBn", "nameEn", category, "isAc", address,
  "totalChairs", "busyChairs", "manualQueueCount",
  ST_DistanceSphere(
    ST_MakePoint(longitude, latitude),
    ST_MakePoint($1, $2) -- $1: User Lng, $2: User Lat
  ) AS distance_meters
FROM "Saloon"
WHERE status = 'ACTIVE'
  AND (
    "trialEndsAt" > NOW() 
    OR ("subscriptionEndsAt" IS NOT NULL AND "subscriptionEndsAt" > NOW())
  )
  AND ST_DWithin(
    ST_MakePoint(longitude, latitude)::geography,
    ST_MakePoint($1, $2)::geography,
    $3 -- $3: Radius in meters (e.g., 5000)
  )
ORDER BY distance_meters ASC
LIMIT 30;
```

---

## 3. Authentication, OTP & Role Isolation Architecture

### 3.1 OTP Flow & Redis Rate Limiting
1. **Phone Normalization:** Convert all inputs (`017XXXXXXXX`, `+88017XXXXXXXX`, `88017XXXXXXXX`) to canonical E.164 format `+88017XXXXXXXX`.
2. **Redis Keys:**
   * `otp:code:{phone}` $\rightarrow$ Stores bcrypt-hashed 6-digit OTP (`TTL = 180s`).
   * `otp:limit:{phone}` $\rightarrow$ Atomic counter for rate-limiting (`TTL = 600s`, max value `3`).
   * `guest:active_queue:{phone}` $\rightarrow$ Stores active `booking_id` (`TTL = 14400s`) to enforce the 1-active-booking-per-guest rule.

### 3.2 Role Isolation & Next.js Middleware (`middleware.ts`)
* **Customer Context (`/`, `/s/*`, `/my-saloons`, `/bookings`):**
  * Accessible by Guests and `role === 'CUSTOMER'`.
  * If JWT contains `role === 'OWNER'`, the middleware intercepts and issues a `307 Temporary Redirect` to `/owner/dashboard` so salon owners strictly see only their salon portal.
* **Owner Context (`/owner/*`):**
  * Requires valid JWT with `role === 'OWNER'`.
  * Multi-branch ownership is validated via a custom NestJS guard (`SalonOwnershipGuard`) that checks `saloon.ownerId === req.user.id` before mutating chairs, queues, services, or ledgers.
* **Admin Context (`/admin`, `/admin/*`):**
  * Unauthenticated requests to `/admin/*` render the dedicated Admin Login page (`/admin/login`).
  * Authenticated requests with `role !== 'ADMIN'` receive an immediate `403 Forbidden`.

---

## 4. Real-Time Chair & Hybrid Queue Engine

### 4.1 Atomic Token Issuance (Redis + Database Transaction)
To prevent race conditions when two customers join a salon's queue at the exact same millisecond:
1. Compute today's date string in Bangladesh Standard Time (`UTC+6`): `YYYY-MM-DD`.
2. Execute Redis `INCR` on key `queue:seq:{saloon_id}:{YYYY-MM-DD}` (with `EXPIRE 86400`).
3. Insert the `Booking` row in PostgreSQL with `tokenNumber = redisSeqValue`.

### 4.2 Real-Time WebSocket Rooms & Payload Specification
Using Socket.io with the Redis Adapter:
* **Room Naming Convention:**
  * `salon_room:{saloon_id}` — Subscribed by any Customer viewing the salon profile or tracking their token, plus the Salon Owner.
  * `owner_alert:{saloon_id}` — Subscribed exclusively by the Salon Owner's device for audio bell notifications on new bookings.
* **State Calculation Formula:**
  Whenever the owner toggles a chair, increments/decrements walk-in count ($Q_{\text{manual}}$), or advances a token, the server computes:

  $$Q_{\text{total}} = Q_{\text{online\_waiting}} + Q_{\text{manual}}$$

  $$C_{\text{free}} = C_{\text{total}} - C_{\text{busy}}$$

  $$T_{\text{wait}} = \left\lceil \frac{Q_{\text{total}} \times \bar{D}_{\text{service}}}{\max(C_{\text{total}}, 1)} \right\rceil$$

* **Broadcast Payload (`salon:state_sync`):**
  ```json
  {
    "saloonId": "b8f9-4c12",
    "totalChairs": 4,
    "busyChairs": 3,
    "chairStates": [
      { "chairNo": 1, "isBusy": true },
      { "chairNo": 2, "isBusy": true },
      { "chairNo": 3, "isBusy": true },
      { "chairNo": 4, "isBusy": false }
    ],
    "currentServingToken": 11,
    "onlineWaitingCount": 2,
    "manualQueueCount": 1,
    "totalQueue": 3,
    "estimatedWaitMins": 19,
    "updatedAt": "2026-10-16T16:15:00.000Z"
  }
  ```

---

## 5. PWA, Top Install Banner & Offline Ledger Sync

### 5.1 Web App Manifest (`manifest.json`)
```json
{
  "name": "আমার সেলুন - AmarSaloon",
  "short_name": "AmarSaloon",
  "description": "Smart Salon & Beauty Parlor Booking App",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFFFFF",
  "theme_color": "#0D9488",
  "lang": "bn-BD",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 5.2 Persistent Top Install Banner Logic
* **Detection Hook (`usePwaInstallPrompt`):**
  1. Checks `window.matchMedia('(display-mode: standalone)').matches` or `window.navigator.standalone === true`. If `true`, `isInstalled = true` (banner hidden).
  2. Listens to `window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); })`.
  3. Renders a sticky top banner (`z-index: 9999`, `height: 44px`) at the top of the mobile shell until `appinstalled` event fires.
  4. On iOS Safari (where `beforeinstallprompt` is unsupported), tapping "ইনস্টল করুন (Install)" opens a native-style bottom sheet illustrating: *Tap Share Icon $\rightarrow$ Add to Home Screen*.

### 5.3 Offline Ledger Synchronization (`IndexedDB` + Background Sync)
* Salon owners recording daily sales/expenses in low-signal ground-floor shops write first to a local `Dexie.js` table `offline_ledger_queue`.
* When `navigator.onLine` becomes `true` (or via Service Worker `sync` event tag `sync-ledger-entries`), the client batch-POSTs pending records to `POST /api/v1/owner/saloons/:id/ledger/batch`.

---

## 6. A4 Printable QR Poster Engine

### 6.1 QR Deep-Link Structure
* **Encoded URL:** `https://amarsaloon.com/s/{slug}?utm_source=qr_poster`
* **Error Correction Level:** `H` ($30\%$Reed-Solomon recovery capacity so posters remain scannable even if ligeramente smudged or laminated).

### 6.2 A4 Vector PDF Specification
* **Dimensions:** ISO A4 Portrait ($210\text{ mm} \times 297\text{ mm}$ / $595.28\text{ pt} \times 841.89\text{ pt}$).
* **Font Embedding:** Embed `HindSiliguri-Bold.ttf`, `HindSiliguri-Regular.ttf`, and `PlusJakartaSans-Bold.ttf` in `@react-pdf/renderer` to ensure accurate Bangla Conjunct (*Juktakkhor*) rendering before streaming to the browser.
* **Poster Layout Zones:**
  1. **Header Band (20% height):** Brand Logo + Salon Name (Bangla & English) + Category & AC/Non-AC pill badges.
  2. **Center Hero Zone (50% height):** High-contrast QR frame (`320pt x 320pt`) with "স্ক্যান করুন / SCAN HERE" badge.
  3. **Instruction Steps (20% height):** 3 visual icons in Bangla:
     * (১) ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন
     * (২) "প্রিয় সেলুন" (My Saloons)-এ যুক্ত করুন
     * (৩) ঘরে বসেই চেয়ার খালি আছে কিনা দেখুন ও সিরিয়াল নিন
  4. **Footer Band (10% height):** Salon Address, Contact Phone Number, and platform URL.

---

## 7. Financial Ledger (*Hishab Khata*) & Export Pipeline

### 7.1 Aggregation Queries
To ensure rapid monthly and yearly chart rendering without full table scans:
```sql
SELECT 
  DATE_TRUNC('month', "entryDate") AS month_bucket,
  SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS total_expense,
  SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) AS net_profit
FROM "LedgerEntry"
WHERE "saloonId" = $1
  AND "entryDate" BETWEEN $2 AND $3
GROUP BY month_bucket
ORDER BY month_bucket ASC;
```

### 7.2 Export Streaming (`CSV`, `XLSX`, `PDF`)
* **Endpoint:** `GET /api/v1/owner/saloons/:id/ledger/export?period=monthly&year=2026&month=10&format=csv`
* Uses Node.js `Transform` streams (`fast-csv` / `exceljs`) with `UTF-8 BOM (\uFEFF)` prepended so Bangla text opens cleanly in Microsoft Excel and Google Sheets on mobile devices.

---

## 8. Subscription & MFS Payment Verification Engine

### 8.1 Trial & Subscription State Machine
```
[Salon Registered] 
       │
       ▼ (Auto-set trialEndsAt = NOW() + 30 Days)
  [TRIAL_ACTIVE] ──────(Day 30 Reached)──────► [EXPIRED / LOCKED]
       │                                               │
       └────(Owner Submits MFS TrxID / Bank Slip)──────┤
                                                       ▼
                                              [PAYMENT_PENDING]
                                                       │
                             ┌─────────────────────────┴─────────────────────────┐
                             ▼ (Admin Approves at /admin)                        ▼ (Admin Rejects)
                    [SUBSCRIPTION_ACTIVE]                               [EXPIRED / LOCKED]
             (subscriptionEndsAt += 30 or 365 Days)                     (Notify Owner via SMS)
```

### 8.2 Automated Daily Cron Job (`node-cron` / BullMQ)
Runs daily at `09:00 Asia/Dhaka`:
1. Identifies salons where `GREATEST(trialEndsAt, subscriptionEndsAt)` expires in exactly $7$, $3$, or $1$ day(s) and dispatches Bangla reminder notifications via Web Push + SMS.
2. Identifies salons that expired at `00:00` and invalidates their discovery cache in Redis (`DEL geo:saloons:*`).

---

## 9. Non-Functional & Security Specifications

1. **Mobile Viewport Enforcement:**
   * Customer and Owner routes render inside `<div className="mx-auto max-w-[480px] min-h-dvh bg-slate-50 shadow-2xl relative pb-16">`.
   * Disable pinch-to-zoom on form inputs (`font-size >= 16px`) to prevent iOS auto-zoom glitches.
2. **Input Sanitization & TrxID Anti-Fraud:**
   * `Subscription.trxId` has a `@unique` constraint in PostgreSQL to prevent salon owners from reusing the same bKash/Nagad Transaction ID across multiple branches or months.
3. **File Upload Security:**
   * Bank transfer deposit slips and salon photos are uploaded via pre-signed S3/Cloudflare R2 URLs with strict MIME-type validation (`image/jpeg`, `image/png`, `application/pdf`) and a $5\text{ MB}$ size ceiling.