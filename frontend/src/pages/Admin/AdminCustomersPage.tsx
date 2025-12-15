import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  MessageCircle,
  Search,
  Crown,
  Star,
  Eye,
  Package,
  ShoppingCart,
  X,
  ChevronRight,
  Calendar,
  TrendingUp,
  Award,
  Camera,
  Upload,
  Mail,
  Phone,
  MapPin,
  Building,
  Hash,
  Globe,
  Tag,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Cake,
  Heart,
  User,
  Filter,
  ChevronDown,
  CreditCard,
  Clock,
  ExternalLink,
  Ship,
  Plane,
  Copy,
  Check,
} from 'lucide-react';
import { useCustomers, useCustomerStats, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers';
import LoadingSpinner from '../../components/LoadingSpinner';
import LineSearchModal from '../../components/LineSearchModal';
import api, { API_BASE_URL } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import useSwipeToDismiss from '../../hooks/useSwipeToDismiss';

// Type for tier from API
interface TierFromAPI {
  id: string;
  tierCode: string;
  tierName: string;
  tierNameTh: string | null;
  exchangeRate: number;
  minSpent: number;
  maxSpent: number | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
}

// Thailand provinces list
const THAILAND_PROVINCES = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร',
  'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ',
  'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก',
  'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์',
  'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี',
  'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา',
  'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์',
  'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร',
  'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง',
  'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ',
  'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี',
  'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย',
  'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์',
  'อุทัยธานี', 'อุบลราชธานี',
];

// Referral sources
const REFERRAL_SOURCES = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'line', label: 'LINE' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google', label: 'Google Search' },
  { value: 'friend', label: 'เพื่อนแนะนำ' },
  { value: 'repeat', label: 'ลูกค้าเก่า' },
  { value: 'other', label: 'อื่นๆ' },
];

// Icon mapping from API icon name to Lucide component
const ICON_MAP: Record<string, React.ElementType> = {
  User: Users,
  Users: Users,
  Star: Star,
  Crown: Crown,
};

const CustomerTierBadge = ({ tier, tierInfo, totalSpent }: { tier: string; tierInfo?: TierFromAPI | null; totalSpent?: number }) => {
  // Get display name
  const displayName = tierInfo?.tierNameTh || tierInfo?.tierName || tier.toUpperCase();

  // Get icon from API or fallback
  const iconName = tierInfo?.icon || 'User';
  const Icon = ICON_MAP[iconName] || Users;

  // Get color from API or fallback
  const apiColor = tierInfo?.color;
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-700';

  if (apiColor) {
    // Convert hex color to appropriate Tailwind classes based on color
    const colorLower = apiColor.toLowerCase();
    if (colorLower.includes('f59e0b') || colorLower.includes('amber')) {
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-700';
    } else if (colorLower.includes('7c3aed') || colorLower.includes('purple')) {
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-700';
    } else if (colorLower.includes('3b82f6') || colorLower.includes('blue')) {
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-700';
    } else if (colorLower.includes('10b981') || colorLower.includes('green')) {
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
    } else if (colorLower.includes('ef4444') || colorLower.includes('red')) {
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
    } else if (colorLower.includes('f97316') || colorLower.includes('orange')) {
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-700';
    } else if (colorLower.includes('ec4899') || colorLower.includes('pink')) {
      bgColor = 'bg-pink-100';
      textColor = 'text-pink-700';
    }
  } else {
    // Fallback based on tier code pattern
    const code = tier.toLowerCase();
    if (code.includes('vvip') || code === 'premium') {
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-700';
    } else if (code.includes('vip')) {
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-700';
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
          <Icon className="w-3 h-3 mr-1" />
          {displayName}
        </span>
      </div>
      {totalSpent !== undefined && totalSpent > 0 && (
        <span className="text-xs text-gray-500">ยอดสะสม: ฿{Number(totalSpent).toLocaleString()}</span>
      )}
    </div>
  );
};

const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'รอดำเนินการ',
  processing: 'กำลังดำเนินการ',
  shipped: 'กำลังจัดส่ง',
  delivered: 'ส่งถึงแล้ว',
  cancelled: 'ยกเลิก',
};

const AdminCustomersPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [showLineSearchModal, setShowLineSearchModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Swipe to dismiss refs
  const detailSheetRef = useSwipeToDismiss({
    onDismiss: () => setShowDetailModal(false),
    enabled: showDetailModal,
  });
  const formSheetRef = useSwipeToDismiss({
    onDismiss: () => setShowModal(false),
    enabled: showModal,
  });
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tiersFromAPI, setTiersFromAPI] = useState<TierFromAPI[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'settings'>('basic');
  const [detailTab, setDetailTab] = useState<'orders' | 'items'>('orders');
  const [tagInput, setTagInput] = useState('');
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');

  // Filter state
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterTier, setFilterTier] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterHasLine, setFilterHasLine] = useState<string>('');
  const filterRef = useRef<HTMLDivElement>(null);

  // Customer code copy state
  const [copiedCustomerCode, setCopiedCustomerCode] = useState(false);

  // Copy customer code to clipboard
  const handleCopyCustomerCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCustomerCode(true);
    toast.success(`คัดลอกรหัสลูกค้า ${code} แล้ว`);
    setTimeout(() => setCopiedCustomerCode(false), 2000);
  };

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count active filters
  const activeFilterCount = [filterTier, filterStatus, filterHasLine].filter(Boolean).length;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    lineId: '',
    email: '',
    address: '',
    notes: '',
    userId: '',
    airtableId: '',
    tier: 'member',
    discount: '',
    // totalSpent is calculated automatically - not editable
    // New fields
    profileImageUrl: '',
    taxId: '',
    shippingAddress: '',
    billingAddress: '',
    province: '',
    postalCode: '',
    country: 'Thailand',
    dateOfBirth: '',
    preferredContact: 'line',
    referralSource: '',
    tags: [] as string[],
    isActive: true,
  });

  const ITEMS_PER_PAGE = 20;
  const filters = {
    tier: filterTier,
    status: filterStatus,
    hasLine: filterHasLine,
  };
  const { data: customersData, isLoading, refetch } = useCustomers(currentPage, ITEMS_PER_PAGE, debouncedSearch, filters);
  const { data: customerStats } = useCustomerStats();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  // Pagination info
  const totalPages = customersData?.pagination?.total_pages || 1;
  const totalCustomers = customersData?.pagination?.total || 0;

  // Fetch tiers from API
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await api.get('/tiers');
        if (response.data.success) {
          setTiersFromAPI(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching tiers:', error);
      }
    };
    fetchTiers();
  }, []);

  // Customers are now filtered from backend
  const customers = customersData?.data || [];

  // Helper to get tier info from API
  const getTierInfo = (tierCode: string): TierFromAPI | null => {
    return tiersFromAPI.find(t => t.tierCode === tierCode) || null;
  };

  const handleViewDetail = async (customer: any) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
    setLoadingDetail(true);

    try {
      const response = await api.get(`/customers/${customer.id}`);
      if (response.data.success) {
        setCustomerDetail(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customer detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      // Use query parameter for folder since multipart doesn't parse body before multer
      const response = await api.post('/upload/cloudinary?folder=customer-profiles', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setFormData({ ...formData, profileImageUrl: response.data.data.url });
        toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const customerData = {
      companyName: formData.companyName || undefined,
      contactPerson: formData.contactPerson || undefined,
      phone: formData.phone || undefined,
      lineId: formData.lineId || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
      userId: formData.userId || undefined,
      airtableId: formData.airtableId || undefined,
      tier: formData.tier || 'member',
      discount: formData.discount ? parseFloat(formData.discount) : undefined,
      // totalSpent is calculated automatically from verified payments - not editable
      // New fields
      profileImageUrl: formData.profileImageUrl || undefined,
      taxId: formData.taxId || undefined,
      shippingAddress: formData.shippingAddress || undefined,
      billingAddress: formData.billingAddress || undefined,
      province: formData.province || undefined,
      postalCode: formData.postalCode || undefined,
      country: formData.country || 'Thailand',
      dateOfBirth: formData.dateOfBirth || undefined,
      preferredContact: formData.preferredContact || 'line',
      referralSource: formData.referralSource || undefined,
      tags: formData.tags,
      isActive: formData.isActive,
    };

    if (editingCustomer) {
      updateCustomer.mutate(
        { id: editingCustomer.id, data: customerData },
        {
          onSuccess: () => {
            setShowModal(false);
            setEditingCustomer(null);
            resetForm();
            refetch(); // Refresh customer list
            toast.success('อัพเดทข้อมูลลูกค้าสำเร็จ');
          },
        }
      );
    } else {
      createCustomer.mutate(customerData, {
        onSuccess: () => {
          setShowModal(false);
          resetForm();
          refetch(); // Refresh customer list
          toast.success('เพิ่มลูกค้าใหม่สำเร็จ');
        },
      });
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      phone: '',
      lineId: '',
      email: '',
      address: '',
      notes: '',
      userId: '',
      airtableId: '',
      tier: 'member',
      discount: '',
      profileImageUrl: '',
      taxId: '',
      shippingAddress: '',
      billingAddress: '',
      province: '',
      postalCode: '',
      country: 'Thailand',
      dateOfBirth: '',
      preferredContact: 'line',
      referralSource: '',
      tags: [],
      isActive: true,
    });
    setActiveTab('basic');
    setTagInput('');
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      companyName: customer.companyName || '',
      contactPerson: customer.contactPerson || '',
      phone: customer.phone || '',
      lineId: customer.lineId || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
      userId: customer.userId || '',
      airtableId: customer.airtableId || '',
      tier: customer.tier || 'member',
      discount: customer.discount?.toString() || '',
      // totalSpent is calculated automatically - not editable
      profileImageUrl: customer.profileImageUrl || '',
      taxId: customer.taxId || '',
      shippingAddress: customer.shippingAddress || '',
      billingAddress: customer.billingAddress || '',
      province: customer.province || '',
      postalCode: customer.postalCode || '',
      country: customer.country || 'Thailand',
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
      preferredContact: customer.preferredContact || 'line',
      referralSource: customer.referralSource || '',
      tags: customer.tags || [],
      isActive: customer.isActive ?? true,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบลูกค้ารายนี้หรือไม่?')) {
      deleteCustomer.mutate(id, {
        onSuccess: () => toast.success('ลบลูกค้าสำเร็จ'),
      });
    }
  };

  const handleSelectLineUser = (lineUser: any) => {
    setFormData({
      ...formData,
      lineId: lineUser.lineId,
      userId: lineUser.id,
      companyName: formData.companyName || lineUser.fullName || '',
      contactPerson: formData.contactPerson || lineUser.fullName || '',
      email: formData.email || lineUser.email || '',
      phone: formData.phone || lineUser.phone || '',
    });
  };

  // Filter provinces based on search
  const filteredProvinces = THAILAND_PROVINCES.filter((province) =>
    province.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  const handleSelectProvince = (province: string) => {
    setFormData({ ...formData, province });
    setShowProvinceModal(false);
    setProvinceSearch('');
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            {t('customers.title')}
          </h1>
          <p className="text-gray-600 text-sm hidden sm:block">จัดการข้อมูลลูกค้าและดูประวัติการสั่งซื้อ</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => refetch()}
            className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>{t('customers.addCustomer')}</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />
        </div>

        {/* Filter Button */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-xl hover:bg-gray-50 transition-colors ${
              activeFilterCount > 0 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>ตัวกรอง</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter Dropdown */}
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
              <div className="p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">ตัวกรอง</h3>

                {/* Tier Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ระดับสมาชิก</label>
                  <select
                    value={filterTier}
                    onChange={(e) => {
                      setFilterTier(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ทั้งหมด</option>
                    {tiersFromAPI.length > 0 ? (
                      tiersFromAPI.map((tier) => (
                        <option key={tier.tierCode} value={tier.tierCode}>
                          {tier.tierName} {tier.tierNameTh && `(${tier.tierNameTh})`}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="member">Member</option>
                        <option value="vip">VIP</option>
                        <option value="vvip">VVIP</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="active">ใช้งานอยู่</option>
                    <option value="inactive">ไม่ใช้งาน</option>
                  </select>
                </div>

                {/* Has LINE Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LINE ID</label>
                  <select
                    value={filterHasLine}
                    onChange={(e) => {
                      setFilterHasLine(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="yes">มี LINE</option>
                    <option value="no">ไม่มี LINE</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterTier('');
                      setFilterStatus('');
                      setFilterHasLine('');
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    ล้างตัวกรองทั้งหมด
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterTier && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              ระดับ: {filterTier.toUpperCase()}
              <button onClick={() => { setFilterTier(''); setCurrentPage(1); }} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterStatus && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              สถานะ: {filterStatus === 'active' ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
              <button onClick={() => { setFilterStatus(''); setCurrentPage(1); }} className="hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterHasLine && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              LINE: {filterHasLine === 'yes' ? 'มี' : 'ไม่มี'}
              <button onClick={() => { setFilterHasLine(''); setCurrentPage(1); }} className="hover:text-emerald-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 md:p-5 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">ทั้งหมด</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold">{customerStats?.totalCustomers ?? totalCustomers}</p>
          <p className="text-xs md:text-sm text-blue-100 mt-1">ลูกค้าทั้งหมด</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 md:p-5 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">เดือนนี้</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold">{customerStats?.newThisMonth ?? 0}</p>
          <p className="text-xs md:text-sm text-emerald-100 mt-1">ลูกค้าใหม่</p>
        </div>
      </div>

      {/* Customers List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {customers?.map((customer: any) => (
              <div
                key={customer.id}
                className="bg-white rounded-xl shadow-sm border p-4 active:scale-[0.98] transition-transform"
                onClick={() => handleViewDetail(customer)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {customer.profileImageUrl ? (
                    <img
                      src={customer.profileImageUrl}
                      alt={customer.companyName || customer.contactPerson}
                      className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {(customer.companyName || customer.contactPerson || '?')[0].toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {customer.companyName || customer.contactPerson || 'ไม่มีชื่อ'}
                        </h3>
                        {customer.companyName && customer.contactPerson && (
                          <p className="text-sm text-gray-500 truncate">{customer.contactPerson}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <CustomerTierBadge tier={customer.tier || 'member'} tierInfo={getTierInfo(customer.tier || 'member')} />
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.lineId && (
                        <span className="flex items-center gap-1 text-green-600">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[80px]">{customer.lineId}</span>
                        </span>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-sm">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{customer.orders?.length || 0}</span>
                          <span className="text-gray-400">ออเดอร์</span>
                        </span>
                        {customer.totalSpent > 0 && (
                          <span className="text-sm text-gray-500">
                            ฿{Number(customer.totalSpent).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {customer.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          ใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <XCircle className="w-3 h-3" />
                          ปิดใช้งาน
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewDetail(customer); }}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 active:bg-gray-200"
                  >
                    <Eye className="w-4 h-4" />
                    ดูประวัติ
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
                    className="flex-1 py-2.5 bg-blue-100 text-blue-700 rounded-lg font-medium flex items-center justify-center gap-2 active:bg-blue-200"
                  >
                    <Edit className="w-4 h-4" />
                    แก้ไข
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                    className="py-2.5 px-4 bg-red-100 text-red-700 rounded-lg active:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {customers && customers.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{searchTerm ? 'ไม่พบลูกค้าที่ค้นหา' : 'ยังไม่มีลูกค้า'}</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ติดต่อ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำสั่งซื้อ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers?.map((customer: any) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {customer.profileImageUrl ? (
                            <img
                              src={customer.profileImageUrl}
                              alt={customer.companyName || customer.contactPerson}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {(customer.companyName || customer.contactPerson || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.companyName || customer.contactPerson || 'ไม่มีชื่อ'}
                            </div>
                            {customer.companyName && customer.contactPerson && (
                              <div className="text-sm text-gray-500">{customer.contactPerson}</div>
                            )}
                            {customer.email && (
                              <div className="text-xs text-gray-400">{customer.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                        {customer.lineId && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <MessageCircle className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">{customer.lineId}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <CustomerTierBadge tier={customer.tier || 'member'} tierInfo={getTierInfo(customer.tier || 'member')} totalSpent={customer.totalSpent} />
                      </td>
                      <td className="px-6 py-4">
                        {customer.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            ใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <XCircle className="w-3 h-3" />
                            ปิดใช้งาน
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{customer._count?.orders || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleViewDetail(customer)} className="text-green-600 hover:text-green-900 p-1" title="ดูประวัติ">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-900 p-1" title="แก้ไข">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900 p-1" title="ลบ">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {customers && customers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'ไม่พบลูกค้าที่ค้นหา' : 'ยังไม่มีลูกค้า'}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 md:px-0">
              <div className="text-sm text-gray-600">
                แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCustomers)} จาก {totalCustomers} รายการ
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  หน้าแรก
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ก่อนหน้า
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 text-sm rounded-lg border ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ถัดไป
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  หน้าสุดท้าย
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Customer Detail Modal - Bottom Sheet on Mobile */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 md:flex md:items-center md:justify-center md:p-4" onClick={() => setShowDetailModal(false)}>
          {/* Mobile: Bottom Sheet */}
          <div
            ref={detailSheetRef}
            className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle - ปัดลงเพื่อปิด */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Mobile Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                {customerDetail?.profileImageUrl ? (
                  <img src={customerDetail.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
                ) : (
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                    {(selectedCustomer?.companyName || selectedCustomer?.contactPerson || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-bold truncate max-w-[200px]">{selectedCustomer?.companyName || selectedCustomer?.contactPerson || 'ลูกค้า'}</h2>
                  <p className="text-blue-100 text-xs">ประวัติการสั่งซื้อ</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-white p-2 -mr-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-8">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : customerDetail ? (
                <>
                  {/* Stats Grid - 2x2 on mobile */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                        <ShoppingCart className="w-4 h-4" />
                        <span className="text-xs">คำสั่งซื้อ</span>
                      </div>
                      <p className="text-xl font-bold text-blue-700">{customerDetail.stats?.totalOrders || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                        <Package className="w-4 h-4" />
                        <span className="text-xs">สินค้า</span>
                      </div>
                      <p className="text-xl font-bold text-gray-700">{customerDetail.stats?.totalItems || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">ยอดรวม (฿)</span>
                      </div>
                      <p className="text-lg font-bold text-amber-700">฿{Number(customerDetail.stats?.totalBaht || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">ยอดรวม (¥)</span>
                      </div>
                      <p className="text-lg font-bold text-purple-700">¥{Math.round(Number(customerDetail.stats?.totalYen || 0)).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Payment Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-green-600 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">ยืนยันแล้ว</span>
                      </div>
                      <p className="text-lg font-bold text-green-700">฿{Number(customerDetail.stats?.verifiedBaht || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-yellow-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">รอยืนยัน</span>
                      </div>
                      <p className="text-lg font-bold text-yellow-700">฿{Number(customerDetail.stats?.pendingBaht || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Customer Info - Compact */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-600" />
                        ข้อมูลลูกค้า
                      </h3>
                      {customerDetail.customerCode && (
                        <button
                          onClick={() => handleCopyCustomerCode(customerDetail.customerCode)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                        >
                          <span className="font-bold">{customerDetail.customerCode}</span>
                          {copiedCustomerCode ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-gray-500 text-xs">ชื่อ/บริษัท</p><p className="font-medium truncate">{customerDetail.companyName || '-'}</p></div>
                      <div><p className="text-gray-500 text-xs">เบอร์โทร</p><p className="font-medium">{customerDetail.phone || '-'}</p></div>
                      <div><p className="text-gray-500 text-xs">LINE ID</p><p className="font-medium truncate">{customerDetail.lineId || '-'}</p></div>
                      <div><p className="text-gray-500 text-xs">จังหวัด</p><p className="font-medium">{customerDetail.province || '-'}</p></div>
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs">ประเภท</p>
                        <CustomerTierBadge tier={customerDetail.tier || 'member'} tierInfo={getTierInfo(customerDetail.tier || 'member')} totalSpent={customerDetail.totalSpent} />
                      </div>
                    </div>
                  </div>

                  {/* Orders List */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-600" />
                      ประวัติคำสั่งซื้อ ({customerDetail.orders?.length || 0})
                    </h3>
                    {customerDetail.orders && customerDetail.orders.length > 0 ? (
                      <div className="space-y-2">
                        {customerDetail.orders.map((order: any) => (
                          <div key={order.id} className="bg-white border rounded-xl p-3 active:bg-gray-50" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{order.orderNumber}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                                {STATUS_LABELS[order.status] || order.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{new Date(order.createdAt).toLocaleDateString('th-TH')}</span>
                              <span>{order.shippingMethod === 'air' ? '✈️' : '🚢'}</span>
                              <span>{order._count?.orderItems || order.orderItems?.length || 0} รายการ</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl text-sm">ยังไม่มีประวัติการสั่งซื้อ</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">ไม่พบข้อมูลลูกค้า</div>
              )}
            </div>
          </div>

          {/* Desktop: Centered Modal */}
          <div
            className="hidden md:flex bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-white">
                {customerDetail?.profileImageUrl ? (
                  <img src={customerDetail.profileImageUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/30" />
                ) : (
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {(selectedCustomer?.companyName || selectedCustomer?.contactPerson || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{selectedCustomer?.companyName || selectedCustomer?.contactPerson || 'ลูกค้า'}</h2>
                  <p className="text-blue-100 text-sm">ประวัติการสั่งซื้อและข้อมูลลูกค้า</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : customerDetail ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <ShoppingCart className="w-4 h-4" />
                        <span className="text-sm">คำสั่งซื้อ</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{customerDetail.stats?.totalOrders || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Package className="w-4 h-4" />
                        <span className="text-sm">สินค้า</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-700">{customerDetail.stats?.totalItems || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">ยอดรวม (฿)</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-700">฿{Number(customerDetail.stats?.totalBaht || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">ยอดรวม (¥)</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">¥{Math.round(Number(customerDetail.stats?.totalYen || 0)).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Payment Stats - Verified vs Pending */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">ยอดที่ยืนยันแล้ว</span>
                      </div>
                      <div className="flex items-baseline gap-4">
                        <p className="text-xl font-bold text-green-700">฿{Number(customerDetail.stats?.verifiedBaht || 0).toLocaleString()}</p>
                        <p className="text-sm text-green-600">¥{Number(customerDetail.stats?.verifiedYen || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-600 mb-2">
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">ยอดที่ยังไม่ยืนยัน</span>
                      </div>
                      <div className="flex items-baseline gap-4">
                        <p className="text-xl font-bold text-yellow-700">฿{Number(customerDetail.stats?.pendingBaht || 0).toLocaleString()}</p>
                        <p className="text-sm text-yellow-600">¥{Number(customerDetail.stats?.pendingYen || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-600" />
                        ข้อมูลลูกค้า
                      </h3>
                      {customerDetail.customerCode && (
                        <button
                          onClick={() => handleCopyCustomerCode(customerDetail.customerCode)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                        >
                          <span className="font-bold">{customerDetail.customerCode}</span>
                          {copiedCustomerCode ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-gray-500">ชื่อ/บริษัท</p><p className="font-medium">{customerDetail.companyName || '-'}</p></div>
                      <div><p className="text-gray-500">ผู้ติดต่อ</p><p className="font-medium">{customerDetail.contactPerson || '-'}</p></div>
                      <div><p className="text-gray-500">เบอร์โทร</p><p className="font-medium">{customerDetail.phone || '-'}</p></div>
                      <div><p className="text-gray-500">อีเมล</p><p className="font-medium">{customerDetail.email || '-'}</p></div>
                      <div><p className="text-gray-500">LINE ID</p><p className="font-medium">{customerDetail.lineId || '-'}</p></div>
                      <div><p className="text-gray-500">เลขผู้เสียภาษี</p><p className="font-medium">{customerDetail.taxId || '-'}</p></div>
                      <div><p className="text-gray-500">จังหวัด</p><p className="font-medium">{customerDetail.province || '-'}</p></div>
                      <div><p className="text-gray-500">รหัสไปรษณีย์</p><p className="font-medium">{customerDetail.postalCode || '-'}</p></div>
                      <div>
                        <p className="text-gray-500">ประเภท</p>
                        <CustomerTierBadge tier={customerDetail.tier || 'member'} tierInfo={getTierInfo(customerDetail.tier || 'member')} totalSpent={customerDetail.totalSpent} />
                      </div>
                      <div><p className="text-gray-500">วันที่สร้าง</p><p className="font-medium">{new Date(customerDetail.createdAt).toLocaleDateString('th-TH')}</p></div>
                      {customerDetail.referralSource && (
                        <div><p className="text-gray-500">รู้จักจาก</p><p className="font-medium">{REFERRAL_SOURCES.find(r => r.value === customerDetail.referralSource)?.label || customerDetail.referralSource}</p></div>
                      )}
                      {customerDetail.tags && customerDetail.tags.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-gray-500 mb-1">แท็ก</p>
                          <div className="flex flex-wrap gap-1">
                            {customerDetail.tags.map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {(customerDetail.shippingAddress || customerDetail.address) && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-gray-500 text-sm mb-1">ที่อยู่จัดส่ง</p>
                        <p className="text-sm">{customerDetail.shippingAddress || customerDetail.address}</p>
                      </div>
                    )}
                  </div>

                  {/* Orders & Items Tabs */}
                  <div>
                    {/* Tab Headers */}
                    <div className="flex gap-4 border-b mb-4">
                      <button
                        type="button"
                        onClick={() => setDetailTab('orders')}
                        className={`flex items-center gap-2 px-1 py-2 border-b-2 transition-colors ${
                          detailTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        ประวัติคำสั่งซื้อ ({customerDetail.orders?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailTab('items')}
                        className={`flex items-center gap-2 px-1 py-2 border-b-2 transition-colors ${
                          detailTab === 'items' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        สินค้า ({customerDetail.stats?.totalItems || 0})
                      </button>
                    </div>

                    {/* Orders Tab Content */}
                    {detailTab === 'orders' && (
                      <>
                        {customerDetail.orders && customerDetail.orders.length > 0 ? (
                          <div className="space-y-3">
                            {customerDetail.orders.map((order: any) => (
                              <div key={order.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-gray-400" />
                                    <span className="font-medium">{order.orderNumber}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                                      {STATUS_LABELS[order.status] || order.status}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(order.createdAt).toLocaleDateString('th-TH')}
                                  </span>
                                  <span>{order.shippingMethod === 'air' ? '✈️ เครื่องบิน' : '🚢 ทางเรือ'}</span>
                                  <span className="flex items-center gap-1">
                                    <ShoppingCart className="w-4 h-4" />
                                    {order._count?.orderItems || order.orderItems?.length || 0} รายการ
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">ยังไม่มีประวัติการสั่งซื้อ</div>
                        )}
                      </>
                    )}

                    {/* Items Tab Content */}
                    {detailTab === 'items' && (
                      <>
                        {customerDetail.orders && customerDetail.orders.length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="px-4 py-3 text-left font-medium text-gray-600">Order</th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-600">สินค้า</th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-600">ขนส่ง</th>
                                  <th className="px-4 py-3 text-right font-medium text-gray-600">ราคา (¥)</th>
                                  <th className="px-4 py-3 text-right font-medium text-gray-600">ราคา (฿)</th>
                                  <th className="px-4 py-3 text-center font-medium text-gray-600">สถานะ</th>
                                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {customerDetail.orders.flatMap((order: any) =>
                                  order.orderItems?.map((item: any, idx: number) => (
                                    <tr key={item.id || `${order.id}-${idx}`} className="hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                        <span className="text-blue-600 font-medium">{order.orderNumber}</span>
                                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('th-TH')}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <p className="font-medium">{item.productCode || `รายการ ${idx + 1}`}</p>
                                        <p className="text-xs text-gray-500">{item.customerName || '-'}</p>
                                      </td>
                                      <td className="px-4 py-3">
                                        {order.shippingMethod === 'sea' ? (
                                          <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs">
                                            <Ship className="w-3 h-3" /> Sea
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-xs">
                                            <Plane className="w-3 h-3" /> Air
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-purple-600">
                                        ¥{Math.round(Number(item.priceYen || 0)).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                                        ฿{Number(item.priceBaht || 0).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          item.statusStep >= 9 ? 'bg-green-100 text-green-700' :
                                          item.statusStep >= 5 ? 'bg-blue-100 text-blue-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {item.itemStatus || `ขั้นตอน ${item.statusStep}`}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <button
                                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                          ดู
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                              <tfoot className="bg-gray-50 border-t-2">
                                <tr className="font-bold">
                                  <td colSpan={3} className="px-4 py-3 text-right">รวมทั้งหมด</td>
                                  <td className="px-4 py-3 text-right text-purple-600">¥{Math.round(Number(customerDetail?.stats?.totalYen || 0)).toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right text-gray-900">฿{Number(customerDetail?.stats?.totalBaht || 0).toLocaleString()}</td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>ยังไม่มีรายการสินค้า</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">ไม่พบข้อมูลลูกค้า</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Bottom Sheet on Mobile */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 md:flex md:items-center md:justify-center md:p-4" onClick={() => setShowModal(false)}>
          <div
            ref={formSheetRef}
            className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[95vh] overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle - ปัดลงเพื่อปิด */}
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Mobile Header */}
            <div className="px-4 pb-3 border-b flex items-center justify-between sticky top-6 bg-white z-10">
              <h2 className="text-lg font-bold">{editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2>
              <button onClick={() => { setShowModal(false); setEditingCustomer(null); resetForm(); }} className="p-2 -mr-2 text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 pb-8">
              {/* Profile Image Upload - Smaller on Mobile */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {formData.profileImageUrl ? (
                    <img src={formData.profileImageUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-gray-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-lg active:bg-blue-700"
                  >
                    {uploadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>

              {/* Mobile Tabs - Scrollable */}
              <div className="flex gap-1 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
                {[
                  { id: 'basic', label: 'ข้อมูล', icon: User },
                  { id: 'address', label: 'ที่อยู่', icon: MapPin },
                  { id: 'settings', label: 'ตั้งค่า', icon: Crown },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Form Fields */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท/ร้านค้า</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="บริษัท ABC จำกัด"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ติดต่อ</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="คุณสมชาย"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="081-234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LINE User ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.lineId}
                        onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="U1234567890abcdef"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLineSearchModal(true)}
                        className="px-4 py-3 bg-green-600 text-white rounded-xl active:bg-green-700"
                      >
                        <Search className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รู้จักจาก</label>
                    <select
                      value={formData.referralSource}
                      onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    >
                      <option value="">-- เลือก --</option>
                      {REFERRAL_SOURCES.map((source) => (
                        <option key={source.value} value={source.value}>{source.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                    <button
                      type="button"
                      onClick={() => setShowProvinceModal(true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left flex items-center justify-between"
                    >
                      <span className={formData.province ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.province || '-- เลือกจังหวัด --'}
                      </span>
                      <Search className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="10110"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่จัดส่ง</label>
                    <textarea
                      value={formData.shippingAddress}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="ที่อยู่สำหรับจัดส่งสินค้า..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ระดับลูกค้า</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    >
                      {tiersFromAPI.length > 0 ? (
                        tiersFromAPI.map((tier) => (
                          <option key={tier.tierCode} value={tier.tierCode}>
                            {tier.tierName} ({tier.exchangeRate} ฿/¥)
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="member">Member (0.25 ฿/¥)</option>
                          <option value="vip">VIP (0.24 ฿/¥)</option>
                          <option value="vvip">VVIP (0.23 ฿/¥)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="isActiveMobile"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActiveMobile" className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">ใช้งานอยู่</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Mobile Submit Button */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingCustomer(null); resetForm(); }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium active:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={createCustomer.isPending || updateCustomer.isPending}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 active:bg-blue-700"
                >
                  {(createCustomer.isPending || updateCustomer.isPending) && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingCustomer ? 'บันทึก' : 'เพิ่มลูกค้า'}
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Modal */}
          <div
            className="hidden md:flex bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2>
              <button onClick={() => { setShowModal(false); setEditingCustomer(null); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {/* Profile Image Upload */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {formData.profileImageUrl ? (
                    <img src={formData.profileImageUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-200" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                  >
                    {uploadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b">
                {[
                  { id: 'basic', label: 'ข้อมูลพื้นฐาน', icon: User },
                  { id: 'address', label: 'ที่อยู่', icon: MapPin },
                  { id: 'settings', label: 'ตั้งค่า', icon: Crown },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                        activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Building className="w-4 h-4 inline mr-1" />
                        ชื่อบริษัท/ร้านค้า
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="บริษัท ABC จำกัด"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User className="w-4 h-4 inline mr-1" />
                        ชื่อผู้ติดต่อ
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="คุณสมชาย"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Phone className="w-4 h-4 inline mr-1" />
                        เบอร์โทร
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="081-234-5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        อีเมล
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        LINE User ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.lineId}
                          onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="U1234567890abcdef"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLineSearchModal(true)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Hash className="w-4 h-4 inline mr-1" />
                        เลขผู้เสียภาษี
                      </label>
                      <input
                        type="text"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0-1234-56789-01-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Cake className="w-4 h-4 inline mr-1" />
                        วันเกิด
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Heart className="w-4 h-4 inline mr-1" />
                        รู้จักจาก
                      </label>
                      <select
                        value={formData.referralSource}
                        onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- เลือก --</option>
                        {REFERRAL_SOURCES.map((source) => (
                          <option key={source.value} value={source.value}>{source.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="หมายเหตุเพิ่มเติม..."
                    />
                  </div>
                </div>
              )}

              {/* Address Tab */}
              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                      <button
                        type="button"
                        onClick={() => setShowProvinceModal(true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
                      >
                        <span className={formData.province ? 'text-gray-900' : 'text-gray-400'}>
                          {formData.province || '-- เลือกจังหวัด --'}
                        </span>
                        <Search className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10110"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ประเทศ</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ช่องทางติดต่อที่ต้องการ</label>
                      <select
                        value={formData.preferredContact}
                        onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="line">LINE</option>
                        <option value="phone">โทรศัพท์</option>
                        <option value="email">อีเมล</option>
                        <option value="sms">SMS</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่ทั่วไป</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123 ถนนสุขุมวิท แขวงคลองเตย..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่จัดส่ง</label>
                    <textarea
                      value={formData.shippingAddress}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ที่อยู่สำหรับจัดส่งสินค้า..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่ออกใบกำกับภาษี</label>
                    <textarea
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ที่อยู่สำหรับออกใบกำกับภาษี..."
                    />
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ระดับลูกค้า</label>
                      <select
                        value={formData.tier}
                        onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {tiersFromAPI.length > 0 ? (
                          tiersFromAPI.map((tier) => (
                            <option key={tier.tierCode} value={tier.tierCode}>
                              {tier.tierName} ({tier.exchangeRate} ฿/¥)
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="member">Member (0.25 ฿/¥)</option>
                            <option value="vip">VIP (0.24 ฿/¥)</option>
                            <option value="vvip">VVIP (0.23 ฿/¥)</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ส่วนลด (%)</label>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="5"
                        min="0"
                        max="100"
                        step="0.5"
                      />
                    </div>
                  </div>

                  {/* Total Spent - Read Only (calculated from verified payments) */}
                  {editingCustomer && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">ยอดสะสม (คำนวณจากยอดชำระที่ยืนยันแล้ว)</p>
                          <p className="text-xl font-bold text-green-600">฿{Number(editingCustomer.totalSpent || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          คำนวณอัตโนมัติ
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Tag className="w-4 h-4 inline mr-1" />
                      แท็ก
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="พิมพ์แท็กแล้วกด Enter"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        เพิ่ม
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">ใช้งานอยู่</span>
                      <span className="text-gray-500 text-sm">(ลูกค้าที่ปิดใช้งานจะไม่แสดงในรายการค้นหา)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={createCustomer.isPending || updateCustomer.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {(createCustomer.isPending || updateCustomer.isPending) && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingCustomer ? 'บันทึก' : 'เพิ่มลูกค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINE User Search Modal */}
      <LineSearchModal
        isOpen={showLineSearchModal}
        onClose={() => setShowLineSearchModal(false)}
        onSelectUser={handleSelectLineUser}
      />

      {/* Province Search Modal */}
      {showProvinceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  เลือกจังหวัด
                </h3>
                <button
                  onClick={() => {
                    setShowProvinceModal(false);
                    setProvinceSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  placeholder="ค้นหาจังหวัด..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {provinceSearch && (
                  <button
                    onClick={() => setProvinceSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredProvinces.length > 0 ? (
                <div className="divide-y">
                  {filteredProvinces.map((province) => (
                    <button
                      key={province}
                      type="button"
                      onClick={() => handleSelectProvince(province)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between transition-colors ${
                        formData.province === province ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {province}
                      </span>
                      {formData.province === province && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>ไม่พบจังหวัดที่ค้นหา</p>
                </div>
              )}
            </div>
            {formData.province && (
              <div className="p-3 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, province: '' });
                    setShowProvinceModal(false);
                    setProvinceSearch('');
                  }}
                  className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                >
                  ล้างการเลือก
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomersPage;
