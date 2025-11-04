import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';

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

// Admin Pages
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import AdminSettingsPage from './pages/Admin/AdminSettingsPage';
import AdminAirTrackingImport from './pages/Admin/AdminAirTrackingImport';

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
          </Route>

          {/* Admin Login (No Layout) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Routes (With Sidebar) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="orders" element={<AdminDashboardPage />} />
            <Route path="shipments" element={<AdminDashboardPage />} />
            <Route path="air-tracking-import" element={<AdminAirTrackingImport />} />
            <Route path="schedules" element={<AdminDashboardPage />} />
            <Route path="customers" element={<AdminDashboardPage />} />
            <Route path="reviews" element={<AdminDashboardPage />} />
            <Route path="pricing" element={<AdminSettingsPage />} />
            <Route path="messages" element={<AdminDashboardPage />} />
            <Route path="statistics" element={<AdminDashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
