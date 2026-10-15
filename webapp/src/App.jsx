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

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="recommend" element={<RecommendPage />} />
        <Route path="reserve" element={<ReservePage />} />
        <Route path="reserve/:type" element={<ReservePage />} />
        <Route path="reservations/:id" element={<ReservationDetailPage />} />
        <Route path="order" element={<OrderPage />} />
        <Route path="my/reservations" element={<MyReservationsPage />} />
        <Route path="my/orders" element={<MyOrdersPage />} />
        <Route path="info" element={<InfoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
