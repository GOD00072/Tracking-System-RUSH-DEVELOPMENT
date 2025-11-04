import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Ship,
  Package,
  Users,
  Calendar,
  Calculator,
  Star,
  MessageSquare,
  BarChart3,
  LogOut,
  Upload
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Ship, label: 'คำสั่งซื้อ', path: '/admin/orders' },
    { icon: Package, label: 'การจัดส่ง', path: '/admin/shipments' },
    { icon: Upload, label: 'นำเข้าข้อมูลเครื่องบิน', path: '/admin/air-tracking-import' },
    { icon: Calendar, label: 'ตารางเรือ', path: '/admin/schedules' },
    { icon: Users, label: 'ลูกค้า', path: '/admin/customers' },
    { icon: Star, label: 'รีวิว', path: '/admin/reviews' },
    { icon: Calculator, label: 'ตั้งค่าราคา', path: '/admin/pricing' },
    { icon: MessageSquare, label: 'ข้อความติดต่อ', path: '/admin/messages' },
    { icon: BarChart3, label: 'สถิติ', path: '/admin/statistics' },
    { icon: Settings, label: 'ตั้งค่าระบบ', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    toast.success('ออกจากระบบสำเร็จ');
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <Ship className="w-8 h-8 text-primary-400" />
          <div>
            <h1 className="font-bold text-lg">Ship Tracking</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
