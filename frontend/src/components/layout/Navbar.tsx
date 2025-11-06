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
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b-4 border-primary-500">
      <div className="flex flex-wrap items-center justify-between w-full px-4 mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src="/pakkuneko-logo.png"
            alt="PakkuNeko Logo"
            className="h-6 sm:h-9 w-auto rounded-full object-cover mr-3"
          />
          <span className="self-center font-extrabold text-xl whitespace-nowrap text-gray-800">
            แพ็คคุเนโกะ
          </span>
        </Link>

        {/* Right Side - Login & Mobile Menu */}
        <div className="flex items-center lg:order-2">
          {/* Desktop Login Button */}
          <div className="h-full md:block flex justify-center items-center">
            <div className="justify-center md:block hidden">
              <div className="hidden lg:block">
                <UserProfile />
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden block">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary-600 h-10 inline-flex items-center p-2 ml-1 text-sm text-gray-200 rounded-lg hover:bg-primary-700 focus:outline-none"
              type="button"
              aria-controls="mobile-menu-2"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="w-6 h-6" fill="white" />
              ) : (
                <Menu className="w-6 h-6" fill="white" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className={`items-center ${isOpen ? 'flex' : 'hidden'} justify-between w-full lg:flex lg:w-auto lg:order-1`} id="mobile-menu-2">
          <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="block font-bold py-2 pl-3 pr-4 lg:p-0 text-gray-700 hover:text-primary-600"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            {/* Mobile Login */}
            <li className="lg:hidden">
              <div className="py-2 pl-3 pr-4">
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
