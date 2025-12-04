import { ReactNode, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';

interface SwipeableBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showHandle?: boolean;
  maxHeight?: string;
}

const SwipeableBottomSheet = ({
  isOpen,
  onClose,
  children,
  title,
  showHandle = true,
  maxHeight = '90vh'
}: SwipeableBottomSheetProps) => {
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  const handleDragEnd = (_: any, info: PanInfo) => {
    // ถ้าปัดลงเกิน 100px หรือความเร็วมากกว่า 500 ให้ปิด
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[200] md:hidden"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-[201] md:hidden"
            style={{ maxHeight, touchAction: 'none' }}
          >
            <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight }}>
              {/* Drag Handle */}
              {showHandle && (
                <div
                  className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>
              )}

              {/* Title */}
              {title && (
                <div className="px-4 pb-3 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">{title}</h3>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SwipeableBottomSheet;
