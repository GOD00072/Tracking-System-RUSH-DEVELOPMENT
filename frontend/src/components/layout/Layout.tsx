import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import NotificationPopup from '../NotificationPopup';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      {/* Popup notification for new schedules */}
      <NotificationPopup />
    </div>
  );
};

export default Layout;
