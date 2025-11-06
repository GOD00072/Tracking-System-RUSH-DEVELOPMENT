import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import CookieConsentBanner from './components/CookieConsentBanner';

// Layouts
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import HomePage from './pages/Home/HomePage';
import ProcessPage from './pages/Process/ProcessPage';
import ShipTrackingPage from './pages/ShipTracking/ShipTrackingPage';
import AirTrackingPage from './pages/AirTracking/AirTrackingPage';
import SchedulePage from './pages/Schedule/SchedulePage';
import CalculatorPage from './pages/Calculator/CalculatorPage';
import PortfolioPage from './pages/Portfolio/PortfolioPage';
import ReviewPage from './pages/Review/ReviewPage';
import StatisticsPage from './pages/Statistics/StatisticsPage';
import AboutPage from './pages/About/AboutPage';
import ContactPage from './pages/Contact/ContactPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import AdminSettingsPage from './pages/Admin/AdminSettingsPage';
import AdminAirTrackingImport from './pages/Admin/AdminAirTrackingImport';
import AdminReviewsPage from './pages/Admin/AdminReviewsPage';
import AdminOrdersPage from './pages/Admin/AdminOrdersPage';
import OrderDetailPage from './pages/Admin/OrderDetailPage';
import AdminCustomersPage from './pages/Admin/AdminCustomersPage';
import AdminSEOPage from './pages/Admin/AdminSEOPage';
import AdminCookiePage from './pages/Admin/AdminCookiePage';
import AdminNotFoundPage from './pages/Admin/AdminNotFoundPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="process" element={<ProcessPage />} />
            <Route path="ship-tracking" element={<ShipTrackingPage />} />
            <Route path="air-tracking" element={<AirTrackingPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="calculator" element={<CalculatorPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Admin Login (No Layout) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Routes (With Sidebar) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="shipments" element={<AdminDashboardPage />} />
            <Route path="air-tracking-import" element={<AdminAirTrackingImport />} />
            <Route path="schedules" element={<AdminDashboardPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="pricing" element={<AdminSettingsPage />} />
            <Route path="messages" element={<AdminDashboardPage />} />
            <Route path="statistics" element={<AdminDashboardPage />} />
            <Route path="seo" element={<AdminSEOPage />} />
            <Route path="cookies" element={<AdminCookiePage />} />
            <Route path="*" element={<AdminNotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
      <CookieConsentBanner />
    </QueryClientProvider>
  );
}

export default App;
