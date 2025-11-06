import { useState } from 'react';
import { User, LogOut, Package } from 'lucide-react';
import { useCurrentUser, useLogout, useLineCallback } from '../hooks/useAuth';
import LineLoginButton from './LineLoginButton';

const UserProfile = () => {
  const [showMenu, setShowMenu] = useState(false);
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  // Handle LINE callback
  useLineCallback();

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (!user) {
    return <LineLoginButton text="เข้าสู่ระบบ" size="sm" />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.fullName || 'User'}
            className="w-8 h-8 rounded-full border-2 border-primary-400"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
        )}
        <span className="text-sm font-medium hidden md:block">
          {user.fullName || user.email || 'User'}
        </span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.fullName || 'User'}
                    className="w-12 h-12 rounded-full border-2 border-primary-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user.fullName || 'User'}
                  </p>
                  {user.email && (
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  )}
                </div>
              </div>
            </div>

            {user.customer && (
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-600 mb-1">Customer Info</div>
                {user.customer.companyName && (
                  <div className="text-sm font-medium text-gray-900">
                    {user.customer.companyName}
                  </div>
                )}
                {user.customer.phone && (
                  <div className="text-sm text-gray-600">{user.customer.phone}</div>
                )}
              </div>
            )}

            <div className="p-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  // Navigate to orders page if available
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                <span>คำสั่งซื้อของฉัน</span>
              </button>

              <button
                onClick={() => {
                  logout.mutate();
                  setShowMenu(false);
                }}
                disabled={logout.isPending}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>{logout.isPending ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
