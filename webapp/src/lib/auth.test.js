import { beforeEach, describe, expect, it } from 'vitest';
import { codeError, confirmError, emailError, isRegistered, passwordError, register, unregister } from './auth.js';

// 테스트 환경(Node)에는 localStorage가 없어 메모리로 대신한다
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
  clear: () => memory.clear(),
};

describe('데모 계정 검증', () => {
  beforeEach(() => localStorage.clear());
  it('이메일·비밀번호·확인·인증번호 형식을 검사한다', () => {
    expect(emailError('demo@aulo.kr')).toBeNull();
    expect(emailError('demo@aulo')).toBeTruthy();
    expect(passwordError('1234567')).toBeTruthy();
    expect(passwordError('12345678')).toBeNull();
    expect(confirmError('abcdefgh', 'abcdefgh')).toBeNull();
    expect(confirmError('abcdefgh', 'abcdefg')).toBeTruthy();
    expect(codeError('123456')).toBeNull();
    expect(codeError('12345a')).toBeTruthy();
  });
  it('가입한 이메일만 기억하고(대소문자 무시) 비밀번호는 저장하지 않는다', () => {
    register(' Demo@Aulo.kr ');
    expect(isRegistered('demo@aulo.kr')).toBe(true);
    expect(isRegistered('other@aulo.kr')).toBe(false);
    expect([...memory.values()].join(' ')).not.toMatch(/password|1234/i);
  });
  it('탈퇴하면 가입 기록에서 지워져 같은 이메일로 다시 가입할 수 있다', () => {
    register('a@aulo.kr');
    register('b@aulo.kr');
    unregister('A@aulo.kr');
    expect(isRegistered('a@aulo.kr')).toBe(false);
    expect(isRegistered('b@aulo.kr')).toBe(true);
  });
});
