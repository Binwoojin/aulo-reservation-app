// 데모 계정: 서버가 없어 이 기기에 가입한 이메일만 기억한다 (비밀번호는 어디에도 저장하지 않는다).
// 로그인 방식 정책(2026-10-19): 이메일 아이디 + 비밀번호
import { loadList, saveList } from './storage.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;
export const CODE_LENGTH = 6;
const ACCOUNTS_KEY = 'aulo.accounts.v1';

export const emailError = (email) => (EMAIL_RE.test(email.trim()) ? null : '이메일 주소를 확인해 주세요.');
export const passwordError = (pw) => (pw.length >= MIN_PASSWORD ? null : `비밀번호는 ${MIN_PASSWORD}자 이상 입력해 주세요.`);
export const confirmError = (pw, confirm) => {
  if (!confirm) return '비밀번호를 한 번 더 입력해 주세요.';
  return pw === confirm ? null : '비밀번호가 서로 달라요.';
};
export const codeError = (code) => (new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code) ? null : `인증번호 ${CODE_LENGTH}자리 숫자를 입력해 주세요.`);

const normalize = (email) => email.trim().toLowerCase();
export const isRegistered = (email) => loadList(ACCOUNTS_KEY).includes(normalize(email));
export const register = (email) => {
  const list = loadList(ACCOUNTS_KEY);
  if (!list.includes(normalize(email))) saveList(ACCOUNTS_KEY, [...list, normalize(email)]);
};
