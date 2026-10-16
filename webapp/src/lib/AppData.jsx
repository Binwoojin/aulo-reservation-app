import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { KEYS, loadList, saveList } from './storage.js';

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
  // 다른 탭에서 바뀐 예약도 반영 (충돌 검사 정확도)
  useEffect(() => {
    const onStorage = (e) => e.key === key && setList(loadList(key));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);
  return [list, add];
};

export function AppDataProvider({ children }) {
  const [reservations, addReservation] = useStoredList(KEYS.reservations);
  const [orders, addOrder] = useStoredList(KEYS.orders);
  const value = useMemo(
    () => ({ reservations, addReservation, orders, addOrder }),
    [reservations, addReservation, orders, addOrder],
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
