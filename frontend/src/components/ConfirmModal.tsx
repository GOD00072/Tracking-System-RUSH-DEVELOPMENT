import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Trash2,
  Info,
  HelpCircle,
  X,
  Check,
  Loader2
} from 'lucide-react';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'confirm';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  loading?: boolean;
  icon?: React.ReactNode;
}

const typeConfig: Record<ConfirmType, {
  bgColor: string;
  iconBg: string;
  iconColor: string;
  buttonBg: string;
  buttonHover: string;
  icon: React.ReactNode;
}> = {
  danger: {
    bgColor: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonBg: 'bg-red-500',
    buttonHover: 'hover:bg-red-600',
    icon: <Trash2 className="w-6 h-6" />
  },
  warning: {
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonBg: 'bg-amber-500',
    buttonHover: 'hover:bg-amber-600',
    icon: <AlertTriangle className="w-6 h-6" />
  },
  info: {
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonBg: 'bg-blue-500',
    buttonHover: 'hover:bg-blue-600',
    icon: <Info className="w-6 h-6" />
  },
  confirm: {
    bgColor: 'bg-primary-50',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    buttonBg: 'bg-primary-500',
    buttonHover: 'hover:bg-primary-600',
    icon: <HelpCircle className="w-6 h-6" />
  }
};

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const iconContainerVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: 0.1
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.15
    }
  }
};

const buttonContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.2,
      staggerChildren: 0.1
    }
  }
};

const buttonVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'confirm',
  loading = false,
  icon
}: ConfirmModalProps) => {
  const { t } = useTranslation();
  const config = typeConfig[type];

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleBackdropClick}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="flex justify-end p-3">
              <motion.button
                onClick={onClose}
                disabled={loading}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 text-center">
              {/* Icon */}
              <motion.div
                className="flex justify-center mb-4"
                variants={iconContainerVariants}
              >
                <motion.div
                  className={`w-16 h-16 rounded-full ${config.iconBg} ${config.iconColor} flex items-center justify-center`}
                  whileHover={{ scale: 1.1 }}
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(0,0,0,0)',
                      '0 0 0 10px rgba(0,0,0,0.03)',
                      '0 0 0 0 rgba(0,0,0,0)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  {icon || config.icon}
                </motion.div>
              </motion.div>

              {/* Title & Message */}
              <motion.div variants={contentVariants}>
                {title && (
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {title}
                  </h3>
                )}
                <p className="text-gray-600 leading-relaxed">
                  {message}
                </p>
              </motion.div>
            </div>

            {/* Buttons */}
            <motion.div
              className={`px-6 py-4 ${config.bgColor} flex gap-3`}
              variants={buttonContainerVariants}
            >
              <motion.button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                variants={buttonVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {cancelText || t('confirm.cancel', 'ยกเลิก')}
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-3 ${config.buttonBg} ${config.buttonHover} text-white rounded-xl font-medium transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2`}
                variants={buttonVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('confirm.processing', 'กำลังดำเนินการ...')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {confirmText || t('confirm.confirm', 'ยืนยัน')}
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
