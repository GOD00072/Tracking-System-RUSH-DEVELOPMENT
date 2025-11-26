import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Save, Trash2, Plus, Edit, ExternalLink, ImageIcon, X, ChevronLeft, ChevronRight, Download, CheckSquare, Square, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminOrders, useAdminUpdateOrder, useAdminDeleteOrder } from '../../hooks/useAdminOrders';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrderItems, useCreateOrderItem, useUpdateOrderItem, useDeleteOrderItem } from '../../hooks/useOrderItems';
import LoadingSpinner from '../../components/LoadingSpinner';
import { buttonTap } from '../../lib/animations';
import api from '../../lib/api';

// 8-step status timeline (constant)
const STATUS_STEPS = [
  { step: 1, name: 'รับออเดอร์', short: '1' },
  { step: 2, name: 'ชำระเงินงวดแรก', short: '2' },
  { step: 3, name: 'สั่งซื้อจากญี่ปุ่น', short: '3' },
  { step: 4, name: 'ของถึงโกดังญี่ปุ่น', short: '4' },
  { step: 5, name: 'ส่งออกจากญี่ปุ่น', short: '5' },
  { step: 6, name: 'ของถึงไทย', short: '6' },
  { step: 7, name: 'กำลังจัดส่ง', short: '7' },
  { step: 8, name: 'ส่งมอบสำเร็จ', short: '8' },
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

  const order = ordersData?.data.find((o) => o.id === id);
  const items = itemsData?.data || [];

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingImages, setViewingImages] = useState<{ images: string[]; index: number } | null>(null);

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkStatusStep, setBulkStatusStep] = useState('1');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

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
    productCode: '',
    productUrl: '',
    priceYen: '',
    priceBaht: '',
    weight: '',
    shippingCost: '',
    itemStatus: 'รับออเดอร์',
    statusStep: '1',
    paymentStatus: 'pending',
    shippingRound: '',
    trackingNumber: '',
    storePage: '',
    remarks: '',
    productImages: [] as string[],
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

  const handleUpdateOrder = () => {
    if (!id) return;

    const orderData = {
      orderNumber: orderForm.orderNumber,
      customerId: orderForm.customerId || undefined,
      shippingMethod: orderForm.shippingMethod,
      status: orderForm.status,
      origin: orderForm.origin || undefined,
      destination: orderForm.destination || undefined,
      totalWeight: orderForm.totalWeight ? parseFloat(orderForm.totalWeight) : undefined,
      totalVolume: orderForm.totalVolume ? parseFloat(orderForm.totalVolume) : undefined,
      estimatedCost: orderForm.estimatedCost ? parseFloat(orderForm.estimatedCost) : undefined,
      actualCost: orderForm.actualCost ? parseFloat(orderForm.actualCost) : undefined,
      estimatedDelivery: orderForm.estimatedDelivery || undefined,
      notes: orderForm.notes || undefined,
    };

    updateOrder.mutate({ id, data: orderData });
  };

  const handleDeleteOrder = () => {
    if (!id) return;
    if (window.confirm('คุณต้องการลบ Order นี้? (รายการสินค้าทั้งหมดจะถูกลบด้วย)')) {
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
      productUrl: itemForm.productUrl || undefined,
      priceYen: itemForm.priceYen ? parseFloat(itemForm.priceYen) : undefined,
      priceBaht: itemForm.priceBaht ? parseFloat(itemForm.priceBaht) : undefined,
      weight: itemForm.weight ? parseFloat(itemForm.weight) : undefined,
      shippingCost: itemForm.shippingCost ? parseFloat(itemForm.shippingCost) : undefined,
      itemStatus: itemForm.itemStatus || undefined,
      statusStep: itemForm.statusStep ? parseInt(itemForm.statusStep) : undefined,
      paymentStatus: itemForm.paymentStatus || undefined,
      shippingRound: itemForm.shippingRound || undefined,
      trackingNumber: itemForm.trackingNumber || undefined,
      storePage: companyName, // Locked to order's company name
      remarks: itemForm.remarks || undefined,
      productImages: itemForm.productImages, // Always send array (even empty) to allow removal
    };

    if (editingItem) {
      updateItem.mutate(
        { id: editingItem.id, data: itemData },
        {
          onSuccess: () => {
            setShowItemForm(false);
            setEditingItem(null);
            resetItemForm();
          },
        }
      );
    } else {
      createItem.mutate(itemData, {
        onSuccess: () => {
          setShowItemForm(false);
          resetItemForm();
        },
      });
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
      productUrl: item.productUrl || '',
      priceYen: item.priceYen?.toString() || '',
      priceBaht: item.priceBaht?.toString() || '',
      weight: item.weight?.toString() || '',
      shippingCost: item.shippingCost?.toString() || '',
      itemStatus: statusName,
      statusStep: item.statusStep?.toString() || '1',
      paymentStatus: item.paymentStatus || 'pending',
      shippingRound: item.shippingRound || '',
      trackingNumber: item.trackingNumber || '',
      storePage: item.storePage || '',
      remarks: item.remarks || '',
      productImages: images,
    });
    setShowItemForm(true);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('คุณต้องการลบรายการสินค้านี้?')) {
      deleteItem.mutate(itemId);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      sequenceNumber: '',
      clickDate: '',
      clickChannel: '',
      clickerName: '',
      productCode: '',
      productUrl: '',
      priceYen: '',
      priceBaht: '',
      weight: '',
      shippingCost: '',
      itemStatus: 'รับออเดอร์',
      statusStep: '1',
      paymentStatus: 'pending',
      shippingRound: '',
      trackingNumber: '',
      storePage: '',
      remarks: '',
      productImages: [],
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
            : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${response.data.data.url}`;
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
      shipped: 'จัดส่งแล้ว',
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
      shipped: 'จัดส่งแล้ว',
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

  const getPaymentBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    const statusText: Record<string, string> = {
      pending: 'รอชำระ',
      partial: 'ชำระบางส่วน',
      paid: 'ชำระครบ',
      refunded: 'คืนเงิน',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status || 'pending']}`}>
        {statusText[status || 'pending']}
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
    <div className="min-h-screen bg-gray-50 p-6">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">รายละเอียด Order</h1>
              <p className="text-gray-600 mt-1">Order Number: {order.orderNumber}</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
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
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
                whileTap={buttonTap}
              >
                <Save className="w-5 h-5" />
                บันทึกการแก้ไข
              </motion.button>
              <motion.button
                onClick={handleDeleteOrder}
                disabled={deleteOrder.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                whileTap={buttonTap}
              >
                <Trash2 className="w-5 h-5" />
                ลบ Order
              </motion.button>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
              <select
                value={orderForm.customerId}
                onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- เลือกลูกค้า --</option>
                {customersData?.data.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName || customer.contactPerson || customer.phone || 'ไม่มีชื่อ'}
                    {customer.phone && ` (${customer.phone})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                value={orderForm.status}
                onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="pending">รอดำเนินการ</option>
                <option value="processing">กำลังดำเนินการ</option>
                <option value="shipped">จัดส่งแล้ว</option>
                <option value="delivered">ส่งถึงแล้ว</option>
                <option value="cancelled">ยกเลิก</option>
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
              <input
                type="text"
                value={orderForm.origin}
                onChange={(e) => setOrderForm({ ...orderForm, origin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น กรุงเทพ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ปลายทาง</label>
              <input
                type="text"
                value={orderForm.destination}
                onChange={(e) => setOrderForm({ ...orderForm, destination: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น โตเกียว"
              />
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

        {/* Order Items Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6 text-primary-600" />
                รายการสินค้า
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                ชื่อลูกค้า: <span className="font-semibold">{customerName}</span> •
                ชื่อเพจ/ร้าน: <span className="font-semibold">{companyName}</span>
                <span className="text-xs text-gray-500 ml-1">(ล็อคอัตโนมัติ)</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Export Button */}
              <motion.button
                onClick={() => handleExport('csv')}
                disabled={exporting || items.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
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
                  setShowItemForm(!showItemForm);
                }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
                whileTap={buttonTap}
              >
                <Plus className="w-5 h-5" />
                เพิ่มสินค้า
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
              </div>
            </motion.div>
          )}

          {/* Item Form */}
          {showItemForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-4 text-lg">
                {editingItem ? 'แก้ไขรายการสินค้า' : 'เพิ่มรายการสินค้าใหม่'}
              </h3>
              <form onSubmit={handleSubmitItem} className="space-y-4">
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
                    <input
                      type="text"
                      value={itemForm.clickerName}
                      onChange={(e) => setItemForm({ ...itemForm, clickerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="ชื่อผู้กด"
                    />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รหัสสินค้า</label>
                    <input
                      type="text"
                      value={itemForm.productCode}
                      onChange={(e) => setItemForm({ ...itemForm, productCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="PROD-001"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {STATUS_STEPS.map((s) => (
                        <option key={s.step} value={s.name}>
                          {s.step}. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สถานะการจ่าย</label>
                    <select
                      value={itemForm.paymentStatus}
                      onChange={(e) => setItemForm({ ...itemForm, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="pending">รอชำระ</option>
                      <option value="partial">ชำระบางส่วน</option>
                      <option value="paid">ชำระครบ</option>
                      <option value="refunded">คืนเงิน</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รอบส่งกลับ</label>
                    <input
                      type="text"
                      value={itemForm.shippingRound}
                      onChange={(e) => setItemForm({ ...itemForm, shippingRound: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Round 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={itemForm.trackingNumber}
                      onChange={(e) => setItemForm({ ...itemForm, trackingNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="TH123456"
                    />
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
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                    whileTap={buttonTap}
                  >
                    ยกเลิก
                  </motion.button>
                </div>
              </form>
            </div>
          )}

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
              <div className="overflow-x-auto">
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ลิ้งค์</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ราคา</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สถานะสินค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">การชำระ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tracking</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item: any) => {
                      const images = getProductImages(item);
                      const isSelected = selectedItems.has(item.id);
                      return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <td className="px-2 py-3 text-center">
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
                        </td>
                        <td className="px-4 py-3 text-sm">{item.sequenceNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {images.length > 0 ? (
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
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.productCode || '-'}</code>
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
                          {item.priceYen && <div className="font-medium">¥{item.priceYen.toLocaleString()}</div>}
                          {item.priceBaht && <div className="text-gray-600 text-xs">฿{item.priceBaht.toLocaleString()}</div>}
                          {!item.priceYen && !item.priceBaht && '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={item.statusStep || 1}
                            onChange={(e) => {
                              const newStep = parseInt(e.target.value);
                              const statusName = STATUS_STEPS.find(s => s.step === newStep)?.name || '';
                              updateItem.mutate({
                                id: item.id,
                                data: {
                                  statusStep: newStep,
                                  itemStatus: statusName
                                }
                              });
                            }}
                            className={`text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer ${
                              item.statusStep === 8 ? 'bg-green-100 border-green-300 text-green-800' :
                              item.statusStep === 7 ? 'bg-blue-100 border-blue-300 text-blue-800' :
                              item.statusStep >= 5 ? 'bg-indigo-100 border-indigo-300 text-indigo-800' :
                              item.statusStep >= 3 ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                              'bg-gray-100 border-gray-300 text-gray-800'
                            }`}
                          >
                            {STATUS_STEPS.map((s) => (
                              <option key={s.step} value={s.step}>
                                {s.step}. {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">{getPaymentBadge(item.paymentStatus)}</td>
                        <td className="px-4 py-3 text-sm">
                          {item.trackingNumber ? (
                            <code className="text-xs text-gray-600">{item.trackingNumber}</code>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              whileTap={buttonTap}
                              title="แก้ไข"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              whileTap={buttonTap}
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
                <span>รวม {items.length} รายการ</span>
                {items.reduce((sum, item) => sum + (item.priceBaht || 0), 0) > 0 && (
                  <span className="font-semibold">
                    ยอดรวม: ฿{items.reduce((sum, item) => sum + (item.priceBaht || 0), 0).toLocaleString()}
                  </span>
                )}
              </div>
            </>
          )}
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
    </div>
  );
};

export default OrderDetailPage;
