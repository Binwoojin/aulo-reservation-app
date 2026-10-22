import { describe, expect, it } from 'vitest';
import { SCENARIOS, canBeInUse } from './scenarios.js';
import { homeStatus } from './status.js';

const at = (h, m = 0) => new Date(Date.UTC(2026, 9, 20, h - 9, m)); // KST
const build = (id, now) => SCENARIOS.find((s) => s.id === id).build(now, 'seongsu');

describe('데모 시나리오', () => {
  it('각 시나리오가 의도한 홈 상태를 만든다', () => {
    const now = at(15, 20);
    expect(homeStatus(build('first', now).reservations, now).kind).toBe('none');
    expect(homeStatus(build('returning', now).reservations, now).kind).toBe('none');
    expect(homeStatus(build('upcoming', now).reservations, now).kind).toBe('upcoming');
    expect(homeStatus(build('focus-now', now).reservations, now).kind).toBe('in-use');
    expect(homeStatus(build('suite-now', now).reservations, now).kind).toBe('in-use');
  });
  it('늦은 시간에도 이용 중 예약은 22:00 종료를 넘지 않고, 운영 시간 밖에서는 만들지 않는다', () => {
    const now = at(21, 30);
    const [r] = build('suite-now', now).reservations;
    expect(r.start + r.hours * 60).toBeLessThanOrEqual(22 * 60);
    expect(homeStatus([r], now).kind).toBe('in-use');
    expect(canBeInUse(at(22, 30))).toBe(false);
    expect(canBeInUse(at(7, 30))).toBe(false);
  });
});
