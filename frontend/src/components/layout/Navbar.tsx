import { Link } from 'react-router-dom';
import { Ship, Menu, X } from 'lucide-react';
import { useState } from 'react';
import UserProfile from '../UserProfile';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'หน้าแรก', path: '/' },
    { name: 'กระบวนการ', path: '/process' },
    { name: 'ติดตามเรือ', path: '/ship-tracking' },
    { name: 'ติดตามบิน', path: '/air-tracking' },
    { name: 'ตารางเรือ', path: '/schedule' },
    { name: 'คำนวณ', path: '/calculator' },
    { name: 'ผลงาน', path: '/portfolio' },
    { name: 'รีวิว', path: '/review' },
    { name: 'เกี่ยวกับ', path: '/about' },
    { name: 'ติดต่อ', path: '/contact' },
  ];

  return (
    <nav className="bg-gradient-to-r from-white via-primary-50/30 to-white backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b-2 border-primary-300/50">
      <div className="flex flex-wrap items-center justify-between w-full px-6 py-3 mx-auto max-w-7xl">
        {/* Logo */}
        <Link to="/" className="flex items-center group transition-all duration-300 hover:scale-105">
          <div className="relative">
            <img
              src="/pakkuneko-logo.png"
              alt="PakkuNeko Logo"
              className="h-8 sm:h-10 w-auto rounded-full object-cover mr-3 ring-2 ring-primary-300 group-hover:ring-primary-500 transition-all duration-300 shadow-md"
            />
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
          </div>
          <span className="self-center font-extrabold text-xl sm:text-2xl whitespace-nowrap bg-gradient-to-r from-gray-800 via-primary-700 to-gray-800 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:via-primary-800 group-hover:to-primary-600 transition-all duration-300">
            แพ็คคุเนโกะ
          </span>
        </Link>

        {/* Right Side - Login & Mobile Menu */}
        <div className="flex items-center gap-3 lg:order-2">
          {/* Desktop Login Button */}
          <div className="hidden lg:block">
            <UserProfile />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative inline-flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white hover:from-primary-600 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            type="button"
            aria-controls="mobile-menu-2"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Open main menu</span>
            <div className="relative w-6 h-6">
              <Menu
                className={`w-6 h-6 absolute top-0 left-0 transition-all duration-300 ${
                  isOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                }`}
                strokeWidth={2.5}
              />
              <X
                className={`w-6 h-6 absolute top-0 left-0 transition-all duration-300 ${
                  isOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                }`}
                strokeWidth={2.5}
              />
            </div>
          </button>
        </div>

        {/* Desktop Navigation */}
        <div
          className={`items-center justify-between w-full lg:flex lg:w-auto lg:order-1 transition-all duration-300 ease-in-out ${
            isOpen
              ? 'flex max-h-screen opacity-100'
              : 'hidden lg:flex max-h-0 lg:max-h-screen opacity-0 lg:opacity-100'
          }`}
          id="mobile-menu-2"
        >
          <ul className="flex flex-col w-full lg:w-auto mt-4 font-medium lg:flex-row lg:space-x-1 lg:mt-0 bg-white lg:bg-transparent rounded-xl lg:rounded-none shadow-lg lg:shadow-none p-4 lg:p-0">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="block relative px-4 py-2.5 lg:py-2 text-gray-700 hover:text-primary-600 font-semibold rounded-lg lg:rounded-md transition-all duration-300 group overflow-hidden"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="relative z-10">{link.name}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-700 group-hover:w-full transition-all duration-300"></div>
                </Link>
              </li>
            ))}
            {/* Mobile Login */}
            <li className="lg:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="px-2">
                <UserProfile />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
