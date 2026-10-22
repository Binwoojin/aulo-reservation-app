import { describe, expect, it } from 'vitest';
import { answer, detectIntent } from './assistant.js';

// KST 2026-10-19 12:00
const now = new Date(Date.UTC(2026, 9, 19, 3, 0));
const user = { email: 'd@a.kr' };
const r = (id, extra) => ({ id, type: 'focus', storeId: 'seongsu', date: '2026-10-19', start: 660, hours: 2, unit: 4, drinkId: 'americano', fee: 4000, ...extra });

describe('이용 도우미', () => {
  it('자유 입력에서 의도를 고른다', () => {
    expect(detectIntent('오늘 좀 늦을 것 같아요')).toBe('late');
    expect(detectIntent('연장 되나요?')).toBe('extend');
    expect(detectIntent('텀블러 할인 있어요?')).toBe('tumbler');
    expect(detectIntent('날씨 어때요')).toBe('unknown');
  });

  it('연장은 내 예약 기준으로 답한다', () => {
    const mine = [r('a')];
    const res = answer('extend', { user, myReservations: mine, reservations: mine, now });
    expect(res.text.join(' ')).toContain('Flow Focus 4번');
    expect(res.text.join(' ')).toContain('14:00까지 최대 60분');
    expect(res.actions[0].to).toBe('/reservations/a');
  });

  it('로그인 전에는 일반 정책과 로그인 안내', () => {
    const res = answer('extend', { user: null, now });
    expect(res.actions[0].label).toBe('로그인하기');
  });

  it('당일 예약은 앱 취소 불가로 안내한다', () => {
    const mine = [r('a')];
    expect(answer('cancel', { user, myReservations: mine, now }).text[0]).toContain('이용 당일');
    const tomorrow = [r('b', { date: '2026-10-20' })];
    expect(answer('cancel', { user, myReservations: tomorrow, now }).text[0]).toContain('10월 19일 (월) 23:59까지');
  });

  it('모르는 질문은 지어내지 않는다', () => {
    expect(answer('unknown', { now }).text[0]).toContain('아직 답할 수 없어요');
  });
});
