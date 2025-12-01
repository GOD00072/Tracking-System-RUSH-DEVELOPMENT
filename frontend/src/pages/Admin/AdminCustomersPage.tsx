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
} from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers';
import LoadingSpinner from '../../components/LoadingSpinner';
import LineSearchModal from '../../components/LineSearchModal';
import api, { API_BASE_URL } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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

// Tier configuration
const TIER_CONFIG: Record<string, any> = {
  member: { label: 'Member', labelTH: 'สมาชิก', icon: Users, color: 'bg-gray-100 text-gray-700', borderColor: 'border-gray-200' },
  vip: { label: 'VIP', labelTH: 'วีไอพี', icon: Star, color: 'bg-amber-100 text-amber-700', borderColor: 'border-amber-300' },
  vvip: { label: 'VVIP', labelTH: 'วีวีไอพี', icon: Crown, color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-300' },
  regular: { label: 'Member', labelTH: 'สมาชิก', icon: Users, color: 'bg-gray-100 text-gray-700', borderColor: 'border-gray-200' },
  premium: { label: 'VVIP', labelTH: 'วีวีไอพี', icon: Crown, color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-300' },
};

const CustomerTierBadge = ({ tier, totalSpent, showRate = false }: { tier: string; totalSpent?: number; showRate?: boolean }) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.member;
  const Icon = config.icon;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
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
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tiersFromAPI, setTiersFromAPI] = useState<TierFromAPI[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'settings'>('basic');
  const [tagInput, setTagInput] = useState('');
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');

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

  const { data: customersData, isLoading, refetch } = useCustomers(1, 100);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

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

  // Filter customers by search term
  const filteredCustomers = customersData?.data.filter((customer: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      customer.companyName?.toLowerCase().includes(term) ||
      customer.contactPerson?.toLowerCase().includes(term) ||
      customer.phone?.includes(term) ||
      customer.lineId?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term)
    );
  });

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
            toast.success('อัพเดทข้อมูลลูกค้าสำเร็จ');
          },
        }
      );
    } else {
      createCustomer.mutate(customerData, {
        onSuccess: () => {
          setShowModal(false);
          resetForm();
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            {t('customers.title')}
          </h1>
          <p className="text-gray-600 text-sm">จัดการข้อมูลลูกค้าและดูประวัติการสั่งซื้อ</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            รีเฟรช
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('customers.addCustomer')}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร, LINE, Email)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Summary */}
      {customersData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
                <p className="text-xl font-bold">{customersData.data.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ใช้งานอยู่</p>
                <p className="text-xl font-bold">
                  {customersData.data.filter((c: any) => c.isActive !== false).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">VIP</p>
                <p className="text-xl font-bold">
                  {customersData.data.filter((c: any) => c.tier === 'vip').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">VVIP</p>
                <p className="text-xl font-bold">
                  {customersData.data.filter((c: any) => c.tier === 'vvip' || c.tier === 'premium').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">มี LINE</p>
                <p className="text-xl font-bold">
                  {customersData.data.filter((c: any) => c.lineId).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                {filteredCustomers?.map((customer: any) => (
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
                      <CustomerTierBadge tier={customer.tier || 'member'} totalSpent={customer.totalSpent} />
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
                        <span className="text-sm font-medium">{customer.orders?.length || 0}</span>
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

          {filteredCustomers && filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'ไม่พบลูกค้าที่ค้นหา' : 'ยังไม่มีลูกค้า'}
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
                      <p className="text-2xl font-bold text-purple-700">¥{Number(customerDetail.stats?.totalYen || 0).toLocaleString()}</p>
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
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-600" />
                      ข้อมูลลูกค้า
                    </h3>
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
                        <CustomerTierBadge tier={customerDetail.tier || 'member'} totalSpent={customerDetail.totalSpent} />
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

                  {/* Orders List */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      ประวัติคำสั่งซื้อ ({customerDetail.orders?.length || 0})
                    </h3>
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
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">ไม่พบข้อมูลลูกค้า</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2>
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
