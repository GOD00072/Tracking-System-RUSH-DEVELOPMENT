import { useState, useEffect } from 'react';
import { Save, MessageCircle, CheckCircle, XCircle, Building2, CreditCard, Upload, X, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useCalculatorSettings, useUpdateCalculatorSettings } from '../../hooks/useCalculatorSettings';
import { pageTransition, staggerContainer, staggerItem, buttonTap } from '../../lib/animations';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../lib/api';
import { BACKEND_URL } from '../../utils/apiConfig';

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

  const [lineSettings, setLineSettings] = useState({
    enabled: false,
    channel_access_token: '',
    channel_secret: '',
    webhook_url: '',
    auto_notify_shipping_update: true,
    notify_on_status: ['shipped', 'in_transit', 'delivered'],
  });

  const [lineLoading, setLineLoading] = useState(false);

  // Bank info settings for payment notifications
  const [bankInfo, setBankInfo] = useState({
    bankName: 'ธนาคารกสิกรไทย',
    accountName: 'บริษัท ปักกุเนโกะ จำกัด',
    accountNumber: '123-4-56789-0',
    qrCodeUrl: '',
  });
  const [bankLoading, setBankLoading] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

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

  // Load LINE settings
  useEffect(() => {
    fetchLineSettings();
    fetchBankSettings();
  }, []);

  const fetchLineSettings = async () => {
    try {
      const response = await api.get('/settings/line');
      if (response.data.success) {
        setLineSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error loading LINE settings:', error);
    }
  };

  const fetchBankSettings = async () => {
    try {
      const response = await api.get('/settings/bank');
      if (response.data.success && response.data.data) {
        setBankInfo({
          bankName: response.data.data.bankName || 'ธนาคารกสิกรไทย',
          accountName: response.data.data.accountName || 'บริษัท ปักกุเนโกะ จำกัด',
          accountNumber: response.data.data.accountNumber || '123-4-56789-0',
          qrCodeUrl: response.data.data.qrCodeUrl || '',
        });
      }
    } catch (error) {
      console.error('Error loading bank settings:', error);
    }
  };

  const handleSaveBank = async () => {
    setBankLoading(true);
    try {
      const response = await api.put('/settings/bank', bankInfo);
      if (response.data.success) {
        toast.success('บันทึกข้อมูลธนาคารสำเร็จ');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลธนาคาร');
    } finally {
      setBankLoading(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success && response.data.data.url) {
        const imageUrl = response.data.data.url.startsWith('http')
          ? response.data.data.url
          : `${BACKEND_URL}${response.data.data.url}`;
        setBankInfo({ ...bankInfo, qrCodeUrl: imageUrl });
        toast.success('อัปโหลด QR Code สำเร็จ');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปโหลด QR Code');
    } finally {
      setUploadingQr(false);
      e.target.value = '';
    }
  };

  const handleRemoveQr = () => {
    setBankInfo({ ...bankInfo, qrCodeUrl: '' });
  };

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

  const handleSaveLine = async () => {
    setLineLoading(true);
    try {
      const response = await api.put('/settings/line', lineSettings);
      if (response.data.success) {
        toast.success('บันทึกการตั้งค่า LINE สำเร็จ');
        await fetchLineSettings();
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า LINE');
    } finally {
      setLineLoading(false);
    }
  };

  const toggleLineEnabled = () => {
    setLineSettings({ ...lineSettings, enabled: !lineSettings.enabled });
  };

  const toggleStatusNotification = (status: string) => {
    const currentStatuses = lineSettings.notify_on_status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    setLineSettings({ ...lineSettings, notify_on_status: newStatuses });
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

          {/* Bank Info for Payment Notifications */}
          <motion.div className="card" variants={staggerItem}>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-bold">ข้อมูลธนาคาร (สำหรับแจ้งเตือนชำระเงิน)</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              ข้อมูลนี้จะใช้เป็นค่าเริ่มต้นเมื่อส่งแจ้งเตือนชำระเงินผ่าน LINE
            </p>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">ชื่อธนาคาร</label>
                <input
                  type="text"
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  className="input-field"
                  placeholder="ธนาคารกสิกรไทย"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">ชื่อบัญชี</label>
                <input
                  type="text"
                  value={bankInfo.accountName}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })}
                  className="input-field"
                  placeholder="บริษัท ปักกุเนโกะ จำกัด"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">เลขบัญชี</label>
                <input
                  type="text"
                  value={bankInfo.accountNumber}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                  className="input-field"
                  placeholder="123-4-56789-0"
                />
              </div>
              {/* QR Code Upload */}
              <div>
                <label className="block font-medium mb-2">
                  <QrCode className="w-4 h-4 inline mr-1" />
                  QR Code สำหรับชำระเงิน
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  อัปโหลดรูป QR Code (PromptPay, QR Code ธนาคาร) เพื่อแสดงในข้อความแจ้งเตือน
                </p>
                {bankInfo.qrCodeUrl ? (
                  <div className="flex items-start gap-4">
                    <div className="relative group">
                      <img
                        src={bankInfo.qrCodeUrl}
                        alt="QR Code"
                        className="w-40 h-40 object-contain border rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveQr}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="text-green-600 font-medium">QR Code พร้อมใช้งาน</p>
                      <p className="mt-1">คลิกที่รูปเพื่อลบและอัปโหลดใหม่</p>
                    </div>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="hidden"
                      disabled={uploadingQr}
                    />
                    {uploadingQr ? (
                      <>
                        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-600">กำลังอัปโหลด...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">อัปโหลด QR Code</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <div className="flex justify-end pt-4 border-t">
                <motion.button
                  onClick={handleSaveBank}
                  disabled={bankLoading}
                  className="btn-primary flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={buttonTap}
                >
                  <CreditCard className="w-4 h-4" />
                  {bankLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลธนาคาร'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* LINE OA Integration */}
          <motion.div className="card" variants={staggerItem}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold">LINE OA Integration</h2>
              </div>
              <div className="flex items-center gap-2">
                {lineSettings.enabled ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    เปิดใช้งาน
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <XCircle className="w-4 h-4" />
                    ปิดใช้งาน
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">เปิดใช้งาน LINE Notifications</p>
                  <p className="text-sm text-gray-600 mt-1">
                    ส่งการแจ้งเตือนการอัปเดทการจัดส่งผ่าน LINE OA
                  </p>
                </div>
                <button
                  onClick={toggleLineEnabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    lineSettings.enabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      lineSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* LINE Credentials */}
              <div>
                <label className="block font-medium mb-2">Channel Access Token</label>
                <input
                  type="password"
                  value={lineSettings.channel_access_token}
                  onChange={(e) =>
                    setLineSettings({ ...lineSettings, channel_access_token: e.target.value })
                  }
                  className="input-field font-mono text-sm"
                  placeholder="Your LINE Channel Access Token"
                  disabled={!lineSettings.enabled}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Channel Secret</label>
                <input
                  type="password"
                  value={lineSettings.channel_secret}
                  onChange={(e) =>
                    setLineSettings({ ...lineSettings, channel_secret: e.target.value })
                  }
                  className="input-field font-mono text-sm"
                  placeholder="Your LINE Channel Secret"
                  disabled={!lineSettings.enabled}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lineSettings.webhook_url || `${window.location.origin}/webhook/line`}
                    onChange={(e) =>
                      setLineSettings({ ...lineSettings, webhook_url: e.target.value })
                    }
                    className="input-field font-mono text-sm"
                    placeholder="https://your-domain.com/webhook/line"
                    disabled={!lineSettings.enabled}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        lineSettings.webhook_url || `${window.location.origin}/webhook/line`
                      );
                      toast.success('คัดลอก URL แล้ว');
                    }}
                    className="btn-secondary whitespace-nowrap"
                  >
                    คัดลอก
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  ใช้ URL นี้ใน LINE Developers Console
                </p>
              </div>

              {/* Auto Notify Settings */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">แจ้งเตือนอัตโนมัติเมื่อสถานะเปลี่ยน</p>
                  <button
                    onClick={() =>
                      setLineSettings({
                        ...lineSettings,
                        auto_notify_shipping_update: !lineSettings.auto_notify_shipping_update,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      lineSettings.auto_notify_shipping_update ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                    disabled={!lineSettings.enabled}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        lineSettings.auto_notify_shipping_update ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">เลือกสถานะที่ต้องการแจ้งเตือน:</p>
                  {[
                    { value: 'pending', label: 'รอดำเนินการ' },
                    { value: 'processing', label: 'กำลังดำเนินการ' },
                    { value: 'shipped', label: 'กำลังจัดส่ง' },
                    { value: 'in_transit', label: 'อยู่ระหว่างการขนส่ง' },
                    { value: 'delivered', label: 'จัดส่งสำเร็จ' },
                  ].map((status) => (
                    <label
                      key={status.value}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={lineSettings.notify_on_status?.includes(status.value)}
                        onChange={() => toggleStatusNotification(status.value)}
                        disabled={!lineSettings.enabled || !lineSettings.auto_notify_shipping_update}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="text-sm">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <motion.button
                  onClick={handleSaveLine}
                  disabled={lineLoading}
                  className="btn-primary flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={buttonTap}
                >
                  <Save className="w-4 h-4" />
                  {lineLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า LINE'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminSettingsPage;
