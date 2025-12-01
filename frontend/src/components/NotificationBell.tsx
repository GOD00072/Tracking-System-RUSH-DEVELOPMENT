import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { SERVER_URL } from '../lib/api';

interface WebNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissedNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const bellRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['web-notifications'],
    queryFn: async () => {
      const res = await api.get('/schedules/notifications');
      return res.data.data as WebNotification[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Filter out dismissed notifications
  const activeNotifications = notifications?.filter(
    (n) => !dismissedIds.includes(n.id)
  ) || [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save dismissed IDs to localStorage
  const dismissNotification = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed));
  };

  const dismissAll = () => {
    const allIds = activeNotifications.map((n) => n.id);
    const newDismissed = [...dismissedIds, ...allIds];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed));
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'วันนี้';
    } else if (diffDays === 1) {
      return 'เมื่อวาน';
    } else if (diffDays < 7) {
      return `${diffDays} วันที่แล้ว`;
    } else {
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const hasNotifications = activeNotifications.length > 0;

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {hasNotifications && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {activeNotifications.length > 9 ? '9+' : activeNotifications.length}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Bell className="w-4 h-4" />
                แจ้งเตือน
              </h3>
              {hasNotifications && (
                <button
                  onClick={dismissAll}
                  className="text-white/80 hover:text-white text-xs"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {activeNotifications.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>ไม่มีการแจ้งเตือนใหม่</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="relative group"
                    >
                      {notification.linkUrl ? (
                        <Link
                          to={notification.linkUrl}
                          onClick={() => setIsOpen(false)}
                          className="block p-4 hover:bg-gray-50 transition-colors"
                        >
                          <NotificationContent notification={notification} formatDate={formatDate} />
                        </Link>
                      ) : (
                        <div className="p-4">
                          <NotificationContent notification={notification} formatDate={formatDate} />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {hasNotifications && (
              <div className="border-t border-gray-100 p-3">
                <Link
                  to="/schedule"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  ดูตารางรอบทั้งหมด
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Separate component for notification content
const NotificationContent = ({
  notification,
  formatDate,
}: {
  notification: WebNotification;
  formatDate: (date: string) => string;
}) => (
  <div className="flex gap-3">
    {notification.imageUrl && (
      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={`${SERVER_URL}${notification.imageUrl}`}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
        {notification.linkUrl && (
          <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
        )}
      </div>
      {notification.message && (
        <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{notification.message}</p>
      )}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(notification.createdAt)}
        </span>
        {notification.type === 'schedule_update' && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            ตารางรอบใหม่
          </span>
        )}
      </div>
    </div>
  </div>
);

export default NotificationBell;
