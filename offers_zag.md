# Zag Offers App - Full Product & Technical Requirements

## 1. Product Overview

Zag Offers is a local offers and coupon marketplace focused first on Zagazig, Egypt.

The platform connects:

- Customers looking for discounts and local deals
- Merchants who want more foot traffic and measurable marketing
- Admin team managing stores, offers, coupons, and monetization

The core idea:

Customers browse offers, generate a unique coupon code, visit the store, and redeem the coupon.  
The platform tracks coupon generation and usage to prove value to merchants.

---

## 2. Target Market

### Initial City

- Zagazig, Egypt

### Initial Areas

- University area
- El Qawmeya
- Downtown Zagazig
- Governorate area
- Talaba Awaida
- Villas area

### Main Customer Segments

- University students
- Young professionals
- Families
- Food lovers
- Gym and beauty customers
- People looking for local discounts

### Main Merchant Segments

- Restaurants
- Cafes
- Clothing stores
- Gyms
- Beauty salons
- Course centers
- Clinics
- Car wash and car services
- Supermarkets
- Local services

---

## 3. Business Model

### MVP Monetization

Start simple:

- Monthly merchant subscription
- Featured offer placement
- Manual payment through Vodafone Cash, Instapay, cash, or bank transfer

### Later Monetization

- Commission per redeemed coupon
- Paid push notifications
- Featured category placement
- City expansion plans
- Premium analytics for merchants
- Sponsored offers
- Subscription tiers

### Example Pricing

- Basic merchant plan: 300 EGP/month
- Standard merchant plan: 500 EGP/month
- Featured offer: 200-300 EGP/week
- Push notification campaign: 150-300 EGP/campaign

---

## 4. Core Product Loop

```txt
1. Merchant registers
2. Merchant creates store profile
3. Admin approves store
4. Merchant creates offer
5. Admin approves offer
6. Customer views offer
7. Customer generates coupon
8. Customer visits store
9. Merchant redeems coupon
10. Platform tracks redemption
11. Admin and merchant view analytics  
5. Main Apps
The system consists of:


Customer Mobile App


Merchant Dashboard


Admin Dashboard


Backend API



6. Recommended Tech Stack
Mobile App


Flutter


Dart


Riverpod or Bloc


Dio


Firebase Cloud Messaging


Flutter Secure Storage


Mobile Scanner for QR codes


Cached Network Image


Geolocator


Backend


NestJS


TypeScript


PostgreSQL


Prisma ORM


JWT Authentication


Role-Based Access Control


Swagger


Redis later


Cloudinary later


Firebase Admin later


Web Dashboards


Next.js


TypeScript


Tailwind CSS


shadcn/ui


React Query


Recharts


Database


PostgreSQL


Cache / Rate Limiting Later


Redis


Upstash Redis


Storage


Cloudinary


Notifications


Firebase Cloud Messaging


Analytics


Firebase Analytics


Metabase


Payments
MVP:


Manual Vodafone Cash


Instapay


Cash


Bank transfer


Later:


Paymob


Fawry


Meeza


Card payments


Wallet payments


Hosting
MVP:


Backend: Railway, Render, or DigitalOcean


Database: Supabase Postgres, Railway Postgres, or DigitalOcean PostgreSQL


Dashboard: Vercel


Images: Cloudinary


Redis: Upstash



7. User Roles
CUSTOMER
A normal app user.
Can:


Register and login


Browse offers


Browse stores


Search and filter


Generate coupon codes


Redeem coupons


View coupon history


Add reviews


Save favorite offers


MERCHANT
Store owner.
Can:


Register and login


Create store profile


Edit own store


Create offers


Pause offers


View coupon usage


Redeem coupons manually


View store analytics


Manage subscription later


ADMIN
Platform owner/team.
Can:


Approve stores


Reject stores


Suspend stores


Approve offers


Reject offers


Manage categories


Manage users


Manage featured offers


View analytics


View redemptions


Manage payments and subscriptions later


STAFF
Internal team member with limited admin permissions.

8. Customer Mobile App Features
Authentication


Register with phone and password for MVP


Login


JWT token storage


OTP login later


Home Page
Should include:


Featured offers


Offers near me


Offers of the day


Student offers


Popular categories


Search bar


Best stores


Categories
Examples:


Restaurants


Cafes


Clothes


Gyms


Beauty


Courses


Clinics


Cars


Supermarkets


Offers List
Filters:


Category


Area


Discount type


Newest


Featured


Nearby


Student offers


Ending soon


Offer Details
Should show:


Offer title


Store name


Store location


Discount details


Terms and conditions


Start and end date


Usage limit


Use offer button


Store contact


Directions


Share button


Generate Coupon
Customer clicks:
Use Offer
Backend returns:
Coupon codeExpiry timeOffer detailsStore details
Example:
ZAG-8F3K2
Coupon Wallet
Customer can view:


Active coupons


Used coupons


Expired coupons


Redemption
Supported methods:


Merchant enters coupon code


Customer scans store QR


QR redemption later preferred


Favorites
Customer can save:


Favorite offers


Favorite stores


Reviews
Customer can review:


Store


Offer experience


Notifications
Later:


New offer nearby


Coupon expiring soon


Weekend offers


Student offers


Favorite store added new deal



9. Merchant Dashboard Features
Merchant Auth


Register merchant


Login


View profile


Store Management
Merchant can:


Create store


Edit store


Add logo


Add cover image


Add address


Add location


Add phone and WhatsApp


Select category


Store status:


Pending


Approved


Rejected


Suspended


Offer Management
Merchant can:


Create offer


Edit offer


Pause offer


View offer status


View offer performance


Offer status:


Draft


Pending


Approved


Rejected


Active


Expired


Paused


Coupon Redemption
Merchant can:


Enter coupon code manually


Validate coupon


Redeem coupon


View redemption result


Merchant Analytics
Show:


Offer views


Coupons generated


Coupons used


Conversion rate


Top performing offers


Redemptions by day


Subscription Section Later
Show:


Current plan


Expiry date


Payment status


Upgrade plan


Invoice history



10. Admin Dashboard Features
Overview
Show:


Total users


Total customers


Total merchants


Total stores


Pending stores


Active stores


Total offers


Pending offers


Active offers


Coupons generated


Coupons used


Redemption rate


Store Management
Admin can:


View all stores


Approve store


Reject store


Suspend store


Edit store


Search stores


Filter by area/category/status


Offer Management
Admin can:


View all offers


Approve offer


Reject offer


Pause offer


Feature offer


Remove featured status


Category Management
Admin can:


Create category


Edit category


Disable category


Sort categories


Add category icon


User Management
Admin can:


View users


Filter by role


Deactivate users


View user activity


Coupon and Redemption Management
Admin can:


View generated coupons


View used coupons


View expired coupons


View redemptions by store


View redemptions by offer


Detect suspicious activity


Revenue Later
Admin can:


View merchant subscriptions


View payments


Add manual payment


Activate merchant plan


Export revenue report



11. Backend Modules
MVP modules:


Auth Module


Users Module


Stores Module


Categories Module


Offers Module


Coupons Module


Redemptions Module


Admin Module


Uploads Module


Future modules:


Subscriptions Module


Payments Module


Notifications Module


Analytics Module


Fraud Detection Module


Referrals Module


Loyalty Module



12. Backend Folder Structure
src/  app.module.ts  main.ts  common/    decorators/      current-user.decorator.ts      roles.decorator.ts    guards/      jwt-auth.guard.ts      roles.guard.ts    filters/    pipes/    utils/  config/    app.config.ts    database.config.ts    jwt.config.ts  prisma/    prisma.module.ts    prisma.service.ts  auth/    auth.module.ts    auth.controller.ts    auth.service.ts    dto/    strategies/  users/    users.module.ts    users.controller.ts    users.service.ts    dto/  stores/    stores.module.ts    stores.controller.ts    stores.service.ts    dto/  categories/    categories.module.ts    categories.controller.ts    categories.service.ts    dto/  offers/    offers.module.ts    offers.controller.ts    offers.service.ts    dto/  coupons/    coupons.module.ts    coupons.controller.ts    coupons.service.ts    dto/  redemptions/    redemptions.module.ts    redemptions.controller.ts    redemptions.service.ts    dto/  admin/    admin.module.ts    admin.controller.ts    admin.service.ts  uploads/    uploads.module.ts    uploads.controller.ts    uploads.service.ts

13. Environment Variables
DATABASE_URL="postgresql://postgres:password@localhost:5432/offers_db"JWT_SECRET="change_this_secret"JWT_EXPIRES_IN="7d"APP_ENV="development"APP_PORT="3000"REDIS_HOST="localhost"REDIS_PORT="6379"CLOUDINARY_CLOUD_NAME=""CLOUDINARY_API_KEY=""CLOUDINARY_API_SECRET=""

14. Database Models
Main entities:


User


Store


Category


Offer


CouponCode


Redemption


Subscription


Payment


Review


AnalyticsEvent



15. Prisma Schema
generator client {  provider = "prisma-client-js"}datasource db {  provider = "postgresql"  url      = env("DATABASE_URL")}enum UserRole {  CUSTOMER  MERCHANT  ADMIN  STAFF}enum StoreStatus {  PENDING  APPROVED  REJECTED  SUSPENDED}enum OfferStatus {  DRAFT  PENDING  APPROVED  REJECTED  ACTIVE  EXPIRED  PAUSED}enum DiscountType {  PERCENTAGE  FIXED_AMOUNT  BUY_ONE_GET_ONE  FREE_GIFT  COMBO  STUDENT_OFFER}enum CouponStatus {  GENERATED  USED  EXPIRED  CANCELLED}enum RedemptionMethod {  QR_SCAN  MERCHANT_ENTRY  ADMIN_MANUAL}model User {  id          String   @id @default(uuid())  name        String?  phone       String   @unique  email       String?  @unique  password    String?  role        UserRole @default(CUSTOMER)  city        String?  area        String?  isActive    Boolean  @default(true)  stores      Store[]  @relation("StoreOwner")  coupons     CouponCode[]  redemptions Redemption[]  reviews     Review[]  createdAt   DateTime @default(now())  updatedAt   DateTime @updatedAt}model Store {  id          String      @id @default(uuid())  ownerId     String  owner       User        @relation("StoreOwner", fields: [ownerId], references: [id])  categoryId  String?  category    Category?   @relation(fields: [categoryId], references: [id])  name        String  description String?  phone       String?  whatsapp    String?  address     String?  city        String      @default("Zagazig")  area        String?  latitude    Float?  longitude   Float?  logoUrl     String?  coverUrl    String?  status      StoreStatus @default(PENDING)  offers      Offer[]  coupons     CouponCode[]  redemptions Redemption[]  subscriptions Subscription[]  reviews     Review[]  createdAt   DateTime @default(now())  updatedAt   DateTime @updatedAt}model Category {  id        String   @id @default(uuid())  name      String  slug      String   @unique  iconUrl   String?  sortOrder Int      @default(0)  isActive  Boolean  @default(true)  stores    Store[]  offers    Offer[]  createdAt DateTime @default(now())  updatedAt DateTime @updatedAt}model Offer {  id             String       @id @default(uuid())  storeId        String  store          Store        @relation(fields: [storeId], references: [id])  categoryId     String?  category       Category?    @relation(fields: [categoryId], references: [id])  title          String  description    String?  terms          String?  discountType   DiscountType  discountValue  Float?  startDate      DateTime  endDate        DateTime  usageLimit     Int?  perUserLimit   Int          @default(1)  status         OfferStatus  @default(PENDING)  imageUrl       String?  isFeatured     Boolean      @default(false)  viewsCount     Int          @default(0)  generatedCount Int          @default(0)  usedCount      Int          @default(0)  coupons        CouponCode[]  redemptions    Redemption[]  reviews        Review[]  createdAt      DateTime @default(now())  updatedAt      DateTime @updatedAt}model CouponCode {  id          String       @id @default(uuid())  offerId     String  offer       Offer        @relation(fields: [offerId], references: [id])  userId      String  user        User         @relation(fields: [userId], references: [id])  storeId     String  store       Store        @relation(fields: [storeId], references: [id])  code        String       @unique  status      CouponStatus @default(GENERATED)  expiresAt   DateTime  usedAt      DateTime?  redemption  Redemption?  createdAt   DateTime @default(now())  updatedAt   DateTime @updatedAt  @@index([offerId])  @@index([userId])  @@index([storeId])  @@index([code])}model Redemption {  id                 String           @id @default(uuid())  couponCodeId       String           @unique  couponCode         CouponCode       @relation(fields: [couponCodeId], references: [id])  offerId            String  offer              Offer            @relation(fields: [offerId], references: [id])  storeId            String  store              Store            @relation(fields: [storeId], references: [id])  userId             String  user               User             @relation(fields: [userId], references: [id])  method             RedemptionMethod  amount             Float?  merchantConfirmed  Boolean          @default(false)  customerConfirmed  Boolean          @default(false)  latitude           Float?  longitude          Float?  createdAt          DateTime         @default(now())}model Subscription {  id            String   @id @default(uuid())  storeId       String  store         Store    @relation(fields: [storeId], references: [id])  planName      String  amount        Float  status        String   @default("ACTIVE")  startDate     DateTime  endDate       DateTime  paymentMethod String?  createdAt     DateTime @default(now())  updatedAt     DateTime @updatedAt}model Payment {  id                   String   @id @default(uuid())  storeId              String  subscriptionId        String?  amount               Float  currency             String   @default("EGP")  paymentMethod         String  paymentStatus         String  transactionReference  String?  createdAt             DateTime @default(now())}model Review {  id        String   @id @default(uuid())  userId    String  user      User     @relation(fields: [userId], references: [id])  storeId   String  store     Store    @relation(fields: [storeId], references: [id])  offerId   String?  offer     Offer?   @relation(fields: [offerId], references: [id])  rating    Int  comment   String?  createdAt DateTime @default(now())}model AnalyticsEvent {  id        String   @id @default(uuid())  userId    String?  storeId   String?  offerId   String?  eventType String  metadata  Json?  createdAt DateTime @default(now())  @@index([eventType])  @@index([storeId])  @@index([offerId])}

16. API Endpoints
Auth
POST /auth/registerPOST /auth/merchant/registerPOST /auth/loginGET  /auth/me
Users
GET   /users/mePATCH /users/meGET   /users/:id
Categories
GET    /categoriesPOST   /categoriesPATCH  /categories/:idDELETE /categories/:id
Stores
POST   /storesGET    /storesGET    /stores/:idPATCH  /stores/:idPATCH  /stores/:id/approvePATCH  /stores/:id/rejectPATCH  /stores/:id/suspend
Offers
POST   /offersGET    /offersGET    /offers/featuredGET    /offers/nearbyGET    /offers/:idPATCH  /offers/:idPATCH  /offers/:id/approvePATCH  /offers/:id/rejectPATCH  /offers/:id/pauseDELETE /offers/:id
Coupons
POST /coupons/generateGET  /coupons/myGET  /coupons/:codePOST /coupons/validate
Redemptions
POST /redemptions/manualPOST /redemptions/qrGET  /redemptions/myGET  /redemptions/store/:id
Admin
GET /admin/overviewGET /admin/stores/pendingGET /admin/offers/pendingGET /admin/revenueGET /admin/fraud-alerts
Uploads
POST /uploads/store-logoPOST /uploads/store-coverPOST /uploads/offer-image

17. Coupon Generation Rules
A coupon can be generated only if:


User is authenticated


User role is CUSTOMER


Offer exists


Store is approved


Offer is active or approved


Current date is between offer start and end date


User has not exceeded per-user limit


Offer has not exceeded total usage limit


User is not rate limited


Coupon code example:
ZAG-8F3K2
Coupon expiry:
2 hours by default

18. Coupon Redemption Rules
A coupon can be redeemed only if:


Coupon exists


Coupon belongs to the selected store


Coupon status is GENERATED


Coupon is not expired


Coupon was not used before


Offer is still valid


Store is approved


Merchant owns the store or user is ADMIN



19. Fraud Prevention
MVP fraud checks:


One coupon per user per offer by default


Coupon expires after 2 hours


Same coupon cannot be used twice


Merchant cannot redeem another store coupon


Store owner can only view own redemptions


Rate limit coupon generation


Track suspicious activity


Future fraud checks:


Device tracking


GPS validation


QR-only redemption


Merchant fraud dashboard


Customer confirmation after merchant redemption


Duplicate account detection



20. Flutter App Screens
Customer App Screens


Splash Screen


Onboarding Screen


Login Screen


Register Screen


Home Screen


Categories Screen


Offers List Screen


Offer Details Screen


Coupon Details Screen


My Coupons Screen


Store Details Screen


Favorites Screen


Profile Screen


Notifications Screen


Review Screen


Main Navigation
HomeCategoriesCouponsFavoritesProfile

21. Next.js Merchant Dashboard Pages
/login/register/dashboard/store/store/edit/offers/offers/create/offers/[id]/coupons/redemptions/analytics/subscription/settings

22. Next.js Admin Dashboard Pages
/admin/login/admin/dashboard/admin/users/admin/stores/admin/stores/pending/admin/offers/admin/offers/pending/admin/categories/admin/coupons/admin/redemptions/admin/revenue/admin/fraud/admin/settings

23. MVP Build Order
Phase 1: Backend
Build:


NestJS project


Prisma setup


PostgreSQL connection


Auth


Roles


Users


Categories


Stores


Offers


Coupons


Redemptions


Admin APIs


Swagger docs


Phase 2: Admin Dashboard
Build:


Admin login


Overview dashboard


Store approval


Offer approval


Category management


Redemptions list


Phase 3: Merchant Dashboard
Build:


Merchant login


Store creation


Offer creation


Coupon redemption


Basic analytics


Phase 4: Flutter Customer App
Build:


Auth


Home


Categories


Offers


Offer details


Generate coupon


My coupons


Store details


Phase 5: Uploads and Polish
Build:


Cloudinary uploads


Store logos


Offer images


Better filtering


Search


UI improvements


Phase 6: Monetization
Build:


Subscription plans


Manual payment tracking


Featured offers


Merchant billing



24. MVP Success Criteria
The first MVP is successful when:
1. Merchant can register2. Merchant can create a store3. Admin can approve the store4. Merchant can create an offer5. Admin can approve the offer6. Customer can view the offer7. Customer can generate a coupon8. Merchant can redeem the coupon9. Admin can view redemption statistics

25. Launch Strategy
Before App Launch
Do not start with a full app immediately.
Start with:


30 to 50 stores


Real offers


Facebook page


Instagram page


WhatsApp group


Landing page


Manual coupon tracking


Initial Merchant Offer
First month free.Your offer appears on the platform.After results, subscription starts from 300 EGP/month.
Strong Sales Message
We are not selling ads.We are bringing you local customers who are actively looking for offers in Zagazig.

26. Best Initial Categories
Start with:


Restaurants


Cafes


Clothes


Gyms


Beauty salons


Courses


Clinics


Car services


Best first category:
Restaurants and cafes
Reason:


High demand


Frequent purchases


Easy to understand discounts


Students respond well to offers



27. Offer Quality Rules
Do not accept weak offers.
Good offers:


15% discount or more


Buy one get one


Free gift


Student discount


Combo offer


Limited time offer


Weekend offer


Weak offers:


5% discount


Complicated terms


Fake discounts


Unclear pricing



28. Future Features
Customer Features


Loyalty points


Referral system


Student verification


Birthday offers


Personalized recommendations


Map view


Wallet


Cashback later


Merchant Features


Advanced analytics


Campaign builder


Push notification campaigns


Subscription upgrades


Invoice downloads


Staff accounts


Branch management


Admin Features


Audit logs


Fraud scoring


City management


Sales team accounts


Commission reports


Advanced revenue dashboard


Technical Features


Redis


BullMQ background jobs


Meilisearch or Typesense


Payment webhooks


Soft delete


Device fingerprinting


Notification scheduler


Advanced location validation



29. Recommended First Development Commands
npm i -g @nestjs/clinest new zag-offers-backendcd zag-offers-backendnpm install @nestjs/confignpm install @nestjs/jwt @nestjs/passport passport passport-jwtnpm install bcryptnpm install class-validator class-transformernpm install prisma @prisma/clientnpm install nanoidnpm install @nestjs/swagger swagger-ui-expressnpm install -D prismanpm install -D @types/bcryptnpm install -D @types/passport-jwtnpx prisma init

30. Final Product Goal
The product should become:
The local offers and coupon platform for Zagazig first, then other Egyptian cities.
The first technical goal:
Build a reliable coupon generation and redemption system.
The first business goal:
Get 30 merchants and 1,000 local users before scaling.
The first revenue goal:
Convert merchants into monthly subscriptions after proving customer traffic.
1. Home Screen لازم تكون بسيطة جدًا

أول شاشة للعميل لازم تجاوب على سؤال واحد:

"أقوى عروض قريبة مني إيه دلوقتي؟"

خليها كده:

Search bar
Featured Offers
Categories
Offers Near You
Student Offers
Ending Today
Popular Stores

بلاش تزحمها بأقسام كتير في الأول.

2. استخدم لغة محلية مش رسمية

بدل:

Redeem Coupon

اكتب:

استخدم العرض

بدل:

Offer Details

اكتب:

تفاصيل العرض

بدل:

Terms and Conditions

اكتب:

شروط العرض

بدل:

Expired

اكتب:

انتهى

اللغة لازم تبقى قريبة من الناس في الزقازيق ومصر عمومًا.

3. أهم زر في التطبيق

زر:

استخدم العرض

لازم يكون واضح جدًا وثابت أسفل صفحة العرض.

مثال:

[ استخدم العرض ]

ويكون بلون قوي.

ما تخليش العميل يدور عليه.

4. صفحة العرض لازم تكون مقنعة

صفحة العرض المفروض تعرض:

صورة العرض
اسم المحل
التقييم
المنطقة
قيمة الخصم
وصف مختصر
شروط العرض
مدة انتهاء العرض
زر استخدم العرض
زر واتساب / اتصال
زر الاتجاهات

أهم حاجة تظهر فوق:

خصم 20%
ينتهي خلال 3 أيام
القومية - الزقازيق
5. شاشة الكود لازم تكون واضحة جدًا

بعد ما العميل يضغط "استخدم العرض"، يظهر:

كودك:
ZAG-8F3K2

صالح لمدة:
01:59:30

اعرض الكود للكاشير

وتضيف أزرار:

نسخ الكود
فتح الخريطة
اتصال بالمحل

مهم جدًا وجود Countdown Timer.

ده بيخلي العميل يتحرك بسرعة، ويقلل الأكواد اللي تتولد من غير استخدام.

6. لا تولد الكود بدري جدًا

في صفحة العرض، قبل توليد الكود، اعرض رسالة:

هتستخدم العرض دلوقتي؟
الكود صالح لمدة ساعتين فقط.

الأزرار:

استخدم العرض
ليس الآن

ده يقلل توليد أكواد عشوائية.

7. خلي التصنيفات قليلة في البداية

ابدأ بـ 8 تصنيفات فقط:

مطاعم
كافيهات
لبس
جيم
تجميل
كورسات
عيادات
سيارات

بعدها زود حسب الاستخدام.

التصنيفات الكتير بتشتت المستخدم.

8. استخدم Badges واضحة

على كروت العروض استخدم شارات مثل:

خصم 20%
عرض طلبة
ينتهي اليوم
قريب منك
الأكثر استخدامًا
جديد

الشارات دي بتساعد المستخدم يقرر بسرعة.

9. Offer Card Design

كارت العرض لازم يكون مختصر:

[صورة]
خصم 20%
Pizza House
بيتزا كبيرة بخصم 20%
القومية
ينتهي بعد 3 أيام
[استخدم العرض]

بلاش تفاصيل كتير في الكارت. التفاصيل في صفحة العرض.

10. Search مهم جدًا

حط Search واضح في الهوم:

دور على مطعم، كافيه، جيم...

خليه يبحث في:

اسم المحل
اسم العرض
التصنيف
المنطقة
11. Filters بسيطة

الفلاتر تكون:

الأقرب
الأحدث
الأعلى خصمًا
ينتهي قريبًا
عروض الطلبة

بلاش فلاتر معقدة في الأول.

12. Location UX

ما تطلبش صلاحية الموقع أول ما التطبيق يفتح.

الأفضل:

اعرض رسالة بعد ما المستخدم يشوف قيمة:

فعّل الموقع عشان نعرضلك أقرب العروض ليك

الأزرار:

تفعيل الموقع
اختيار المنطقة يدويًا

لازم يكون فيه اختيار يدوي للمنطقة، لأن ناس كتير بترفض الموقع.

13. Empty States مهمة جدًا

لو مفيش عروض في منطقة معينة، ما تعرضش شاشة فاضية.

اكتب:

لسه مفيش عروض في المنطقة دي
جرب تشوف عروض القومية أو الجامعة

وزر:

شوف كل عروض الزقازيق
14. Merchant UX لازم يكون أبسط من العميل

التاجر غالبًا مش عايز Dashboard معقد.

خلي لوحة التاجر فيها 4 حاجات بس:

عروضي
استخدام كود
الإحصائيات
بيانات المحل
15. أهم شاشة للتاجر: استخدام الكود

لازم تكون مباشرة:

ادخل كود العميل
[ ZAG-____ ]

[ تحقق من الكود ]

بعد التحقق:

العرض: خصم 20% على البيتزا
الحالة: صالح
العميل: أحمد
ينتهي بعد: 45 دقيقة

[ تأكيد استخدام الكود ]

لو الكود غلط:

الكود غير صحيح

لو مستخدم قبل كده:

الكود تم استخدامه قبل كده

لو منتهي:

الكود انتهت صلاحيته
16. خلي رسائل الخطأ بشرية

بدل:

Invalid coupon status

اكتب:

الكود ده مش صالح للاستخدام

بدل:

Unauthorized

اكتب:

سجّل دخول الأول عشان تستخدم العرض

بدل:

Forbidden

اكتب:

مش مسموحلك تعمل الإجراء ده
17. Admin UX

الأدمن محتاج سرعة في الموافقات.

خلي الصفحة الرئيسية فيها:

محلات في انتظار الموافقة
عروض في انتظار الموافقة
أكواد مستخدمة اليوم
أكثر العروض استخدامًا
بلاغات أو مشاكل

وفي صفحة الموافقة على العرض، اعرض:

اسم المحل
المنطقة
نوع العرض
قيمة الخصم
الشروط
تاريخ البداية والنهاية

وأزرار واضحة:

موافقة
رفض
طلب تعديل
18. Onboarding قصير جدًا

بلاش 5 شاشات تعريف.

اعمل 2 أو 3 فقط:

اكتشف عروض قريبة منك
استخدم كود الخصم في المحل
وفر في مطاعم وكافيهات الزقازيق

بعدها:

ابدأ الآن
19. Login UX

ما تجبرش المستخدم يعمل حساب قبل ما يشوف العروض.

خليه يتصفح الأول.

اطلب تسجيل الدخول فقط عند:

استخدام العرض
حفظ عرض
تقييم محل

ده هيزود التحويل.

20. Trust UX

لازم تبني ثقة لأن الناس هتسأل: "العرض حقيقي؟"

اعرض عناصر ثقة:

تم التحقق من المحل
العرض معتمد
تم استخدامه 124 مرة
آخر استخدام منذ ساعتين

دي قوية جدًا.

21. Student UX

بما إن الزقازيق فيها جامعة، اعمل قسم واضح:

عروض الطلبة

وفي الكارت:

خصم للطلبة
قد تحتاج لإظهار الكارنيه

ده هيبقى Hook ممتاز.

22. Color System مقترح

اختار ألوان حيوية بس مش مزعجة.

مثال:

Primary: Orange / Red-orange
Secondary: Dark Navy
Success: Green
Warning: Amber
Error: Red
Background: Off-white

مثال استخدام:

زر استخدم العرض: Orange
الكود صالح: Green
الكود منتهي: Red
ينتهي قريبًا: Amber
23. Bottom Navigation

للتطبيق:

الرئيسية
الأقسام
كوبوناتي
المفضلة
حسابي

أو نسخة أبسط:

الرئيسية
بحث
كوبوناتي
حسابي

أنصح في البداية:

الرئيسية
الأقسام
كوبوناتي
حسابي
24. Microcopy مهم جدًا

استخدم جمل قصيرة وواضحة:

العرض متاح دلوقتي
الكود صالح لمدة ساعتين
اعرض الكود للكاشير
تم استخدام الكود بنجاح
العرض انتهى
المحل غير متاح حاليًا
25. Notifications UX

ما تبعتش إشعارات عامة كتير.

خليها ذكية:

عرض جديد قريب منك في القومية
كودك هينتهي بعد 30 دقيقة
مطعمك المفضل نزل عرض جديد
عروض الطلبة الأسبوع ده

بلاش:

افتح التطبيق الآن
لدينا عروض جديدة

دي ضعيفة.

26. Reviews UX

بعد استخدام الكود، اسأل سؤال بسيط:

تجربتك مع العرض كانت إيه؟

اختيارات:

ممتازة
كويسة
مش واضحة
المحل رفض العرض

دي أهم من تقييم نجوم فقط، لأنها تكشف مشاكل التشغيل.

27. Complaint Flow

لو المحل رفض العرض، لازم المستخدم يعرف يبلغ بسهولة:

المحل رفض الكود؟
[بلّغ عن مشكلة]

أسباب:

المحل رفض العرض
الكود لم يعمل
الشروط غير واضحة
السعر مختلف
مشكلة أخرى

دي مهمة عشان جودة السوق.

28. Loading UX

استخدم Skeleton loading بدل Spinner فقط.

مثال:

كروت عروض رمادية تظهر مكان المحتوى

ده يخلي التطبيق يحس أسرع.

29. Offline / Bad Network

في مصر، النت مش دايمًا ثابت.

اعرض رسائل واضحة:

في مشكلة في الاتصال
حاول مرة تانية

وخلي آخر عروض اتفتحت تتحفظ مؤقتًا لو ممكن.

30. أهم UX Rule

لازم رحلة استخدام العرض تكون أقل من 3 خطوات:

افتح العرض
اضغط استخدم العرض
اعرض الكود للكاشير

أي تعقيد زيادة هيقلل الاستخدام.

أفضل Flow للعميل
Home
↓
Offer Card
↓
Offer Details
↓
Use Offer
↓
Coupon Code Screen
↓
Merchant Redeems
↓
Success + Review
أفضل Flow للتاجر
Merchant Dashboard
↓
استخدام كود
↓
إدخال الكود
↓
تحقق
↓
تأكيد الاستخدام
↓
تم بنجاح
UX Priority في أول MVP

ابدأ بـ 5 حاجات فقط:

1. Home واضحة
2. Offer Card قوي
3. Offer Details مقنعة
4. Coupon Screen سهلة
5. Merchant Redeem Screen سريعة