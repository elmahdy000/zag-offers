# Zag Offers Platform 🚀

Zag Offers is a comprehensive digital platform designed to connect customers with exclusive local deals, discounts, and coupons while empowering merchants to manage their promotional campaigns effectively.

## 🏗️ System Architecture

The platform is divided into four main applications, each serving a distinct role within the ecosystem:

### 1. ⚙️ Backend API (`/zag-offers-backend`)
The core engine powering the entire platform. Built with a robust, modern tech stack to ensure high performance and scalability.
- **Framework:** NestJS
- **Database:** PostgreSQL (Managed via Prisma ORM)
- **Features:** 
  - JWT Authentication & Role-based Access Control (Admin, Merchant, Customer)
  - Real-time Notifications (Firebase Cloud Messaging - FCM)
  - Advanced querying, filtering, and pagination
  - Secure endpoints for offer management, coupon generation, and redemption validation.

### 2. 🎛️ Admin Dashboard (`/zag-offers-admin`)
A professional, high-density web interface for platform administrators to oversee and manage the ecosystem.
- **Framework:** Next.js (React) + Tailwind CSS
- **Features:**
  - Dynamic Glassmorphism UI with premium aesthetics.
  - Comprehensive management of Users, Merchants, Offers, and Coupons.
  - Intelligent approval workflows for pending stores and offers.
  - Real-time statistics and engagement metrics.

### 3. 🏪 Vendor Application (`/zag_offers_vendor_app`)
A dedicated mobile application for merchants to manage their business presence on the platform.
- **Framework:** Flutter
- **Features:**
  - Create and manage store profiles and promotional offers.
  - Quick coupon redemption via QR code scanning or manual entry.
  - Track offer performance and customer engagement.

### 4. 📱 Client Application (`/zag_offers_app`)
The primary mobile interface for end-users to discover and utilize deals.
- **Framework:** Flutter
- **Features:**
  - Browse offers by category, location, or popularity.
  - Generate and save digital coupons.
  - Interactive maps to locate nearby deals.
  - Review and rate merchants.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Flutter SDK (for mobile apps)
- Firebase Account (for push notifications)

### Running the Backend
```bash
cd zag-offers-backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

### Running the Admin Dashboard
```bash
cd zag-offers-admin
npm install
npm run dev
```
*(The dashboard will typically be available at `http://localhost:3000`)*

### Running the Mobile Apps
Navigate to either `/zag_offers_app` or `/zag_offers_vendor_app`:
```bash
flutter pub get
flutter run
```

---

## 🔐 Environment Variables
Ensure you set up the necessary `.env` files in both the backend and admin projects before running them. Key variables usually include database URLs, JWT secrets, and Firebase credentials. *(Refer to `.env.example` in respective directories if available).*

## 📄 Documentation
Further detailed design briefs, technical specifications, and UI guidelines can be found within the root directory (e.g., `offers_zag.md`, `zag_offers_design_brief.md`).
