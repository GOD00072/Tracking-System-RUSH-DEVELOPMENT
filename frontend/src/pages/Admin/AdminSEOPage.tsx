import { useState, useEffect } from 'react';
import { Save, Globe, FileText, Image, Tag, Search, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { buttonTap } from '../../lib/animations';
import api from '../../lib/api';

const AdminSEOPage = () => {
  const [loading, setLoading] = useState(false);
  const [seoData, setSeoData] = useState({
    // Global SEO
    siteName: '',
    siteDescription: '',
    siteKeywords: '',
    ogImage: '',
    twitterCard: 'summary_large_image',

    // Google Analytics
    gaTrackingId: '',

    // Google Search Console
    googleSiteVerification: '',

    // Facebook Pixel
    fbPixelId: '',

    // Google Ads
    googleAdsId: '',

    // Robots.txt
    robotsTxt: '',

    // Sitemap
    sitemapEnabled: true,

    // Structured Data (JSON-LD)
    structuredDataEnabled: true,
    businessType: 'Logistics',
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
  });

  useEffect(() => {
    loadSEOSettings();
  }, []);

  const loadSEOSettings = async () => {
    try {
      const response = await api.get('/system-settings/seo');
      if (response.data.success && response.data.data) {
        setSeoData({ ...seoData, ...response.data.data.value });
      }
    } catch (error) {
      console.error('Failed to load SEO settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/system-settings/seo', {
        key: 'seo',
        value: seoData,
        category: 'seo',
      });
      toast.success('บันทึกการตั้งค่า SEO สำเร็จ');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Search className="w-8 h-8 text-primary-600" />
          การตั้งค่า SEO
        </h1>
        <p className="text-gray-600 mt-2">
          จัดการ SEO, Meta Tags, Analytics และ Tracking Scripts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic SEO */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600" />
              SEO พื้นฐาน
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อเว็บไซต์ (Site Name)
                </label>
                <input
                  type="text"
                  value={seoData.siteName}
                  onChange={(e) => setSeoData({ ...seoData, siteName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Your Logistics Company"
                />
                <p className="text-xs text-gray-500 mt-1">แสดงใน browser tab และ search results</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำอธิบายเว็บไซต์ (Meta Description)
                </label>
                <textarea
                  value={seoData.siteDescription}
                  onChange={(e) => setSeoData({ ...seoData, siteDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="บริการขนส่งสินค้าระหว่างประเทศ ไทย-ญี่ปุ่น ทางเรือและทางอากาศ..."
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {seoData.siteDescription.length}/160 ตัวอักษร (แนะนำ 150-160)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำค้นหา (Keywords)
                </label>
                <input
                  type="text"
                  value={seoData.siteKeywords}
                  onChange={(e) => setSeoData({ ...seoData, siteKeywords: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ขนส่งสินค้า, ไทย-ญี่ปุ่น, logistics, shipping"
                />
                <p className="text-xs text-gray-500 mt-1">แยกด้วยเครื่องหมายจุลภาค (,)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รูปภาพ OG (Open Graph Image)
                </label>
                <input
                  type="url"
                  value={seoData.ogImage}
                  onChange={(e) => setSeoData({ ...seoData, ogImage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  แสดงเมื่อแชร์ใน Facebook, Line, Twitter (แนะนำ 1200x630px)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter Card Type
                </label>
                <select
                  value={seoData.twitterCard}
                  onChange={(e) => setSeoData({ ...seoData, twitterCard: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary Large Image</option>
                </select>
              </div>
            </div>
          </div>

          {/* Analytics & Tracking */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              Analytics & Tracking
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Analytics Measurement ID
                </label>
                <input
                  type="text"
                  value={seoData.gaTrackingId}
                  onChange={(e) => setSeoData({ ...seoData, gaTrackingId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">Google Analytics 4 (GA4)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={seoData.fbPixelId}
                  onChange={(e) => setSeoData({ ...seoData, fbPixelId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="123456789012345"
                />
                <p className="text-xs text-gray-500 mt-1">สำหรับติดตาม Conversion และ Ads</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Ads Conversion ID
                </label>
                <input
                  type="text"
                  value={seoData.googleAdsId}
                  onChange={(e) => setSeoData({ ...seoData, googleAdsId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="AW-XXXXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">Google Ads Remarketing</p>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Tag className="w-6 h-6 text-purple-600" />
              Site Verification
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Search Console Verification
                </label>
                <input
                  type="text"
                  value={seoData.googleSiteVerification}
                  onChange={(e) => setSeoData({ ...seoData, googleSiteVerification: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="xxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Meta tag content จาก Google Search Console
                </p>
              </div>
            </div>
          </div>

          {/* Business Info (Structured Data) */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-orange-600" />
              ข้อมูลธุรกิจ (Structured Data)
            </h2>

            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="structuredDataEnabled"
                checked={seoData.structuredDataEnabled}
                onChange={(e) => setSeoData({ ...seoData, structuredDataEnabled: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="structuredDataEnabled" className="text-sm font-medium text-gray-700">
                เปิดใช้งาน Structured Data (JSON-LD)
              </label>
            </div>

            {seoData.structuredDataEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทธุรกิจ
                  </label>
                  <select
                    value={seoData.businessType}
                    onChange={(e) => setSeoData({ ...seoData, businessType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Logistics">Logistics</option>
                    <option value="MovingCompany">Moving Company</option>
                    <option value="Organization">Organization</option>
                    <option value="LocalBusiness">Local Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อธุรกิจ
                  </label>
                  <input
                    type="text"
                    value={seoData.businessName}
                    onChange={(e) => setSeoData({ ...seoData, businessName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ABC Logistics Co., Ltd."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ที่อยู่
                  </label>
                  <textarea
                    value={seoData.businessAddress}
                    onChange={(e) => setSeoData({ ...seoData, businessAddress: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="123 ถนน... แขวง... เขต... กรุงเทพฯ 10110"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      value={seoData.businessPhone}
                      onChange={(e) => setSeoData({ ...seoData, businessPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="02-xxx-xxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      value={seoData.businessEmail}
                      onChange={(e) => setSeoData({ ...seoData, businessEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="info@example.com"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Robots.txt */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-gray-600" />
              Robots.txt
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เนื้อหา robots.txt
              </label>
              <textarea
                value={seoData.robotsTxt}
                onChange={(e) => setSeoData({ ...seoData, robotsTxt: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder={`User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml`}
              />
              <p className="text-xs text-gray-500 mt-1">
                ควบคุมว่า Search Engine จะ crawl หน้าไหนได้บ้าง
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Button */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <motion.button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
              whileTap={buttonTap}
            >
              <Save className="w-5 h-5" />
              {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </motion.button>
          </div>

          {/* SEO Checklist */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">✅ SEO Checklist</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!seoData.siteName}
                  readOnly
                  className="w-4 h-4 text-green-600 border-gray-300 rounded"
                />
                <span>ชื่อเว็บไซต์</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!seoData.siteDescription && seoData.siteDescription.length >= 150}
                  readOnly
                  className="w-4 h-4 text-green-600 border-gray-300 rounded"
                />
                <span>คำอธิบาย (150-160 ตัวอักษร)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!seoData.siteKeywords}
                  readOnly
                  className="w-4 h-4 text-green-600 border-gray-300 rounded"
                />
                <span>คำค้นหา</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!seoData.ogImage}
                  readOnly
                  className="w-4 h-4 text-green-600 border-gray-300 rounded"
                />
                <span>OG Image</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!seoData.gaTrackingId}
                  readOnly
                  className="w-4 h-4 text-green-600 border-gray-300 rounded"
                />
                <span>Google Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!seoData.googleSiteVerification}
                  readOnly
                  className="w-4 h-4 text-green-600 border-gray-300 rounded"
                />
                <span>Google Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={seoData.structuredDataEnabled && !!seoData.businessName}
                  readOnly
                  className="w-4 h-4 text-green-600 border-gray-300 rounded"
                />
                <span>Structured Data</span>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">📚 แหล่งข้อมูล</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → Google Analytics
              </a>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → Google Search Console
              </a>
              <a
                href="https://business.facebook.com/events_manager2"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → Facebook Pixel
              </a>
              <a
                href="https://ads.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → Google Ads
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSEOPage;
