import { useState, useEffect } from 'react';
import {
  Crown, Star, User, Save, Plus, Trash2,
  RefreshCw, Users, TrendingUp, Award,
  Edit2, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem, buttonTap } from '../../lib/animations';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../lib/api';

interface CustomerTier {
  id: string;
  tierCode: string;
  tierName: string;
  tierNameTh: string | null;
  exchangeRate: number;
  minSpent: number;
  maxSpent: number | null;
  benefits: {
    freeShipping?: boolean;
    prioritySupport?: boolean;
  } | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TierStats {
  tier: CustomerTier;
  customerCount: number;
  totalSpent: number;
  averageSpent: number;
}

interface TierFormData {
  tierCode: string;
  tierName: string;
  tierNameTh: string;
  exchangeRate: string;
  minSpent: string;
  maxSpent: string;
  color: string;
  icon: string;
  sortOrder: number;
  benefits: {
    freeShipping: boolean;
    prioritySupport: boolean;
  };
}

const defaultFormData: TierFormData = {
  tierCode: '',
  tierName: '',
  tierNameTh: '',
  exchangeRate: '0.25',
  minSpent: '0',
  maxSpent: '',
  color: '#6B7280',
  icon: 'User',
  sortOrder: 0,
  benefits: {
    freeShipping: false,
    prioritySupport: false,
  },
};

const TIER_ICONS = [
  { value: 'User', label: 'User', icon: User },
  { value: 'Star', label: 'Star', icon: Star },
  { value: 'Crown', label: 'Crown', icon: Crown },
  { value: 'Award', label: 'Award', icon: Award },
];

const TIER_COLORS = [
  { value: '#6B7280', label: 'Gray' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#7C3AED', label: 'Purple' },
  { value: '#10B981', label: 'Green' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#EF4444', label: 'Red' },
  { value: '#EC4899', label: 'Pink' },
];

const AdminTierSettingsPage = () => {
  const [tiers, setTiers] = useState<CustomerTier[]>([]);
  const [tierStats, setTierStats] = useState<TierStats[]>([]);
  const [overallStats, setOverallStats] = useState({ totalCustomers: 0, totalSpent: 0, averageSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoUpgrading, setAutoUpgrading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState<CustomerTier | null>(null);
  const [formData, setFormData] = useState<TierFormData>(defaultFormData);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tiersRes, statsRes] = await Promise.all([
        api.get('/tiers'),
        api.get('/customers/stats/tier-summary'),
      ]);

      if (tiersRes.data.success) {
        setTiers(tiersRes.data.data);
      }

      if (statsRes.data.success) {
        setTierStats(statsRes.data.data.tierStats);
        setOverallStats(statsRes.data.data.overall);
      }
    } catch (error) {
      console.error('Error fetching tier data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tier?: CustomerTier) => {
    if (tier) {
      setEditingTier(tier);
      setFormData({
        tierCode: tier.tierCode,
        tierName: tier.tierName,
        tierNameTh: tier.tierNameTh || '',
        exchangeRate: tier.exchangeRate.toString(),
        minSpent: tier.minSpent.toString(),
        maxSpent: tier.maxSpent?.toString() || '',
        color: tier.color || '#6B7280',
        icon: tier.icon || 'User',
        sortOrder: tier.sortOrder,
        benefits: {
          freeShipping: tier.benefits?.freeShipping || false,
          prioritySupport: tier.benefits?.prioritySupport || false,
        },
      });
    } else {
      setEditingTier(null);
      setFormData({
        ...defaultFormData,
        sortOrder: tiers.length + 1,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTier(null);
    setFormData(defaultFormData);
  };

  const handleSaveTier = async () => {
    if (!formData.tierCode || !formData.tierName || !formData.exchangeRate) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tierCode: formData.tierCode.toLowerCase(),
        tierName: formData.tierName,
        tierNameTh: formData.tierNameTh || null,
        exchangeRate: parseFloat(formData.exchangeRate),
        minSpent: parseFloat(formData.minSpent) || 0,
        maxSpent: formData.maxSpent ? parseFloat(formData.maxSpent) : null,
        color: formData.color,
        icon: formData.icon,
        sortOrder: formData.sortOrder,
        benefits: formData.benefits,
      };

      if (editingTier) {
        const res = await api.patch(`/tiers/${editingTier.tierCode}`, payload);
        if (res.data.success) {
          toast.success('อัปเดตระดับลูกค้าสำเร็จ');
        }
      } else {
        const res = await api.post('/tiers', payload);
        if (res.data.success) {
          toast.success('เพิ่มระดับลูกค้าใหม่สำเร็จ');
        }
      }

      handleCloseModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (tierCode: string) => {
    if (tierCode === 'member') {
      toast.error('ไม่สามารถลบระดับ Member ได้');
      return;
    }

    if (!confirm(`ต้องการลบระดับ "${tierCode}" หรือไม่?`)) {
      return;
    }

    try {
      const res = await api.delete(`/tiers/${tierCode}`);
      if (res.data.success) {
        toast.success('ลบระดับลูกค้าสำเร็จ');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleAutoUpgrade = async () => {
    if (!confirm('ต้องการอัปเกรดระดับลูกค้าทั้งหมดตามยอดสะสมหรือไม่?')) {
      return;
    }

    setAutoUpgrading(true);
    try {
      const res = await api.post('/tiers/auto-upgrade');
      if (res.data.success) {
        const { upgraded, downgraded, unchanged } = res.data.data;
        toast.success(`อัปเกรดสำเร็จ: ${upgraded} อัปเกรด, ${downgraded} ปรับลด, ${unchanged} ไม่เปลี่ยนแปลง`);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setAutoUpgrading(false);
    }
  };

  const getTierIcon = (iconName: string | null) => {
    const iconData = TIER_ICONS.find(i => i.value === iconName);
    const IconComponent = iconData?.icon || User;
    return IconComponent;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <LoadingSpinner size={300} text="กำลังโหลดข้อมูลระดับลูกค้า..." />
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Crown className="w-8 h-8 text-amber-500" />
              ระบบระดับลูกค้า (VIP Tier System)
            </h1>
            <p className="text-gray-600 mt-2">จัดการระดับลูกค้าและอัตราแลกเปลี่ยนตามยอดใช้จ่ายสะสม</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={handleAutoUpgrade}
              disabled={autoUpgrading}
              className="btn-secondary flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={buttonTap}
            >
              <RefreshCw className={`w-5 h-5 ${autoUpgrading ? 'animate-spin' : ''}`} />
              {autoUpgrading ? 'กำลังอัปเกรด...' : 'Auto-Upgrade ทั้งหมด'}
            </motion.button>
            <motion.button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={buttonTap}
            >
              <Plus className="w-5 h-5" />
              เพิ่มระดับใหม่
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white" variants={staggerItem}>
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 opacity-80" />
              <div>
                <p className="text-sm opacity-80">ลูกค้าทั้งหมด</p>
                <p className="text-2xl font-bold">{overallStats.totalCustomers}</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="card bg-gradient-to-br from-green-500 to-green-600 text-white" variants={staggerItem}>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-10 h-10 opacity-80" />
              <div>
                <p className="text-sm opacity-80">ยอดใช้จ่ายรวม</p>
                <p className="text-2xl font-bold">{formatCurrency(overallStats.totalSpent)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white" variants={staggerItem}>
            <div className="flex items-center gap-3">
              <Award className="w-10 h-10 opacity-80" />
              <div>
                <p className="text-sm opacity-80">ค่าเฉลี่ยต่อคน</p>
                <p className="text-2xl font-bold">{formatCurrency(overallStats.averageSpent)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white" variants={staggerItem}>
            <div className="flex items-center gap-3">
              <Crown className="w-10 h-10 opacity-80" />
              <div>
                <p className="text-sm opacity-80">จำนวนระดับ</p>
                <p className="text-2xl font-bold">{tiers.length}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Tiers Table */}
        <motion.div className="card" variants={staggerItem}>
          <h2 className="text-xl font-bold mb-4">รายการระดับลูกค้า</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ลำดับ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ระดับ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">อัตราแลกเปลี่ยน</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ยอดใช้จ่ายขั้นต่ำ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ยอดใช้จ่ายสูงสุด</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">จำนวนลูกค้า</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">สิทธิประโยชน์</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, index) => {
                  const TierIcon = getTierIcon(tier.icon);
                  const stats = tierStats.find(s => s.tier.tierCode === tier.tierCode);

                  return (
                    <motion.tr
                      key={tier.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td className="py-4 px-4">
                        <span className="text-gray-500">{tier.sortOrder}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: tier.color || '#6B7280' }}
                          >
                            <TierIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold">{tier.tierName}</p>
                            <p className="text-sm text-gray-500">{tier.tierNameTh}</p>
                            <p className="text-xs text-gray-400 font-mono">{tier.tierCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-lg font-bold text-amber-600">{tier.exchangeRate}</span>
                        <span className="text-sm text-gray-500 ml-1">฿/¥</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium">{formatCurrency(tier.minSpent)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium">
                          {tier.maxSpent ? formatCurrency(tier.maxSpent) : 'ไม่จำกัด'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{stats?.customerCount || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tier.benefits?.freeShipping && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              Free Shipping
                            </span>
                          )}
                          {tier.benefits?.prioritySupport && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              Priority Support
                            </span>
                          )}
                          {!tier.benefits?.freeShipping && !tier.benefits?.prioritySupport && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(tier)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {tier.tierCode !== 'member' && (
                            <button
                              onClick={() => handleDeleteTier(tier.tierCode)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Tier Statistics by Tier */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8" variants={staggerContainer}>
          {tierStats.map((stat, index) => {
            const TierIcon = getTierIcon(stat.tier.icon);
            return (
              <motion.div
                key={stat.tier.id}
                className="card"
                variants={staggerItem}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: stat.tier.color || '#6B7280' }}
                  >
                    <TierIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">{stat.tier.tierName}</h3>
                    <p className="text-sm text-gray-500">Exchange Rate: {stat.tier.exchangeRate}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">จำนวนลูกค้า</span>
                    <span className="font-bold">{stat.customerCount} คน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ยอดรวม</span>
                    <span className="font-bold text-green-600">{formatCurrency(stat.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ค่าเฉลี่ย</span>
                    <span className="font-bold">{formatCurrency(stat.averageSpent)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* How it works */}
        <motion.div className="card mt-8 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200" variants={staggerItem}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            วิธีการทำงานของระบบระดับลูกค้า
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">การอัปเกรดอัตโนมัติ</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>ระบบจะตรวจสอบยอดใช้จ่ายสะสม (จากการชำระเงินที่ verified)</li>
                <li>เมื่อยอดถึง threshold จะอัปเกรดระดับอัตโนมัติ</li>
                <li>ประวัติการเปลี่ยนระดับจะถูกบันทึกไว้</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">อัตราแลกเปลี่ยน</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>แต่ละระดับมีอัตราแลกเปลี่ยน (฿/¥) ที่แตกต่างกัน</li>
                <li>ระดับสูงกว่าจะได้อัตราที่ดีกว่า</li>
                <li>อัตราจะถูกใช้เมื่อสร้างการชำระเงินใหม่</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Tier Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingTier ? 'แก้ไขระดับลูกค้า' : 'เพิ่มระดับลูกค้าใหม่'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">รหัสระดับ (tierCode)</label>
                    <input
                      type="text"
                      value={formData.tierCode}
                      onChange={(e) => setFormData({ ...formData, tierCode: e.target.value })}
                      className="input-field font-mono"
                      placeholder="vip"
                      disabled={!!editingTier}
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">ลำดับ</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">ชื่อระดับ (EN)</label>
                    <input
                      type="text"
                      value={formData.tierName}
                      onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
                      className="input-field"
                      placeholder="VIP"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">ชื่อระดับ (TH)</label>
                    <input
                      type="text"
                      value={formData.tierNameTh}
                      onChange={(e) => setFormData({ ...formData, tierNameTh: e.target.value })}
                      className="input-field"
                      placeholder="วีไอพี"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2">อัตราแลกเปลี่ยน (฿/¥)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                    className="input-field"
                    placeholder="0.24"
                  />
                  <p className="text-sm text-gray-500 mt-1">ตัวอย่าง: 0.25 หมายถึง ¥100 = ฿25</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">ยอดใช้จ่ายขั้นต่ำ (฿)</label>
                    <input
                      type="number"
                      value={formData.minSpent}
                      onChange={(e) => setFormData({ ...formData, minSpent: e.target.value })}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">ยอดใช้จ่ายสูงสุด (฿)</label>
                    <input
                      type="number"
                      value={formData.maxSpent}
                      onChange={(e) => setFormData({ ...formData, maxSpent: e.target.value })}
                      className="input-field"
                      placeholder="ว่างไว้ = ไม่จำกัด"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">สี</label>
                    <div className="flex gap-2 flex-wrap">
                      {TIER_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.color === color.value ? 'border-gray-800 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">ไอคอน</label>
                    <div className="flex gap-2">
                      {TIER_ICONS.map((iconData) => (
                        <button
                          key={iconData.value}
                          onClick={() => setFormData({ ...formData, icon: iconData.value })}
                          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${
                            formData.icon === iconData.value
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          title={iconData.label}
                        >
                          <iconData.icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2">สิทธิประโยชน์</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.benefits.freeShipping}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            benefits: { ...formData.benefits, freeShipping: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                      <span>Free Shipping - ส่งฟรี</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.benefits.prioritySupport}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            benefits: { ...formData.benefits, prioritySupport: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                      <span>Priority Support - บริการลำดับความสำคัญ</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                <button onClick={handleCloseModal} className="btn-secondary">
                  ยกเลิก
                </button>
                <motion.button
                  onClick={handleSaveTier}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={buttonTap}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      บันทึก
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminTierSettingsPage;
