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
  LogOut,
  Cookie,
  Search,
  Check,
  Crown,
  Cloud,
  Globe,
  ChevronDown,
  BarChart3
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

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface MenuGroup {
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['customers', 'settings']);
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

  // Main menu items (always visible)
  const mainMenuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'แดชบอร์ด', path: '/admin/dashboard' },
    { icon: Ship, label: 'ออเดอร์', path: '/admin/orders' },
    { icon: Package, label: 'Shipments', path: '/admin/shipments' },
    { icon: Calendar, label: 'ตารางขนส่ง', path: '/admin/schedules' },
    { icon: BarChart3, label: 'สถิติ & รายงาน', path: '/admin/statistics' },
  ];

  // Grouped menu items (collapsible drawers)
  const menuGroups: MenuGroup[] = [
    {
      label: 'ลูกค้า',
      icon: Users,
      items: [
        { icon: Users, label: 'รายชื่อลูกค้า', path: '/admin/customers' },
        { icon: Crown, label: 'ระดับลูกค้า', path: '/admin/tier-settings' },
      ],
    },
    {
      label: 'ราคา & รีวิว',
      icon: Calculator,
      items: [
        { icon: Calculator, label: 'ตั้งค่าราคา', path: '/admin/pricing' },
        { icon: Star, label: 'รีวิวลูกค้า', path: '/admin/reviews' },
      ],
    },
    {
      label: 'ตั้งค่าระบบ',
      icon: Settings,
      items: [
        { icon: Settings, label: 'ตั้งค่าทั่วไป', path: '/admin/settings' },
        { icon: Search, label: 'SEO', path: '/admin/seo' },
        { icon: Cookie, label: 'Cookies', path: '/admin/cookies' },
        { icon: Cloud, label: 'Cloudinary', path: '/admin/cloudinary' },
      ],
    },
  ];

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupLabel)
        ? prev.filter((g) => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  const isGroupOpen = (groupLabel: string) => openGroups.includes(groupLabel);

  const isActiveInGroup = (items: MenuItem[]) =>
    items.some((item) => location.pathname === item.path);

  const handleLogout = () => {
    logout();
    toast.success(t('admin.sidebar.logoutSuccess'));
    navigate('/admin/login');
  };

  const renderMenuItem = (item: MenuItem, isNested = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
          isNested ? 'ml-4' : ''
        } ${
          isActive
            ? 'bg-primary-500 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <Ship className="w-8 h-8 text-primary-400" />
          <div>
            <h1 className="font-bold text-lg">{t('admin.sidebar.title')}</h1>
            <p className="text-xs text-gray-400">{t('admin.sidebar.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Main Menu Items */}
        {mainMenuItems.map((item) => renderMenuItem(item))}

        {/* Divider */}
        <div className="border-t border-gray-800 my-3" />

        {/* Grouped Menu Items */}
        {menuGroups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = isGroupOpen(group.label);
          const hasActiveItem = isActiveInGroup(group.items);

          return (
            <div key={group.label} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-colors ${
                  hasActiveItem
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <GroupIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">{group.label}</span>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1 py-1">
                      {group.items.map((item) => renderMenuItem(item, true))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Language Switcher & Logout */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        {/* Language Switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center space-x-3 px-4 py-2.5 rounded-lg w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
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
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
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
          className="flex items-center space-x-3 px-4 py-2.5 rounded-lg w-full text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t('admin.sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
