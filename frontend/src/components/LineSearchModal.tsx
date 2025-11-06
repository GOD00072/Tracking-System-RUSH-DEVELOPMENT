import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, X, User } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import API_BASE_URL from '../utils/apiConfig';

interface LineUser {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  lineId: string;
  profilePicture?: string;
  avatarUrl?: string;
  createdAt: string;
}

interface LineSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: LineUser) => void;
}

const LineSearchModal = ({ isOpen, onClose, onSelectUser }: LineSearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LineUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/customers/search-line-users?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching LINE users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search while typing with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(searchQuery);
      }, 300); // Wait 300ms after user stops typing
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectUser = (user: LineUser) => {
    onSelectUser(user);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-500" />
            ค้นหาผู้ใช้จาก LINE OA
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="พิมพ์เพื่อค้นหา (ชื่อ, อีเมล, LINE ID, เบอร์โทร)..."
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              ) : (
                <Search className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
               ผลลัพธ์จะแสดงอัตโนมัติขณะพิมพ์
            </p>
            {searchResults.length > 0 && (
              <p className="text-xs font-medium text-green-600">
                พบ {searchResults.length} ผู้ใช้
              </p>
            )}
          </div>
        </div>

        <div className="border rounded-lg max-h-[500px] overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Profile Picture */}
                      <div className="flex-shrink-0">
                        {user.profilePicture || user.avatarUrl ? (
                          <img
                            src={user.profilePicture || user.avatarUrl}
                            alt={user.fullName || 'User'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${user.profilePicture || user.avatarUrl ? 'hidden' : ''} bg-green-100 p-3 rounded-full`}>
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.fullName || 'ไม่ระบุชื่อ'}
                        </div>
                        {user.email && (
                          <div className="text-sm text-gray-600 truncate">{user.email}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 font-mono truncate">
                          LINE ID: {user.lineId}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">📞 {user.phone}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectUser(user);
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex-shrink-0 transition-colors"
                    >
                      เลือก
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="p-12 text-center text-gray-500">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-700">ไม่พบผู้ใช้ LINE</p>
              <p className="text-sm mt-2">ไม่พบผู้ใช้ที่ตรงกับ "{searchQuery}"</p>
              <p className="text-sm text-gray-400 mt-1">ลองค้นหาด้วยคำอื่น หรือเพิ่ม LINE ID ด้วยตัวเอง</p>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-lg font-medium text-gray-700">เริ่มค้นหาผู้ใช้ LINE</p>
              <p className="text-sm mt-2">พิมพ์ชื่อ, อีเมล, LINE ID, หรือเบอร์โทร</p>
              <p className="text-sm text-gray-400 mt-1">ผลลัพธ์จะแสดงอัตโนมัติขณะพิมพ์</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineSearchModal;
