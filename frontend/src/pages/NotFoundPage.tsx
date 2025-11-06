import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft, Package, Ship } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Ship className="w-16 h-16 text-primary-400" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
            >
              <Package className="w-14 h-14 text-blue-400" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.6 }}
            >
              <Package className="w-12 h-12 text-indigo-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ไม่พบหน้าที่คุณกำลังค้นหา
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            ขออภัย หน้านี้อาจถูกย้าย ลบ หรือไม่เคยมีอยู่เลย
          </p>
          <p className="text-gray-500">
            โปรดตรวจสอบ URL อีกครั้ง หรือกลับไปยังหน้าหลัก
          </p>
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
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Home className="w-5 h-5" />
            กลับหน้าหลัก
          </motion.button>

          <motion.button
            onClick={() => navigate('/ship-tracking')}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-5 h-5" />
            ตรวจสอบสถานะ
          </motion.button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 pt-8 border-t border-gray-200"
        >
          <p className="text-sm text-gray-600 mb-4">หน้าที่มักเข้าชม:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/ship-tracking')}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ติดตามเรือ
            </button>
            <button
              onClick={() => navigate('/air-tracking')}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ติดตามเครื่องบิน
            </button>
            <button
              onClick={() => navigate('/calculator')}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              คำนวณค่าขนส่ง
            </button>
            <button
              onClick={() => navigate('/schedule')}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ตารางเรือ
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ติดต่อเรา
            </button>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-sm text-gray-500"
        >
          <p>หากคุณคิดว่านี่คือข้อผิดพลาด โปรด{' '}
            <button
              onClick={() => navigate('/contact')}
              className="text-primary-600 hover:underline font-medium"
            >
              ติดต่อเรา
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
