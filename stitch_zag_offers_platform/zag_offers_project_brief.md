# 🎨 Zag Offers - Design & UX Specification Brief

## 📝 Project Overview
**Zag Offers** is a localized discount and offer discovery platform for Zagazig city. It connects Merchants with Customers through a smart recommendation system and a secure coupon verification flow.

---

## 💎 Design Language (The "Vibe")
- **Style:** Modern, Sleek, Premium.
- **Vibe:** "Vibrant Zagazig" - Energetic but professional.
- **Primary Colors:** 
  - #FF6B00 (Vibrant Orange - for discounts and action)
  - #1A1A1A (Deep Charcoal - for dark mode text/backgrounds)
  - #00C853 (Success Green - for active coupons)
- **Typography:** Modern Arabic fonts (e.g., Cairo, Almarai, or Tajawal).

---

## 📱 1. Customer Mobile App (The "Hunter" Experience)
### Core Screens:
1. **Onboarding:** High-quality splash screens explaining the value of Zagazig discounts.
2. **Auth:** Phone login, Social login (Google/FB) with clean integration.
3. **Home Dashboard:**
   - **Search Bar:** Sticky, prominent.
   - **Horizontal Categories:** Food, Cafe, Gym, Clothes, etc.
   - **Dynamic Sections:** "Trending in Zag", "Recommended for You", "New Near You".
4. **Offer Card UX:**
   - Visual priority on the discount percentage (e.g., 50% OFF).
   - Distance/Area tag (e.g., "القومية - 500m").
5. **Store Detail:** Cover image, Logo overlay, quick call/whatsapp buttons, active offers list.
6. **Coupon Generation:** A "Magic" animation when generating the ZAG-XXXXXX code.
7. **My Coupons:** Tabbed view for (Active / Used / Expired).

---

## 💻 2. Merchant Dashboard (The "Business" Experience)
### Core Screens:
1. **Quick Redeem:** A prominent field at the top of the dashboard to scan or enter coupon codes.
2. **Store Management:** UI for uploading Logo/Cover, editing location (Area), and business hours.
3. **Offer Builder:** Step-by-step form to create an offer with live preview.
4. **Analytics:** Visual charts for "Coupon Usage" and "Store Views".
5. **Review Feed:** Simple list to see and reply to customer feedback.

---

## 🛡️ 3. Admin Panel (The "Governance" Experience)
### Core Screens & Deep-Dive:

1. **The Approval Engine (Gated Workflow):**
   - **Offer Pending Queue:** A list of all offers with `PENDING` status.
   - **Review Detail:** Admin views the full offer details (Image, Title, Discount, Terms) + Store info.
   - **Decision Bar:**
     - **Approve ✅:** Changes status to `ACTIVE`. Trigger Push Notification to users.
     - **Reject ❌:** Prompt for reason (e.g., "Image quality low", "Misleading discount"). Notify Merchant.
   - **Store Approval:** Same logic for newly registered stores.

2. **Content Moderation:**
   - **Review Moderation:** Ability to hide/delete inappropriate customer reviews.
   - **Store Status Toggle:** Force-close a store (Emergency suspension).

3. **Global Control Center:**
   - **Category Management:** Drag-and-drop ordering of categories for the mobile app.
   - **Featured Offers:** Select specific active offers to pin at the top of the mobile home screen.

4. **Strategic Analytics:**
   - **Heatmap:** Areas in Zagazig with highest coupon redemption.
   - **Growth Metrics:** New users vs. Uninstalls (Churn).
   - **Top Merchants:** Who is providing the best value.

---

## 🚦 Business Rule: Zero-Visibility without Approval
- **Developer Note:** The Backend is strictly configured such that `Offers.findAll` and `Offers.search` ONLY return items where `status === ACTIVE`. 
- **Design Requirement:** Ensure the Merchant understands their offer is "Waiting for Approval" through clear UI indicators (Status Badges).

---

## 🎨 Advanced UX Requirements for Stitch
1. **Empty States:** Design creative placeholders for:
   - "No Search Results found."
   - "You haven't favorited any offers yet."
   - "Merchant has no active offers."
2. **Loading UX:** Use **Skeleton Screens** instead of simple spinners to maintain perceived performance.
3. **RTL Mastery:** Ensure the entire layout is 100% Arabic-ready (Right-to-Left alignment, mirrored icons where appropriate).
4. **Form Validation UX:** Visual feedback for incorrect phone numbers or weak passwords (inline errors, not just alerts).
5. **Status Badges:** 
   - `PENDING`: Amber/Yellow.
   - `ACTIVE`: Vibrant Green.
   - `EXPIRED/REJECTED`: Soft Red/Grey.

---

## 🛠️ Technical Context for Designers
- **API Backend:** Fully implemented in NestJS + Prisma.
- **Image Upload:** Local storage (`/uploads/`).
- **Real-time Engine:** Full Socket.io integration for instant cross-platform synchronization.
- **Security:** Middleware-based Auth protection for all dashboard routes.

