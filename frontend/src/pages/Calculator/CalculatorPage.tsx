import { Calculator, Package, Crown, Star, User, Check, icons } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCalculatorSettings } from '../../hooks/useCalculatorSettings';
import { pageTransition, staggerContainer, staggerItem, buttonTap } from '../../lib/animations';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../lib/api';

interface AdditionalService {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface TierInfo {
  tierCode: string;
  tierName: string;
  tierNameTh: string | null;
  exchangeRate: number;
  color: string | null;
  icon: string | null;
}

// Dynamic icon component
const DynamicIcon = ({ name, className }: { name: string | null; className?: string }) => {
  if (!name) return <Crown className={className} />;

  // Map icon names to components
  const iconMap: Record<string, any> = {
    'User': User,
    'Star': Star,
    'Crown': Crown,
  };

  const IconComponent = iconMap[name] || (icons as any)[name] || Crown;
  return <IconComponent className={className} />;
};

const CalculatorPage = () => {
  const { data: settings, isLoading } = useCalculatorSettings();

  // Tiers from API
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);

  const [userLevel, setUserLevel] = useState('member');
  const [productPrice, setProductPrice] = useState('0');
  const [weight, setWeight] = useState('1');
  const [deliveryDays, setDeliveryDays] = useState('air');
  const [productType, setProductType] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [productLength, setProductLength] = useState('30');
  const [courierService, setCourierService] = useState('dhl');
  const [deliveryArea, setDeliveryArea] = useState('bangkok');
  const [boxWidth, setBoxWidth] = useState('0');
  const [boxLength, setBoxLength] = useState('0');
  const [boxHeight, setBoxHeight] = useState('0');

  // Fetch tiers from API
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await api.get('/tiers/public');
        if (res.data.success && res.data.data.length > 0) {
          setTiers(res.data.data);
        } else {
          // Fallback
          setTiers([
            { tierCode: 'member', tierName: 'Member', tierNameTh: 'สมาชิก', exchangeRate: 0.25, color: '#6B7280', icon: 'User' },
            { tierCode: 'vip', tierName: 'VIP', tierNameTh: 'วีไอพี', exchangeRate: 0.24, color: '#F59E0B', icon: 'Star' },
            { tierCode: 'vvip', tierName: 'VVIP', tierNameTh: 'วีวีไอพี', exchangeRate: 0.23, color: '#7C3AED', icon: 'Crown' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching tiers:', error);
        // Fallback
        setTiers([
          { tierCode: 'member', tierName: 'Member', tierNameTh: 'สมาชิก', exchangeRate: 0.25, color: '#6B7280', icon: 'User' },
          { tierCode: 'vip', tierName: 'VIP', tierNameTh: 'วีไอพี', exchangeRate: 0.24, color: '#F59E0B', icon: 'Star' },
          { tierCode: 'vvip', tierName: 'VVIP', tierNameTh: 'วีวีไอพี', exchangeRate: 0.23, color: '#7C3AED', icon: 'Crown' },
        ]);
      } finally {
        setTiersLoading(false);
      }
    };
    fetchTiers();
  }, []);

  // Get rates from settings (with fallback values)
  const shippingRates = settings?.shipping_rates_japan || { air: 700, sea: 1000 };
  const courierRates = settings?.courier_rates_thailand || { dhl: 26, best: 35, lalamove: 50 };

  // Parse additional services - support both old format (object) and new format (array)
  const additionalServices: AdditionalService[] = useMemo(() => {
    if (!settings?.additional_services) {
      return [{ id: '1', name: 'Repack/Bubble', price: 50, isActive: true }];
    }

    if (Array.isArray(settings.additional_services)) {
      return settings.additional_services.filter((s: AdditionalService) => s.isActive);
    }

    // Convert old format to new format
    if (typeof settings.additional_services === 'object') {
      return Object.entries(settings.additional_services).map(([name, price], index) => ({
        id: (index + 1).toString(),
        name: name === 'repack' ? 'Repack/Bubble' : name,
        price: price as number,
        isActive: true,
      }));
    }

    return [];
  }, [settings?.additional_services]);

  // Get selected tier info
  const selectedTier = useMemo(() => {
    return tiers.find(t => t.tierCode === userLevel) || tiers[0];
  }, [tiers, userLevel]);

  // Exchange rate from selected tier
  const exchangeRate = selectedTier?.exchangeRate || 0.25;

  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Calculate selected services total
  const selectedServicesCost = useMemo(() => {
    return additionalServices
      .filter((s) => selectedServices.includes(s.id))
      .reduce((total, s) => total + s.price, 0);
  }, [additionalServices, selectedServices]);

  // Get selected services for display
  const selectedServicesDetails = useMemo(() => {
    return additionalServices.filter((s) => selectedServices.includes(s.id));
  }, [additionalServices, selectedServices]);

  // Calculate costs
  const productCost = parseFloat(productPrice) * exchangeRate;
  const shippingFromJapan = deliveryDays === 'air' ? shippingRates.air : shippingRates.sea;
  const courierFee = courierRates[courierService as keyof typeof courierRates];
  const totalCost = productCost + shippingFromJapan + selectedServicesCost + courierFee;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (isLoading || tiersLoading) {
    return (
      <div className="container-custom py-12 flex items-center justify-center min-h-screen">
        <LoadingSpinner size={300} text="กำลังโหลดข้อมูลการคำนวณ..." />
      </div>
    );
  }

  return (
    <motion.div
      className="container-custom py-12"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <Calculator className="w-16 h-16 text-accent-500 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">โปรแกรมคำนวณราคา</h1>
          <p className="text-gray-600">คำนวณค่าใช้จ่ายโดยประมาณ</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Form Section */}
          <motion.form
            onSubmit={handleCalculate}
            className="lg:col-span-2 card"
            variants={staggerItem}
          >
            <div className="space-y-6">
              {/* User Level - Dynamic from API */}
              <div>
                <label className="block font-medium mb-3">
                  <Crown className="w-4 h-4 inline mr-1" />
                  ระดับของผู้ใช้งาน
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {tiers.map((tier) => (
                    <motion.button
                      key={tier.tierCode}
                      type="button"
                      onClick={() => setUserLevel(tier.tierCode)}
                      whileTap={buttonTap}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        userLevel === tier.tierCode
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: tier.color || '#6B7280' }}
                        >
                          <DynamicIcon name={tier.icon} className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold">{tier.tierName}</p>
                          {tier.tierNameTh && (
                            <p className="text-xs text-gray-500">{tier.tierNameTh}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-center py-2 bg-gray-100 rounded-lg">
                        <span className="text-lg font-bold" style={{ color: tier.color || '#6B7280' }}>
                          {tier.exchangeRate}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">฿/¥</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Product Price */}
              <div>
                <label className="block font-medium mb-2">ราคาสินค้า (¥)</label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="input-field"
                  min="0"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block font-medium mb-2">น้ำหนักสินค้าโดยประมาณ (KG)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="input-field"
                  min="0.1"
                  step="0.1"
                />
              </div>

              {/* Delivery Days */}
              <div>
                <label className="block font-medium mb-2">จำนวนวันที่ต้องการใช้สินค้า</label>
                <select value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} className="input-field">
                  <option value="air">ไม่เกิน 20 วัน (AIR)</option>
                  <option value="sea">30-45 วัน (SEA)</option>
                </select>
              </div>

              {/* Product Type (AIR only) */}
              {deliveryDays === 'air' && (
                <div>
                  <label className="block font-medium mb-2">ประเภทสินค้า (AIR เท่านั้น)</label>
                  <select value={productType} onChange={(e) => setProductType(e.target.value)} className="input-field">
                    <option value="">เลือกประเภทสินค้า</option>
                    <option value="general">สินค้าทั่วไป</option>
                    <option value="electronics">อิเล็กทรอนิกส์</option>
                    <option value="cosmetics">เครื่องสำอาง</option>
                    <option value="food">อาหาร</option>
                  </select>
                </div>
              )}

              {/* Additional Services - Button Style */}
              {additionalServices.length > 0 && (
                <div>
                  <label className="block font-medium mb-3">
                    <Package className="w-4 h-4 inline mr-1" />
                    บริการเสริม
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {additionalServices.map((service) => {
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <motion.button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          whileTap={buttonTap}
                          whileHover={{ scale: 1.02 }}
                          className={`relative px-4 py-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {/* Check icon when selected */}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Package className={`w-5 h-5 ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`} />
                            <div className="text-left">
                              <p className={`font-medium ${isSelected ? 'text-cyan-700' : 'text-gray-700'}`}>
                                {service.name}
                              </p>
                              <p className={`text-sm font-bold ${isSelected ? 'text-cyan-600' : 'text-gray-500'}`}>
                                +฿{service.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  {selectedServices.length > 0 && (
                    <p className="text-sm text-cyan-600 mt-3 font-medium">
                      เลือก {selectedServices.length} บริการ รวม ฿{selectedServicesCost.toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Product Length */}
              <div>
                <label className="block font-medium mb-2">ความยาวของสินค้า (cm)</label>
                <input
                  type="number"
                  value={productLength}
                  onChange={(e) => setProductLength(e.target.value)}
                  className="input-field"
                  min="0"
                />
              </div>

              {/* Courier Service in Thailand */}
              <div>
                <label className="block font-medium mb-2">ผู้ให้บริการขนส่งในไทย</label>
                <div className="flex flex-wrap gap-2 mt-2 w-full">
                  <motion.button
                    type="button"
                    onClick={() => setCourierService('dhl')}
                    whileTap={buttonTap}
                    whileHover={{ scale: 1.05 }}
                    className={`px-3 py-1 rounded-xl transition text-sm font-bold italic ${
                      courierService === 'dhl'
                        ? 'ring-2 ring-black scale-105 bg-[#FFCC00] text-[#D40511]'
                        : 'bg-[#FFCC00] text-[#D40511] opacity-50'
                    }`}
                  >
                    DHL Express
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setCourierService('best')}
                    whileTap={buttonTap}
                    whileHover={{ scale: 1.05 }}
                    className={`px-3 py-1 rounded-xl transition text-sm font-bold uppercase tracking-wide italic bg-[#333333] text-[#FF6600] ${
                      courierService === 'best'
                        ? 'opacity-100 scale-105'
                        : 'opacity-50'
                    }`}
                    style={{ transform: courierService === 'best' ? 'skewX(-10deg) scale(1.05)' : 'skewX(-10deg)' }}
                  >
                    BEST Express
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setCourierService('lalamove')}
                    whileTap={buttonTap}
                    whileHover={{ scale: 1.05 }}
                    className={`px-3 py-1 rounded-xl transition text-sm font-bold bg-[#FF7F00] text-white ${
                      courierService === 'lalamove'
                        ? 'opacity-100 scale-105'
                        : 'opacity-50'
                    }`}
                  >
                    Lalamove
                  </motion.button>
                </div>
              </div>

              {/* Delivery Area */}
              {courierService === 'dhl' && (
                <div>
                  <label className="block font-medium mb-2">พื้นที่จัดส่งในไทย (DHL)</label>
                  <select value={deliveryArea} onChange={(e) => setDeliveryArea(e.target.value)} className="input-field">
                    <option value="bangkok">กรุงเทพและปริมณฑล</option>
                    <option value="upcountry">ต่างจังหวัด</option>
                  </select>
                </div>
              )}

              {/* Box Dimensions */}
              <div>
                <label className="block font-medium mb-2">ขนาดกล่อง (กว้าง + ยาว + สูง) cm</label>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    value={boxWidth}
                    onChange={(e) => setBoxWidth(e.target.value)}
                    placeholder="กว้าง"
                    className="input-field"
                    min="0"
                  />
                  <input
                    type="number"
                    value={boxLength}
                    onChange={(e) => setBoxLength(e.target.value)}
                    placeholder="ยาว"
                    className="input-field"
                    min="0"
                  />
                  <input
                    type="number"
                    value={boxHeight}
                    onChange={(e) => setBoxHeight(e.target.value)}
                    placeholder="สูง"
                    className="input-field"
                    min="0"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  รวม: {parseInt(boxWidth || '0') + parseInt(boxLength || '0') + parseInt(boxHeight || '0')} cm
                </p>
              </div>
            </div>
          </motion.form>

          {/* Cost Summary */}
          <motion.div
            className="card bg-primary-50 border-primary-200"
            variants={staggerItem}
          >
            <h2 className="text-xl font-bold mb-6">ค่าใช้จ่ายโดยประมาณ</h2>

            {/* Selected Tier Info */}
            {selectedTier && (
              <div className="mb-4 p-3 rounded-lg bg-white border border-primary-200">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedTier.color || '#6B7280' }}
                  >
                    <DynamicIcon name={selectedTier.icon} className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium">{selectedTier.tierName}</span>
                  <span className="text-sm text-gray-500">
                    (เรท: {selectedTier.exchangeRate} ฿/¥)
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-primary-200">
                <span className="text-gray-700">ค่าสินค้า:</span>
                <span className="font-semibold">฿{productCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-primary-200">
                <span className="text-gray-700">ค่าขนส่งจาก JP ({deliveryDays.toUpperCase()}):</span>
                <span className="font-semibold">฿{shippingFromJapan.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Selected Additional Services */}
              {selectedServicesDetails.length > 0 && (
                <div className="py-2 border-b border-primary-200">
                  <p className="text-gray-700 mb-2">บริการเสริม:</p>
                  {selectedServicesDetails.map((service) => (
                    <div key={service.id} className="flex justify-between pl-4 py-1">
                      <span className="text-gray-600 text-sm">• {service.name}</span>
                      <span className="font-medium text-sm">฿{service.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between py-2 border-b border-primary-200">
                <span className="text-gray-700">ค่าจัดส่งในไทย:</span>
                <span className="font-semibold">฿{courierFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between py-4 bg-primary-500 text-white px-4 rounded-lg mt-4">
                <span className="font-bold text-lg">รวมทั้งหมด:</span>
                <span className="font-bold text-2xl">฿{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Summary note */}
              <p className="text-xs text-gray-500 mt-4">
                * ราคานี้เป็นการประมาณการเบื้องต้น ราคาจริงอาจแตกต่างตามน้ำหนักและขนาดจริงของสินค้า
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CalculatorPage;
