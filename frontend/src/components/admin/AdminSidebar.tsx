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
  Search,
  Check,
  Crown,
  Cloud,
  Globe,
  ChevronDown,
  BarChart3,
  X,
  MoreHorizontal,
  Sun,
  Moon,
  Images
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

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

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ isOpen: externalIsOpen, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { t, i18n } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['customers', 'settings']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : isMobileMenuOpen;
  const handleClose = onClose || (() => setIsMobileMenuOpen(false));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    handleClose();
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsLangOpen(false);
  };

  // Main menu items for bottom nav (mobile)
  const bottomNavItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'หน้าหลัก', path: '/admin/dashboard' },
    { icon: Ship, label: 'ออเดอร์', path: '/admin/orders' },
    { icon: Package, label: 'Shipments', path: '/admin/shipments' },
    { icon: Calendar, label: 'ตาราง', path: '/admin/schedules' },
  ];

  // All menu items for sidebar
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
        { icon: Images, label: 'ผลงาน', path: '/admin/portfolio' },
      ],
    },
    {
      label: 'ตั้งค่าระบบ',
      icon: Settings,
      items: [
        { icon: Settings, label: 'ตั้งค่าทั่วไป', path: '/admin/settings' },
        { icon: Search, label: 'SEO', path: '/admin/seo' },
        { icon: Cloud, label: 'Cloudinary', path: '/admin/cloudinary' },
      ],
    },
  ];

  // More menu items (for mobile "More" tab)
  const moreMenuItems: MenuItem[] = [
    { icon: BarChart3, label: 'สถิติ & รายงาน', path: '/admin/statistics' },
    { icon: Users, label: 'ลูกค้า', path: '/admin/customers' },
    { icon: Crown, label: 'ระดับลูกค้า', path: '/admin/tier-settings' },
    { icon: Calculator, label: 'ตั้งค่าราคา', path: '/admin/pricing' },
    { icon: Star, label: 'รีวิว', path: '/admin/reviews' },
    { icon: Images, label: 'ผลงาน', path: '/admin/portfolio' },
    { icon: Settings, label: 'ตั้งค่า', path: '/admin/settings' },
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

  const renderMenuItem = (item: MenuItem, isNested = false, onClick?: () => void) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClick}
        className={`flex items-center space-x-3 px-4 py-3 md:py-2.5 rounded-xl transition-all active:scale-95 ${
          isNested ? 'ml-4' : ''
        } ${
          isActive
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  };

  // Desktop Sidebar
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img src="/pakkuneko-logo.png" alt="PakkuNeko" className="w-12 h-12 rounded-xl shadow-lg shadow-primary-500/20" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div>
            <h1 className="font-bold text-xl bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">PakkuNeko</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {/* Main Menu Items */}
        {mainMenuItems.map((item) => renderMenuItem(item, false, handleClose))}

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
                className={`flex items-center justify-between w-full px-4 py-3 md:py-2.5 rounded-xl transition-colors ${
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
                      {group.items.map((item) => renderMenuItem(item, true, handleClose))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Theme, Language Switcher & Logout */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center space-x-3 px-4 py-3 md:py-2.5 rounded-xl w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium">โหมดสว่าง</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium">โหมดมืด</span>
              </>
            )}
          </button>
        )}

        {/* Language Switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center space-x-3 px-4 py-3 md:py-2.5 rounded-xl w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
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
                className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-50"
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
          className="flex items-center space-x-3 px-4 py-3 md:py-2.5 rounded-xl w-full text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t('admin.sidebar.logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white h-screen flex-col sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-gray-900 text-white z-50 flex flex-col shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all active:scale-90 min-w-[60px] ${
                  isActive
                    ? 'text-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-primary-400' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 w-8 h-1 bg-primary-400 rounded-full"
                  />
                )}
              </Link>
            );
          })}

          {/* More Button */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all active:scale-90 min-w-[60px] ${
                isMoreMenuOpen ? 'text-primary-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <MoreHorizontal className="w-6 h-6" />
              <span className="text-[10px] mt-1 font-medium">เพิ่มเติม</span>
            </button>

            {/* More Menu Popup */}
            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    {moreMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMoreMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all active:scale-95 ${
                            isActive
                              ? 'bg-primary-500 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                      );
                    })}

                    <div className="border-t border-gray-700 my-1" />

                    {/* Theme Toggle */}
                    {mounted && (
                      <button
                        onClick={() => {
                          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                        }}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-xl w-full text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                        {resolvedTheme === 'dark' ? (
                          <>
                            <Sun className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm font-medium">โหมดสว่าง</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-5 h-5 text-blue-400" />
                            <span className="text-sm font-medium">โหมดมืด</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Language Switcher */}
                    <div className="px-1">
                      <div className="flex items-center space-x-1 bg-gray-700/50 rounded-xl p-1">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              lang.code === currentLanguage.code
                                ? 'bg-primary-500 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <span>{lang.flag}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-700 my-1" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-xl w-full text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-medium">ออกจากระบบ</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

    </>
  );
};

export default AdminSidebar;
