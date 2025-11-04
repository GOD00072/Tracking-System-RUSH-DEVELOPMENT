import { Calculator } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCalculatorSettings } from '../../hooks/useCalculatorSettings';
import { pageTransition, staggerContainer, staggerItem, buttonTap } from '../../lib/animations';
import LoadingSpinner from '../../components/LoadingSpinner';

const CalculatorPage = () => {
  const { data: settings, isLoading } = useCalculatorSettings();

  const [userLevel, setUserLevel] = useState('member');
  const [productPrice, setProductPrice] = useState('0');
  const [weight, setWeight] = useState('1');
  const [deliveryDays, setDeliveryDays] = useState('air');
  const [productType, setProductType] = useState('');
  const [repackService, setRepackService] = useState(false);
  const [productLength, setProductLength] = useState('30');
  const [courierService, setCourierService] = useState('dhl');
  const [deliveryArea, setDeliveryArea] = useState('bangkok');
  const [boxWidth, setBoxWidth] = useState('0');
  const [boxLength, setBoxLength] = useState('0');
  const [boxHeight, setBoxHeight] = useState('0');

  // Get rates from settings (with fallback values)
  const exchangeRates = settings?.exchange_rates || { member: 0.250, vip: 0.240, vvip: 0.230 };
  const shippingRates = settings?.shipping_rates_japan || { air: 700, sea: 1000 };
  const courierRates = settings?.courier_rates_thailand || { dhl: 26, best: 35, lalamove: 50 };
  const additionalServices = settings?.additional_services || { repack: 50 };

  // Exchange rate based on user level
  const exchangeRate = exchangeRates[userLevel as keyof typeof exchangeRates];

  // Calculate costs
  const productCost = parseFloat(productPrice) * exchangeRate;
  const shippingFromJapan = deliveryDays === 'air' ? shippingRates.air : shippingRates.sea;
  const repackFee = repackService ? additionalServices.repack : 0;
  const courierFee = courierRates[courierService as keyof typeof courierRates];
  const totalCost = productCost + shippingFromJapan + repackFee + courierFee;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
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
              {/* User Level */}
              <div>
                <label className="block font-medium mb-2">
                  ระดับของผู้ใช้งาน <span className="text-sm text-gray-500">(เรท: {exchangeRate.toFixed(3)})</span>
                </label>
                <select value={userLevel} onChange={(e) => setUserLevel(e.target.value)} className="input-field">
                  <option value="member">Member</option>
                  <option value="vip">VIP</option>
                  <option value="vvip">VVIP</option>
                </select>
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

              {/* Repack Service */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="repack"
                  checked={repackService}
                  onChange={(e) => setRepackService(e.target.checked)}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <label htmlFor="repack" className="ml-2 font-medium">
                  บริการเสริม Repack/Bubble (+฿50)
                </label>
              </div>

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
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-primary-200">
                <span className="text-gray-700">• ค่าสินค้า:</span>
                <span className="font-semibold">฿{productCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-primary-200">
                <span className="text-gray-700">• ค่าขนส่งจากญี่ปุ่น ({deliveryDays.toUpperCase()}):</span>
                <span className="font-semibold">฿{shippingFromJapan.toFixed(2)}</span>
              </div>
              {repackService && (
                <div className="flex justify-between py-2 border-b border-primary-200">
                  <span className="text-gray-700">• Repack/Bubble:</span>
                  <span className="font-semibold">฿{repackFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-primary-200">
                <span className="text-gray-700">• ค่าจัดส่งในไทย:</span>
                <span className="font-semibold">฿{courierFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-4 bg-primary-500 text-white px-4 rounded-lg mt-4">
                <span className="font-bold text-lg">รวมทั้งหมด:</span>
                <span className="font-bold text-2xl">฿{totalCost.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CalculatorPage;
