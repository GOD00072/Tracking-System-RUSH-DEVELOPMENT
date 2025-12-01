import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Ship, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { BACKEND_URL } from '../../utils/apiConfig';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // ตรวจสอบว่ามาจาก session expired หรือไม่
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setSessionExpired(true);
      // Clear any remaining tokens
      logout();
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('admin_token');
      // Show toast notification
      toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    }
  }, [searchParams, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Login successful
        login(
          {
            id: data.data.user.id,
            email: data.data.user.email,
            full_name: data.data.user.fullName,
            role: data.data.user.role,
          },
          data.data.token
        );
        setSessionExpired(false);
        toast.success('เข้าสู่ระบบสำเร็จ');
        // Navigate without query params
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.error(data.error?.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
              <Ship className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Ship Tracking System</p>
          </div>

          {/* Session Expired Warning */}
          {sessionExpired && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Session หมดอายุ</p>
                <p className="text-xs text-red-600 mt-1">กรุณาเข้าสู่ระบบใหม่อีกครั้ง</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="admin@shiptracking.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <strong>Demo:</strong> admin@shiptracking.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
