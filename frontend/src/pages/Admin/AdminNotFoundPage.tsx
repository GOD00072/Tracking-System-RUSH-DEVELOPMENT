import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft, Shield, AlertTriangle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminNotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="w-24 h-24 text-red-500" />
            </motion.div>
          </div>
          <h1 className="text-8xl font-bold text-gray-800 mb-4">404</h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ไม่พบหน้า Admin ที่คุณกำลังค้นหา
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            หน้านี้อาจไม่มีอยู่หรือคุณไม่มีสิทธิ์เข้าถึง
          </p>
          <p className="text-gray-500">
            โปรดตรวจสอบ URL หรือสิทธิ์การเข้าถึงของคุณ
          </p>
        </motion.div>

        {/* Warning Box */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="text-left">
              <h3 className="font-semibold text-yellow-900 mb-2">ข้อควรระวัง</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• หน้านี้อาจต้องการสิทธิ์แอดมินพิเศษ</li>
                <li>• URL อาจสะกดผิดหรือเปลี่ยนแปลงไปแล้ว</li>
                <li>• ฟีเจอร์นี้อาจยังไม่เปิดใช้งาน</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            ย้อนกลับ
          </motion.button>

          <motion.button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Home className="w-5 h-5" />
            Admin Dashboard
          </motion.button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 pt-8 border-t border-gray-200"
        >
          <p className="text-sm text-gray-600 mb-4">หน้าแอดมินที่มักใช้งาน:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-4 py-3 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all font-medium"
            >
              📦 คำสั่งซื้อ
            </button>
            <button
              onClick={() => navigate('/admin/customers')}
              className="px-4 py-3 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all font-medium"
            >
              👥 ลูกค้า
            </button>
            <button
              onClick={() => navigate('/admin/reviews')}
              className="px-4 py-3 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all font-medium"
            >
              ⭐ รีวิว
            </button>
            <button
              onClick={() => navigate('/admin/seo')}
              className="px-4 py-3 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all font-medium"
            >
              🔍 SEO
            </button>
            <button
              onClick={() => navigate('/admin/cookies')}
              className="px-4 py-3 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all font-medium"
            >
              🍪 คุกกี้
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="px-4 py-3 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all font-medium"
            >
              ⚙️ ตั้งค่า
            </button>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Settings className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-2">ต้องการความช่วยเหลือ?</h3>
                <p className="text-sm text-blue-800 mb-3">
                  หากคุณคิดว่านี่เป็นข้อผิดพลาด หรือต้องการเข้าถึงหน้านี้:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ตรวจสอบว่าคุณมีสิทธิ์แอดมิน</li>
                  <li>• ลองออกจากระบบและเข้าสู่ระบบใหม่</li>
                  <li>• ติดต่อ Super Admin เพื่อขอสิทธิ์เพิ่มเติม</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Code */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-8 text-xs text-gray-400 font-mono"
        >
          <p>Error Code: ADMIN_404_NOT_FOUND</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminNotFoundPage;
