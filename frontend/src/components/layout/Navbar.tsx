import { Link } from 'react-router-dom';
import { Ship, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'หน้าแรก', path: '/' },
    { name: 'กระบวนการ', path: '/process' },
    { name: 'ติดตามเรือ', path: '/ship-tracking' },
    { name: 'ติดตามเครื่องบิน', path: '/air-tracking' },
    { name: 'ตารางเรือ', path: '/schedule' },
    { name: 'คำนวณค่าขนส่ง', path: '/calculator' },
    { name: 'ผลงาน', path: '/portfolio' },
    { name: 'รีวิว', path: '/review' },
    { name: 'สถิติ', path: '/statistics' },
    { name: 'เกี่ยวกับเรา', path: '/about' },
    { name: 'ติดต่อ', path: '/contact' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b-4 border-primary-500">
      <div className="container-custom">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/pakkuneko-logo.png"
              alt="PakkuNeko Logo"
              className="h-16 w-16 rounded-full object-cover transition-transform group-hover:scale-105"
            />
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent" style={{ fontFamily: 'Noto Sans JP' }}>แพ็คคุเนโกะ</span>
              <p className="text-xs text-gray-500">PakkuNeko</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium text-sm relative group"
              >
                {link.name}
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary-500 group-hover:w-3/4 transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block py-2 text-gray-700 hover:text-primary-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
