export function validateEgyptianPhone(phone: string): boolean {
  return /^01[0125]\d{8}$/.test(phone.trim());
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
  }
  if (password.length > 50) {
    return { valid: false, error: 'كلمة المرور طويلة جداً' };
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على أرقام أو رموز' };
  }
  return { valid: true };
}
