import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Ship, AlertCircle, User, Key, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { BACKEND_URL } from '../../utils/apiConfig';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Login OTP state
  const [loginStep, setLoginStep] = useState<1 | 2>(1); // Step 1: email/password, Step 2: OTP
  const [loginOtp, setLoginOtp] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regStaffCode, setRegStaffCode] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regStep, setRegStep] = useState<1 | 2>(1); // Step 1: กรอกข้อมูล, Step 2: ใส่โค้ด
  const [codeRequested, setCodeRequested] = useState(false);

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

  // Step 1: ตรวจสอบ email/password และขอ OTP
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
        if (data.requireOtp) {
          // OTP required - go to step 2
          toast.success('OTP ถูกส่งไปยังกลุ่มแอดมินแล้ว');
          setLoginStep(2);
        } else {
          // Direct login (shouldn't happen with new flow)
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
          navigate('/admin/dashboard', { replace: true });
        }
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

  // Step 2: ยืนยัน OTP
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginOtp || loginOtp.length !== 6) {
      toast.error('กรุณาใส่ OTP 6 หลัก');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/admin/verify-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otpCode: loginOtp }),
      });

      const data = await response.json();

      if (data.success) {
        login(
          {
            id: data.data.user.id,
            email: data.data.user.email,
            full_name: data.data.user.full_name,
            role: data.data.user.role,
          },
          data.data.token
        );
        setSessionExpired(false);
        toast.success('เข้าสู่ระบบสำเร็จ');
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.error(data.error?.message || 'OTP ไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('เกิดข้อผิดพลาดในการยืนยัน OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: ขอโค้ด OTP
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regPassword !== regConfirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (regPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setRegLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/admin/request-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          fullName: regFullName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('โค้ดถูกส่งไปยังกลุ่มแอดมินแล้ว');
        setCodeRequested(true);
        setRegStep(2);
      } else {
        toast.error(data.error?.message || 'ไม่สามารถขอโค้ดได้');
      }
    } catch (error) {
      console.error('Request code error:', error);
      toast.error('เกิดข้อผิดพลาดในการขอโค้ด');
    } finally {
      setRegLoading(false);
    }
  };

  // Step 2: ยืนยันโค้ดและสมัคร
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regStaffCode) {
      toast.error('กรุณาใส่โค้ดพนักงาน');
      return;
    }

    setRegLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/admin/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: regEmail,
          staffCode: regStaffCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        login(
          {
            id: data.data.user.id,
            email: data.data.user.email,
            full_name: data.data.user.fullName,
            role: data.data.user.role,
          },
          data.data.token
        );
        toast.success('สมัครสมาชิกสำเร็จ');
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.error(data.error?.message || 'โค้ดไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error('เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800">
      
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-400/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>


      <div className="max-w-md w-full mx-4 z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/50">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div 
              className="inline-block"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-24 h-24 bg-gradient-to-tr from-orange-50 to-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg p-3 ring-4 ring-orange-100">
                <img src="/pakkuneko-logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
            </motion.div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase" style={{ textShadow: "2px 2px 0px rgba(255, 165, 0, 0.2)" }}>Pakkuneko</h1>
            <p className="text-primary-600 font-bold tracking-widest text-sm mt-1 uppercase">Admin Panel</p>
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

          {/* Step 1: Email/Password Form */}
          {loginStep === 1 && (
            <>
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
                  {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                </button>
              </form>

              {/* Register Button */}
              <div className="mt-4">
                <button
                  onClick={() => setShowRegister(true)}
                  className="w-full py-3 border-2 border-primary-500 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
                >
                  สมัครสมาชิก (พนักงาน)
                </button>
              </div>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {loginStep === 2 && (
            <form onSubmit={handleVerifyLoginOtp} className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Key className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">ยืนยัน OTP</h3>
                <p className="text-sm text-gray-600 mt-1">
                  OTP ถูกส่งไปยังกลุ่ม LINE แอดมินแล้ว
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>กำลังเข้าสู่ระบบเป็น:</strong> {email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัส OTP 6 หลัก
                </label>
                <input
                  type="text"
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  OTP หมดอายุใน 5 นาที
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || loginOtp.length !== 6}
                className="btn-primary w-full"
              >
                {loading ? 'กำลังยืนยัน...' : 'ยืนยันและเข้าสู่ระบบ'}
              </button>

              <button
                type="button"
                onClick={() => { setLoginStep(1); setLoginOtp(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← กลับไปกรอกข้อมูลใหม่
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Register Modal */}
      <AnimatePresence>
        {showRegister && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowRegister(false); setRegStep(1); setCodeRequested(false); }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-primary-500 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">สมัครสมาชิก</h2>
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    ขั้นตอน {regStep}/2
                  </span>
                </div>
                <button
                  onClick={() => { setShowRegister(false); setRegStep(1); setCodeRequested(false); }}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Step 1: กรอกข้อมูล */}
              {regStep === 1 && (
                <form onSubmit={handleRequestCode} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อ-นามสกุล
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="input-field pl-10"
                        placeholder="สมชาย ใจดี"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อีเมล
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="input-field pl-10"
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสผ่าน
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="input-field pl-10"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ยืนยันรหัสผ่าน
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="input-field pl-10"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      <strong>หมายเหตุ:</strong> หลังจากกดขอโค้ด ระบบจะส่งรหัสยืนยันไปยังกลุ่ม LINE แอดมิน กรุณารอรับโค้ดจากแอดมิน
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="btn-primary w-full mt-4"
                  >
                    {regLoading ? 'กำลังส่งคำขอ...' : 'ขอรหัสยืนยัน'}
                  </button>
                </form>
              )}

              {/* Step 2: ใส่โค้ด OTP */}
              {regStep === 2 && (
                <form onSubmit={handleRegister} className="p-6 space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Key className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">ใส่รหัสยืนยัน</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      รหัสถูกส่งไปยังกลุ่ม LINE แอดมินแล้ว
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>อีเมล:</strong> {regEmail}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>ชื่อ:</strong> {regFullName}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสยืนยัน 6 หลัก
                    </label>
                    <input
                      type="text"
                      value={regStaffCode}
                      onChange={(e) => setRegStaffCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input-field text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                      maxLength={6}
                      required
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      รหัสจะหมดอายุใน 10 นาที
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading || regStaffCode.length !== 6}
                    className="btn-primary w-full mt-4"
                  >
                    {regLoading ? 'กำลังยืนยัน...' : 'ยืนยันและสมัครสมาชิก'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRegStep(1); setRegStaffCode(''); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← กลับไปแก้ไขข้อมูล
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLoginPage;
