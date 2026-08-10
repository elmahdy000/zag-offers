# إقرارات الخصوصية المقترحة للمتاجر

يجب مطابقة هذه القائمة مع إعدادات Play Console وApp Store Connect وقت الرفع. لا تعلن عن بيانات غير مستخدمة، ولا تستبعد بيانات يرسلها التطبيق أو SDK إلى الخادم.

## العميل

- Contact info: name, email, phone — account management/app functionality; linked to identity.
- Location: precise/coarse location — nearby offers/app functionality; linked when submitted.
- Photos: profile/review images — app functionality; linked.
- Identifiers: user ID and push token — account management and notifications; linked.
- App activity: favorites, coupon use, reviews, offer interactions — app functionality/analytics; linked.
- Tracking: No، ما لم تتم إضافة مشاركة عبر شركات إعلانات أو tracking domains.

## التاجر

- Contact info: name, email, phone — merchant account/app functionality; linked.
- Location: store coordinates — store setup/app functionality; linked.
- Photos: store and offer images — app functionality; linked.
- Identifiers: user ID and push token — authentication and notifications; linked.
- App activity: offers, coupon redemption, dashboard activity — app functionality/analytics; linked.
- Tracking: No.

## الإدارة

- Contact info: administrator name, email, phone — authentication/profile; linked.
- Photos: store and offer images selected for upload — app functionality; linked to managed records.
- Identifiers: administrator user ID and push token — authentication, audit, notifications; linked.
- App activity: moderation and administrative actions — security/audit/app functionality; linked.
- Tracking: No.

## Security and deletion

- Data is encrypted in transit using HTTPS.
- Account deletion is available inside customer/vendor apps and at the public deletion URL.
- Administrator self-deletion is intentionally disabled to protect privileged access; another authorized administrator manages privileged accounts.
- Legal, fraud-prevention, payment, or audit records may be retained only for the required period and must be documented in the public policy if applicable.
