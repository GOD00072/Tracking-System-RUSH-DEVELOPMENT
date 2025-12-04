import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Package, Save, Trash2, Plus, Edit, ExternalLink, ImageIcon, X, ChevronLeft, ChevronRight, Download, CheckSquare, Square, FileText, CreditCard, Search, User, Phone, Lock, Unlock, CheckCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import shipAnimation from '../../assets/Animation - ship.json';
import { useAdminOrders, useAdminUpdateOrder, useAdminDeleteOrder } from '../../hooks/useAdminOrders';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrderItems, useCreateOrderItem, useUpdateOrderItem, useDeleteOrderItem, useLockPrice, useUnlockPrice, useBulkLockPrice } from '../../hooks/useOrderItems';
import LoadingSpinner from '../../components/LoadingSpinner';
import { buttonTap } from '../../lib/animations';
import api from '../../lib/api';
import { BACKEND_URL } from '../../utils/apiConfig';
import PaymentTab from '../../components/Admin/PaymentTab';
import { useConfirm } from '../../hooks/useConfirm';

// 9-step status timeline (constant) with descriptions
const STATUS_STEPS = [
  { step: 1, name: 'รับออเดอร์', short: '1', description: 'รอยืนยันรายละเอียดและราคา' },
  { step: 2, name: 'ชำระเงินงวดแรก', short: '2', description: 'ลูกค้าชำระมัดจำเรียบร้อย' },
  { step: 3, name: 'สั่งซื้อจากญี่ปุ่น', short: '3', description: 'กดสั่งซื้อจากร้านค้าแล้ว' },
  { step: 4, name: 'ของถึงโกดังญี่ปุ่น', short: '4', description: 'ตรวจสอบและรวมพัสดุ' },
  { step: 5, name: 'จัดรอบส่งกลับ', short: '5', description: 'กำหนดรอบเรือ/เครื่องบิน' },
  { step: 6, name: 'ส่งออกจากญี่ปุ่น', short: '6', description: 'สินค้ากำลังเดินทางมาไทย' },
  { step: 7, name: 'ของถึงไทย', short: '7', description: 'ผ่านพิธีการศุลกากร' },
  { step: 8, name: 'กำลังจัดส่ง', short: '8', description: 'จัดส่งผ่านขนส่งเอกชน' },
  { step: 9, name: 'ส่งมอบสำเร็จ', short: '9', description: 'ลูกค้ารับสินค้าแล้ว' },
];

// Country options for Origin/Destination
const COUNTRIES = [
  { code: 'JP', name: 'Japan', nameLocal: '🇯🇵 ญี่ปุ่น' },
  { code: 'TH', name: 'Thailand', nameLocal: '🇹🇭 ไทย' },
  { code: 'CN', name: 'China', nameLocal: '🇨🇳 จีน' },
  { code: 'KR', name: 'South Korea', nameLocal: '🇰🇷 เกาหลีใต้' },
  { code: 'TW', name: 'Taiwan', nameLocal: '🇹🇼 ไต้หวัน' },
  { code: 'HK', name: 'Hong Kong', nameLocal: '🇭🇰 ฮ่องกง' },
  { code: 'SG', name: 'Singapore', nameLocal: '🇸🇬 สิงคโปร์' },
  { code: 'MY', name: 'Malaysia', nameLocal: '🇲🇾 มาเลเซีย' },
  { code: 'VN', name: 'Vietnam', nameLocal: '🇻🇳 เวียดนาม' },
  { code: 'ID', name: 'Indonesia', nameLocal: '🇮🇩 อินโดนีเซีย' },
  { code: 'PH', name: 'Philippines', nameLocal: '🇵🇭 ฟิลิปปินส์' },
  { code: 'US', name: 'United States', nameLocal: '🇺🇸 สหรัฐอเมริกา' },
  { code: 'UK', name: 'United Kingdom', nameLocal: '🇬🇧 สหราชอาณาจักร' },
  { code: 'DE', name: 'Germany', nameLocal: '🇩🇪 เยอรมนี' },
  { code: 'FR', name: 'France', nameLocal: '🇫🇷 ฝรั่งเศส' },
  { code: 'AU', name: 'Australia', nameLocal: '🇦🇺 ออสเตรเลีย' },
];

// Image Viewer Modal Component
const ImageViewerModal = ({
  images,
  initialIndex = 0,
  onClose
}: {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Main Image */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Product image ${currentIndex + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                idx === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: ordersData } = useAdminOrders(1, 1000);
  const { data: customersData } = useCustomers(1, 1000);
  const { data: itemsData, isLoading: itemsLoading } = useOrderItems(id);
  const updateOrder = useAdminUpdateOrder();
  const deleteOrder = useAdminDeleteOrder();
  const createItem = useCreateOrderItem();
  const updateItem = useUpdateOrderItem();
  const deleteItem = useDeleteOrderItem();
  const lockPrice = useLockPrice();
  const unlockPrice = useUnlockPrice();
  const bulkLockPrice = useBulkLockPrice();
  const { confirm } = useConfirm();

  const order = ordersData?.data.find((o) => o.id === id);
  const items = itemsData?.data || [];

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingImages, setViewingImages] = useState<{ images: string[]; index: number } | null>(null);

  // Customer search modal state
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!customersData?.data) return [];
    if (!customerSearchQuery.trim()) return customersData.data;

    const query = customerSearchQuery.toLowerCase();
    return customersData.data.filter((customer) => {
      const companyName = (customer.companyName || '').toLowerCase();
      const contactPerson = (customer.contactPerson || '').toLowerCase();
      const phone = (customer.phone || '').toLowerCase();
      const lineId = (customer.lineId || '').toLowerCase();

      return (
        companyName.includes(query) ||
        contactPerson.includes(query) ||
        phone.includes(query) ||
        lineId.includes(query)
      );
    });
  }, [customersData?.data, customerSearchQuery]);

  // Get selected customer name
  const getSelectedCustomerName = () => {
    if (!orderForm.customerId || !customersData?.data) return null;
    const customer = customersData.data.find((c) => c.id === orderForm.customerId);
    if (!customer) return null;
    return customer.companyName || customer.contactPerson || customer.phone || 'ไม่มีชื่อ';
  };

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkStatusStep, setBulkStatusStep] = useState('1');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Tab state for switching between items and payments
  const [activeTab, setActiveTab] = useState<'items' | 'payments'>('items');

  // Pending status changes (itemId -> { statusStep, itemStatus, extraData })
  const [pendingStatusChanges, setPendingStatusChanges] = useState<Map<string, { statusStep: number; itemStatus: string; extraData?: any }>>(new Map());

  // Status Modal state
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    itemId: string;
    itemName: string;
    currentStep: number;
    newStep: number;
    extraData: {
      jpOrderNumber: string;
      shippingRound: string;
      shipmentBatch: string;
      trackingNumber: string;
      courierName: string;
    };
  }>({
    isOpen: false,
    itemId: '',
    itemName: '',
    currentStep: 1,
    newStep: 1,
    extraData: {
      jpOrderNumber: '',
      shippingRound: '',
      shipmentBatch: '',
      trackingNumber: '',
      courierName: '',
    },
  });

  // Pending new items (items to be created when saving)
  const [pendingNewItems, setPendingNewItems] = useState<any[]>([]);

  // Pending item edits (itemId -> edited data)
  const [pendingItemEdits, setPendingItemEdits] = useState<Map<string, any>>(new Map());

  // Pending item deletes (set of item IDs to delete)
  const [pendingItemDeletes, setPendingItemDeletes] = useState<Set<string>>(new Set());

  // Pending payment operations (from PaymentTab)
  const [pendingPaymentOps, setPendingPaymentOps] = useState<any[]>([]);
  const [hasPaymentPendingChanges, setHasPaymentPendingChanges] = useState(false);
  const [paymentSaveVersion, setPaymentSaveVersion] = useState(0);

  // Saving state for animation overlay
  const [saveState, setSaveState] = useState<{
    isOpen: boolean;
    status: 'saving' | 'success' | 'error';
    message: string;
  }>({
    isOpen: false,
    status: 'saving',
    message: '',
  });

  // Payment summary state for order-level display
  const [paymentSummary, setPaymentSummary] = useState<{
    grandTotal: number;
    paidBaht: number;
    remainingBaht: number;
    percentPaid: number;
  } | null>(null);

  // Fetch payment summary on load
  useEffect(() => {
    if (id) {
      api.get(`/payments/order/${id}`)
        .then((response) => {
          if (response.data.success && response.data.data.summary) {
            setPaymentSummary({
              grandTotal: response.data.data.summary.grandTotal,
              paidBaht: response.data.data.summary.paidBaht,
              remainingBaht: response.data.data.summary.remainingBaht,
              percentPaid: response.data.data.summary.percentPaid,
            });
          }
        })
        .catch(() => {});
    }
  }, [id]);

  // Callback for PaymentTab to notify of pending changes
  const handlePaymentPendingUpdate = (hasPending: boolean, pendingOps: any[]) => {
    setHasPaymentPendingChanges(hasPending);
    setPendingPaymentOps(pendingOps);
  };

  // Callback for PaymentTab to update payment summary
  const handlePaymentSummaryUpdate = (summary: { grandTotal: number; paidBaht: number; remainingBaht: number; percentPaid: number }) => {
    setPaymentSummary(summary);
  };

  // Calculate order payment status
  const getOrderPaymentStatus = () => {
    if (!paymentSummary) return { status: 'pending', label: 'รอชำระ', color: 'bg-red-100 text-red-800' };
    const { grandTotal, paidBaht } = paymentSummary;
    if (paidBaht >= grandTotal && grandTotal > 0) {
      return { status: 'paid', label: 'ชำระครบ', color: 'bg-green-100 text-green-800' };
    } else if (paidBaht > 0) {
      return { status: 'partial', label: 'ชำระบางส่วน', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'pending', label: 'รอชำระ', color: 'bg-red-100 text-red-800' };
  };

  // Handle payment status change with confirmation
  const handlePaymentStatusChange = async (newStatus: string) => {
    const currentPayment = getOrderPaymentStatus();

    // If changing to "paid" but payment is not actually complete
    if (newStatus === 'paid' && currentPayment.status !== 'paid') {
      const confirmed = await confirm({
        title: 'ยืนยันการเปลี่ยนสถานะ',
        message: 'ชำระเงินยังไม่ครบ ต้องการปรับสถานะเป็น "ชำระครบ" จริงๆ ใช่ไหม?',
        confirmText: 'ยืนยัน',
        cancelText: 'ยกเลิก',
        type: 'warning'
      });
      if (confirmed) {
        setOrderForm({ ...orderForm, paymentStatus: newStatus });
      }
    } else {
      setOrderForm({ ...orderForm, paymentStatus: newStatus });
    }
  };

  // Check if there are any pending changes (including payments)
  const hasPendingChanges = pendingStatusChanges.size > 0 || pendingNewItems.length > 0 || pendingItemEdits.size > 0 || pendingItemDeletes.size > 0 || hasPaymentPendingChanges;

  // Fee item type state
  const [itemFormType, setItemFormType] = useState<'product' | 'fee'>('product');

  // Common fee types
  const FEE_TYPES = [
    { value: 'shipping_japan', label: 'ค่าขนส่งญี่ปุ่น-ไทย' },
    { value: 'shipping_thai', label: 'ค่าจัดส่งในไทย' },
    { value: 'service_fee', label: 'ค่าบริการ' },
    { value: 'customs', label: 'ค่าภาษีนำเข้า' },
    { value: 'insurance', label: 'ค่าประกันสินค้า' },
    { value: 'packing', label: 'ค่าแพ็คพิเศษ' },
    { value: 'other', label: 'ค่าใช้จ่ายอื่นๆ' },
  ];

  // Helper function to get product images array
  const getProductImages = (item: any): string[] => {
    if (!item.productImages) return [];
    if (Array.isArray(item.productImages)) return item.productImages;
    if (typeof item.productImages === 'string') {
      try {
        const parsed = JSON.parse(item.productImages);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Order form state
  const [orderForm, setOrderForm] = useState({
    orderNumber: '',
    customerId: '',
    shippingMethod: 'sea',
    status: 'pending',
    statusStep: 1,
    paymentStatus: '',
    origin: '',
    destination: '',
    totalWeight: '',
    totalVolume: '',
    estimatedCost: '',
    actualCost: '',
    estimatedDelivery: '',
    notes: '',
  });

  // Item form state
  const [itemForm, setItemForm] = useState({
    sequenceNumber: '',
    clickDate: '',
    clickChannel: '',
    clickerName: '',
    productCode: '', // รหัสสินค้า (manual, e.g. SKU from JP store)
    itemCode: '', // ไอเทมโค้ด
    trackingCode: '', // รหัสติดตาม (auto-generated: PKN-ORD001-01)
    productName: '',
    productUrl: '',
    priceYen: '',
    priceBaht: '',
    weight: '',
    shippingCost: '',
    itemStatus: 'รับออเดอร์',
    statusStep: '1',
    shippingRound: '',
    trackingNumber: '',
    storePage: '',
    remarks: '',
    productImages: [] as string[],
    // Dynamic status fields - รายละเอียดแต่ละสถานะ
    jpOrderNumber: '', // เลขที่ออเดอร์ญี่ปุ่น (step 3)
    jpOrderDate: '', // วันที่สั่งซื้อ JP (step 3)
    warehouseDate: '', // วันที่ถึงโกดัง JP (step 4)
    shipmentBatch: '', // เลขตู้/เที่ยวบิน (step 5-6)
    exportDate: '', // วันที่ส่งออกจาก JP (step 6)
    arrivalDate: '', // วันที่ถึงไทย (step 7)
    courierName: '', // ชื่อขนส่งในไทย (step 8)
    deliveryDate: '', // วันที่ส่งมอบ (step 9)
    statusRemarks: {} as Record<string, string>, // หมายเหตุแต่ละสถานะ
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  // Load order data into form
  useEffect(() => {
    if (order) {
      setOrderForm({
        orderNumber: order.orderNumber,
        customerId: order.customerId || '',
        shippingMethod: order.shippingMethod,
        status: order.status,
        statusStep: (order as any).statusStep || 1,
        paymentStatus: (order as any).paymentStatus || '',
        origin: order.origin || '',
        destination: order.destination || '',
        totalWeight: order.totalWeight?.toString() || '',
        totalVolume: order.totalVolume?.toString() || '',
        estimatedCost: order.estimatedCost?.toString() || '',
        actualCost: order.actualCost?.toString() || '',
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
        notes: order.notes || '',
      });
    }
  }, [order]);

  const handleUpdateOrder = async () => {
    if (!id) return;

    // Show saving animation
    setSaveState({
      isOpen: true,
      status: 'saving',
      message: 'กำลังบันทึกข้อมูล...',
    });

    const orderData = {
      orderNumber: orderForm.orderNumber,
      customerId: orderForm.customerId || undefined,
      shippingMethod: orderForm.shippingMethod,
      status: orderForm.status,
      statusStep: orderForm.statusStep,
      paymentStatus: orderForm.paymentStatus || undefined,
      origin: orderForm.origin || undefined,
      destination: orderForm.destination || undefined,
      totalWeight: orderForm.totalWeight ? parseFloat(orderForm.totalWeight) : undefined,
      totalVolume: orderForm.totalVolume ? parseFloat(orderForm.totalVolume) : undefined,
      estimatedCost: orderForm.estimatedCost ? parseFloat(orderForm.estimatedCost) : undefined,
      actualCost: orderForm.actualCost ? parseFloat(orderForm.actualCost) : undefined,
      estimatedDelivery: orderForm.estimatedDelivery || undefined,
      notes: orderForm.notes || undefined,
    };

    try {
      // Save order data
      await updateOrder.mutateAsync({ id, data: orderData });

      // 1. Save pending new items
      if (pendingNewItems.length > 0) {
        setSaveState(prev => ({ ...prev, message: 'กำลังบันทึกรายการสินค้าใหม่...' }));
        for (const newItem of pendingNewItems) {
          const { _tempId, ...itemData } = newItem;
          await createItem.mutateAsync(itemData);
        }
        setPendingNewItems([]);
      }

      // 2. Save pending item edits
      if (pendingItemEdits.size > 0) {
        setSaveState(prev => ({ ...prev, message: 'กำลังบันทึกการแก้ไขสินค้า...' }));
        const editPromises = Array.from(pendingItemEdits.entries()).map(([itemId, data]) =>
          updateItem.mutateAsync({ id: itemId, data })
        );
        await Promise.all(editPromises);
        setPendingItemEdits(new Map());
      }

      // 3. Save pending status changes for items
      if (pendingStatusChanges.size > 0) {
        setSaveState(prev => ({ ...prev, message: 'กำลังอัพเดทสถานะ...' }));
        const statusPromises = Array.from(pendingStatusChanges.entries()).map(([itemId, changes]) =>
          updateItem.mutateAsync({
            id: itemId,
            data: {
              statusStep: changes.statusStep,
              itemStatus: changes.itemStatus
            }
          })
        );
        await Promise.all(statusPromises);
        setPendingStatusChanges(new Map());
      }

      // 4. Delete pending item deletes
      if (pendingItemDeletes.size > 0) {
        setSaveState(prev => ({ ...prev, message: 'กำลังลบรายการสินค้า...' }));
        const deletePromises = Array.from(pendingItemDeletes).map(itemId =>
          deleteItem.mutateAsync(itemId)
        );
        await Promise.all(deletePromises);
        setPendingItemDeletes(new Set());
      }

      // 5. Save pending payment operations
      if (pendingPaymentOps.length > 0) {
        setSaveState(prev => ({ ...prev, message: 'กำลังบันทึกการชำระเงิน...' }));
        for (const op of pendingPaymentOps) {
          if (op.type === 'create') {
            await api.post('/payments', op.data);
          } else if (op.type === 'update') {
            await api.patch(`/payments/${op.paymentId}`, op.data);
          } else if (op.type === 'delete') {
            await api.delete(`/payments/${op.paymentId}`);
          }
        }
        // Trigger PaymentTab to clear pending state and refetch
        setPaymentSaveVersion(v => v + 1);
      }

      // Show success
      setSaveState({
        isOpen: true,
        status: 'success',
        message: 'บันทึกสำเร็จ!',
      });

      // Auto close after 1.5 seconds
      setTimeout(() => {
        setSaveState(prev => ({ ...prev, isOpen: false }));
      }, 1500);

    } catch (error) {
      console.error('Error saving pending changes:', error);
      setSaveState({
        isOpen: true,
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการบันทึก',
      });

      // Auto close error after 3 seconds
      setTimeout(() => {
        setSaveState(prev => ({ ...prev, isOpen: false }));
      }, 3000);
    }
  };

  const handleDeleteOrder = async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'ลบคำสั่งซื้อ',
      message: 'คุณต้องการลบ Order นี้? รายการสินค้าทั้งหมดจะถูกลบด้วย',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      type: 'danger'
    });
    if (confirmed) {
      deleteOrder.mutate(id, {
        onSuccess: () => {
          navigate('/admin/orders');
        },
      });
    }
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Get customer name and company name from order
    const customerName = order?.customer?.companyName || order?.customer?.contactPerson || '';
    const companyName = order?.customer?.companyName || '';

    const itemData = {
      orderId: id,
      sequenceNumber: itemForm.sequenceNumber ? parseInt(itemForm.sequenceNumber) : undefined,
      clickDate: itemForm.clickDate || undefined,
      clickChannel: itemForm.clickChannel || undefined,
      clickerName: itemForm.clickerName || undefined,
      customerName: customerName, // Locked to order's customer
      productCode: itemForm.productCode || undefined,
      itemCode: itemForm.itemCode || undefined,
      productName: itemForm.productName || undefined,
      productUrl: itemForm.productUrl || undefined,
      priceYen: itemForm.priceYen ? Math.round(parseFloat(itemForm.priceYen)) : undefined,
      priceBaht: itemForm.priceBaht ? parseFloat(itemForm.priceBaht) : undefined,
      weight: itemForm.weight ? parseFloat(itemForm.weight) : undefined,
      shippingCost: itemForm.shippingCost ? parseFloat(itemForm.shippingCost) : undefined,
      itemStatus: itemForm.itemStatus || undefined,
      statusStep: itemForm.statusStep ? parseInt(itemForm.statusStep) : undefined,
      shippingRound: itemForm.shippingRound || undefined,
      trackingNumber: itemForm.trackingNumber || undefined,
      storePage: companyName, // Locked to order's company name
      remarks: itemForm.remarks || undefined,
      productImages: itemForm.productImages, // Always send array (even empty) to allow removal
      // Status detail fields
      jpOrderNumber: itemForm.jpOrderNumber || undefined,
      jpOrderDate: itemForm.jpOrderDate || undefined,
      warehouseDate: itemForm.warehouseDate || undefined,
      shipmentBatch: itemForm.shipmentBatch || undefined,
      exportDate: itemForm.exportDate || undefined,
      arrivalDate: itemForm.arrivalDate || undefined,
      courierName: itemForm.courierName || undefined,
      deliveryDate: itemForm.deliveryDate || undefined,
      statusRemarks: Object.keys(itemForm.statusRemarks).length > 0 ? itemForm.statusRemarks : undefined,
    };

    if (editingItem) {
      // Store in pending edits instead of immediate API call
      setPendingItemEdits(prev => {
        const newMap = new Map(prev);
        newMap.set(editingItem.id, itemData);
        return newMap;
      });
      setShowItemForm(false);
      setEditingItem(null);
      resetItemForm();
    } else {
      // Store in pending new items instead of immediate API call
      const tempId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setPendingNewItems(prev => [...prev, { ...itemData, _tempId: tempId }]);
      setShowItemForm(false);
      resetItemForm();
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    const images = getProductImages(item);
    // Get status name from statusStep
    const statusName = STATUS_STEPS.find(s => s.step === item.statusStep)?.name || item.itemStatus || 'รับออเดอร์';
    setItemForm({
      sequenceNumber: item.sequenceNumber?.toString() || '',
      clickDate: item.clickDate ? new Date(item.clickDate).toISOString().split('T')[0] : '',
      clickChannel: item.clickChannel || '',
      clickerName: item.clickerName || '',
      productCode: item.productCode || '',
      itemCode: item.itemCode || '',
      trackingCode: item.trackingCode || '',
      productName: item.productName || '',
      productUrl: item.productUrl || '',
      priceYen: item.priceYen?.toString() || '',
      priceBaht: item.priceBaht?.toString() || '',
      weight: item.weight?.toString() || '',
      shippingCost: item.shippingCost?.toString() || '',
      itemStatus: statusName,
      statusStep: item.statusStep?.toString() || '1',
      shippingRound: item.shippingRound || '',
      trackingNumber: item.trackingNumber || '',
      storePage: item.storePage || '',
      remarks: item.remarks || '',
      productImages: images,
      // Status detail fields
      jpOrderNumber: item.jpOrderNumber || '',
      jpOrderDate: item.jpOrderDate ? new Date(item.jpOrderDate).toISOString().split('T')[0] : '',
      warehouseDate: item.warehouseDate ? new Date(item.warehouseDate).toISOString().split('T')[0] : '',
      shipmentBatch: item.shipmentBatch || '',
      exportDate: item.exportDate ? new Date(item.exportDate).toISOString().split('T')[0] : '',
      arrivalDate: item.arrivalDate ? new Date(item.arrivalDate).toISOString().split('T')[0] : '',
      courierName: item.courierName || '',
      deliveryDate: item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : '',
      statusRemarks: item.statusRemarks || {},
    });
    setShowItemForm(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    const confirmed = await confirm({
      title: 'ลบรายการสินค้า',
      message: 'คุณต้องการลบรายการสินค้านี้?',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      type: 'danger'
    });
    if (confirmed) {
      // Store in pending deletes instead of immediate API call
      setPendingItemDeletes(prev => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });
      // Also remove from pending edits and status changes if any
      setPendingItemEdits(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
      setPendingStatusChanges(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    }
  };

  // Cancel pending delete (restore item)
  const handleCancelPendingDelete = (itemId: string) => {
    setPendingItemDeletes(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  // Remove pending new item (not saved yet)
  const handleRemovePendingItem = (tempId: string) => {
    setPendingNewItems(prev => prev.filter(item => item._tempId !== tempId));
  };

  // Cancel pending edit (revert to original)
  const handleCancelPendingEdit = (itemId: string) => {
    setPendingItemEdits(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
  };

  // Cancel pending status change
  const handleCancelPendingStatus = (itemId: string) => {
    setPendingStatusChanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
  };

  const resetItemForm = () => {
    setItemForm({
      sequenceNumber: '',
      clickDate: '',
      clickChannel: '',
      clickerName: '',
      productCode: '',
      itemCode: '',
      trackingCode: '',
      productName: '',
      productUrl: '',
      priceYen: '',
      priceBaht: '',
      weight: '',
      shippingCost: '',
      itemStatus: 'รับออเดอร์',
      statusStep: '1',
      shippingRound: '',
      trackingNumber: '',
      storePage: '',
      remarks: '',
      productImages: [],
      // Status detail fields
      jpOrderNumber: '',
      jpOrderDate: '',
      warehouseDate: '',
      shipmentBatch: '',
      exportDate: '',
      arrivalDate: '',
      courierName: '',
      deliveryDate: '',
      statusRemarks: {},
    });
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // Select/Deselect all items
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item: any) => item.id)));
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async () => {
    if (selectedItems.size === 0) return;

    setBulkUpdating(true);
    try {
      const response = await api.post('/order-items/bulk-status', {
        itemIds: Array.from(selectedItems),
        statusStep: parseInt(bulkStatusStep),
        sendNotification: true,
      });

      if (response.data.success) {
        alert(`อัปเดตสถานะ ${response.data.data.updatedCount} รายการสำเร็จ\nส่ง LINE แจ้งเตือน ${response.data.data.notificationsSent} ราย`);
        setSelectedItems(new Set());
        // Refetch items
        window.location.reload();
      }
    } catch (error) {
      console.error('Bulk status update error:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Lock price for single item
  const handleLockPrice = async (itemId: string, priceYen?: number) => {
    try {
      await lockPrice.mutateAsync({ id: itemId, priceYen });
    } catch (error) {
      console.error('Lock price error:', error);
    }
  };

  // Unlock price for single item
  const handleUnlockPrice = async (itemId: string) => {
    const confirmed = await confirm({
      title: 'ปลดล็อคราคา',
      message: 'คุณต้องการปลดล็อคราคาบาท? ราคาจะสามารถแก้ไขได้อีกครั้ง',
      confirmText: 'ปลดล็อค',
      cancelText: 'ยกเลิก',
      variant: 'warning',
    });
    if (!confirmed) return;

    try {
      await unlockPrice.mutateAsync(itemId);
    } catch (error) {
      console.error('Unlock price error:', error);
    }
  };

  // Bulk lock price for selected items
  const handleBulkLockPrice = async () => {
    if (selectedItems.size === 0) return;

    try {
      await bulkLockPrice.mutateAsync(Array.from(selectedItems));
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Bulk lock price error:', error);
    }
  };

  // Handle status change in dropdown - open modal for status-specific data
  const handleStatusDropdownChange = (itemId: string, newStep: number) => {
    // Find the item to get its current data
    const item = items?.find((i: any) => i.id === itemId);
    if (!item) return;

    const currentStep = item.statusStep || 1;

    // Open modal with item info and pre-fill existing data
    setStatusModal({
      isOpen: true,
      itemId,
      itemName: item.productName || item.description || 'สินค้า',
      currentStep,
      newStep,
      extraData: {
        jpOrderNumber: item.jpOrderNumber || '',
        shippingRound: item.shippingRound || '',
        shipmentBatch: item.shipmentBatch || '',
        trackingNumber: item.trackingNumber || '',
        courierName: item.courierName || '',
      },
    });
  };

  // Confirm status change from modal
  const handleConfirmStatusChange = () => {
    const { itemId, newStep, extraData } = statusModal;
    const statusName = STATUS_STEPS.find(s => s.step === newStep)?.name || '';

    setPendingStatusChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(itemId, {
        statusStep: newStep,
        itemStatus: statusName,
        extraData: { ...extraData }
      });
      return newMap;
    });

    // Close modal
    setStatusModal(prev => ({ ...prev, isOpen: false }));
  };

  // Cancel status change modal
  const handleCancelStatusModal = () => {
    setStatusModal(prev => ({ ...prev, isOpen: false }));
  };

  // Get display status for an item (pending or actual)
  const getDisplayStatusStep = (item: any): number => {
    const pending = pendingStatusChanges.get(item.id);
    return pending ? pending.statusStep : (item.statusStep || 1);
  };

  // Export to CSV
  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    setExporting(true);
    try {
      const response = await api.get(`/order-items/export`, {
        params: { orderId: id, format },
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      if (format === 'csv') {
        // Download CSV file
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-${order?.orderNumber || id}-items.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Download JSON file
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-${order?.orderNumber || id}-items.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('เกิดข้อผิดพลาดในการ Export');
    } finally {
      setExporting(false);
    }
  };

  // Generate Invoice PDF
  const handleGenerateInvoice = async () => {
    if (!id) return;

    setGeneratingInvoice(true);
    try {
      const response = await api.get(`/invoice/order/${id}`, {
        responseType: 'blob',
      });

      // Download PDF file
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order?.orderNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Invoice generation error:', error);
      alert('เกิดข้อผิดพลาดในการสร้างใบแจ้งหนี้');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success && response.data.data.url) {
          // Use full URL from API base or relative path
          const imageUrl = response.data.data.url.startsWith('http')
            ? response.data.data.url
            : `${BACKEND_URL}${response.data.data.url}`;
          newImages.push(imageUrl);
        }
      }

      setItemForm((prev) => ({
        ...prev,
        productImages: [...prev.productImages, ...newImages],
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Remove image from form
  const handleRemoveImage = (index: number) => {
    setItemForm((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
    }));
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'รอดำเนินการ',
      processing: 'กำลังดำเนินการ',
      shipped: 'กำลังจัดส่ง',
      delivered: 'ส่งถึงแล้ว',
      cancelled: 'ยกเลิก',
    };
    return texts[status] || status;
  };

  const getStatusStepIndicator = (currentStep: number = 1) => {
    return (
      <div className="flex items-center gap-0.5">
        {STATUS_STEPS.map((s, idx) => (
          <div
            key={s.step}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              currentStep >= s.step
                ? currentStep === s.step
                  ? 'bg-primary-600 text-white ring-2 ring-primary-300'
                  : 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
            title={s.name}
          >
            {currentStep > s.step ? '✓' : s.short}
          </div>
        ))}
      </div>
    );
  };

  const getStatusStepName = (step: number = 1) => {
    const found = STATUS_STEPS.find(s => s.step === step);
    return found?.name || `สถานะ ${step}`;
  };

  const getItemStatusBadge = (status?: string, statusStep?: number) => {
    // If we have statusStep, show the step indicator
    if (statusStep && statusStep > 0) {
      return (
        <div className="flex flex-col gap-1">
          {getStatusStepIndicator(statusStep)}
          <span className="text-xs text-gray-600">{getStatusStepName(statusStep)}</span>
        </div>
      );
    }

    // Fallback to text status
    const statusColors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      ordered: 'bg-blue-100 text-blue-800',
      received: 'bg-purple-100 text-purple-800',
      packing: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const statusText: Record<string, string> = {
      pending: 'รอดำเนินการ',
      ordered: 'สั่งซื้อแล้ว',
      received: 'รับสินค้าแล้ว',
      packing: 'กำลังแพ็ค',
      shipped: 'กำลังจัดส่ง',
      delivered: 'ส่งถึงแล้ว',
      cancelled: 'ยกเลิก',
    };

    // Try to match Thai status text
    const thaiStatusMap: Record<string, number> = {
      'รับออเดอร์': 1,
      'ชำระเงินงวดแรก': 2,
      'สั่งซื้อจากญี่ปุ่น': 3,
      'ของถึงโกดังญี่ปุ่น': 4,
      'ส่งออกจากญี่ปุ่น': 5,
      'ของถึงไทย': 6,
      'กำลังจัดส่ง': 7,
      'ส่งมอบสำเร็จ': 8,
    };

    if (status && thaiStatusMap[status]) {
      return (
        <div className="flex flex-col gap-1">
          {getStatusStepIndicator(thaiStatusMap[status])}
          <span className="text-xs text-gray-600">{status}</span>
        </div>
      );
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status || 'pending']}`}>
        {status || statusText['pending']}
      </span>
    );
  };

  if (!order) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  const customerName = order.customer?.companyName || order.customer?.contactPerson || 'ไม่ระบุ';
  const companyName = order.customer?.companyName || 'ไม่ระบุ';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            ย้อนกลับ
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">รายละเอียด Order</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-600">Order Number: {order.orderNumber}</p>
                {/* Payment Status Badge */}
                {(() => {
                  const paymentStatus = getOrderPaymentStatus();
                  return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${paymentStatus.color}`}>
                      <CreditCard className="w-4 h-4" />
                      {paymentStatus.label}
                      {paymentSummary && paymentSummary.grandTotal > 0 && (
                        <span className="ml-1 text-xs">
                          ({paymentSummary.percentPaid}%)
                        </span>
                      )}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <motion.button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50"
                whileTap={buttonTap}
                title="สร้างใบแจ้งหนี้ PDF"
              >
                {generatingInvoice ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    ใบแจ้งหนี้
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleUpdateOrder}
                disabled={updateOrder.isPending}
                className={`text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                  hasPendingChanges
                    ? 'bg-orange-500 hover:bg-orange-600 animate-pulse'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
                whileTap={buttonTap}
              >
                <Save className="w-5 h-5" />
                บันทึกการแก้ไข
                {hasPendingChanges && (
                  <span className="bg-white text-orange-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {pendingNewItems.length + pendingItemEdits.size + pendingStatusChanges.size + pendingItemDeletes.size + pendingPaymentOps.length}
                  </span>
                )}
              </motion.button>
              <motion.button
                onClick={handleDeleteOrder}
                disabled={deleteOrder.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                whileTap={buttonTap}
              >
                <Trash2 className="w-5 h-5" />
                ลบ Order
              </motion.button>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-600" />
            ข้อมูล Order
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
              <input
                type="text"
                value={orderForm.orderNumber}
                onChange={(e) => setOrderForm({ ...orderForm, orderNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearchQuery('');
                    setShowCustomerSearch(true);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className={orderForm.customerId ? 'text-gray-900' : 'text-gray-400'}>
                    {getSelectedCustomerName() || 'ค้นหาลูกค้า...'}
                  </span>
                </button>
                {orderForm.customerId && (
                  <button
                    type="button"
                    onClick={() => setOrderForm({ ...orderForm, customerId: '' })}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะออเดอร์</label>
              <select
                value={orderForm.statusStep}
                onChange={(e) => {
                  const step = parseInt(e.target.value);
                  const statusName = STATUS_STEPS.find(s => s.step === step)?.name || '';
                  // Update both statusStep and status based on step
                  let newStatus = 'pending';
                  if (step >= 9) newStatus = 'delivered';
                  else if (step >= 6) newStatus = 'shipped';
                  else if (step >= 2) newStatus = 'processing';
                  setOrderForm({ ...orderForm, statusStep: step, status: newStatus });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUS_STEPS.map((s) => (
                  <option key={s.step} value={s.step}>
                    {s.step}. {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะการชำระเงิน</label>
              <select
                value={orderForm.paymentStatus || getOrderPaymentStatus().status}
                onChange={(e) => handlePaymentStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="pending">รอชำระ</option>
                <option value="partial">ชำระบางส่วน</option>
                <option value="paid">ชำระครบ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการจัดส่ง</label>
              <select
                value={orderForm.shippingMethod}
                onChange={(e) => setOrderForm({ ...orderForm, shippingMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="sea">🚢 ทางเรือ</option>
                <option value="air">✈️ ทางอากาศ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ต้นทาง</label>
              <select
                value={orderForm.origin}
                onChange={(e) => setOrderForm({ ...orderForm, origin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- เลือกประเทศต้นทาง --</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.nameLocal}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ปลายทาง</label>
              <select
                value={orderForm.destination}
                onChange={(e) => setOrderForm({ ...orderForm, destination: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- เลือกประเทศปลายทาง --</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.nameLocal}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนัก (kg)</label>
              <input
                type="number"
                step="0.01"
                value={orderForm.totalWeight}
                onChange={(e) => setOrderForm({ ...orderForm, totalWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ปริมาตร (m³)</label>
              <input
                type="number"
                step="0.01"
                value={orderForm.totalVolume}
                onChange={(e) => setOrderForm({ ...orderForm, totalVolume: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ค่าใช้จ่ายโดยประมาณ</label>
              <input
                type="number"
                step="0.01"
                value={orderForm.estimatedCost}
                onChange={(e) => setOrderForm({ ...orderForm, estimatedCost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ค่าใช้จ่ายจริง</label>
              <input
                type="number"
                step="0.01"
                value={orderForm.actualCost}
                onChange={(e) => setOrderForm({ ...orderForm, actualCost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่จัดส่งโดยประมาณ</label>
              <input
                type="date"
                value={orderForm.estimatedDelivery}
                onChange={(e) => setOrderForm({ ...orderForm, estimatedDelivery: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="หมายเหตุเพิ่มเติม..."
            />
          </div>
        </div>

        {/* Order Items & Payments Section with Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab('items')}
              className={`flex-1 px-4 md:px-6 py-4 md:py-4 min-h-[56px] text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'items'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="hidden sm:inline">รายการสินค้า ({items.length})</span>
              <span className="sm:hidden">สินค้า ({items.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 px-4 md:px-6 py-4 md:py-4 min-h-[56px] text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'payments'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="hidden sm:inline">การชำระเงิน</span>
              <span className="sm:hidden">ชำระเงิน</span>
            </button>
          </div>

          <div className="p-4 md:p-6">
            {/* Items Tab Content */}
            {activeTab === 'items' && (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                      <Package className="w-6 h-6 text-primary-600" />
                      รายการสินค้า
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      ชื่อลูกค้า: <span className="font-semibold">{customerName}</span> •
                      ชื่อเพจ/ร้าน: <span className="font-semibold">{companyName}</span>
                      <span className="text-xs text-gray-500 ml-1">(ล็อคอัตโนมัติ)</span>
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Export Button */}
                    <motion.button
                      onClick={() => handleExport('csv')}
                      disabled={exporting || items.length === 0}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                      whileTap={buttonTap}
                      title="Export to CSV"
                    >
                      <Download className="w-5 h-5" />
                      Export
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setEditingItem(null);
                        resetItemForm();
                        setItemFormType('product');
                        setShowItemForm(!showItemForm);
                      }}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                      whileTap={buttonTap}
                    >
                      <Plus className="w-5 h-5" />
                      เพิ่มสินค้า
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setEditingItem(null);
                        resetItemForm();
                        setItemFormType('fee');
                        setItemForm(prev => ({
                          ...prev,
                          productCode: 'FEE',
                          productName: '',
                        }));
                        setShowItemForm(true);
                      }}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                      whileTap={buttonTap}
                    >
                      <Plus className="w-5 h-5" />
                      เพิ่มค่าจัดส่ง/อื่นๆ
                    </motion.button>
                  </div>
                </div>

          {/* Bulk Actions Toolbar - Show when items selected */}
          {selectedItems.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-blue-800 font-medium">
                  เลือก {selectedItems.size} รายการ
                </span>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  ยกเลิกการเลือก
                </button>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={bulkStatusStep}
                  onChange={(e) => setBulkStatusStep(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_STEPS.map((s) => (
                    <option key={s.step} value={s.step}>
                      {s.step}. {s.name}
                    </option>
                  ))}
                </select>
                <motion.button
                  onClick={handleBulkStatusUpdate}
                  disabled={bulkUpdating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  whileTap={buttonTap}
                >
                  {bulkUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังอัปเดต...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      อัปเดตสถานะ
                    </>
                  )}
                </motion.button>
                {/* Bulk Lock Price Button */}
                <motion.button
                  onClick={handleBulkLockPrice}
                  disabled={bulkLockPrice.isPending}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                  whileTap={buttonTap}
                  title="ล็อคราคาบาททั้งหมดตาม Tier ลูกค้า"
                >
                  {bulkLockPrice.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังล็อค...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      ล็อคราคา
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Item Form - Bottom Sheet on Mobile */}
          <AnimatePresence>
          {showItemForm && (
            <>
              {/* Mobile Bottom Sheet */}
              <div className="md:hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40"
                  onClick={() => {
                    setShowItemForm(false);
                    resetItemForm();
                    setItemFormType('product');
                  }}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className={`fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl shadow-2xl ${itemFormType === 'fee' ? 'bg-orange-50' : 'bg-white'}`}
                >
                  <div className="sticky top-0 bg-white border-b px-4 py-4 flex items-center justify-between rounded-t-3xl">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {itemFormType === 'fee' ? (
                        <>
                          <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">฿</span>
                          {editingItem ? 'แก้ไขค่าใช้จ่าย' : 'เพิ่มค่าจัดส่ง/อื่นๆ'}
                        </>
                      ) : (
                        <>
                          <Package className="w-5 h-5 text-primary-600" />
                          {editingItem ? 'แก้ไขรายการสินค้า' : 'เพิ่มสินค้า'}
                        </>
                      )}
                    </h3>
                    <button
                      onClick={() => {
                        setShowItemForm(false);
                        resetItemForm();
                        setItemFormType('product');
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <form onSubmit={handleSubmitItem} className="space-y-4">
                      {/* Form fields will be rendered here */}
                      {itemFormType === 'fee' ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทค่าใช้จ่าย</label>
                            <select
                              value={itemForm.productName}
                              onChange={(e) => setItemForm({ ...itemForm, productName: e.target.value })}
                              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">เลือกประเภท</option>
                              {FEE_TYPES.map((fee) => (
                                <option key={fee.value} value={fee.label}>{fee.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ยอดเงิน (บาท)</label>
                            <input
                              type="number"
                              value={itemForm.priceBaht}
                              onChange={(e) => setItemForm({ ...itemForm, priceBaht: e.target.value })}
                              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                            <textarea
                              value={itemForm.remarks}
                              onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
                              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                              rows={2}
                              placeholder="รายละเอียดเพิ่มเติม..."
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Product form fields - mobile version */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับที่</label>
                              <input
                                type="number"
                                min="1"
                                value={itemForm.sequenceNumber}
                                onChange={(e) => setItemForm({ ...itemForm, sequenceNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="1"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่กด</label>
                              <input
                                type="date"
                                value={itemForm.clickDate}
                                onChange={(e) => setItemForm({ ...itemForm, clickDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ช่องทางการกด</label>
                            <select
                              value={itemForm.clickChannel}
                              onChange={(e) => setItemForm({ ...itemForm, clickChannel: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">เลือก</option>
                              <option value="LINE">LINE</option>
                              <option value="Facebook">Facebook</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Website">Website</option>
                              <option value="Email">Email</option>
                              <option value="Phone">โทรศัพท์</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อคนกด</label>
                            <select
                              value={itemForm.clickerName}
                              onChange={(e) => setItemForm({ ...itemForm, clickerName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">เลือก</option>
                              <option value="POTTER">POTTER</option>
                              <option value="M">M</option>
                              <option value="SOM">SOM</option>
                              <option value="MAY">MAY</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ชื่อลูกค้า
                              <span className="ml-2 text-xs text-gray-500">(ล็อคอัตโนมัติ)</span>
                            </label>
                            <input
                              type="text"
                              value={customerName}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              รหัสติดตาม
                              <span className="ml-1 text-xs text-gray-500">(อัตโนมัติ)</span>
                            </label>
                            {editingItem && itemForm.trackingCode ? (
                              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 font-mono text-primary-600 font-medium text-sm">
                                {itemForm.trackingCode}
                              </div>
                            ) : (
                              <div className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-xs">
                                PKN-XXX-01-XXX
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              รหัสสินค้า
                              <span className="ml-1 text-xs text-gray-500">(SKU ร้าน)</span>
                            </label>
                            <input
                              type="text"
                              value={itemForm.productCode}
                              onChange={(e) => setItemForm({ ...itemForm, productCode: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="SKU-12345"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ไอเทมโค้ด
                              <span className="ml-1 text-xs text-gray-500">(Item Code)</span>
                            </label>
                            <input
                              type="text"
                              value={itemForm.itemCode}
                              onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="ITEM-001"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
                            <input
                              type="text"
                              value={itemForm.productName}
                              onChange={(e) => setItemForm({ ...itemForm, productName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="ชื่อสินค้า"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ลิ้งค์สินค้า</label>
                            <input
                              type="url"
                              value={itemForm.productUrl}
                              onChange={(e) => setItemForm({ ...itemForm, productUrl: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">ราคาเยน (¥)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={itemForm.priceYen}
                                onChange={(e) => setItemForm({ ...itemForm, priceYen: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">ราคาบาท (฿)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={itemForm.priceBaht}
                                onChange={(e) => setItemForm({ ...itemForm, priceBaht: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนัก (kg)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={itemForm.weight}
                                onChange={(e) => setItemForm({ ...itemForm, weight: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">ค่าจัดส่ง (฿)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={itemForm.shippingCost}
                                onChange={(e) => setItemForm({ ...itemForm, shippingCost: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          {/* สถานะสินค้า - Mobile */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะสินค้า</label>
                            <select
                              value={itemForm.itemStatus}
                              onChange={(e) => {
                                const selectedStep = STATUS_STEPS.find(s => s.name === e.target.value);
                                setItemForm({
                                  ...itemForm,
                                  itemStatus: e.target.value,
                                  statusStep: selectedStep?.step.toString() || '1'
                                });
                              }}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm ${
                                parseInt(itemForm.statusStep) === 9 ? 'border-green-400 bg-green-50' :
                                parseInt(itemForm.statusStep) >= 6 ? 'border-indigo-400 bg-indigo-50' :
                                parseInt(itemForm.statusStep) === 5 ? 'border-purple-400 bg-purple-50' :
                                parseInt(itemForm.statusStep) >= 3 ? 'border-yellow-400 bg-yellow-50' :
                                'border-gray-300'
                              }`}
                            >
                              {STATUS_STEPS.map((s) => (
                                <option key={s.step} value={s.name}>
                                  {s.step}. {s.name}
                                </option>
                              ))}
                            </select>
                            {/* Status Description - Mobile */}
                            {itemForm.statusStep && (
                              <div className={`mt-2 p-2 rounded-lg text-xs ${
                                parseInt(itemForm.statusStep) === 9 ? 'bg-green-100 text-green-800' :
                                parseInt(itemForm.statusStep) >= 6 ? 'bg-indigo-100 text-indigo-800' :
                                parseInt(itemForm.statusStep) === 5 ? 'bg-purple-100 text-purple-800' :
                                parseInt(itemForm.statusStep) >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                <span className="font-medium">{itemForm.statusStep}/9:</span> {STATUS_STEPS.find(s => s.step === parseInt(itemForm.statusStep))?.description}
                              </div>
                            )}
                          </div>

                          {/* Dynamic Status Fields - Mobile */}
                          <div className={`p-3 rounded-lg border ${
                            parseInt(itemForm.statusStep) === 9 ? 'bg-green-50 border-green-200' :
                            parseInt(itemForm.statusStep) >= 6 ? 'bg-indigo-50 border-indigo-200' :
                            parseInt(itemForm.statusStep) === 5 ? 'bg-purple-50 border-purple-200' :
                            parseInt(itemForm.statusStep) >= 3 ? 'bg-yellow-50 border-yellow-200' :
                            'bg-blue-50 border-blue-200'
                          }`}>
                            <p className="text-xs font-medium text-gray-600 mb-2">
                              ข้อมูลสำหรับสถานะ: {STATUS_STEPS.find(s => s.step === parseInt(itemForm.statusStep))?.name}
                            </p>

                            {/* Step 3: JP Order Number */}
                            {parseInt(itemForm.statusStep) === 3 && (
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">เลขออเดอร์ญี่ปุ่น</label>
                                <input
                                  type="text"
                                  value={itemForm.jpOrderNumber}
                                  onChange={(e) => setItemForm({ ...itemForm, jpOrderNumber: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                  placeholder="JP-XXXX-XXXX"
                                />
                              </div>
                            )}

                            {/* Step 5: Shipping Round */}
                            {parseInt(itemForm.statusStep) === 5 && (
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">รอบส่งกลับ *</label>
                                <input
                                  type="text"
                                  value={itemForm.shippingRound}
                                  onChange={(e) => setItemForm({ ...itemForm, shippingRound: e.target.value })}
                                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
                                  placeholder="เรือธันวาคม, Air Dec-1"
                                />
                              </div>
                            )}

                            {/* Step 6: Shipping Round + Batch */}
                            {parseInt(itemForm.statusStep) === 6 && (
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">รอบส่งกลับ</label>
                                  <input
                                    type="text"
                                    value={itemForm.shippingRound}
                                    onChange={(e) => setItemForm({ ...itemForm, shippingRound: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                    placeholder="เรือธันวาคม"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">เที่ยว/ลำ</label>
                                  <input
                                    type="text"
                                    value={itemForm.shipmentBatch}
                                    onChange={(e) => setItemForm({ ...itemForm, shipmentBatch: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                    placeholder="TG123"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Step 8: Tracking + Courier */}
                            {parseInt(itemForm.statusStep) === 8 && (
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Tracking *</label>
                                  <input
                                    type="text"
                                    value={itemForm.trackingNumber}
                                    onChange={(e) => setItemForm({ ...itemForm, trackingNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                    placeholder="TH123456"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">ขนส่ง</label>
                                  <select
                                    value={itemForm.courierName}
                                    onChange={(e) => setItemForm({ ...itemForm, courierName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                                  >
                                    <option value="">เลือกขนส่ง</option>
                                    <option value="Kerry">Kerry Express</option>
                                    <option value="Flash">Flash Express</option>
                                    <option value="J&T">J&T Express</option>
                                    <option value="ThaiPost">ไปรษณีย์ไทย</option>
                                    <option value="Other">อื่นๆ</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Step 9: Delivery Confirmation */}
                            {parseInt(itemForm.statusStep) === 9 && (
                              <div className="flex items-center gap-2 p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-green-700 text-xs font-medium">ลูกค้ารับสินค้าเรียบร้อยแล้ว</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                            <textarea
                              value={itemForm.remarks}
                              onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="หมายเหตุเพิ่มเติม..."
                            />
                          </div>
                          {/* Product Images Upload - Mobile */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              รูปสินค้า
                              {itemForm.productImages.length > 0 && (
                                <span className="ml-2 text-xs text-gray-500">({itemForm.productImages.length} รูป)</span>
                              )}
                            </label>
                            {/* Image Preview Grid */}
                            {itemForm.productImages.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {itemForm.productImages.map((img, idx) => (
                                  <div key={idx} className="relative group">
                                    <img
                                      src={img}
                                      alt={`Product ${idx + 1}`}
                                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(idx)}
                                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Upload Button */}
                            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-600">เลือกรูปภาพ</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </>
                      )}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowItemForm(false);
                            resetItemForm();
                            setItemFormType('product');
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className={`flex-1 px-4 py-3 text-white rounded-lg font-medium ${
                            itemFormType === 'fee' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary-600 hover:bg-primary-700'
                          }`}
                        >
                          {editingItem ? 'บันทึก' : itemFormType === 'fee' ? 'เพิ่มค่าใช้จ่าย' : 'เพิ่มสินค้า'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>

              {/* Desktop Inline Form */}
              <div className={`hidden md:block mb-6 p-6 rounded-lg border ${itemFormType === 'fee' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                {itemFormType === 'fee' ? (
                  <>
                    <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">฿</span>
                    {editingItem ? 'แก้ไขค่าใช้จ่าย' : 'เพิ่มค่าจัดส่ง/ค่าใช้จ่ายอื่นๆ'}
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 text-primary-600" />
                    {editingItem ? 'แก้ไขรายการสินค้า' : 'เพิ่มรายการสินค้าใหม่'}
                  </>
                )}
              </h3>
              <form onSubmit={handleSubmitItem} className="space-y-4">
                {/* Fee Form - Simplified */}
                {itemFormType === 'fee' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทค่าใช้จ่าย</label>
                        <select
                          value={itemForm.productName}
                          onChange={(e) => setItemForm({ ...itemForm, productName: e.target.value })}
                          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">เลือกประเภท</option>
                          {FEE_TYPES.map((fee) => (
                            <option key={fee.value} value={fee.label}>{fee.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ยอดเงิน (บาท)</label>
                        <input
                          type="number"
                          value={itemForm.priceBaht}
                          onChange={(e) => setItemForm({ ...itemForm, priceBaht: e.target.value })}
                          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                      <textarea
                        value={itemForm.remarks}
                        onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={2}
                        placeholder="รายละเอียดเพิ่มเติม..."
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowItemForm(false);
                          resetItemForm();
                          setItemFormType('product');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                      >
                        {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มค่าใช้จ่าย'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                {/* Product Form - Original */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับที่</label>
                    <input
                      type="number"
                      value={itemForm.sequenceNumber}
                      onChange={(e) => setItemForm({ ...itemForm, sequenceNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่กด</label>
                    <input
                      type="date"
                      value={itemForm.clickDate}
                      onChange={(e) => setItemForm({ ...itemForm, clickDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ช่องทางการกด</label>
                    <select
                      value={itemForm.clickChannel}
                      onChange={(e) => setItemForm({ ...itemForm, clickChannel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">เลือก</option>
                      <option value="LINE">LINE</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Website">Website</option>
                      <option value="Email">Email</option>
                      <option value="Phone">โทรศัพท์</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อคนกด</label>
                    <select
                      value={itemForm.clickerName}
                      onChange={(e) => setItemForm({ ...itemForm, clickerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">เลือก</option>
                      <option value="POTTER">POTTER</option>
                      <option value="M">M</option>
                      <option value="SOM">SOM</option>
                      <option value="MAY">MAY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อลูกค้า
                      <span className="ml-2 text-xs text-gray-500">(ล็อคอัตโนมัติ)</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสติดตาม
                      <span className="ml-1 text-xs text-gray-500">(อัตโนมัติ)</span>
                    </label>
                    {editingItem && itemForm.trackingCode ? (
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 font-mono text-primary-600 font-medium">
                        {itemForm.trackingCode}
                      </div>
                    ) : (
                      <div className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">
                        PKN-{order?.orderNumber || 'XXX'}-{(itemForm.sequenceNumber || '01').toString().padStart(2, '0')}-XXX
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสสินค้า
                      <span className="ml-1 text-xs text-gray-500">(SKU ร้าน)</span>
                    </label>
                    <input
                      type="text"
                      value={itemForm.productCode}
                      onChange={(e) => setItemForm({ ...itemForm, productCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="SKU-12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ไอเทมโค้ด
                      <span className="ml-1 text-xs text-gray-500">(Item Code)</span>
                    </label>
                    <input
                      type="text"
                      value={itemForm.itemCode}
                      onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="ITEM-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
                    <input
                      type="text"
                      value={itemForm.productName}
                      onChange={(e) => setItemForm({ ...itemForm, productName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="ชื่อสินค้า"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลิ้งค์สินค้า</label>
                    <input
                      type="url"
                      value={itemForm.productUrl}
                      onChange={(e) => setItemForm({ ...itemForm, productUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาเยน (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.priceYen}
                      onChange={(e) => setItemForm({ ...itemForm, priceYen: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาบาท (฿)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.priceBaht}
                      onChange={(e) => setItemForm({ ...itemForm, priceBaht: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนักสินค้า (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.weight}
                      onChange={(e) => setItemForm({ ...itemForm, weight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ค่าจัดส่ง (฿)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.shippingCost}
                      onChange={(e) => setItemForm({ ...itemForm, shippingCost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* สถานะสินค้า - Full Width with Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะสินค้า</label>
                  <select
                    value={itemForm.itemStatus}
                    onChange={(e) => {
                      const selectedStep = STATUS_STEPS.find(s => s.name === e.target.value);
                      setItemForm({
                        ...itemForm,
                        itemStatus: e.target.value,
                        statusStep: selectedStep?.step.toString() || '1',
                        statusDate: new Date().toISOString().split('T')[0], // Auto-set today
                      });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      parseInt(itemForm.statusStep) === 9 ? 'border-green-400 bg-green-50' :
                      parseInt(itemForm.statusStep) >= 6 ? 'border-indigo-400 bg-indigo-50' :
                      parseInt(itemForm.statusStep) === 5 ? 'border-purple-400 bg-purple-50' :
                      parseInt(itemForm.statusStep) >= 3 ? 'border-yellow-400 bg-yellow-50' :
                      'border-gray-300'
                    }`}
                  >
                    {STATUS_STEPS.map((s) => (
                      <option key={s.step} value={s.name}>
                        {s.step}. {s.name} - {s.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Status Fields - แสดงตาม step ที่เลือก */}
                <div className={`p-4 rounded-lg border-2 ${
                  parseInt(itemForm.statusStep) === 9 ? 'bg-green-50 border-green-200' :
                  parseInt(itemForm.statusStep) >= 6 ? 'bg-indigo-50 border-indigo-200' :
                  parseInt(itemForm.statusStep) === 5 ? 'bg-purple-50 border-purple-200' :
                  parseInt(itemForm.statusStep) >= 3 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-sm font-semibold ${
                      parseInt(itemForm.statusStep) === 9 ? 'text-green-700' :
                      parseInt(itemForm.statusStep) >= 6 ? 'text-indigo-700' :
                      parseInt(itemForm.statusStep) === 5 ? 'text-purple-700' :
                      parseInt(itemForm.statusStep) >= 3 ? 'text-yellow-700' :
                      'text-gray-700'
                    }`}>
                      ขั้นตอนที่ {itemForm.statusStep}/9: {STATUS_STEPS.find(s => s.step === parseInt(itemForm.statusStep))?.description}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Step 3: สั่งซื้อจากญี่ปุ่น */}
                    {parseInt(itemForm.statusStep) >= 3 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สั่งซื้อ JP</label>
                          <input
                            type="date"
                            value={itemForm.jpOrderDate}
                            onChange={(e) => setItemForm({ ...itemForm, jpOrderDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่ออเดอร์ JP</label>
                          <input
                            type="text"
                            value={itemForm.jpOrderNumber}
                            onChange={(e) => setItemForm({ ...itemForm, jpOrderNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="MERC-12345, YAH-67890"
                          />
                        </div>
                      </>
                    )}

                    {/* Step 4: ของถึงโกดังญี่ปุ่น */}
                    {parseInt(itemForm.statusStep) >= 4 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ถึงโกดัง JP</label>
                        <input
                          type="date"
                          value={itemForm.warehouseDate}
                          onChange={(e) => setItemForm({ ...itemForm, warehouseDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}

                    {/* Step 5-6: จัดรอบส่ง & ส่งออก */}
                    {parseInt(itemForm.statusStep) >= 5 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">รอบส่ง</label>
                          <input
                            type="text"
                            value={itemForm.shippingRound}
                            onChange={(e) => setItemForm({ ...itemForm, shippingRound: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="เรือธันวาคม, Air Dec-1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">เลขตู้ / เที่ยวบิน</label>
                          <input
                            type="text"
                            value={itemForm.shipmentBatch}
                            onChange={(e) => setItemForm({ ...itemForm, shipmentBatch: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="CONT-123, TG661"
                          />
                        </div>
                      </>
                    )}

                    {/* Step 6: วันที่ส่งออก */}
                    {parseInt(itemForm.statusStep) >= 6 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ส่งออกจาก JP</label>
                        <input
                          type="date"
                          value={itemForm.exportDate}
                          onChange={(e) => setItemForm({ ...itemForm, exportDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}

                    {/* Step 7: ของถึงไทย */}
                    {parseInt(itemForm.statusStep) >= 7 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ถึงไทย</label>
                        <input
                          type="date"
                          value={itemForm.arrivalDate}
                          onChange={(e) => setItemForm({ ...itemForm, arrivalDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}

                    {/* Step 8: Tracking & ขนส่ง */}
                    {parseInt(itemForm.statusStep) >= 8 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ขนส่งในไทย</label>
                          <select
                            value={itemForm.courierName}
                            onChange={(e) => setItemForm({ ...itemForm, courierName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">เลือกขนส่ง</option>
                            <option value="Kerry">Kerry Express</option>
                            <option value="Flash">Flash Express</option>
                            <option value="J&T">J&T Express</option>
                            <option value="ThaiPost">ไปรษณีย์ไทย</option>
                            <option value="Ninja">Ninja Van</option>
                            <option value="DHL">DHL</option>
                            <option value="BEST">BEST Express</option>
                            <option value="Pickup">รับเอง</option>
                            <option value="Other">อื่นๆ</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number ในไทย</label>
                          <input
                            type="text"
                            value={itemForm.trackingNumber}
                            onChange={(e) => setItemForm({ ...itemForm, trackingNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="TH123456789"
                          />
                        </div>
                      </>
                    )}

                    {/* Step 9: วันที่ส่งมอบ */}
                    {parseInt(itemForm.statusStep) >= 9 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ส่งมอบ</label>
                          <input
                            type="date"
                            value={itemForm.deliveryDate}
                            onChange={(e) => setItemForm({ ...itemForm, deliveryDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg w-full">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 font-medium">ลูกค้ารับสินค้าเรียบร้อยแล้ว</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* หมายเหตุสถานะปัจจุบัน */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หมายเหตุสถานะ {STATUS_STEPS.find(s => s.step === parseInt(itemForm.statusStep))?.name}
                      </label>
                      <textarea
                        value={itemForm.statusRemarks[`step${itemForm.statusStep}`] || ''}
                        onChange={(e) => setItemForm({
                          ...itemForm,
                          statusRemarks: {
                            ...itemForm.statusRemarks,
                            [`step${itemForm.statusStep}`]: e.target.value
                          }
                        })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={`หมายเหตุสำหรับสถานะ ${STATUS_STEPS.find(s => s.step === parseInt(itemForm.statusStep))?.name}...`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เพจ/ร้าน
                    <span className="ml-2 text-xs text-gray-500">(ล็อคอัตโนมัติ)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                  <textarea
                    value={itemForm.remarks}
                    onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>

                {/* Product Images Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รูปสินค้า
                    {itemForm.productImages.length > 0 && (
                      <span className="ml-2 text-xs text-gray-500">({itemForm.productImages.length} รูป)</span>
                    )}
                  </label>

                  {/* Image Preview Grid */}
                  {itemForm.productImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {itemForm.productImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Product ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <label className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-600">กำลังอัพโหลด...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">เพิ่มรูปภาพ</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="submit"
                    disabled={createItem.isPending || updateItem.isPending}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    whileTap={buttonTap}
                  >
                    {createItem.isPending || updateItem.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowItemForm(false);
                      setEditingItem(null);
                      resetItemForm();
                      setItemFormType('product');
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                    whileTap={buttonTap}
                  >
                    ยกเลิก
                  </motion.button>
                </div>
                  </>
                )}
              </form>
            </div>
            </>
          )}
          </AnimatePresence>

          {/* Items Table */}
          {itemsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-lg">ยังไม่มีรายการสินค้า</p>
              <p className="text-sm mt-1">คลิกปุ่ม "เพิ่มสินค้า" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-2 py-3 text-center">
                        <button
                          onClick={toggleSelectAll}
                          className="text-gray-500 hover:text-primary-600"
                          title={selectedItems.size === items.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                        >
                          {selectedItems.size === items.length && items.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ลำดับ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">รูปสินค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">รหัสสินค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ชื่อสินค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ลิ้งค์</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ราคา</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สถานะสินค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tracking</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Combine existing items with pending new items */}
                    {[...items, ...pendingNewItems.map(p => ({ ...p, id: p._tempId, _isPending: true }))].map((item: any) => {
                      const images = getProductImages(item);
                      const isSelected = selectedItems.has(item.id);
                      const isFeeItem = item.productCode === 'FEE';
                      const isPendingNew = item._isPending;
                      const isPendingEdit = pendingItemEdits.has(item.id);
                      const isPendingDelete = pendingItemDeletes.has(item.id);
                      const hasPendingStatus = pendingStatusChanges.has(item.id);
                      const hasPendingChange = isPendingNew || isPendingEdit || hasPendingStatus || isPendingDelete;
                      return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${isFeeItem ? 'bg-orange-50' : ''} ${isPendingNew ? 'bg-green-50 border-l-4 border-green-500' : ''} ${isPendingEdit ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''} ${isPendingDelete ? 'bg-red-50 border-l-4 border-red-500 opacity-60' : ''}`}>
                        <td className="px-2 py-3 text-center">
                          {isPendingNew || isPendingDelete ? (
                            <span className="text-gray-300" title={isPendingDelete ? "รายการรอลบ" : "รายการรอบันทึก - ไม่สามารถเลือกได้"}>
                              <Square className="w-5 h-5" />
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleItemSelection(item.id)}
                              className="text-gray-500 hover:text-primary-600"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-primary-600" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{item.sequenceNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {isFeeItem ? (
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                              <span className="text-orange-500 font-bold text-lg">฿</span>
                            </div>
                          ) : images.length > 0 ? (
                            <button
                              onClick={() => setViewingImages({ images, index: 0 })}
                              className="relative group"
                            >
                              <img
                                src={images[0]}
                                alt="Product"
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 group-hover:border-primary-500 transition-colors"
                              />
                              {images.length > 1 && (
                                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                  +{images.length - 1}
                                </span>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            {isFeeItem ? (
                              <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded font-medium">ค่าใช้จ่าย</span>
                            ) : isPendingNew ? (
                              <>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium border border-green-300 border-dashed">รอสร้าง</span>
                                {item.productCode && (
                                  <span className="text-xs text-gray-500">SKU: {item.productCode}</span>
                                )}
                              </>
                            ) : (
                              <>
                                <code className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-medium">{item.trackingCode || '-'}</code>
                                {item.productCode && (
                                  <span className="text-xs text-gray-500">SKU: {item.productCode}</span>
                                )}
                              </>
                            )}
                            <div className="flex items-center gap-1">
                              {isPendingNew && (
                                <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">ใหม่</span>
                              )}
                              {isPendingEdit && (
                                <span className="text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">แก้ไข</span>
                              )}
                              {isPendingDelete && (
                                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">รอลบ</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-gray-800" title={item.productName || ''}>
                            {item.productName ? (item.productName.length > 30 ? item.productName.substring(0, 30) + '...' : item.productName) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.productUrl ? (
                            <a
                              href={item.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline flex items-center gap-1"
                            >
                              ดูสินค้า
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isFeeItem ? (
                            <div className="font-bold text-orange-600">฿{Math.ceil(Number(item.priceBaht || 0)).toLocaleString()}</div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div>
                                {item.priceYen && <div className="font-medium">¥{Number(item.priceYen).toLocaleString()}</div>}
                                {item.priceBaht && (
                                  <div className={`text-xs flex items-center gap-1 ${item.priceBahtLocked ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                    ฿{Math.ceil(Number(item.priceBaht)).toLocaleString()}
                                    {item.priceBahtLocked && (
                                      <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-700 px-1 py-0.5 rounded text-[10px]" title={`ล็อคโดย ${item.lockedBy} | Rate: ${item.lockedExchangeRate} | Tier: ${item.lockedTierCode}`}>
                                        <Lock className="w-2.5 h-2.5" />
                                        {item.lockedTierCode?.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {!item.priceYen && !item.priceBaht && '-'}
                              </div>
                              {/* Lock/Unlock button */}
                              {!isPendingNew && item.priceYen && (
                                item.priceBahtLocked ? (
                                  <button
                                    onClick={() => handleUnlockPrice(item.id)}
                                    className="p-1 text-green-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="ปลดล็อคราคาบาท"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleLockPrice(item.id, Number(item.priceYen))}
                                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="ล็อคราคาบาทตาม Tier ลูกค้า"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isFeeItem ? (
                            <span className="text-xs text-gray-400">-</span>
                          ) : isPendingNew ? (
                            <span className="text-xs text-gray-400 italic">รอบันทึก</span>
                          ) : (
                            <select
                              value={getDisplayStatusStep(item)}
                              onChange={(e) => handleStatusDropdownChange(item.id, parseInt(e.target.value))}
                              className={`text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer ${
                                pendingStatusChanges.has(item.id) ? 'ring-2 ring-orange-400 ' : ''
                              }${
                                getDisplayStatusStep(item) === 9 ? 'bg-green-100 border-green-300 text-green-800' :
                                getDisplayStatusStep(item) === 8 ? 'bg-blue-100 border-blue-300 text-blue-800' :
                                getDisplayStatusStep(item) >= 6 ? 'bg-indigo-100 border-indigo-300 text-indigo-800' :
                                getDisplayStatusStep(item) === 5 ? 'bg-purple-100 border-purple-300 text-purple-800' :
                                getDisplayStatusStep(item) >= 3 ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                                'bg-gray-100 border-gray-300 text-gray-800'
                              }`}
                            >
                              {STATUS_STEPS.map((s) => (
                                <option key={s.step} value={s.step}>
                                  {s.step}. {s.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isFeeItem ? (
                            <span className="text-xs text-gray-400">-</span>
                          ) : item.trackingNumber ? (
                            <code className="text-xs text-gray-600">{item.trackingNumber}</code>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Copy tracking URL button */}
                            {!isFeeItem && item.trackingCode && (
                              <motion.button
                                onClick={() => {
                                  const trackingUrl = `${window.location.origin}/tracking/${item.trackingCode}`;
                                  navigator.clipboard.writeText(trackingUrl);
                                  alert(`คัดลอกลิงก์ติดตามสินค้าแล้ว`);
                                }}
                                className="text-gray-400 hover:text-primary-600 p-1"
                                whileTap={buttonTap}
                                title={`คัดลอกลิงก์ติดตาม: ${item.trackingCode}`}
                              >
                                <Copy className="w-4 h-4" />
                              </motion.button>
                            )}
                            {/* Cancel pending status button */}
                            {hasPendingStatus && !isPendingNew && (
                              <motion.button
                                onClick={() => handleCancelPendingStatus(item.id)}
                                className="text-orange-600 hover:text-orange-800 p-1"
                                whileTap={buttonTap}
                                title="ยกเลิกการเปลี่ยนสถานะ"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            )}
                            {/* Cancel pending edit button */}
                            {isPendingEdit && (
                              <motion.button
                                onClick={() => handleCancelPendingEdit(item.id)}
                                className="text-yellow-600 hover:text-yellow-800 p-1"
                                whileTap={buttonTap}
                                title="ยกเลิกการแก้ไข"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            )}
                            {/* Edit button - disabled for pending new items and pending deletes */}
                            {!isPendingNew && !isPendingDelete && (
                              <motion.button
                                onClick={() => handleEditItem(item)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                whileTap={buttonTap}
                                title="แก้ไข"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                            )}
                            {/* Delete/Remove button */}
                            {isPendingNew ? (
                              <motion.button
                                onClick={() => handleRemovePendingItem(item._tempId)}
                                className="text-red-600 hover:text-red-800 p-1"
                                whileTap={buttonTap}
                                title="นำออก (ยังไม่บันทึก)"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            ) : isPendingDelete ? (
                              <motion.button
                                onClick={() => handleCancelPendingDelete(item.id)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                whileTap={buttonTap}
                                title="ยกเลิกการลบ"
                              >
                                ยกเลิก
                              </motion.button>
                            ) : (
                              <motion.button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                whileTap={buttonTap}
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {[...items, ...pendingNewItems.map(p => ({ ...p, id: p._tempId, _isPending: true }))].map((item: any) => {
                  const images = getProductImages(item);
                  const isSelected = selectedItems.has(item.id);
                  const isFeeItem = item.productCode === 'FEE';
                  const isPendingNew = item._isPending;
                  const isPendingEdit = pendingItemEdits.has(item.id);
                  const isPendingDelete = pendingItemDeletes.has(item.id);
                  const hasPendingStatus = pendingStatusChanges.has(item.id);

                  return (
                    <motion.div
                      key={item.id}
                      className={`bg-white border-2 rounded-xl p-4 ${
                        isSelected ? 'border-primary-500 bg-primary-50' :
                        isFeeItem ? 'border-orange-200 bg-orange-50' :
                        isPendingNew ? 'border-green-500 bg-green-50' :
                        isPendingEdit ? 'border-yellow-500 bg-yellow-50' :
                        isPendingDelete ? 'border-red-500 bg-red-50 opacity-60' :
                        'border-gray-200'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Card Header */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Checkbox */}
                        <div className="pt-1">
                          {isPendingNew || isPendingDelete ? (
                            <span className="text-gray-300">
                              <Square className="w-5 h-5" />
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleItemSelection(item.id)}
                              className="text-gray-500 hover:text-primary-600"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-primary-600" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Image */}
                        <div className="flex-shrink-0">
                          {isFeeItem ? (
                            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                              <span className="text-orange-500 font-bold text-xl">฿</span>
                            </div>
                          ) : images.length > 0 ? (
                            <button
                              onClick={() => setViewingImages({ images, index: 0 })}
                              className="relative"
                            >
                              <img
                                src={images[0]}
                                alt="Product"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                              {images.length > 1 && (
                                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                  +{images.length - 1}
                                </span>
                              )}
                            </button>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-1 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isFeeItem ? (
                                <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded font-medium">ค่าใช้จ่าย</span>
                              ) : isPendingNew ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium border border-green-300 border-dashed">รอสร้าง</span>
                              ) : (
                                <code className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-medium">{item.trackingCode || '-'}</code>
                              )}
                              {isPendingNew && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">ใหม่</span>}
                              {isPendingEdit && <span className="text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">แก้ไข</span>}
                              {isPendingDelete && <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">รอลบ</span>}
                            </div>
                            {!isFeeItem && item.productCode && (
                              <span className="text-xs text-gray-500">SKU: {item.productCode}</span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900 line-clamp-2">{item.productName || '-'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">#{item.sequenceNumber || '-'}</span>
                            {item.productUrl && (
                              <a
                                href={item.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 text-xs flex items-center gap-1"
                              >
                                ลิงค์ <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-3 pl-8">
                        {isFeeItem ? (
                          <div className="font-bold text-orange-600 text-lg">฿{Math.ceil(Number(item.priceBaht || 0)).toLocaleString()}</div>
                        ) : (
                          <div>
                            {item.priceYen && <div className="font-medium">¥{Number(item.priceYen).toLocaleString()}</div>}
                            {item.priceBaht && <div className="text-gray-600 text-sm">฿{Math.ceil(Number(item.priceBaht)).toLocaleString()}</div>}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      {!isFeeItem && !isPendingNew && (
                        <div className="mb-3 pl-8">
                          <p className="text-xs text-gray-500 mb-1">สถานะ</p>
                          <select
                            value={getDisplayStatusStep(item)}
                            onChange={(e) => handleStatusDropdownChange(item.id, parseInt(e.target.value))}
                            className={`text-sm border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              pendingStatusChanges.has(item.id) ? 'ring-2 ring-orange-400' : ''
                            }`}
                          >
                            {STATUS_STEPS.map((s) => (
                              <option key={s.step} value={s.step}>
                                {s.step}. {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Tracking */}
                      {!isFeeItem && item.trackingNumber && (
                        <div className="mb-3 pl-8">
                          <p className="text-xs text-gray-500 mb-1">Tracking</p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.trackingNumber}</code>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pl-8 pt-3 border-t">
                        {/* Copy tracking URL button - Mobile */}
                        {!isFeeItem && item.trackingCode && (
                          <motion.button
                            onClick={() => {
                              const trackingUrl = `${window.location.origin}/tracking/${item.trackingCode}`;
                              navigator.clipboard.writeText(trackingUrl);
                              alert(`คัดลอกลิงก์ติดตามสินค้าแล้ว`);
                            }}
                            className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center"
                            whileTap={buttonTap}
                            title={`คัดลอกลิงก์ติดตาม`}
                          >
                            <Copy className="w-4 h-4" />
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => handleEditItem(item)}
                          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 text-sm"
                          whileTap={buttonTap}
                        >
                          <Edit className="w-4 h-4" />
                          แก้ไข
                        </motion.button>
                        {isPendingDelete ? (
                          <motion.button
                            onClick={() => handleCancelDeleteItem(item.id)}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
                            whileTap={buttonTap}
                          >
                            ยกเลิก
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => handleDeleteItem(item.id)}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm"
                            whileTap={buttonTap}
                          >
                            <Trash2 className="w-4 h-4" />
                            ลบ
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-4 text-sm text-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>
                  รวม {items.length + pendingNewItems.length} รายการ
                  {pendingNewItems.length > 0 && (
                    <span className="text-green-600 ml-1">(+{pendingNewItems.length} รอบันทึก)</span>
                  )}
                </span>
                {(() => {
                  const existingTotal = items.reduce((sum, item) => sum + Math.ceil(Number(item.priceBaht || 0)) + Math.ceil(Number(item.shippingCost || 0)), 0);
                  const pendingTotal = pendingNewItems.reduce((sum, item) => sum + Math.ceil(Number(item.priceBaht || 0)) + Math.ceil(Number(item.shippingCost || 0)), 0);
                  const total = existingTotal + pendingTotal;
                  return total > 0 && (
                    <span className="font-semibold">
                      ยอดรวม: ฿{total.toLocaleString()}
                      {pendingTotal > 0 && (
                        <span className="text-green-600 ml-1">(+฿{pendingTotal.toLocaleString()} รอบันทึก)</span>
                      )}
                    </span>
                  );
                })()}
              </div>
            </>
          )}
              </>
            )}

            {/* Payments Tab Content */}
            {activeTab === 'payments' && id && (
              <PaymentTab
                orderId={id}
                orderNumber={order.orderNumber}
                onPendingChangesUpdate={handlePaymentPendingUpdate}
                onPaymentSummaryUpdate={handlePaymentSummaryUpdate}
                saveVersion={paymentSaveVersion}
              />
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {viewingImages && (
          <ImageViewerModal
            images={viewingImages.images}
            initialIndex={viewingImages.index}
            onClose={() => setViewingImages(null)}
          />
        )}
      </AnimatePresence>

      {/* Save Progress Overlay */}
      <AnimatePresence>
        {saveState.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
            >
              {/* Animation Container */}
              <div className="w-40 h-40 mx-auto mb-4">
                {saveState.status === 'saving' && (
                  <Lottie
                    animationData={shipAnimation}
                    loop={true}
                    className="w-full h-full"
                  />
                )}
                {saveState.status === 'success' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                      <motion.svg
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5 }}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    </div>
                  </motion.div>
                )}
                {saveState.status === 'error' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="w-12 h-12 text-red-500" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Status Text */}
              <h3 className={`text-xl font-bold mb-2 ${
                saveState.status === 'saving' ? 'text-primary-600' :
                saveState.status === 'success' ? 'text-green-600' :
                'text-red-600'
              }`}>
                {saveState.status === 'saving' && 'กำลังบันทึก...'}
                {saveState.status === 'success' && 'สำเร็จ!'}
                {saveState.status === 'error' && 'เกิดข้อผิดพลาด'}
              </h3>
              <p className="text-gray-600">{saveState.message}</p>

              {/* Progress indicator for saving */}
              {saveState.status === 'saving' && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <motion.div
                      className="bg-primary-600 h-1.5 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </div>
              )}

              {/* Close button for error */}
              {saveState.status === 'error' && (
                <button
                  onClick={() => setSaveState(prev => ({ ...prev, isOpen: false }))}
                  className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  ปิด
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Search Modal */}
      <AnimatePresence>
        {showCustomerSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-[60]"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full md:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl md:rounded-xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold">ค้นหาลูกค้า</h3>
                <button
                  onClick={() => setShowCustomerSearch(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, LINE ID..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  พบ {filteredCustomers.length} รายการ
                </p>
              </div>

              {/* Customer List */}
              <div className="flex-1 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>ไม่พบลูกค้าที่ตรงกัน</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setOrderForm({ ...orderForm, customerId: customer.id });
                          setShowCustomerSearch(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                          orderForm.customerId === customer.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {customer.companyName || customer.contactPerson || 'ไม่มีชื่อ'}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                              {customer.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {customer.phone}
                                </span>
                              )}
                              {customer.lineId && (
                                <span className="text-green-600">LINE: {customer.lineId}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-gray-50 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setOrderForm({ ...orderForm, customerId: '' });
                    setShowCustomerSearch(false);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ล้างการเลือก
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomerSearch(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                >
                  ปิด
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Change Modal */}
      <AnimatePresence>
        {statusModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleCancelStatusModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-4 ${
                statusModal.newStep === 9 ? 'bg-green-500' :
                statusModal.newStep === 8 ? 'bg-blue-500' :
                statusModal.newStep >= 6 ? 'bg-indigo-500' :
                statusModal.newStep === 5 ? 'bg-purple-500' :
                statusModal.newStep >= 3 ? 'bg-yellow-500' :
                'bg-gray-500'
              } text-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">เปลี่ยนสถานะสินค้า</h3>
                  <button onClick={handleCancelStatusModal} className="p-1 hover:bg-white/20 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm opacity-90 mt-1 truncate">{statusModal.itemName}</p>
              </div>

              {/* Status Info */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">จาก</p>
                    <p className="font-medium text-gray-700">
                      {statusModal.currentStep}. {STATUS_STEPS.find(s => s.step === statusModal.currentStep)?.name}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">เป็น</p>
                    <p className={`font-bold ${
                      statusModal.newStep === 9 ? 'text-green-600' :
                      statusModal.newStep === 8 ? 'text-blue-600' :
                      statusModal.newStep >= 6 ? 'text-indigo-600' :
                      statusModal.newStep === 5 ? 'text-purple-600' :
                      statusModal.newStep >= 3 ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {statusModal.newStep}. {STATUS_STEPS.find(s => s.step === statusModal.newStep)?.name}
                    </p>
                  </div>
                </div>
                {/* Status Description */}
                <div className={`mt-3 p-2 rounded-lg text-xs ${
                  statusModal.newStep === 9 ? 'bg-green-50 text-green-700' :
                  statusModal.newStep === 8 ? 'bg-blue-50 text-blue-700' :
                  statusModal.newStep >= 6 ? 'bg-indigo-50 text-indigo-700' :
                  statusModal.newStep === 5 ? 'bg-purple-50 text-purple-700' :
                  statusModal.newStep >= 3 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {STATUS_STEPS.find(s => s.step === statusModal.newStep)?.description}
                </div>
              </div>

              {/* Dynamic Fields based on status */}
              <div className="p-4 space-y-4">
                {/* Step 3: JP Order Number */}
                {statusModal.newStep === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เลขออเดอร์ญี่ปุ่น
                    </label>
                    <input
                      type="text"
                      value={statusModal.extraData.jpOrderNumber}
                      onChange={(e) => setStatusModal(prev => ({
                        ...prev,
                        extraData: { ...prev.extraData, jpOrderNumber: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="JP-XXXX-XXXX"
                    />
                  </div>
                )}

                {/* Step 5: Shipping Round */}
                {statusModal.newStep === 5 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รอบส่งกลับ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={statusModal.extraData.shippingRound}
                      onChange={(e) => setStatusModal(prev => ({
                        ...prev,
                        extraData: { ...prev.extraData, shippingRound: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="เช่น: เรือธันวาคม, Air Dec-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">ระบุรอบเรือหรือเที่ยวบินที่จะส่งกลับ</p>
                  </div>
                )}

                {/* Step 6: Shipping Round + Batch */}
                {statusModal.newStep === 6 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">รอบส่งกลับ</label>
                      <input
                        type="text"
                        value={statusModal.extraData.shippingRound}
                        onChange={(e) => setStatusModal(prev => ({
                          ...prev,
                          extraData: { ...prev.extraData, shippingRound: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="เรือธันวาคม"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เที่ยว/ลำ (เรือ/เครื่องบิน)</label>
                      <input
                        type="text"
                        value={statusModal.extraData.shipmentBatch}
                        onChange={(e) => setStatusModal(prev => ({
                          ...prev,
                          extraData: { ...prev.extraData, shipmentBatch: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="TG123 / ลำที่ 2"
                      />
                    </div>
                  </>
                )}

                {/* Step 8: Tracking + Courier */}
                {statusModal.newStep === 8 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={statusModal.extraData.trackingNumber}
                        onChange={(e) => setStatusModal(prev => ({
                          ...prev,
                          extraData: { ...prev.extraData, trackingNumber: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="TH123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">บริษัทขนส่ง</label>
                      <select
                        value={statusModal.extraData.courierName}
                        onChange={(e) => setStatusModal(prev => ({
                          ...prev,
                          extraData: { ...prev.extraData, courierName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">เลือกบริษัทขนส่ง</option>
                        <option value="Kerry">Kerry Express</option>
                        <option value="Flash">Flash Express</option>
                        <option value="J&T">J&T Express</option>
                        <option value="ThaiPost">ไปรษณีย์ไทย</option>
                        <option value="DHL">DHL</option>
                        <option value="Other">อื่นๆ</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Step 9: Confirmation */}
                {statusModal.newStep === 9 && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="font-medium text-green-800">ยืนยันลูกค้ารับสินค้าแล้ว</p>
                      <p className="text-sm text-green-600">สินค้าจะถูกทำเครื่องหมายว่าจัดส่งสำเร็จ</p>
                    </div>
                  </div>
                )}

                {/* Other steps - just confirmation */}
                {![3, 5, 6, 8, 9].includes(statusModal.newStep) && (
                  <div className="text-center text-gray-600 py-2">
                    <p>คลิก "ยืนยัน" เพื่อเปลี่ยนสถานะ</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 flex gap-3">
                <button
                  onClick={handleCancelStatusModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                    statusModal.newStep === 9 ? 'bg-green-500 hover:bg-green-600' :
                    statusModal.newStep === 8 ? 'bg-blue-500 hover:bg-blue-600' :
                    statusModal.newStep >= 6 ? 'bg-indigo-500 hover:bg-indigo-600' :
                    statusModal.newStep === 5 ? 'bg-purple-500 hover:bg-purple-600' :
                    statusModal.newStep >= 3 ? 'bg-yellow-500 hover:bg-yellow-600' :
                    'bg-gray-500 hover:bg-gray-600'
                  }`}
                >
                  ยืนยัน
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderDetailPage;
