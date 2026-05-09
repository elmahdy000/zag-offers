# اختبارات TypeScript - دليل الاستخدام

## 🧪 إعداد الاختبارات

### 1. تثبيت الاعتماديات

```bash
cd d:\offers\zag-offers-client
npm install
```

### 2. تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات مع UI
npm run test:ui

# تشغيل الاختبارات في وضع المراقبة
npx vitest --watch
```

---

## 📁 هيكل ملفات الاختبارات

```
src/
├── lib/
│   ├── utils.ts          ← الدوال الأصلية
│   └── utils.test.ts     ← اختبارات الدوال
├── hooks/
│   └── useFavorites.test.ts  ← اختبارات الـ Hooks
├── test/
│   └── setup.ts          ← إعداد الاختبارات العام
└── ...
vitest.config.ts          ← إعداد Vitest
```

---

## 📝 أنواع الاختبارات

### 1. اختبارات Utilities (`utils.test.ts`)

اختبارات للدوال المساعدة:
- `resolveImageUrl()` - تحويل مسار الصورة
- `formatDiscount()` - تنسيق نسبة الخصم
- `calculateDaysLeft()` - حساب الأيام المتبقية

```typescript
import { describe, it, expect } from 'vitest';
import { resolveImageUrl } from './utils';

describe('resolveImageUrl', () => {
  it('should return empty string for null path', () => {
    expect(resolveImageUrl(null)).toBe('');
  });
});
```

### 2. اختبارات WebSocket (`socket.test.ts`)

اختبارات لـ WebSocket hook:
- الاتصال عند توفر token
- عدم الاتصال بدون token
- معالجة أخطاء الاتصال
- إعادة المحاولة تلقائياً

### 3. اختبارات Favorites (`useFavorites.test.ts`)

اختبارات لإدارة المفضلة:
- تحميل من API عند تسجيل الدخول
- تحميل من localStorage بدون تسجيل دخول
- إضافة/إزالة من المفضلة
- Fallback عند فشل API

---

## 🔧 إعداد Vitest

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',      // محاكاة المتصفح
    globals: true,             // دوال عالمية (describe, it, expect)
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### `src/test/setup.ts`

إعداد عام للاختبارات:
- Mock لـ localStorage
- Mock لـ matchMedia
- Mock لـ fetch

---

## 🎯 أمثلة على الاختبارات

### اختبار دالة بسيطة

```typescript
describe('formatDiscount', () => {
  it('should add % suffix to numeric value', () => {
    expect(formatDiscount('50')).toBe('50%');
  });

  it('should return value as-is if already has %', () => {
    expect(formatDiscount('50%')).toBe('50%');
  });
});
```

### اختبار Hook مع Mock

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';

global.fetch = vi.fn();

describe('useFavorites', () => {
  it('should load favorites from API when logged in', async () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ offerId: '1', offer: { title: 'Test' } }],
    });

    const { result } = renderHook(() => useFavorites());
    
    await waitFor(() => {
      expect(result.current.favorites).toHaveLength(1);
    });
  });
});
```

### اختبار WebSocket

```typescript
describe('useSocket', () => {
  it('should connect when token is provided', () => {
    renderHook(() => useSocket('test-token'));
    
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'test-token' },
        reconnection: true,
      })
    );
  });
});
```

---

## 🛠️ Mocking

### Mock لـ localStorage

```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
```

### Mock لـ fetch

```typescript
global.fetch = vi.fn();

(fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

### Mock لـ socket.io

```typescript
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));
```

---

## 📊 تقارير الاختبارات

### تشغيل الاختبارات مع تقرير

```bash
npx vitest --reporter=verbose
npx vitest --reporter=json > test-report.json
```

### تغطية الكود (Code Coverage)

```bash
npx vitest --coverage
```

يحتاج تثبيت:
```bash
npm install -D @vitest/coverage-v8
```

---

## ✅ أفضل الممارسات

1. **اسماء واضحة**: استخدم أسماء توضح ما يتم اختباره
   ```typescript
   it('should toggle favorite status when user is logged in', ...)
   ```

2. **Arrange-Act-Assert**: رتب الاختبار بشكل منطقي
   ```typescript
   // Arrange
   const token = 'test-token';
   
   // Act
   const { result } = renderHook(() => useSocket(token));
   
   // Assert
   expect(result.current.isConnected).toBe(true);
   ```

3. ** cleanup**: نظف after each test
   ```typescript
   afterEach(() => {
     vi.clearAllMocks();
   });
   ```

4. **Edge cases**: اختبر الحالات الحدية
   - null/undefined values
   - empty strings
   - invalid dates

---

## 🔍 Troubleshooting

### مشكلة: "Cannot find module 'vitest'"

**الحل**: تأكد من تثبيت الاعتماديات
```bash
npm install
```

### مشكلة: "fetch is not defined"

**الحل**: vitest يوفر fetch عالمي في بيئة jsdom

### مشكلة: "window is not defined"

**الحل**: استخدم `global` بدلاً من `window` أو تأكد من إعداد jsdom

---

## 📚 مصادر مفيدة

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
