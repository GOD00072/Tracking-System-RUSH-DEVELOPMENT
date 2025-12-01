import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, Crown, ChevronRight, Ship, Plane, Truck, Package,
  RefreshCw, Calculator, CheckCircle, Plus, Edit2, Trash2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalculatorSettings, useUpdateCalculatorSettings } from '../../hooks/useCalculatorSettings';
import { pageTransition, staggerContainer, staggerItem, buttonTap } from '../../lib/animations';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../lib/api';

interface TierData {
  tierCode: string;
  tierName: string;
  tierNameTh: string | null;
  exchangeRate: number;
  color: string | null;
}

interface AdditionalService {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

const AdminPricingPage = () => {
  const navigate = useNavigate();
  const { data: settings, isLoading } = useCalculatorSettings();
  const updateSettings = useUpdateCalculatorSettings();

  // Tier data for exchange rates display
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);

  const [shippingRates, setShippingRates] = useState({
    air: '700',
    sea: '1000',
  });

  const [courierRates, setCourierRates] = useState({
    dhl: '26',
    best: '35',
    lalamove: '50',
  });

  // Additional services (dynamic)
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);

  // Modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<AdditionalService | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '' });

  // Fetch tiers for exchange rate display
  const fetchTiers = async () => {
    setTiersLoading(true);
    try {
      const res = await api.get('/tiers');
      if (res.data.success) {
        setTiers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setTiersLoading(false);
    }
  };

  // Load settings from API
  useEffect(() => {
    if (settings) {
      if (settings.shipping_rates_japan) {
        setShippingRates({
          air: settings.shipping_rates_japan.air?.toString() || '700',
          sea: settings.shipping_rates_japan.sea?.toString() || '1000',
        });
      }
      if (settings.courier_rates_thailand) {
        setCourierRates({
          dhl: settings.courier_rates_thailand.dhl?.toString() || '26',
          best: settings.courier_rates_thailand.best?.toString() || '35',
          lalamove: settings.courier_rates_thailand.lalamove?.toString() || '50',
        });
      }

      // Handle both old format (object) and new format (array)
      if (Array.isArray(settings.additional_services)) {
        setAdditionalServices(settings.additional_services);
      } else if (typeof settings.additional_services === 'object') {
        // Convert old format to new format
        const converted: AdditionalService[] = Object.entries(settings.additional_services).map(
          ([name, price], index) => ({
            id: (index + 1).toString(),
            name: name === 'repack' ? 'Repack/Bubble' : name,
            price: price as number,
            isActive: true,
          })
        );
        setAdditionalServices(converted);
      }
    }
  }, [settings]);

  // Load tiers
  useEffect(() => {
    fetchTiers();
  }, []);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        shipping_rates_japan: {
          air: parseFloat(shippingRates.air),
          sea: parseFloat(shippingRates.sea),
        },
        courier_rates_thailand: {
          dhl: parseFloat(courierRates.dhl),
          best: parseFloat(courierRates.best),
          lalamove: parseFloat(courierRates.lalamove),
        },
        additional_services: additionalServices,
      });
      toast.success('บันทึกการตั้งค่าราคาสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // Service modal handlers
  const openAddServiceModal = () => {
    setEditingService(null);
    setServiceForm({ name: '', price: '' });
    setShowServiceModal(true);
  };

  const openEditServiceModal = (service: AdditionalService) => {
    setEditingService(service);
    setServiceForm({ name: service.name, price: service.price.toString() });
    setShowServiceModal(true);
  };

  const closeServiceModal = () => {
    setShowServiceModal(false);
    setEditingService(null);
    setServiceForm({ name: '', price: '' });
  };

  const handleSaveService = () => {
    if (!serviceForm.name.trim() || !serviceForm.price) {
      toast.error('กรุณากรอกชื่อบริการและราคา');
      return;
    }

    const price = parseFloat(serviceForm.price);
    if (isNaN(price) || price < 0) {
      toast.error('ราคาไม่ถูกต้อง');
      return;
    }

    if (editingService) {
      // Update existing service
      setAdditionalServices(prev =>
        prev.map(s =>
          s.id === editingService.id
            ? { ...s, name: serviceForm.name.trim(), price }
            : s
        )
      );
      toast.success('อัพเดทบริการเสริมแล้ว');
    } else {
      // Add new service
      const newService: AdditionalService = {
        id: Date.now().toString(),
        name: serviceForm.name.trim(),
        price,
        isActive: true,
      };
      setAdditionalServices(prev => [...prev, newService]);
      toast.success('เพิ่มบริการเสริมแล้ว');
    }

    closeServiceModal();
  };

  const handleDeleteService = (serviceId: string) => {
    if (!confirm('ต้องการลบบริการนี้หรือไม่?')) return;

    setAdditionalServices(prev => prev.filter(s => s.id !== serviceId));
    toast.success('ลบบริการเสริมแล้ว');
  };

  const handleToggleServiceActive = (serviceId: string) => {
    setAdditionalServices(prev =>
      prev.map(s =>
        s.id === serviceId ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <LoadingSpinner size={300} text="กำลังโหลดการตั้งค่าราคา..." />
      </div>
    );
  }

  return (
    <motion.div
      className="p-8"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <div className="max-w-4xl">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-600" />
              ตั้งค่าราคา
            </h1>
            <p className="text-gray-600 mt-2">จัดการอัตราค่าขนส่งและบริการเสริม</p>
          </div>
          <motion.button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={buttonTap}
          >
            <Save className="w-5 h-5" />
            บันทึกการตั้งค่า
          </motion.button>
        </motion.div>

        <motion.div
          className="space-y-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Exchange Rates - Synced from Tier Settings (Read Only) */}
          <motion.div className="card border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50" variants={staggerItem}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-amber-600" />
                <div>
                  <h2 className="text-xl font-bold">อัตราแลกเปลี่ยน (¥ → ฿)</h2>
                  <p className="text-sm text-gray-600">ซิงค์จากระบบระดับลูกค้า (Tier Settings)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTiers}
                  className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                  title="รีเฟรช"
                >
                  <RefreshCw className={`w-4 h-4 ${tiersLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => navigate('/admin/tier-settings')}
                  className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 font-medium"
                >
                  จัดการระดับลูกค้า
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {tiersLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((tier) => (
                  <div
                    key={tier.tierCode}
                    className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tier.color || '#6B7280' }}
                      >
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{tier.tierName}</p>
                        {tier.tierNameTh && (
                          <p className="text-xs text-gray-500">{tier.tierNameTh}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-center mt-3 py-2 bg-amber-50 rounded-lg">
                      <span className="text-2xl font-bold text-amber-600">{tier.exchangeRate}</span>
                      <span className="text-sm text-gray-500 ml-1">฿/¥</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-amber-700 mt-4 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              อัตราแลกเปลี่ยนจะถูกใช้อัตโนมัติตามระดับลูกค้า
            </p>
          </motion.div>

          {/* Shipping from Japan */}
          <motion.div className="card" variants={staggerItem}>
            <div className="flex items-center gap-3 mb-4">
              <Ship className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold">ค่าขนส่งจากญี่ปุ่น (฿/กก.)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 font-medium mb-2">
                  <Plane className="w-4 h-4 text-purple-500" />
                  ทางเครื่องบิน (AIR)
                </label>
                <input
                  type="number"
                  value={shippingRates.air}
                  onChange={(e) => setShippingRates({...shippingRates, air: e.target.value})}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">ราคาต่อกิโลกรัม</p>
              </div>
              <div>
                <label className="flex items-center gap-2 font-medium mb-2">
                  <Ship className="w-4 h-4 text-blue-500" />
                  ทางเรือ (SEA)
                </label>
                <input
                  type="number"
                  value={shippingRates.sea}
                  onChange={(e) => setShippingRates({...shippingRates, sea: e.target.value})}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">ราคาต่อกิโลกรัม</p>
              </div>
            </div>
          </motion.div>

          {/* Courier Rates in Thailand */}
          <motion.div className="card" variants={staggerItem}>
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold">ค่าจัดส่งในไทย (฿)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-2">DHL Express</label>
                <input
                  type="number"
                  value={courierRates.dhl}
                  onChange={(e) => setCourierRates({...courierRates, dhl: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">BEST Express</label>
                <input
                  type="number"
                  value={courierRates.best}
                  onChange={(e) => setCourierRates({...courierRates, best: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Lalamove</label>
                <input
                  type="number"
                  value={courierRates.lalamove}
                  onChange={(e) => setCourierRates({...courierRates, lalamove: e.target.value})}
                  className="input-field"
                />
              </div>
            </div>
          </motion.div>

          {/* Additional Services - Dynamic */}
          <motion.div className="card" variants={staggerItem}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-cyan-600" />
                <h2 className="text-xl font-bold">บริการเสริม (฿)</h2>
              </div>
              <motion.button
                onClick={openAddServiceModal}
                className="btn-secondary flex items-center gap-2 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={buttonTap}
              >
                <Plus className="w-4 h-4" />
                เพิ่มบริการ
              </motion.button>
            </div>

            {additionalServices.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>ยังไม่มีบริการเสริม</p>
                <button
                  onClick={openAddServiceModal}
                  className="mt-2 text-sm text-cyan-600 hover:text-cyan-700"
                >
                  + เพิ่มบริการแรก
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {additionalServices.map((service) => (
                  <motion.div
                    key={service.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      service.isActive
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleServiceActive(service.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          service.isActive ? 'bg-cyan-500' : 'bg-gray-300'
                        }`}
                        title={service.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            service.isActive ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>

                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500">
                          {service.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-cyan-600">฿{service.price.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditServiceModal(service)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">
              * บริการที่ปิดใช้งานจะไม่แสดงในหน้าคำนวณราคา
            </p>
          </motion.div>

          {/* Price Summary Info */}
          <motion.div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200" variants={staggerItem}>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              วิธีคำนวณราคา
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">ราคาสินค้า</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>ราคาสินค้า (¥) × อัตราแลกเปลี่ยนตาม Tier</li>
                  <li>ตัวอย่าง: ¥10,000 × 0.25 = ฿2,500</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">ค่าจัดส่ง</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>น้ำหนัก (กก.) × ค่าขนส่ง JP-TH</li>
                  <li>+ ค่าจัดส่งในไทย (ถ้ามี)</li>
                  <li>+ บริการเสริม (ถ้ามี)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Add/Edit Service Modal */}
      <AnimatePresence>
        {showServiceModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeServiceModal}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">
                  {editingService ? 'แก้ไขบริการเสริม' : 'เพิ่มบริการเสริม'}
                </h2>
                <button
                  onClick={closeServiceModal}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block font-medium mb-2">ชื่อบริการ</label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="input-field"
                    placeholder="เช่น Repack/Bubble, ประกันสินค้า"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">ราคา (฿)</label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="input-field"
                    placeholder="50"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
                <button onClick={closeServiceModal} className="btn-secondary">
                  ยกเลิก
                </button>
                <motion.button
                  onClick={handleSaveService}
                  className="btn-primary flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={buttonTap}
                >
                  <Save className="w-4 h-4" />
                  {editingService ? 'บันทึก' : 'เพิ่ม'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPricingPage;
