import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORES } from '../config/policy.js';
import { KEYS, loadList, loadValue, saveList, saveValue } from './storage.js';
import { parseKey } from './order.js';
import { getDrink } from './reservation.js';

const AppDataContext = createContext(null);

const useStoredList = (key) => {
  const [list, setList] = useState(() => loadList(key));
  const add = useCallback(
    (item) =>
      setList((prev) => {
        const next = [...prev, item];
        saveList(key, next);
        return next;
      }),
    [key],
  );
  const remove = useCallback(
    (id) =>
      setList((prev) => {
        const next = prev.filter((item) => item.id !== id);
        saveList(key, next);
        return next;
      }),
    [key],
  );
  // 다른 탭에서 바뀐 예약도 반영 (충돌 검사 정확도)
  useEffect(() => {
    const onStorage = (e) => e.key === key && setList(loadList(key));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);
  // 데모 시나리오: 목록 전체를 바꾼다
  const replace = useCallback((next) => { saveList(key, next); setList(next); }, [key]);
  return [list, add, remove, replace];
};

// 데모 로그인: 서버가 없어 이메일만 이 기기에 세션으로 저장한다 (비밀번호는 저장하지 않음)
const useSession = () => {
  const [user, setUser] = useState(() => loadValue(KEYS.session));
  const login = useCallback((email) => {
    const next = { email };
    saveValue(KEYS.session, next);
    setUser(next);
  }, []);
  const logout = useCallback(() => {
    saveValue(KEYS.session, null);
    setUser(null);
  }, []);
  return { user, login, logout };
};

// 장바구니: 로그인하러 다녀와도 남도록 이 탭(sessionStorage)에 보관한다
// items: { [drinkId]: 잔 수 } — 카페 주문 전용 (좌석 추가 주문·Suite 배달은 예약별 화면에서 따로 받는다)
// serve: 카페 주문의 이용 방법 'dine-in'(매장) | 'takeout'(테이크아웃)
const CART_KEY = 'aulo.cart.v2';
const EMPTY_CART = { items: {}, serve: 'dine-in' };
// 메뉴에서 빠진 음료(예: 허브티 → 녹차로 교체)가 남아 있으면 버린다
const knownItems = (items = {}) => Object.fromEntries(Object.entries(items).filter(([key]) => getDrink(parseKey(key).id)));
const readCart = () => {
  try {
    const saved = { ...EMPTY_CART, ...JSON.parse(sessionStorage.getItem(CART_KEY)) };
    return { ...saved, items: knownItems(saved.items) };
  } catch { return EMPTY_CART; }
};
const useCart = () => {
  const [cart, setCart] = useState(readCart);
  useEffect(() => {
    try { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* 저장소를 못 쓰면 메모리에만 */ }
  }, [cart]);
  const addToCart = useCallback((id, qty = 1) => setCart((c) => ({ ...c, items: { ...c.items, [id]: (c.items[id] ?? 0) + qty } })), []);
  const setCartQty = useCallback((id, qty) => setCart((c) => {
    const items = { ...c.items };
    if (qty > 0) items[id] = qty; else delete items[id];
    return { ...c, items };
  }), []);
  const setCartServe = useCallback((serve) => setCart((c) => ({ ...c, serve })), []);
  const clearCart = useCallback(() => setCart(EMPTY_CART), []);
  return useMemo(() => ({ cart, addToCart, setCartQty, setCartServe, clearCart }), [cart, addToCart, setCartQty, setCartServe, clearCart]);
};

// 선택한 매장: 홈에서 고르고 앱 전체(홈 상태·공간 정보, 카페 주문, 예약 기본값)가 이 매장을 기준으로 한다 (필수 규칙 4)
const validStore = (id) => (STORES.value.some((s) => s.id === id) ? id : STORES.value[0].id);
const useSelectedStore = () => {
  const [storeId, setStoreIdState] = useState(() => validStore(loadValue(KEYS.store)));
  const setStoreId = useCallback((id) => {
    const next = validStore(id);
    saveValue(KEYS.store, next);
    setStoreIdState(next);
  }, []);
  return { storeId, setStoreId, store: STORES.value.find((s) => s.id === storeId) };
};

// 예약·주문에는 owner(이메일)를 붙인다. owner가 없는 예전 데모 기록은 누구의 것으로도 본다.
const isMine = (item, user) => !!user && (!item.owner || item.owner === user.email);

export function AppDataProvider({ children }) {
  const { user, login, logout } = useSession();
  const cartApi = useCart();
  const { storeId, setStoreId, store } = useSelectedStore();
  const [reservations, addStoredReservation, removeReservation, replaceReservations] = useStoredList(KEYS.reservations);
  const [orders, addStoredOrder, , replaceOrders] = useStoredList(KEYS.orders);
  const addReservation = useCallback((r) => addStoredReservation({ ...r, owner: user?.email ?? null }), [addStoredReservation, user]);
  const addOrder = useCallback((o) => addStoredOrder({ ...o, owner: user?.email ?? null }), [addStoredOrder, user]);
  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      reservations, // 좌석 현황 계산용 전체 예약
      myReservations: reservations.filter((r) => isMine(r, user)),
      addReservation,
      removeReservation,
      orders,
      myOrders: orders.filter((o) => isMine(o, user)),
      addOrder,
      ...cartApi,
      storeId,
      store,
      setStoreId,
      // 데모 시나리오 적용: 로그인 상태·예약·주문을 한 번에 바꾸고 장바구니를 비운다
      loadScenario: ({ email, reservations: rs, orders: os }) => {
        if (email) login(email); else logout();
        replaceReservations(rs);
        replaceOrders(os);
        cartApi.clearCart();
      },
    }),
    [user, login, logout, reservations, addReservation, removeReservation, orders, addOrder, cartApi, storeId, store, setStoreId, replaceReservations, replaceOrders],
  );
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppData = () => useContext(AppDataContext);

// 현재 시각 (1분마다 갱신)
export const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
};
