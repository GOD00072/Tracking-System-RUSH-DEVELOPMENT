import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Calendar, Ship, Plane, ArrowRight } from 'lucide-react';
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
  createdAt: string;
}

const NotificationPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<WebNotification | null>(null);

  // Get dismissed popup IDs from localStorage
  const getDismissedPopups = (): string[] => {
    const saved = localStorage.getItem('dismissedPopups');
    return saved ? JSON.parse(saved) : [];
  };

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['web-notifications-popup'],
    queryFn: async () => {
      const res = await api.get('/schedules/notifications');
      return res.data.data as WebNotification[];
    },
    refetchInterval: 60000, // Check every minute
  });

  // Show popup for new notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const dismissedPopups = getDismissedPopups();

    // Find the first notification that hasn't been dismissed as popup
    const newNotification = notifications.find(n => !dismissedPopups.includes(n.id));

    if (newNotification) {
      // Delay showing popup for better UX
      const timer = setTimeout(() => {
        setCurrentNotification(newNotification);
        setIsVisible(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const dismissPopup = () => {
    if (currentNotification) {
      const dismissedPopups = getDismissedPopups();
      const newDismissed = [...dismissedPopups, currentNotification.id];
      localStorage.setItem('dismissedPopups', JSON.stringify(newDismissed));
    }
    setIsVisible(false);
    setCurrentNotification(null);
  };

  const getTypeIcon = () => {
    if (currentNotification?.type === 'schedule_update') {
      if (currentNotification.title.includes('เรือ')) {
        return <Ship className="w-6 h-6" />;
      }
      return <Plane className="w-6 h-6" />;
    }
    return <Bell className="w-6 h-6" />;
  };

  const getTypeColor = () => {
    if (currentNotification?.title.includes('เรือ')) {
      return 'from-blue-500 to-blue-600';
    }
    if (currentNotification?.title.includes('เครื่องบิน')) {
      return 'from-sky-500 to-sky-600';
    }
    return 'from-primary-500 to-primary-600';
  };

  return (
    <AnimatePresence>
      {isVisible && currentNotification && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={dismissPopup}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${getTypeColor()} p-6 text-white relative`}>
                <button
                  onClick={dismissPopup}
                  className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    {getTypeIcon()}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">แจ้งเตือนใหม่</p>
                    <h3 className="text-xl font-bold">{currentNotification.title}</h3>
                  </div>
                </div>

                {currentNotification.message && (
                  <p className="text-white/90">{currentNotification.message}</p>
                )}
              </div>

              {/* Image preview if available */}
              {currentNotification.imageUrl && (
                <div className="relative">
                  <img
                    src={
                      currentNotification.imageUrl.startsWith('http://') || currentNotification.imageUrl.startsWith('https://')
                        ? currentNotification.imageUrl
                        : `${SERVER_URL}${currentNotification.imageUrl}`
                    }
                    alt=""
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}

              {/* Footer */}
              <div className="p-4 flex gap-3">
                <button
                  onClick={dismissPopup}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  ปิด
                </button>
                {currentNotification.linkUrl && (
                  <Link
                    to={currentNotification.linkUrl}
                    onClick={dismissPopup}
                    className={`flex-1 py-3 px-4 rounded-xl bg-gradient-to-r ${getTypeColor()} text-white font-medium hover:opacity-90 transition flex items-center justify-center gap-2`}
                  >
                    ดูรายละเอียด
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Timestamp */}
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(currentNotification.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopup;
