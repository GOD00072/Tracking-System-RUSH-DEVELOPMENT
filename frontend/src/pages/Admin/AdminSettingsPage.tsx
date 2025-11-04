import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useCalculatorSettings, useUpdateCalculatorSettings } from '../../hooks/useCalculatorSettings';
import { pageTransition, staggerContainer, staggerItem, buttonTap } from '../../lib/animations';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminSettingsPage = () => {
  const { data: settings, isLoading } = useCalculatorSettings();
  const updateSettings = useUpdateCalculatorSettings();

  const [exchangeRates, setExchangeRates] = useState({
    member: '0.250',
    vip: '0.240',
    vvip: '0.230',
  });

  const [shippingRates, setShippingRates] = useState({
    air: '700',
    sea: '1000',
  });

  const [courierRates, setCourierRates] = useState({
    dhl: '26',
    best: '35',
    lalamove: '50',
  });

  const [repackFee, setRepackFee] = useState('50');

  const [companyInfo, setCompanyInfo] = useState({
    name: 'Ship Tracking Company',
    address: '',
    phone: '',
    email: '',
  });

  // Load settings from API
  useEffect(() => {
    if (settings) {
      setExchangeRates({
        member: settings.exchange_rates.member.toString(),
        vip: settings.exchange_rates.vip.toString(),
        vvip: settings.exchange_rates.vvip.toString(),
      });
      setShippingRates({
        air: settings.shipping_rates_japan.air.toString(),
        sea: settings.shipping_rates_japan.sea.toString(),
      });
      setCourierRates({
        dhl: settings.courier_rates_thailand.dhl.toString(),
        best: settings.courier_rates_thailand.best.toString(),
        lalamove: settings.courier_rates_thailand.lalamove.toString(),
      });
      setRepackFee(settings.additional_services.repack.toString());
      setCompanyInfo(settings.company_info);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        exchange_rates: {
          member: parseFloat(exchangeRates.member),
          vip: parseFloat(exchangeRates.vip),
          vvip: parseFloat(exchangeRates.vvip),
        },
        shipping_rates_japan: {
          air: parseFloat(shippingRates.air),
          sea: parseFloat(shippingRates.sea),
        },
        courier_rates_thailand: {
          dhl: parseFloat(courierRates.dhl),
          best: parseFloat(courierRates.best),
          lalamove: parseFloat(courierRates.lalamove),
        },
        additional_services: {
          repack: parseFloat(repackFee),
        },
        company_info: companyInfo,
      });
      toast.success('บันทึกการตั้งค่าสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <LoadingSpinner size={300} text="กำลังโหลดการตั้งค่า..." />
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
            <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
            <p className="text-gray-600 mt-2">จัดการค่าต่างๆ ของระบบ</p>
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
          {/* Exchange Rates */}
          <motion.div className="card" variants={staggerItem}>
            <h2 className="text-xl font-bold mb-4">อัตราแลกเปลี่ยน (¥ → ฿)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-2">Member</label>
                <input
                  type="number"
                  value={exchangeRates.member}
                  onChange={(e) => setExchangeRates({...exchangeRates, member: e.target.value})}
                  className="input-field"
                  step="0.001"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">VIP</label>
                <input
                  type="number"
                  value={exchangeRates.vip}
                  onChange={(e) => setExchangeRates({...exchangeRates, vip: e.target.value})}
                  className="input-field"
                  step="0.001"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">VVIP</label>
                <input
                  type="number"
                  value={exchangeRates.vvip}
                  onChange={(e) => setExchangeRates({...exchangeRates, vvip: e.target.value})}
                  className="input-field"
                  step="0.001"
                />
              </div>
            </div>
          </motion.div>

          {/* Shipping from Japan */}
          <motion.div className="card" variants={staggerItem}>
            <h2 className="text-xl font-bold mb-4">ค่าขนส่งจากญี่ปุ่น (฿)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">ทางเครื่องบิน (AIR)</label>
                <input
                  type="number"
                  value={shippingRates.air}
                  onChange={(e) => setShippingRates({...shippingRates, air: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">ทางเรือ (SEA)</label>
                <input
                  type="number"
                  value={shippingRates.sea}
                  onChange={(e) => setShippingRates({...shippingRates, sea: e.target.value})}
                  className="input-field"
                />
              </div>
            </div>
          </motion.div>

          {/* Courier Rates in Thailand */}
          <motion.div className="card" variants={staggerItem}>
            <h2 className="text-xl font-bold mb-4">ค่าจัดส่งในไทย (฿)</h2>
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

          {/* Additional Services */}
          <motion.div className="card" variants={staggerItem}>
            <h2 className="text-xl font-bold mb-4">บริการเสริม (฿)</h2>
            <div className="max-w-sm">
              <label className="block font-medium mb-2">Repack/Bubble</label>
              <input
                type="number"
                value={repackFee}
                onChange={(e) => setRepackFee(e.target.value)}
                className="input-field"
              />
            </div>
          </motion.div>

          {/* Company Info */}
          <motion.div className="card" variants={staggerItem}>
            <h2 className="text-xl font-bold mb-4">ข้อมูลบริษัท</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">ชื่อบริษัท</label>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                  className="input-field"
                  placeholder="Ship Tracking Company"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">ที่อยู่</label>
                <textarea
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                  className="input-field"
                  rows={3}
                  placeholder="กรุงเทพมหานคร"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                    className="input-field"
                    placeholder="02-XXX-XXXX"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">อีเมล</label>
                  <input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                    className="input-field"
                    placeholder="info@shiptracking.com"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminSettingsPage;
