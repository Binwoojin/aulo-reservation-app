import { describe, expect, it } from 'vitest';
import { PRIVACY_TERMS, SERVICE_TERMS, TERMS } from './terms.js';
import { BOOKING_WINDOW_DAYS, PENALTY } from '../config/policy.js';

const text = (t) => [...(t.table ?? []).flatMap((r) => [r.head, ...r.cells]), ...t.sections.flatMap((s) => [s.title, ...s.body])].join(' ');

describe('terms', () => {
  it('회원가입의 필수 약관 두 개', () => {
    expect(TERMS.map((t) => t.id)).toEqual(['service', 'privacy']);
  });
  it('이용약관은 확정 정책 값으로 만든다', () => {
    const all = text(SERVICE_TERMS);
    expect(all).toContain(`${BOOKING_WINDOW_DAYS}일 안에서`);
    expect(all).toContain(`${PENALTY.banDays}일 동안 예약할 수 없습니다`);
    expect(all).not.toMatch(/undefined|NaN/);
  });
  it('개인정보 동의는 항목·목적·보유 기간을 담는다', () => {
    expect(PRIVACY_TERMS.table.map((r) => r.head)).toEqual(['수집 항목', '수집·이용 목적', '보유 기간']);
    expect(text(PRIVACY_TERMS)).not.toMatch(/undefined|NaN/);
  });
});
