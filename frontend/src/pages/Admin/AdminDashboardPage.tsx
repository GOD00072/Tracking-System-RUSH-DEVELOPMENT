import { Ship, Package, Users, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem, cardHover, buttonTap } from '../../lib/animations';

const AdminDashboardPage = () => {
  const stats = [
    { icon: Ship, label: 'คำสั่งซื้อทั้งหมด', value: '1,250', change: '+12%', color: 'primary' },
    { icon: Package, label: 'กำลังจัดส่ง', value: '45', change: '+5%', color: 'secondary' },
    { icon: CheckCircle2, label: 'ส่งสำเร็จเดือนนี้', value: '120', change: '+8%', color: 'green' },
    { icon: Users, label: 'ลูกค้าทั้งหมด', value: '500', change: '+15%', color: 'purple' },
  ];

  const recentOrders = [
    { id: 'ORD-2025-001', customer: 'ABC Company', status: 'shipped', date: '2025-11-01' },
    { id: 'ORD-2025-002', customer: 'XYZ Corp', status: 'processing', date: '2025-11-01' },
    { id: 'ORD-2025-003', customer: 'Test Ltd', status: 'delivered', date: '2025-10-31' },
  ];

  return (
    <motion.div
      className="p-8"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">ภาพรวมระบบ Ship Tracking</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              variants={staggerItem}
              whileHover={{ scale: 1.03, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-500`} />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Recent Orders */}
        <motion.div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          variants={staggerItem}
        >
          <h2 className="text-xl font-bold mb-4">คำสั่งซื้อล่าสุด</h2>
          <div className="space-y-4">
            {recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, backgroundColor: "#f9fafb" }}
              >
                <div>
                  <p className="font-semibold text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customer}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{order.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          variants={staggerItem}
        >
          <h2 className="text-xl font-bold mb-4">การดำเนินการด่วน</h2>
          <div className="space-y-3">
            <motion.button
              className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={buttonTap}
            >
              <p className="font-semibold text-primary-700">เพิ่มคำสั่งซื้อใหม่</p>
              <p className="text-sm text-primary-600">สร้างคำสั่งซื้อสินค้า</p>
            </motion.button>
            <motion.button
              className="w-full text-left px-4 py-3 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={buttonTap}
            >
              <p className="font-semibold text-secondary-700">อัพเดทสถานะการจัดส่ง</p>
              <p className="text-sm text-secondary-600">ปรับปรุงข้อมูลพัสดุ</p>
            </motion.button>
            <motion.button
              className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={buttonTap}
            >
              <p className="font-semibold text-green-700">ดูรายงานสถิติ</p>
              <p className="text-sm text-green-600">วิเคราะห์ข้อมูลธุรกิจ</p>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboardPage;
