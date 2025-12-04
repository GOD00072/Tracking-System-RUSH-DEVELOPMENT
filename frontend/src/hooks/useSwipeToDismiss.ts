import { useRef, useEffect, useCallback } from 'react';

interface UseSwipeToDismissOptions {
  onDismiss: () => void;
  threshold?: number; // ระยะปัดขั้นต่ำ (px)
  velocityThreshold?: number; // ความเร็วปัดขั้นต่ำ
  enabled?: boolean;
}

export const useSwipeToDismiss = ({
  onDismiss,
  threshold = 100,
  velocityThreshold = 0.5,
  enabled = true,
}: UseSwipeToDismissOptions) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startTime = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    startY.current = touch.clientY;
    startTime.current = Date.now();
    currentY.current = 0;
    isDragging.current = true;

    if (elementRef.current) {
      elementRef.current.style.transition = 'none';
    }
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isDragging.current) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startY.current;

    // เฉพาะปัดลงเท่านั้น
    if (deltaY > 0) {
      currentY.current = deltaY;
      if (elementRef.current) {
        elementRef.current.style.transform = `translateY(${deltaY}px)`;
        // ลด opacity ตามระยะปัด
        const opacity = Math.max(0.5, 1 - (deltaY / 300));
        elementRef.current.style.opacity = String(opacity);
      }
    }
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isDragging.current) return;

    isDragging.current = false;
    const deltaY = currentY.current;
    const deltaTime = Date.now() - startTime.current;
    const velocity = deltaY / deltaTime;

    if (elementRef.current) {
      elementRef.current.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';

      // ถ้าปัดเกิน threshold หรือปัดเร็วพอ ให้ปิด
      if (deltaY > threshold || velocity > velocityThreshold) {
        elementRef.current.style.transform = 'translateY(100%)';
        elementRef.current.style.opacity = '0';
        setTimeout(onDismiss, 300);
      } else {
        // กลับตำแหน่งเดิม
        elementRef.current.style.transform = 'translateY(0)';
        elementRef.current.style.opacity = '1';
      }
    }
  }, [enabled, threshold, velocityThreshold, onDismiss]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
};

export default useSwipeToDismiss;
