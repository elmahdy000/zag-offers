# 🧠 Zag Offers - Master Knowledge & System Memorandum
> **سجل الذاكرة الشامل لكافة مراحل التطوير، المعمارية البرمجية، وتحسينات الـ UI/UX والسيرفر**  
> *آخر تحديث: أكتوبر 2026*

---

## 📌 1. الرؤية العامة وهوية المشروع (Product Vision & Identity)
- **الهدف الأساسي**: منصة وعروض وكوبونات الزقازيق الأولى (محافظة الشرقية، مصر)، مصممة لربط العملاء بأقوى خصومات المحلات والمطاعم والكافيهات ومراكز التجميل والخدمات.
- **التوجه البصري (Design System)**:
  - مستوحى من أفضل تصميمات تطبيقات Behance وشركات الـ Consumer Tech الرائدة (Rabbit, Talabat, Noon, Waffarha).
  - ثيم داكن فخم (Dark Mode) مع لون رئيسي برتقالي متدرج وناصع (`AppColors.primary`).
  - خط **Cairo** المتميز في اللغة العربية مع أحجام وأوزان مدروسة بدقة.
  - بطاقات تذاكر فاخرة (Voucher Tickets) مع قصّات دائرية واقعية (Ticket Notches) وخطوط تنقيط فاصلة.
- **الهوية واللغة التسويقية (Egyptian Microcopy)**:
  - إلغاء اللغة الفصحى الجافة واستبدالها بلهجة مصرية عصرية وسريعة:
    - *"وفّر مع كل خروجة"*
    - *"مبروك! كوبونك جاهز 🎉"*
    - *"ورّي الكود للكاشير وخصمك في جيبك"*
    - *"مكانهم فين؟"*
    - *"امسح الـ QR عند الكاشير 📱"*
- **استراتيجية التكلفة الصفرية (Zero-Cost Operation)**:
  - إلغاء تام للاعتماد على Google Maps SDK المدفوعة لتجنب أي فواتير شهرية لـ Google Cloud.
  - الاعتماد على **العنوان التفصيلي الدقيق** مع زر التوجيه المجاني الذي يفتح تطبيق الخرائط الأصلي في جهاز المستخدم (`url_launcher` -> Apple Maps / Google Maps) بدون أي تكلفة ($0).

---

## 🏗️ 2. البنية التحتية والسيرفر (Server & Infrastructure)
- **السيرفر (VPS)**:
  - **IP**: `72.62.27.196`
  - **User**: `root`
  - **مسار المشروع**: `/var/www/zag-offers`
- **مستودع الكود (GitHub)**:
  - `https://github.com/elmahdy000/zag-offers.git`
  - الفرع الأساسي: `main`
- **خدمات PM2 الفعالة على السيرفر**:
  | الخدمة | التقنية | المنفذ (Port) | الوصف |
  |---|---|---|---|
  | `zag-backend` | NestJS + Prisma | `3010` | الخادم الخلفي ومحرك الـ REST API والـ WebSockets |
  | `zag-client` | Next.js (SSR/PWA) | `3000` | موقع الويب المخصص للعملاء |
  | `zag-vendor` | Next.js (SSR/PWA) | `3002` | لوحة تحكم التجار وأصحاب المتاجر |
  | `zag-admin` | Next.js (SSR/PWA) | `3003` | لوحة الإدارة العامة للنظام |
- **قاعدة البيانات**:
  - PostgreSQL مع Prisma ORM.
  - جداول رئيسية: `User`, `Store`, `Offer`, `Coupon`, `Category`, `Review`, `AuditLog`.

---

## 📱 3. تطبيق الموبايل فلاتر (`zag_offers_app`)
- **الهيكل المعماري (Clean Architecture + BLoC)**:
  - **Features**: `offers`, `coupons`, `auth`, `favorites`, `notifications`, `home`.
  - **Dependency Injection**: GetIt (`injection_container.dart`).
  - **Data Layer**: Dio Client + Secure Storage + Socket.io للاتصال الفوري.

### أهم التحسينات الجذرية المنجزة:
1. **كارت العنوان والوصول الذكي (Smart Store Address Card)**:
   - تحديث `StoreEntity` و `StoreModel` ليشمل `address` و `locationUrl` و `workingHours`.
   - كارت موحد في `OfferDetailPage` و `StoreDetailPage` يحتوي على:
     - العنوان التفصيلي للمحل في الزقازيق.
     - زر **نسخ العنوان** بنقرة واحدة للحافظة مع Haptic Feedback.
     - زر **طريق الوصول** المجاني (يفتح خرائط جوجل أو آبل الخارجية بدون تكلفة).
     - أزرار سريعة للاتصال الهاتفي والمحادثة المباشرة على **واتساب**.

2. **شيت أحياء ومناطق الزقازيق (Zagazig Area Picker Bottom Sheet)**:
   - شارة تفاعلية أعلى الشاشة الرئيسية تفتح نافذة سفلية تضم أشهر مناطق وأحياء الزقازيق:
     *(القومية، فلل الجامعة، طلبة عويضة، المشاية، شارع المحافظة، المنتزه، حي الزهور، الصيادين)*.
   - تصفية العروض فورياً حسب الحي المختار بنقرة واحدة.

3. **محفظة التذاكر الفاخرة (Voucher Ticket Wallet)**:
   - إعادة كتابة صفحة الكوبونات بالكامل (`MyCouponsPage`) بنظام تذاكر الخصم المشابه لـ Apple Wallet.
   - فلاتر مبوبة: *"كوبونات نشطة ✨"* | *"تم استخدامها 💰"* | *"الكل"*.
   - كود الخصم البارز بتصميم مميز وزر نسخ سريع.
   - نافذة منبثقة تفاعلية للـ **QR Code** لمسحه أمام الكاشير لسرعة الخصم.

4. **معالجة مشاكل التجاوب والأوفر فلو (100% Responsive & Zero Overflow)**:
   - حل مشكلات `BOTTOM OVERFLOWED BY 10 PIXELS` و `RIGHT OVERFLOW BY 7.1 PIXELS` نهائياً.
   - ضبط نسبة العرض إلى الارتفاع في شبكة العروض (`childAspectRatio: 0.58`).
   - تغليف عناصر النصوص المتغيرة (اسم المتجر، الحي، التصنيف) بـ `Expanded` و `Flexible` مع `TextOverflow.ellipsis`.
   - مراعاة الـ Safe Area للهواتف الحديثة (`MediaQuery.of(context).padding.bottom`) لضمان عدم تغطية الأزرار العائمة على المحتوى أو تداخلها مع شريط التنقل.
   - إزالة أزرار الرجوع التلقائية غير المرغوبة (`automaticallyImplyLeading: false`) وضبط التنقل بعد تسجيل الدخول (`pushAndRemoveUntil`).

5. **حزمة الأنيميشن والراحة البصرية التفاعلية (Tactile Micro-Interactions & Floating Glass UI)**:
   - **فيزياء اللمس التفاعلية (`BouncyTap`)**: استبدال الـ InkWell المسطح بفيزياء الزنبرك الطبيعية (`Transform.scale` بنسبة 0.96 مع `Curves.easeOutBack`) والهابتك اللمسي الفوري (`HapticFeedback.lightImpact`) على جميع بطاقات العروض (`OfferCard`)، التصنيفات الدائرية (`CategoriesSection`)، والفلاتر.
   - **شريط التنقل الزجاجي العائم (`Floating Dynamic Frosted Glass Navbar`)**: تحويل النافبار السفلي في `MainScreen` إلى جزيرة عائمة بحواف دائرية (`BorderRadius.circular(24)`)، مع تأثير البلور الزجاجي (`ImageFilter.blur`) وبادج نشط ينساب بنعومة (`AnimatedScale` و `AnimatedContainer`) خلف التاب النشط.
   - **أنيميشن ختم الكوبون الفاخر (`CouponCelebrationDialog`)**: استبدال مربعات الحوار التقليدية بشاشة احتفال ثلاثية الأبعاد تحتوي على ختم مطاطي ينقض بقوة وارتداد مرن (`Curves.elasticOut`) مع انبعاث جزيئات الكونفيتي الملونة والـ QR Code الفخم.
   - **كبسولة المفضلة الزجاجية المريحة للعين (`FavoriteButton`)**: دعم التدرج الداكن الفاتح لزر الإعجاب ليمنع أي توهج أبيض حاد في الوضع الليلي مع ارتداد القلوب المتوهجة.

---

## 🧪 4. الاختبارات والتحقق الميداني (Live Verification)
- **iOS Simulator**:
  - الجهاز: `iPhone Duo` (معرف: `4BF77C94-22E0-42D4-B288-257AA2E01EF4`).
  - الحالة: يعمل بدون أي أخطاء ومُحدّث بالكامل.
- **Android Emulator**:
  - الجهاز: `emulator-5554` (Android 17 / API 37).
  - الحالة: تم بناء الـ Debug APK وتثبيته واختبار تدفق المستخدم الكامل بنجاح.
- **بيانات حساب العميل التجريبي المُنشأ والمُختبر على السيرفر**:
  - **رقم الموبايل**: `01099887711`
  - **كلمة السر**: `password123`
  - **الكوبونات المربوطة بالحساب**:
    - نشط: `ZAG-789456` (جاهز للاستخدام ومربوط بـ QR Code).
    - مستخدم: `ZAG-123456` (تم استخدامه بنجاح).

---

## 📜 5. سجل الـ Git والـ Commits الحديثة
- `77082bc`: *feat(offers): free external map navigation, store address card, and Egyptian copy*
- `5aafd78`: *feat(ui/ux): bulletproof responsive cards, voucher tickets wallet, safe area padding, and area picker*
- `9e0669f`: *fix(nav): prevent unwanted leading back button and clean auth stack navigation*

جميع الـ Commits مرفوعة على **GitHub `origin/main`** ومسحوبة ومطبقة على السيرفر الحي (`72.62.27.196`).

---

## ⚡ 6. أوامر النشر والتحديث السريع (Quick Cheat Sheet)
```bash
# 1. تحديث ورفع التغييرات المحلية إلى GitHub:
git add .
git commit -m "feat/fix: description"
git push origin main

# 2. سحب التحديثات وتطبيقها على سيرفر الـ VPS:
/usr/bin/expect << 'EOF'
set timeout 30
spawn ssh -o StrictHostKeyChecking=no root@72.62.27.196 "cd /var/www/zag-offers && git pull origin main"
expect {
    "password:" {
        send "e#LWhcSAa6B&R8s\r"
        exp_continue
    }
    eof
}
EOF

# 3. فحص الأخطاء في تطبيق فلاتر:
cd zag_offers_app && flutter analyze lib
```
