import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import HomePage from './pages/HomePage.jsx';
import RecommendPage from './pages/RecommendPage.jsx';
import ReservePage from './pages/ReservePage.jsx';
import ReservationDetailPage from './pages/ReservationDetailPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import MyReservationsPage from './pages/MyReservationsPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import NoticePage, { NoticeDetailPage } from './pages/NoticePage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import FindPasswordPage from './pages/FindPasswordPage.jsx';
import DemoPage from './pages/DemoPage.jsx';
import InfoPage from './pages/InfoPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage, { RequireLogin } from './pages/LoginPage.jsx';
import WithdrawPage from './pages/WithdrawPage.jsx';
import OrderTrackPage from './pages/OrderTrackPage.jsx';
import MyPage from './pages/MyPage.jsx';
import MenuDetailPage from './pages/MenuDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import SeatOrderPage from './pages/SeatOrderPage.jsx';
import HelpPage from './pages/HelpPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="recommend" element={<RecommendPage />} />
        {/* 좌석 예약과 내 기록은 로그인 필수. 음료 메뉴·상세·장바구니는 누구나, 장바구니의 '주문하기'에서 로그인 안내창으로 막는다 */}
        <Route path="reserve" element={<RequireLogin><ReservePage /></RequireLogin>} />
        <Route path="reserve/:type" element={<RequireLogin><ReservePage /></RequireLogin>} />
        <Route path="reservations/:id" element={<RequireLogin><ReservationDetailPage /></RequireLogin>} />
        <Route path="reservations/:id/order" element={<RequireLogin><SeatOrderPage /></RequireLogin>} />
        <Route path="order" element={<OrderPage />} />
        <Route path="menu/:id" element={<MenuDetailPage />} />
        <Route path="cart" element={<RequireLogin><CartPage /></RequireLogin>} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="find-password" element={<FindPasswordPage />} />
        <Route path="my" element={<MyPage />} />
        <Route path="my/reservations" element={<RequireLogin><MyReservationsPage /></RequireLogin>} />
        <Route path="my/orders" element={<RequireLogin><MyOrdersPage /></RequireLogin>} />
        <Route path="my/orders/:id" element={<RequireLogin><OrderTrackPage /></RequireLogin>} />
        <Route path="my/withdraw" element={<WithdrawPage />} />
        <Route path="info" element={<InfoPage />} />
        <Route path="notice" element={<NoticePage />} />
        <Route path="notice/:id" element={<NoticeDetailPage />} />
        <Route path="demo" element={<DemoPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
