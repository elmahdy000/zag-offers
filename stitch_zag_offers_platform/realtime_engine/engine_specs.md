# ⚡ Real-time Engine (WebSocket Integration)

## 📋 Overview
The platform utilizes **Socket.io** to provide instantaneous updates across the Customer App, Merchant Dashboard, and Admin Panel. This ensures that actions like coupon redemptions and offer approvals are visible to all parties in milliseconds.

## 🛠️ Architecture
- **Backend:** NestJS Gateway (`EventsGateway`) managing persistent connections.
- **Rooms System:** 
  - `Broadcast`: For global announcements (New Offers).
  - `User Room`: Targeted notifications for customers.
  - `Merchant Room`: Specific alerts for store owners (New Reviews).

## 🚀 Key Workflows
1. **Instant Redemption:** When a merchant scans a code, the customer's app UI updates to "USED" instantly.
2. **Approval Alerts:** Merchants receive live notifications when their offers are approved by the admin.
3. **Live Stats:** Dashboards refresh data automatically without page reloads.
4. **Room Management:** Dynamic `join_room` handler that intelligently extracts `userId` from payloads to ensure secure, targeted message delivery.

