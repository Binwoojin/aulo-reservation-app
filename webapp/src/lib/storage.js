// 데모 저장소: 브라우저 localStorage. 사용할 수 없으면 메모리에만 보관한다.
const memory = new Map();

const read = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return memory.get(key) ?? [];
  }
};

const write = (key, value) => {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 불가(시크릿 모드 등) — 메모리 값으로 계속 동작
  }
};

export const KEYS = { reservations: 'aulo.reservations.v1', orders: 'aulo.orders.v1' };
export const loadList = (key) => read(key);
export const saveList = (key, list) => write(key, list);
