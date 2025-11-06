import { useState } from 'react';
import CookieConsent, { Cookies } from 'react-cookie-consent';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, X, Check, Shield } from 'lucide-react';

const CookieConsentBanner = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  // Google Analytics ID (ถ้ามี)
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

  const handleAcceptAll = () => {
    setPreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    });

    // Enable all tracking scripts
    enableAnalytics();
    enableMarketing();

    Cookies.set('cookie-preferences', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    }), { expires: 365 });

    setShowSettings(false);
  };

  const handleRejectAll = () => {
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    });

    Cookies.set('cookie-preferences', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    }), { expires: 365 });

    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    Cookies.set('cookie-preferences', JSON.stringify(preferences), { expires: 365 });

    // Enable scripts based on preferences
    if (preferences.analytics) {
      enableAnalytics();
    }
    if (preferences.marketing) {
      enableMarketing();
    }

    setShowSettings(false);
  };

  const enableAnalytics = () => {
    // Google Analytics
    if (GA_MEASUREMENT_ID) {
      // Load GA script
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
      });
    }

    // Facebook Pixel (ถ้ามี)
    const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;
    if (FB_PIXEL_ID) {
      // Load Facebook Pixel here
      // fbq('init', FB_PIXEL_ID);
    }
  };

  const enableMarketing = () => {
    // Google Ads (ถ้ามี)
    const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID;
    if (GOOGLE_ADS_ID) {
      // Load Google Ads script
    }
  };

  return (
    <>
      <CookieConsent
        location="bottom"
        buttonText="ยอมรับทั้งหมด"
        declineButtonText="ปฏิเสธทั้งหมด"
        enableDeclineButton
        onAccept={handleAcceptAll}
        onDecline={handleRejectAll}
        cookieName="cookie-consent"
        expires={365}
        overlay={false}
        buttonStyle={{
          background: '#2563eb',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '8px',
          padding: '12px 24px',
          cursor: 'pointer',
          border: 'none',
        }}
        declineButtonStyle={{
          background: '#e5e7eb',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '8px',
          padding: '12px 24px',
          cursor: 'pointer',
          border: 'none',
        }}
        containerClasses="cookie-consent-container"
        contentClasses="cookie-consent-content"
        style={{
          background: 'white',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '20px',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          zIndex: 9999,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '300px' }}>
          <Cookie className="w-8 h-8 text-blue-600 flex-shrink-0" />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px', color: '#111827' }}>
              🍪 เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
              เว็บไซต์นี้ใช้คุกกี้เพื่อวิเคราะห์การใช้งาน ปรับปรุงประสิทธิภาพ และมอบประสบการณ์ที่ดีที่สุดให้กับคุณ
              เราปฏิบัติตาม PDPA และ GDPR อย่างเคร่งครัด
            </p>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Settings className="w-4 h-4" />
              ตั้งค่าคุกกี้
            </button>
          </div>
        </div>
      </CookieConsent>

      {/* Cookie Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">ตั้งค่าความเป็นส่วนตัว</h2>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งานของคุณ คุณสามารถเลือกประเภทคุกกี้ที่ต้องการได้ด้านล่าง
                </p>

                {/* Necessary Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">คุกกี้ที่จำเป็น</h3>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      จำเป็น
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    คุกกี้เหล่านี้จำเป็นสำหรับการทำงานของเว็บไซต์ ไม่สามารถปิดได้
                    ใช้สำหรับ: การเข้าสู่ระบบ, ตะกร้าสินค้า, ความปลอดภัย
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cookie className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">คุกกี้เพื่อวิเคราะห์</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    ช่วยให้เราเข้าใจว่าผู้เยี่ยมชมใช้เว็บไซต์อย่างไร เพื่อปรับปรุงประสบการณ์
                    ใช้สำหรับ: Google Analytics, การติดตามพฤติกรรมผู้ใช้ (ไม่ระบุตัวตน)
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">คุกกี้เพื่อการทำงาน</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    คุกกี้เหล่านี้เพิ่มฟังก์ชันการทำงานและการปรับแต่งส่วนบุคคล
                    ใช้สำหรับ: การจดจำการตั้งค่า, ภาษา, ธีม
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cookie className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">คุกกี้เพื่อการตลาด</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    ใช้เพื่อแสดงโฆษณาที่เกี่ยวข้องกับคุณและติดตามประสิทธิภาพแคมเปญ
                    ใช้สำหรับ: Facebook Pixel, Google Ads, โฆษณาแบบ Retargeting
                  </p>
                </div>

                {/* Privacy Policy Link */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    📋 อ่านเพิ่มเติมในหน้า{' '}
                    <a href="/privacy-policy" className="text-blue-600 font-semibold hover:underline">
                      นโยบายความเป็นส่วนตัว
                    </a>{' '}
                    และ{' '}
                    <a href="/cookie-policy" className="text-blue-600 font-semibold hover:underline">
                      นโยบายคุกกี้
                    </a>
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
                <button
                  onClick={handleRejectAll}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ปฏิเสธทั้งหมด
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  บันทึกการตั้งค่า
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ยอมรับทั้งหมด
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CookieConsentBanner;
