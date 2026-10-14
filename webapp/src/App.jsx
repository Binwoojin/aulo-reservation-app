import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import RecommendPage from './pages/RecommendPage.jsx';
import ReservePage from './pages/ReservePage.jsx';
import ReservationDonePage from './pages/ReservationDonePage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="recommend" element={<RecommendPage />} />
        <Route path="reserve" element={<ReservePage />} />
        <Route path="reserve/:type" element={<ReservePage />} />
        <Route path="reservations/:id" element={<ReservationDonePage />} />
        <Route path="order" element={<OrderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
