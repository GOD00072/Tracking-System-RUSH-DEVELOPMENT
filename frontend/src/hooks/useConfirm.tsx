import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import ConfirmModal from '../components/ConfirmModal';

type ConfirmType = 'danger' | 'warning' | 'info' | 'confirm';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  icon?: ReactNode;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDelete: (itemName?: string) => Promise<boolean>;
  confirmAction: (message: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    message: ''
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const confirmDelete = useCallback((itemName?: string): Promise<boolean> => {
    return confirm({
      title: 'ยืนยันการลบ',
      message: itemName
        ? `คุณต้องการลบ "${itemName}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
        : 'คุณต้องการลบรายการนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      type: 'danger'
    });
  }, [confirm]);

  const confirmAction = useCallback((message: string): Promise<boolean> => {
    return confirm({
      title: 'ยืนยันการดำเนินการ',
      message,
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      type: 'confirm'
    });
  }, [confirm]);

  const handleClose = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setLoading(false);
    setResolvePromise(null);
  }, [resolvePromise]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setLoading(false);
    setResolvePromise(null);
  }, [resolvePromise]);

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete, confirmAction }}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
        loading={loading}
        icon={options.icon}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export default useConfirm;
