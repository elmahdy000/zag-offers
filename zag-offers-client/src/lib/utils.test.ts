import { describe, it, expect } from 'vitest';
import { resolveImageUrl, formatDiscount, calculateDaysLeft } from './utils';

describe('resolveImageUrl', () => {
  it('should return empty string for null/undefined path', () => {
    expect(resolveImageUrl(null)).toBe('');
    expect(resolveImageUrl(undefined)).toBe('');
  });

  it('should return path as-is if it starts with http', () => {
    const httpUrl = 'https://example.com/image.jpg';
    expect(resolveImageUrl(httpUrl)).toBe(httpUrl);
  });

  it('should add /uploads/ prefix if missing', () => {
    const path = 'image.jpg';
    const result = resolveImageUrl(path);
    expect(result).toContain('/uploads/');
    expect(result).toContain('image.jpg');
  });

  it('should not double-add /uploads/ if already present', () => {
    const path = '/uploads/image.jpg';
    const result = resolveImageUrl(path);
    expect(result.split('/uploads/').length).toBe(2);
  });
});

describe('formatDiscount', () => {
  it('should add % suffix to numeric value', () => {
    expect(formatDiscount('50')).toBe('50%');
    expect(formatDiscount('25.5')).toBe('25.5%');
  });

  it('should return value as-is if already has %', () => {
    expect(formatDiscount('50%')).toBe('50%');
  });

  it('should return value as-is for non-numeric strings', () => {
    expect(formatDiscount('خصم خاص')).toBe('خصم خاص');
  });
});

describe('calculateDaysLeft', () => {
  it('should return positive days for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    
    const daysLeft = calculateDaysLeft(futureDate.toISOString());
    expect(daysLeft).toBeGreaterThan(0);
  });

  it('should return 0 or negative for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const daysLeft = calculateDaysLeft(pastDate.toISOString());
    expect(daysLeft).toBeLessThanOrEqual(0);
  });

  it('should return 0 for invalid date', () => {
    expect(calculateDaysLeft('invalid')).toBe(0);
  });
});
