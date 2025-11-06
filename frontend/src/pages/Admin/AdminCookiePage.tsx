import { useState, useEffect } from 'react';
import { Save, Cookie, Shield, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Cookies } from 'react-cookie-consent';
import { buttonTap } from '../../lib/animations';
import api from '../../lib/api';

const AdminCookiePage = () => {
  const [loading, setLoading] = useState(false);
  const [cookieData, setCookieData] = useState({
    // Cookie Banner Settings
    bannerEnabled: true,
    bannerPosition: 'bottom',
    bannerMessage: 'เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ',

    // Cookie Categories
    necessaryCookies: true, // Always true
    analyticsCookies: false,
    marketingCookies: false,
    functionalCookies: false,

    // Banner Appearance
    primaryColor: '#2563eb',
    buttonText: 'ยอมรับทั้งหมด',
    declineButtonText: 'ปฏิเสธทั้งหมด',

    // Cookie Lifetime
    cookieLifetime: 365, // days

    // GDPR/PDPA Compliance
    showPrivacyLink: true,
    privacyPolicyUrl: '/privacy-policy',
    cookiePolicyUrl: '/cookie-policy',
  });

  const [allCookies, setAllCookies] = useState<any[]>([]);

  useEffect(() => {
    loadCookieSettings();
    loadAllCookies();
  }, []);

  const loadCookieSettings = async () => {
    try {
      const response = await api.get('/system-settings/cookies');
      if (response.data.success && response.data.data) {
        setCookieData({ ...cookieData, ...response.data.data.value });
      }
    } catch (error) {
      console.error('Failed to load cookie settings:', error);
    }
  };

  const loadAllCookies = () => {
    const cookies = document.cookie.split(';').map((cookie) => {
      const [name, value] = cookie.trim().split('=');
      return { name, value: value || '' };
    });
    setAllCookies(cookies);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/system-settings/cookies', {
        key: 'cookies',
        value: cookieData,
        category: 'privacy',
      });
      toast.success('บันทึกการตั้งค่าคุกกี้สำเร็จ');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleResetConsent = () => {
    if (confirm('ต้องการรีเซ็ต Cookie Consent ทั้งหมด?')) {
      Cookies.remove('cookie-consent');
      Cookies.remove('cookie-preferences');
      toast.success('รีเซ็ต Cookie Consent สำเร็จ - โหลดหน้าใหม่เพื่อเห็น Banner');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleDeleteCookie = (cookieName: string) => {
    if (confirm(`ต้องการลบคุกกี้ "${cookieName}"?`)) {
      Cookies.remove(cookieName);
      toast.success(`ลบคุกกี้ "${cookieName}" สำเร็จ`);
      loadAllCookies();
    }
  };

  const handleClearAllCookies = () => {
    if (confirm('ต้องการลบคุกกี้ทั้งหมด? (ยกเว้นคุกกี้ระบบ)')) {
      allCookies.forEach((cookie) => {
        if (!cookie.name.includes('admin_token') && !cookie.name.includes('user_token')) {
          Cookies.remove(cookie.name);
        }
      });
      toast.success('ลบคุกกี้ทั้งหมดสำเร็จ');
      loadAllCookies();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Cookie className="w-8 h-8 text-orange-600" />
          การจัดการคุกกี้
        </h1>
        <p className="text-gray-600 mt-2">
          ตั้งค่า Cookie Consent Banner และจัดการคุกกี้ทั้งหมด
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cookie Banner Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Cookie Consent Banner
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="bannerEnabled"
                  checked={cookieData.bannerEnabled}
                  onChange={(e) => setCookieData({ ...cookieData, bannerEnabled: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="bannerEnabled" className="text-sm font-medium text-gray-700">
                  เปิดใช้งาน Cookie Consent Banner
                </label>
              </div>

              {cookieData.bannerEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ตำแหน่ง Banner
                    </label>
                    <select
                      value={cookieData.bannerPosition}
                      onChange={(e) => setCookieData({ ...cookieData, bannerPosition: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="top">บนสุด</option>
                      <option value="bottom">ล่างสุด</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ข้อความ Banner
                    </label>
                    <textarea
                      value={cookieData.bannerMessage}
                      onChange={(e) => setCookieData({ ...cookieData, bannerMessage: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ข้อความปุ่มยอมรับ
                      </label>
                      <input
                        type="text"
                        value={cookieData.buttonText}
                        onChange={(e) => setCookieData({ ...cookieData, buttonText: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ข้อความปุ่มปฏิเสธ
                      </label>
                      <input
                        type="text"
                        value={cookieData.declineButtonText}
                        onChange={(e) => setCookieData({ ...cookieData, declineButtonText: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สีหลัก (Primary Color)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={cookieData.primaryColor}
                        onChange={(e) => setCookieData({ ...cookieData, primaryColor: e.target.value })}
                        className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cookieData.primaryColor}
                        onChange={(e) => setCookieData({ ...cookieData, primaryColor: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cookie Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Cookie className="w-6 h-6 text-purple-600" />
              ประเภทคุกกี้
            </h2>

            <div className="space-y-4">
              {/* Necessary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">คุกกี้ที่จำเป็น</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      จำเป็นสำหรับการทำงานของเว็บไซต์ ไม่สามารถปิดได้
                    </p>
                  </div>
                  <div className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                    เปิดอยู่เสมอ
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">คุกกี้เพื่อวิเคราะห์</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Google Analytics, การติดตามพฤติกรรมผู้ใช้
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieData.analyticsCookies}
                      onChange={(e) => setCookieData({ ...cookieData, analyticsCookies: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Functional */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">คุกกี้เพื่อการทำงาน</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      การจดจำการตั้งค่า, ภาษา, ธีม
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieData.functionalCookies}
                      onChange={(e) => setCookieData({ ...cookieData, functionalCookies: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Marketing */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">คุกกี้เพื่อการตลาด</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Facebook Pixel, Google Ads, Retargeting
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieData.marketingCookies}
                      onChange={(e) => setCookieData({ ...cookieData, marketingCookies: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Links */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">🔗 ลิงก์นโยบาย</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showPrivacyLink"
                  checked={cookieData.showPrivacyLink}
                  onChange={(e) => setCookieData({ ...cookieData, showPrivacyLink: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="showPrivacyLink" className="text-sm font-medium text-gray-700">
                  แสดงลิงก์นโยบายความเป็นส่วนตัว
                </label>
              </div>

              {cookieData.showPrivacyLink && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Privacy Policy URL
                    </label>
                    <input
                      type="text"
                      value={cookieData.privacyPolicyUrl}
                      onChange={(e) => setCookieData({ ...cookieData, privacyPolicyUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="/privacy-policy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cookie Policy URL
                    </label>
                    <input
                      type="text"
                      value={cookieData.cookiePolicyUrl}
                      onChange={(e) => setCookieData({ ...cookieData, cookiePolicyUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="/cookie-policy"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อายุคุกกี้ (วัน)
                </label>
                <input
                  type="number"
                  value={cookieData.cookieLifetime}
                  onChange={(e) => setCookieData({ ...cookieData, cookieLifetime: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="1"
                  max="365"
                />
                <p className="text-xs text-gray-500 mt-1">
                  คุกกี้จะหมดอายุหลังจาก {cookieData.cookieLifetime} วัน
                </p>
              </div>
            </div>
          </div>

          {/* Current Cookies */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6 text-gray-600" />
                คุกกี้ปัจจุบัน ({allCookies.length})
              </h2>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={loadAllCookies}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                  whileTap={buttonTap}
                >
                  <RefreshCw className="w-4 h-4" />
                  รีเฟรช
                </motion.button>
                <motion.button
                  onClick={handleClearAllCookies}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 text-sm"
                  whileTap={buttonTap}
                >
                  <Trash2 className="w-4 h-4" />
                  ลบทั้งหมด
                </motion.button>
              </div>
            </div>

            {allCookies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Cookie className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>ไม่มีคุกกี้</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        ชื่อคุกกี้
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        ค่า
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allCookies.map((cookie, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {cookie.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                          {cookie.value.substring(0, 50)}
                          {cookie.value.length > 50 && '...'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <motion.button
                            onClick={() => handleDeleteCookie(cookie.name)}
                            className="text-red-600 hover:text-red-800"
                            whileTap={buttonTap}
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Button */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <motion.button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 mb-3"
              whileTap={buttonTap}
            >
              <Save className="w-5 h-5" />
              {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </motion.button>

            <motion.button
              onClick={handleResetConsent}
              className="w-full bg-orange-100 text-orange-700 px-6 py-3 rounded-lg hover:bg-orange-200 font-semibold flex items-center justify-center gap-2"
              whileTap={buttonTap}
            >
              <RefreshCw className="w-5 h-5" />
              รีเซ็ต Cookie Consent
            </motion.button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              ใช้เพื่อทดสอบ Banner อีกครั้ง
            </p>
          </div>

          {/* Compliance Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              GDPR/PDPA
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>✅ Cookie Consent Banner</p>
              <p>✅ ให้ผู้ใช้เลือกได้</p>
              <p>✅ จัดเก็บความยินยอม</p>
              <p>✅ ลบคุกกี้ได้</p>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">📚 ข้อมูลเพิ่มเติม</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://gdpr.eu/cookies/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → GDPR Cookie Rules
              </a>
              <a
                href="https://www.pdpc.or.th"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → PDPA Thailand
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCookiePage;
