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
  Upload,
  Search,
  Cookie,
  Globe,
  Check
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

const languages = [
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsLangOpen(false);
  };

  const menuItems = [
    { icon: LayoutDashboard, labelKey: 'admin.sidebar.dashboard', path: '/admin/dashboard' },
    { icon: Ship, labelKey: 'admin.sidebar.orders', path: '/admin/orders' },
    { icon: Package, labelKey: 'admin.sidebar.shipments', path: '/admin/shipments' },
    { icon: Upload, labelKey: 'admin.sidebar.airImport', path: '/admin/air-tracking-import' },
    { icon: Calendar, labelKey: 'admin.sidebar.schedules', path: '/admin/schedules' },
    { icon: Users, labelKey: 'admin.sidebar.customers', path: '/admin/customers' },
    { icon: Star, labelKey: 'admin.sidebar.reviews', path: '/admin/reviews' },
    { icon: Calculator, labelKey: 'admin.sidebar.pricing', path: '/admin/pricing' },
    { icon: MessageSquare, labelKey: 'admin.sidebar.messages', path: '/admin/messages' },
    { icon: BarChart3, labelKey: 'admin.sidebar.statistics', path: '/admin/statistics' },
    { icon: Search, labelKey: 'admin.sidebar.seo', path: '/admin/seo' },
    { icon: Cookie, labelKey: 'admin.sidebar.cookies', path: '/admin/cookies' },
    { icon: Settings, labelKey: 'admin.sidebar.settings', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    toast.success(t('admin.sidebar.logoutSuccess'));
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <Ship className="w-8 h-8 text-primary-400" />
          <div>
            <h1 className="font-bold text-lg">{t('admin.sidebar.title')}</h1>
            <p className="text-xs text-gray-400">{t('admin.sidebar.subtitle')}</p>
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
              <span className="text-sm font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Language Switcher & Logout */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* Language Switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span className="text-lg">{currentLanguage.flag}</span>
            <span className="text-sm font-medium flex-1 text-left">{currentLanguage.name}</span>
          </button>

          <AnimatePresence>
            {isLangOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      lang.code === currentLanguage.code
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="flex-1 text-left font-medium">{lang.name}</span>
                    {lang.code === currentLanguage.code && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t('admin.sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
