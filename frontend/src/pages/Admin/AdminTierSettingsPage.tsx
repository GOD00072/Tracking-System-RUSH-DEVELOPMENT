import { useState, useEffect } from 'react';
import {
  Crown, Star, User, Save, Plus, Trash2,
  RefreshCw, Users, TrendingUp, Award,
  Edit2, X, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../lib/api';
import useSwipeToDismiss from '../../hooks/useSwipeToDismiss';

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

  // Swipe to dismiss for mobile modal
  const formSheetRef = useSwipeToDismiss({
    onDismiss: handleCloseModal,
    enabled: showModal,
  });

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

  function handleCloseModal() {
    setShowModal(false);
    setEditingTier(null);
    setFormData(defaultFormData);
  }

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
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <LoadingSpinner size={300} text="กำลังโหลดข้อมูลระดับลูกค้า..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
              <Crown className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
              <span className="hidden md:inline">ระบบระดับลูกค้า (VIP Tier System)</span>
              <span className="md:hidden">ระดับลูกค้า</span>
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base hidden md:block">
              จัดการระดับลูกค้าและอัตราแลกเปลี่ยนตามยอดใช้จ่ายสะสม
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={handleAutoUpgrade}
              disabled={autoUpgrading}
              className="flex-1 md:flex-none px-3 py-2 md:px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${autoUpgrading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{autoUpgrading ? 'กำลังอัปเกรด...' : 'Auto-Upgrade'}</span>
              <span className="md:hidden">{autoUpgrading ? '...' : 'อัปเกรด'}</span>
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex-1 md:flex-none px-3 py-2 md:px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline">เพิ่มระดับใหม่</span>
              <span className="md:hidden">เพิ่ม</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Users className="w-8 h-8 md:w-10 md:h-10 opacity-80" />
              <div>
                <p className="text-xs md:text-sm opacity-80">ลูกค้าทั้งหมด</p>
                <p className="text-lg md:text-2xl font-bold">{overallStats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <TrendingUp className="w-8 h-8 md:w-10 md:h-10 opacity-80" />
              <div>
                <p className="text-xs md:text-sm opacity-80">ยอดใช้จ่ายรวม</p>
                <p className="text-lg md:text-2xl font-bold">{formatCurrency(overallStats.totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Award className="w-8 h-8 md:w-10 md:h-10 opacity-80" />
              <div>
                <p className="text-xs md:text-sm opacity-80">ค่าเฉลี่ย/คน</p>
                <p className="text-lg md:text-2xl font-bold">{formatCurrency(overallStats.averageSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Crown className="w-8 h-8 md:w-10 md:h-10 opacity-80" />
              <div>
                <p className="text-xs md:text-sm opacity-80">จำนวนระดับ</p>
                <p className="text-lg md:text-2xl font-bold">{tiers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">รายการระดับลูกค้า</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ลำดับ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ระดับ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">อัตราแลกเปลี่ยน</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ยอดขั้นต่ำ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ยอดสูงสุด</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ลูกค้า</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">สิทธิประโยชน์</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => {
                  const TierIcon = getTierIcon(tier.icon);
                  const stats = tierStats.find(s => s.tier.tierCode === tier.tierCode);

                  return (
                    <tr key={tier.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                              Priority
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3 mb-6">
          <h2 className="text-lg font-bold text-gray-900">รายการระดับลูกค้า</h2>
          {tiers.map((tier) => {
            const TierIcon = getTierIcon(tier.icon);
            const stats = tierStats.find(s => s.tier.tierCode === tier.tierCode);

            return (
              <div key={tier.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tier.color || '#6B7280' }}
                      >
                        <TierIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{tier.tierName}</p>
                        <p className="text-sm text-gray-500">{tier.tierNameTh}</p>
                        <p className="text-xs text-gray-400 font-mono">{tier.tierCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">{tier.exchangeRate}</p>
                      <p className="text-xs text-gray-500">฿/¥</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">ขั้นต่ำ</p>
                      <p className="font-medium text-sm">{formatCurrency(tier.minSpent)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">สูงสุด</p>
                      <p className="font-medium text-sm">{tier.maxSpent ? formatCurrency(tier.maxSpent) : '∞'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">ลูกค้า</p>
                      <p className="font-medium text-sm">{stats?.customerCount || 0}</p>
                    </div>
                  </div>

                  {(tier.benefits?.freeShipping || tier.benefits?.prioritySupport) && (
                    <div className="flex flex-wrap gap-1 mt-3">
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
                    </div>
                  )}
                </div>

                <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                  <button
                    onClick={() => handleOpenModal(tier)}
                    className="flex-1 py-3 text-sm font-medium text-blue-600 flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                    แก้ไข
                  </button>
                  {tier.tierCode !== 'member' && (
                    <button
                      onClick={() => handleDeleteTier(tier.tierCode)}
                      className="flex-1 py-3 text-sm font-medium text-red-600 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      ลบ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tier Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          {tierStats.map((stat) => {
            const TierIcon = getTierIcon(stat.tier.icon);
            return (
              <div key={stat.tier.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: stat.tier.color || '#6B7280' }}
                  >
                    <TierIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base">{stat.tier.tierName}</h3>
                    <p className="text-xs md:text-sm text-gray-500">Rate: {stat.tier.exchangeRate}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ลูกค้า</span>
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
              </div>
            );
          })}
        </div>

        {/* How it works - Hidden on mobile */}
        <div className="hidden md:block bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            วิธีการทำงานของระบบระดับลูกค้า
          </h2>
          <div className="grid grid-cols-2 gap-6 text-sm text-gray-700">
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
        </div>
      </div>

      {/* Add/Edit Tier Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 bg-black/50 z-50 md:flex md:items-center md:justify-center md:p-4"
            onClick={handleCloseModal}
          >
            {/* Desktop Modal */}
            <motion.div
              className="hidden md:block bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
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
                <TierForm
                  formData={formData}
                  setFormData={setFormData}
                  editingTier={editingTier}
                />
              </div>

              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                <button onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveTier}
                  disabled={saving}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
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
                </button>
              </div>
            </motion.div>

            {/* Mobile Bottom Sheet */}
            <motion.div
              ref={formSheetRef}
              className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[95vh] overflow-hidden flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {editingTier ? 'แก้ไขระดับ' : 'เพิ่มระดับใหม่'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <TierForm
                  formData={formData}
                  setFormData={setFormData}
                  editingTier={editingTier}
                  isMobile
                />
              </div>

              {/* Submit Button */}
              <div className="p-4 border-t bg-white">
                <button
                  onClick={handleSaveTier}
                  disabled={saving}
                  className="w-full py-4 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      บันทึก
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Tier Form Component
const TierForm = ({
  formData,
  setFormData,
  editingTier,
  isMobile = false,
}: {
  formData: TierFormData;
  setFormData: (data: TierFormData) => void;
  editingTier: CustomerTier | null;
  isMobile?: boolean;
}) => {
  const inputClass = isMobile
    ? "w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
    : "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2">รหัสระดับ</label>
          <input
            type="text"
            value={formData.tierCode}
            onChange={(e) => setFormData({ ...formData, tierCode: e.target.value })}
            className={`${inputClass} font-mono`}
            placeholder="vip"
            disabled={!!editingTier}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2">ลำดับ</label>
          <input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2">ชื่อ (EN)</label>
          <input
            type="text"
            value={formData.tierName}
            onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
            className={inputClass}
            placeholder="VIP"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2">ชื่อ (TH)</label>
          <input
            type="text"
            value={formData.tierNameTh}
            onChange={(e) => setFormData({ ...formData, tierNameTh: e.target.value })}
            className={inputClass}
            placeholder="วีไอพี"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 md:mb-2">อัตราแลกเปลี่ยน (฿/¥)</label>
        <input
          type="number"
          step="0.001"
          value={formData.exchangeRate}
          onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
          className={inputClass}
          placeholder="0.24"
        />
        <p className="text-xs text-gray-500 mt-1">เช่น 0.25 หมายถึง ¥100 = ฿25</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2">ยอดขั้นต่ำ (฿)</label>
          <input
            type="number"
            value={formData.minSpent}
            onChange={(e) => setFormData({ ...formData, minSpent: e.target.value })}
            className={inputClass}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2">ยอดสูงสุด (฿)</label>
          <input
            type="number"
            value={formData.maxSpent}
            onChange={(e) => setFormData({ ...formData, maxSpent: e.target.value })}
            className={inputClass}
            placeholder="ว่างไว้ = ไม่จำกัด"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2">สี</label>
          <div className="flex gap-2 flex-wrap">
            {TIER_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.value })}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  formData.color === color.value ? 'border-gray-800 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2">ไอคอน</label>
          <div className="flex gap-2">
            {TIER_ICONS.map((iconData) => (
              <button
                key={iconData.value}
                type="button"
                onClick={() => setFormData({ ...formData, icon: iconData.value })}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${
                  formData.icon === iconData.value
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <iconData.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">สิทธิประโยชน์</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.benefits.freeShipping}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  benefits: { ...formData.benefits, freeShipping: e.target.checked },
                })
              }
              className="w-5 h-5 text-amber-600 rounded"
            />
            <span className="text-sm">Free Shipping - ส่งฟรี</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.benefits.prioritySupport}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  benefits: { ...formData.benefits, prioritySupport: e.target.checked },
                })
              }
              className="w-5 h-5 text-amber-600 rounded"
            />
            <span className="text-sm">Priority Support - บริการลำดับความสำคัญ</span>
          </label>
        </div>
      </div>
    </>
  );
};

export default AdminTierSettingsPage;
