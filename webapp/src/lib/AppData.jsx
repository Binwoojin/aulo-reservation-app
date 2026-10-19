import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { KEYS, loadList, loadValue, saveList, saveValue } from './storage.js';

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
  return [list, add, remove];
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

// 예약·주문에는 owner(이메일)를 붙인다. owner가 없는 예전 데모 기록은 누구의 것으로도 본다.
const isMine = (item, user) => !!user && (!item.owner || item.owner === user.email);

export function AppDataProvider({ children }) {
  const { user, login, logout } = useSession();
  const [reservations, addStoredReservation, removeReservation] = useStoredList(KEYS.reservations);
  const [orders, addStoredOrder] = useStoredList(KEYS.orders);
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
    }),
    [user, login, logout, reservations, addReservation, removeReservation, orders, addOrder],
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
