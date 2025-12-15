import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import { ConfirmProvider } from './hooks/useConfirm';

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
import TrackingPortal from './pages/TrackingPortal';

// Admin Pages
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import AdminSettingsPage from './pages/Admin/AdminSettingsPage';
import AdminReviewsPage from './pages/Admin/AdminReviewsPage';
import AdminOrdersPage from './pages/Admin/AdminOrdersPage';
import OrderDetailPage from './pages/Admin/OrderDetailPage';
import AdminCustomersPage from './pages/Admin/AdminCustomersPage';
import AdminSEOPage from './pages/Admin/AdminSEOPage';
import AdminTierSettingsPage from './pages/Admin/AdminTierSettingsPage';
import AdminShipmentsPage from './pages/Admin/AdminShipmentsPage';
import AdminPricingPage from './pages/Admin/AdminPricingPage';
import AdminSchedulesPage from './pages/Admin/AdminSchedulesPage';
import AdminCloudinaryPage from './pages/Admin/AdminCloudinaryPage';
import AdminStatisticsPage from './pages/Admin/AdminStatisticsPage';
import AdminPortfolioPage from './pages/Admin/AdminPortfolioPage';
import AdminStatementPage from './pages/Admin/AdminStatementPage';
import AdminNotFoundPage from './pages/Admin/AdminNotFoundPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="process" element={<ProcessPage />} />
            <Route path="tracking" element={<TrackingPortal />} />
            <Route path="tracking/:productCode" element={<TrackingPortal />} />
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
            <Route path="shipments" element={<AdminShipmentsPage />} />
            <Route path="schedules" element={<AdminSchedulesPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="tier-settings" element={<AdminTierSettingsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="portfolio" element={<AdminPortfolioPage />} />
            <Route path="pricing" element={<AdminPricingPage />} />
            <Route path="seo" element={<AdminSEOPage />} />
            <Route path="cloudinary" element={<AdminCloudinaryPage />} />
            <Route path="statistics" element={<AdminStatisticsPage />} />
            <Route path="statement" element={<AdminStatementPage />} />
            <Route path="*" element={<AdminNotFoundPage />} />
          </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </ConfirmProvider>
    </QueryClientProvider>
  );
}

export default App;
