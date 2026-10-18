# Product Requirements Document (PRD)
**Project Name:** AmarSaloon (আমার সেলুন) — Smart Salon & Beauty Parlor Booking & Queue Management Platform  
**Document Version:** 1.0  
**Status:** Ready for Engineering & Design  
**Author:** Senior Lead Product Designer  
**Target Market:** Bangladesh (Primary Language: Bangla, Secondary: English)  
**Platform:** Mobile-First Web Application / Progressive Web App (PWA)

---

## 1. Executive Summary & Product Vision
In Bangladesh, visiting a local salon or beauty parlor often involves unpredictable waiting times, crowded waiting areas, and zero visibility into chair availability. Meanwhile, salon owners rely on manual pen-and-paper ledgers to track daily sales and struggle to retain customers digitally.

**Vision:** To build a lightweight, hyper-localized, mobile-first Progressive Web App (PWA) that bridges the gap between customers and salons. Customers can discover nearby salons, inspect real-time chair availability, and join a live virtual queue or book appointments seamlessly. Salon owners gain a digital storefront, automated QR-based marketing, live queue control, and a daily bookkeeping ledger (Tali/Khata).

---

## 2. User Personas & Role Architecture

The system operates on strict **Role-Based Access Control (RBAC)** with distinct entry points and experiences:

### 2.1 Customer (Guest & Registered)
* **Guest User:** Can browse, filter salons, scan QR codes, and join a queue/book an appointment by providing a name and phone number (verified via OTP at checkout to prevent spam).
* **Registered User:** Authenticated via Phone + OTP. Can save salons to **"My Saloons" (আমার সেলুন)**, view booking history, track live waiting serial numbers, and receive real-time push/SMS notifications.

### 2.2 Salon Owner (Partner)
* Authenticated via a dedicated Partner Login flow.
* **Strictly Isolated View:** Upon logging in, owners only see their salon management dashboard (no customer discovery feed).
* **Multi-Branch Support:** A single owner account can register, switch between, and manage multiple salon branches.

### 2.3 Super Admin
* Accessed exclusively via a hidden/restricted `/admin` route.
* Controls platform-wide configurations, user roles, salon approvals/blocks, and subscription verification (MFS/Bank payments).

---

## 3. Core Functional Requirements

### 3.1 Module A: Customer Experience (Web & PWA)
1. **PWA Installation & Onboarding:**
   * Persistent, non-intrusive sticky top banner: *"অ্যাপটি আপনার ফোনে ইনস্টল করুন (Install App for Faster Booking & Live Queue Alerts)"* with a 1-tap `Install` button. Automatically hides once installed (`display-mode: standalone`).
   * Language toggle in the header: **বাংলা (Default)** | **EN**.
2. **Discovery, Search & Filtering:**
   * Geolocation-based "Near Me" sorting using HTML5 Geolocation API.
   * **Quick Filters:**
     * Category: *Gents Salon (জেন্টস সেলুন)* | *Ladies Beauty Parlor (লেডিস বিউটি পার্লার)* | *Unisex*.
     * Environment: *AC (এসি)* | *Non-AC (নন-এসি)*.
     * Availability: *Free Chair Right Now* | *Shortest Queue*.
   * Search by Salon Name, Area/Thana, or specific service (e.g., Facial, Beard Trim).
3. **Salon Profile View & QR Deep-Linking:**
   * Scanning a salon’s physical QR code opens `https://domain.com/s/{salon_slug}` directly inside the PWA.
   * Displays: Salon Name, Verified Badge, AC/Non-AC tag, Google Map Location link, Contact button, Live Status Widget, and Service Menu.
   * **"Add to My Saloons" (ফেভারিট করুন) CTA:** Prominent heart/bookmark button. If the user is a Guest, clicking triggers a slide-up OTP login modal.
4. **Live Queue & Booking Flow:**
   * **Visual Status Board:** Displays Total Chairs/Desks (e.g., 5 Chairs), Currently Occupied (e.g., 5/5 Booked), and Current Waiting Queue (e.g., 3 People in Queue).
   * **Service Selection:** Multi-select services (e.g., Haircut + Beard Shave) with dynamic calculation of **Total Price (৳)** and **Estimated Duration (mins)**.
   * **Booking Type:**
     * *Join Live Queue (এখনই সিরিয়াল নিন):* Assigns an immediate Token/Waiting Number (e.g., Token #14).
     * *Schedule Appointment (সময় নির্ধারণ করুন):* Pick a specific date and time slot.
   * **Live Waiting Tracker:** Active screen showing the customer's Token Number, Current Serving Token, and Estimated Wait Time.

---

### 3.2 Module B: Salon Owner Portal (Partner App)
1. **Multi-Salon Registration & Profile Management:**
   * Create/Edit Salon Profile: Salon Name (Bangla/English), Full Address, Pin Location on Map (Lat/Lng), Contact Phone, Salon Type (Gents/Ladies), Facility (AC/Non-AC), Opening/Closing Hours, Cover Photos.
   * **Branch Switcher:** Top dropdown allowing owners with multiple salons to toggle between branches seamlessly.
2. **Service Catalog Builder:**
   * Pre-loaded templates in Bangla & English for rapid setup: *Hair Cutting (চুল কাটা), Beard Shave (দাড়ি শেভ), Facial (ফেসিয়াল), Pedicure (পেডিকিউর), Manicure (ম্যানিকিউর), Spa (স্পা), Face Pack (ফেস প্যাক), Bridal Makeup (ব্রাইডাল মেকআপ)*.
   * Custom Service Creation: Service Name, Price (BDT ৳), Estimated Duration (in minutes), Service Description, Active/Inactive toggle.
3. **Live Floor & Queue Controller (The "One-Tap" Console):**
   * *Design Note:* Barbers often have wet hands or are holding tools. The UI must feature oversized, single-tap controls.
   * **Chair/Desk Grid:** Set total chairs (e.g., 4). Tap any chair to toggle state: `Available (খালি আছে - Green)` $\leftrightarrow$ `Booked/Busy (ব্যস্ত - Red)`.
   * **Queue Counter Control:** Big `+` and `-` buttons to manually adjust walk-in customers waiting in the physical shop, synced with online queue bookings.
   * **"Call Next Customer" Button:** Advances the queue, marks current customer as served, and automatically triggers a real-time notification to the next customer in line.
4. **A4 Printable QR Poster Engine:**
   * Auto-generates a unique QR code linked to the salon's profile.
   * **Print-Ready A4 PDF Generator:** Generates a high-resolution, professionally designed A4 poster containing:
     * Salon Name, Address, and Contact Info.
     * Large scannable QR Code in the center.
     * Bangla & English callouts: *"সিরিয়াল দিতে বা আমাদের সার্ভিস দেখতে QR কোডটি স্ক্যান করুন (Scan to check live waiting line & book online)"*.
   * Actions: `Download A4 PDF` (for printing and laminating at the shop) and `Share Card` (WhatsApp/Facebook).
5. **Digital Ledger: Daily Sales & Expense Tracker (হিসাব খাতা):**
   * **Automated + Manual Sales Entry:** Completed app bookings can be converted into a sale with 1 tap. Owners can also log walk-in cash sales and daily shop expenses (e.g., Electricity bill, Blade/Cosmetics purchase, Staff tea, Rent).
   * **Financial Dashboard:**
     * Daily summary: Total Income (আয়), Total Expense (ব্যয়), Net Profit (নিট লাভ).
     * Monthly & Yearly interactive charts and tabular reports.
   * **Data Export:** Export filtered daily/monthly/yearly statements as `.CSV` / `.XLSX` or printable `.PDF`.

---

### 3.3 Module C: Super Admin Portal (`/admin`)
1. **Dedicated Authentication:** Accessible only at `/admin` via email/phone + password + 2FA.
2. **Salon Lifecycle Management:**
   * View all registered salons.
   * Add new salon on behalf of an owner, Edit salon details, Soft-Delete, or **Block/Suspend** a salon (immediately hides salon from customer discovery).
3. **User & Role Management:**
   * View Customers, Salon Owners, and System Admins. Change roles or ban abusive accounts/numbers.
4. **Subscription & Payment Verification Console:**
   * Manage subscription plans (Monthly / Yearly rates).
   * Review manual Bank Transfer slips or MFS Transaction IDs (TrxID) if manual fallback is used alongside automated gateways.
   * Extend trial periods or manually activate a salon’s subscription.

---

## 4. Monetization & Subscription Logic

1. **30-Day Free Trial:**
   * Every newly registered salon automatically receives a **30-Day Free Trial** (`status: TRIAL_ACTIVE`) with full access to all features.
2. **Subscription Packages:**
   * **Monthly Package (মাসিক প্যাকেজ):** Billed every 30 days.
   * **Yearly Package (বার্ষিক প্যাকেজ):** Billed every 365 days (discounted rate).
3. **Grace Period & Expiry Behavior:**
   * Reminders sent at $T-7$, $T-3$, and $T-1$ days before expiration.
   * Upon expiration (`status: EXPIRED`), the owner can still log in and view past sales reports, but their salon is hidden from public booking and the queue controller is locked until renewed.
4. **Payment Methods (Bangladesh Localized):**
   * **MFS (Mobile Financial Services):** bKash, Nagad, Rocket (Automated tokenized checkout via SSLCommerz / bKash PGW, plus an option to submit TrxID for manual verification).
   * **Bank Transfer:** Display platform bank account details + upload payment receipt/deposit slip image for Admin approval.

---

## 5. UX/UI & Native Mobile Design Guidelines

Even though this is a web application, it must feel indistinguishable from a native Android/iOS app.

### 5.1 Mobile-First & PWA Layout Rules
* **Viewport Lock:** Constrain main customer and owner views to a mobile container (`max-width: 480px` centered on desktop screens, full-bleed on mobile devices; Admin `/admin` uses a responsive desktop widescreen layout).
* **Bottom Navigation Bar:** Fixed 4-tab bottom bar for thumb-friendly navigation:
  * *Customer:* `Home (হোম)` | `Search (খুঁজুন)` | `My Bookings (সিরিয়াল)` | `My Saloons (প্রিয় সেলুন)`
  * *Owner:* `Live Queue (চেয়ার ও সিরিয়াল)` | `Ledger (হিসাব খাতা)` | `Services (সার্ভিস)` | `Profile & QR (প্রোফাইল)`
* **Touch Targets:** Minimum `48px × 48px` tap targets. No hover-dependent interactions. Use native-style bottom sheets (slide-up drawers) instead of cramped center modals.

### 5.2 Typography & Color Palette
* **Typography:**
  * *Bangla:* **Hind Siliguri** or **Noto Sans Bengali** (clean, modern, high legibility on low-DPI screens).
  * *English & Numerals:* **Plus Jakarta Sans** or **Inter**.
* **Color System:**
  * *Primary Brand:* Deep Royal Plum (`#4A154B`) or Vibrant Teal (`#0D9488`) — evokes grooming, hygiene, and trust.
  * *Accent / CTA:* Warm Amber (`#F59E0B`) for primary booking buttons.
  * *Semantic Status Colors:*
    * Chair Available: Emerald Green (`#10B981`)
    * Chair Occupied / Busy: Crimson Red (`#EF4444`)
    * Queue Waiting: Amber (`#F59E0B`)

---

## 6. Real-Time Notification Architecture

Both Customers and Salon Owners must receive immediate, reliable feedback across two channels: **Web Push / Socket (In-App)** and **Transactional SMS (Fallback)**.

| Trigger Event | Recipient | Channel | Message Template (Bangla Default) |
| :--- | :--- | :--- | :--- |
| **New Booking / Queue Joined** | Salon Owner | Web Push + Sound Alert | *"নতুন বুকিং! কাস্টমার [Name] সিরিয়াল নিয়েছেন (টোকেন #12)।"* |
| **Booking Confirmed** | Customer | Web Push + SMS | *"আপনার সিরিয়াল কনফার্ম হয়েছে! টোকেন নং: #12। বর্তমান ওয়েটিং: ২ জন।"* |
| **Queue Advancing (Next in Line)** | Customer | Web Push + SMS | *"প্রস্তুত থাকুন! আপনার আগের কাস্টমারের কাজ চলছে। ১০ মিনিটের মধ্যে সেলুনে চলে আসুন।"* |
| **Chair Ready / Turn Arrived** | Customer | Web Push | *"আপনার সিরিয়াল এসেছে! অনুগ্রহ করে চেয়ারে বসুন।"* |
| **Subscription Expiring** | Salon Owner | Web Push + SMS | *"আপনার ফ্রি ট্রায়াল আগামী ৩ দিনে শেষ হবে। সেবা চালু রাখতে প্যাকেজ নবায়ন করুন।"* |

---

## 7. Queue & Chair State Logic (Mathematical Model)

To give customers an accurate **Estimated Waiting Time ($T_{\text{wait}}$)**, the system computes:

$$T_{\text{wait}} = \frac{Q_{\text{current}} \times \bar{D}_{\text{service}}}{\max(C_{\text{active}}, 1)}$$

Where:
* $Q_{\text{current}}$ = Number of queued customers ahead of the user.
* $\bar{D}_{\text{service}}$ = Average service duration (default $25\text{ mins}$ if unspecified, or sum of selected service durations in queue).
* $C_{\text{active}}$ = Total number of active/operational chairs set by the owner.

*Walk-in Synchronization:* Because many local customers walk into the salon without using the app, the Owner's `+ / - Queue Counter` directly increments or decrements $Q_{\text{current}}$ in real time via WebSockets so app users always see the true physical reality inside the shop.

---

## 8. Technical Architecture & Stack Recommendations

* **Frontend (PWA):** Next.js (React) with TypeScript, Tailwind CSS.
  * *PWA Capabilities:* `next-pwa` / Service Workers with `manifest.json`, offline caching of static assets, `beforeinstallprompt` listener for the sticky top install banner, and Web Push API (`VAPID` keys).
* **Real-Time Engine:** Socket.io, Pusher, or Supabase Realtime (for instantaneous chair status and waiting number updates without page reloads).
* **Backend & API:** Node.js (NestJS or Express) or Next.js API Routes.
* **Database:** PostgreSQL (via Prisma ORM) with PostGIS extension for fast radius-based "Near Me" geospatial queries.
* **Authentication & OTP:** Phone Number + 6-digit OTP via local BD SMS Gateway (e.g., SSL Wireless, BoomCast, or GreenWeb BD) with Redis TTL rate-limiting (max 3 OTP requests per 10 minutes per number).
* **PDF & QR Generation:** `qrcode.react` + `@react-pdf/renderer` or HTML-to-Canvas for crisp, print-ready 300 DPI A4 poster generation.

---

## 9. Core Database Schema (High-Level Entities)

* **`users`**: `id`, `phone` (unique), `name`, `role` (`CUSTOMER`, `OWNER`, `ADMIN`), `language_pref` (`bn`, `en`), `status`, `created_at`
* **`saloons`**: `id`, `owner_id` (FK), `slug` (unique for QR), `name_bn`, `name_en`, `category` (`GENTS`, `LADIES`, `UNISEX`), `is_ac` (boolean), `address`, `lat`, `lng`, `phone`, `total_chairs`, `busy_chairs`, `manual_queue_count`, `status` (`PENDING`, `ACTIVE`, `BLOCKED`), `trial_ends_at`, `subscription_ends_at`
* **`salon_services`**: `id`, `saloon_id` (FK), `name_bn`, `name_en`, `price`, `duration_mins`, `details`, `is_active`
* **`bookings`**: `id`, `saloon_id` (FK), `customer_id` (FK, nullable for guests), `guest_name`, `guest_phone`, `token_number`, `booking_type` (`LIVE_QUEUE`, `SCHEDULED`), `scheduled_at`, `total_amount`, `status` (`WAITING`, `IN_SERVICE`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)
* **`favorite_saloons`**: `user_id` (FK), `saloon_id` (FK)
* **`ledger_entries`**: `id`, `saloon_id` (FK), `type` (`INCOME`, `EXPENSE`), `category`, `amount`, `note`, `entry_date`, `booking_id` (nullable FK)
* **`subscriptions`**: `id`, `saloon_id` (FK), `plan_type` (`MONTHLY`, `YEARLY`), `amount`, `payment_method` (`BKASH`, `NAGAD`, `ROCKET`, `BANK`), `trx_id`, `receipt_url`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `valid_until`

---

## 10. Edge Cases & Risk Mitigation (Senior Designer Notes)

1. **Customer No-Shows in Live Queue:**
   * *Problem:* A customer books online from home and doesn't show up when their turn arrives, blocking the chair.
   * *Solution:* Add a **"Skip / Hold Token (পাশে রাখুন)"** and **"Cancel / No-Show"** button for the Salon Owner. Skipping moves the customer down by 2 spots instead of deleting them immediately.
2. **Fake/Spam Guest Bookings:**
   * *Problem:* Competitors or pranksters flooding a salon's queue as a "Guest".
   * *Solution:* Guest booking requires a 1-time Phone OTP check before the token is issued, and each phone number is limited to **1 active live queue token** at a time.
3. **Poor Internet Connectivity inside Salons:**
   * *Problem:* Ground-floor salons in Bangladesh often have weak mobile data.
   * *Solution:* Optimistic UI updates in the PWA and lightweight payloads. The ledger module stores draft entries in `IndexedDB` locally and syncs when connection resumes.

---

## 11. Phased Rollout Roadmap

* **Phase 1 (MVP - Weeks 1–4):**
  * Customer & Owner OTP Auth, Multi-Salon Profile & Service Setup, Live Chair & Queue Controller, A4 Printable QR Code Generator, Guest & Registered Queue Booking, Top PWA Install Banner, Bangla/English Localization.
* **Phase 2 (Monetization & Ledger - Weeks 5–6):**
  * Daily Sales & Expense Ledger with Monthly/Yearly exports, 30-day Free Trial logic, MFS/Bank Subscription Checkout, and `/admin` Portal.
* **Phase 3 (Growth & Polish - Weeks 7–8):**
  * Automated SMS & Web Push reminders, Customer Reviews & Ratings, Staff/Barber-specific selection, and Promotional Discount Coupons.