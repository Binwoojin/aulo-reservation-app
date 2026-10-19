import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import HomePage from './pages/HomePage.jsx';
import RecommendPage from './pages/RecommendPage.jsx';
import ReservePage from './pages/ReservePage.jsx';
import ReservationDetailPage from './pages/ReservationDetailPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import MyReservationsPage from './pages/MyReservationsPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import InfoPage from './pages/InfoPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage, { RequireLogin } from './pages/LoginPage.jsx';
import MyPage from './pages/MyPage.jsx';
import MenuDetailPage from './pages/MenuDetailPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="recommend" element={<RecommendPage />} />
        {/* 좌석 예약과 내 기록은 로그인 필수. 음료 메뉴 보기(주문 화면)는 누구나, 담기·주문은 화면 안에서 로그인을 거친다 */}
        <Route path="reserve" element={<RequireLogin><ReservePage /></RequireLogin>} />
        <Route path="reserve/:type" element={<RequireLogin><ReservePage /></RequireLogin>} />
        <Route path="reservations/:id" element={<RequireLogin><ReservationDetailPage /></RequireLogin>} />
        <Route path="order" element={<OrderPage />} />
        <Route path="menu/:id" element={<MenuDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="my" element={<MyPage />} />
        <Route path="my/reservations" element={<RequireLogin><MyReservationsPage /></RequireLogin>} />
        <Route path="my/orders" element={<RequireLogin><MyOrdersPage /></RequireLogin>} />
        <Route path="info" element={<InfoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
