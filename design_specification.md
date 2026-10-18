# Design Specification & UI/UX System

**Project Name:** AmarSaloon (আমার সেলুন) — Smart Salon & Beauty Parlor Booking & Queue Management Platform

**Document Version:** 1.0

**Target Device Class:** Mobile-First Viewports (`max-width: 480px`), Progressive Web App (PWA), Widescreen Desktop for `/admin`.

---

## 1. Design Philosophy: "Native-App-in-Browser"

To ensure users on Android and iOS feel like they are interacting with a native application rather than a responsive website, the interface adheres to strict native interaction patterns, haptic feedback emulation, zero horizontal scrolling, and touch-optimized ergonomics.

### 1.1 Viewport Container & Shell Constraints

* **Mobile Shell Frame:** On screens wider than `480px` (desktop viewports), the customer and salon owner apps are constrained inside a centered mobile frame (`max-width: 480px`, `min-height: 100dvh`, background shadow, border radius framing) simulating an iPhone/Android device screen. On actual mobile devices, it spans full width (`width: 100vw`, `height: 100dvh`).
* **Viewport Meta Tags:** 
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  ```
* **Overflow Control:** `overflow-x: hidden` enforced on body and html to eliminate accidental horizontal jitter.

---

## 2. Color Palette & Semantic System

The color system builds trust, grooming hygiene, and instant state recognition under bright outdoor daylight conditions in Bangladesh.

| Token Name | Hex Code | Usage Context |
| :--- | :--- | :--- |
| **Primary Brand (Deep Teal)** | `#0D9488` | App header, primary brand accents, active tab indicators, brand logo. |
| **Secondary Accent (Royal Plum)** | `#4A154B` | Owner portal badge accents, premium subscription highlights. |
| **Action CTA (Warm Amber)** | `#F59E0B` | Primary booking buttons, "Join Queue" CTA, prominent notifications. |
| **Background Neutral (Off-White)** | `#F8FAFC` | App background container (`bg-slate-50`). |
| **Card Surface** | `#FFFFFF` | Saloon cards, bottom sheet containers, form inputs. |
| **Success / Chair Available** | `#10B981` | Emerald Green — indicates open chairs (`খালি আছে`), successful bookings. |
| **Danger / Chair Busy** | `#EF4444` | Crimson Red — indicates occupied chairs (`ব্যস্ত`), error states, expired trials. |
| **Text Primary** | `#0F172A` | High contrast headings and primary body text (`slate-900`). |
| **Text Muted** | `#64748B` | Secondary descriptions, timestamps, addresses (`slate-500`). |

---

## 3. Typography & Localization Rules

* **Bangla Typography:** **Hind Siliguri** (Google Fonts) loaded with weights `400 (Regular)`, `500 (Medium)`, `600 (SemiBold)`, and `700 (Bold)` to ensure clean legibility of Bangla conjuncts (*Juktakkhor*) on low-end Android screens.
* **English & Numerals:** **Plus Jakarta Sans** for modern numerals, English labels, and monetary figures (`৳`).
* **Dynamic Font Scaling:** Enforce a minimum font size of `16px` (`text-base`) on all form input elements to prevent mobile Safari from auto-zooming on focus.

---

## 4. Navigation Architecture & Touch Ergonomics

### 4.1 Fixed Bottom Navigation Bar (`height: 64px + safe-area-inset-bottom`)
Pinned to the bottom of the viewport using `fixed bottom-0 left-0 right-0 z-50` with a subtle top blur border (`backdrop-blur-md bg-white/90 border-t border-slate-200`).

* **Customer Tabs:**
  1. **Home (হোম):** Discovery feed, GPS radius search, quick filters.
  2. **Search (খুঁজুন):** Advanced filter drawer (AC/Non-AC, Gents/Ladies, Service type).
  3. **My Bookings (সিরিয়াল):** Active waiting token status and live countdown tracker.
  4. **My Saloons (প্রিয় সেলুন):** Saved favorite salons list for 1-tap re-booking.
* **Salon Owner Tabs:**
  1. **Queue & Chairs (চেয়ার ও সিরিয়াল):** Live floor grid and walk-in counter controller.
  2. **Ledger (হিসাব খাতা):** Daily income/expense tracking and monthly reports.
  3. **Services (সার্ভিস):** Service catalog builder and rate editor.
  4. **Profile & QR (প্রোফাইল):** Salon settings and A4 QR PDF generator.

### 4.2 Touch Targets & Gestures
* **Minimum Target Size:** All buttons, toggle cards, and interactive elements must have a minimum bounding box of `48px × 48px`.
* **Bottom Sheets over Modals:** Instead of center-screen desktop dialogs, all filters, booking confirmations, and OTP login prompts slide up smoothly from the bottom (`translate-y-0`) using Radix UI Drawer / Framer Motion spring physics.

---

## 5. Screen-by-Screen UI Layout Specifications

### 5.1 Customer Discovery Feed (`/`)
* **Top PWA Install Banner:** A sticky 44px banner (`bg-teal-900 text-white`) pinned at the very top of the screen: *"অ্যাপটি আপনার ফোনে ইনস্টল করুন [ইনস্টল করুন]"*. Disappears once installed.
* **Header Bar:** Brand Logo + Language Toggle (`বাংলা` | `EN`) + User Avatar/Login Button.
* **Search & Filter Strip:** Horizontal scrolling pill filters (*জেন্টস*, *লেডিস*, *এসি*, *খালি চেয়ার আছে*).
* **Salon Card Component:**
  * Thumbnail image on left or top cover photo.
  * Salon Name (Bangla bold) + Distance badge (e.g., `1.2 কিমি দূরে`).
  * Status Pill: Green pulsing dot + `"২টি চেয়ার খালি"` or Red badge + `"ওয়েটিং: ৩ জন"`.
  * Quick Actions: Heart icon (Favorite toggle) + `"সিরিয়াল নিন"` amber button.

### 5.2 Salon Profile & QR Deep-Link View (`/s/[slug]`)
* **Cover Photo & Header:** Hero image with gradient overlay. Saloon name, verified blue check, full address with Google Maps pin link.
* **Live Status Dashboard Card:** Large numerical readout of Total Chairs vs. Busy Chairs, plus estimated waiting time calculated via algorithm.
* **Service Menu Accordion:** Grouped by category (Haircut, Shave, Facial, Spa). Each item displays service name, duration in minutes, and price in BDT (`৳ ৩০০`). Multi-select checkboxes.
* **Sticky Bottom Action Bar:** 
  * Left: Total Cost & Duration summary (`৳ ৫০০ • ৩৫ মি.`).
  * Right: High-impact Amber Button: `"এখনই সিরিয়াল নিন (Join Queue)"`.

### 5.3 Salon Owner Live Queue Console (`/owner/dashboard`)
* **Branch Switcher Dropdown:** Pinned in the top header for owners managing multiple salon branches.
* **Chair Grid Matrix:** Interactive cards representing each chair. Tap to toggle status between `Available (সবুজ)` and `Busy (লাল)`. Designed with oversized touch areas so barbers with wet hands can operate it instantly.
* **Queue Counter Controls:** Big `+` and `-` buttons to adjust walk-in customers (`Q_manual`).
* **"Call Next Customer" Banner:** Prominent sticky action card showing the next waiting token number with a loudspeaker icon.

### 5.4 A4 Printable QR Poster Screen (`/owner/qr`)
* **Preview Card:** Displays a visual thumbnail of the print-ready A4 poster layout.
* **Action Buttons:** 
  * `"A4 প্রিন্ট করার জন্য PDF ডাউনলোড করুন (Download A4 PDF)"` (Downloads 300 DPI vector PDF).
  * `"পোস্টার শেয়ার করুন (Share Poster)"` (Triggers native Web Share API for WhatsApp/Facebook).

### 5.5 Financial Ledger (*Hishab Khata* - `/owner/ledger`)
* **Summary Cards Grid:** Today's Total Income (`আয়`), Total Expense (`ব্যয়`), and Net Profit (`নিট লাভ`) with green/red indicator arrows.
* **Action Floating Action Button (FAB):** Fixed circular teal button `+` at bottom-right for 1-tap addition of walk-in sales or shop expenses.
* **Export Toolbar:** Filter buttons for Daily, Monthly, and Yearly views with 1-tap export buttons for CSV and PDF reports.

---

## 6. Micro-Interactions & Animation Standards

* **Page Transitions:** Slide-in from right (`translateX(100% -> 0)`) for forward navigation; slide-out to right for back navigation, emulating native iOS/Android gesture navigation.
* **Skeleton Loaders:** Shimmer gray skeleton cards (`animate-pulse`) used during data fetching over 3G/4G connections to prevent layout shifts.
* **Audio & Haptic Cues:** Subtle vibration haptic pulse (via `navigator.vibrate(50)`) when a customer successfully secures a queue token or when an owner toggles a chair state.