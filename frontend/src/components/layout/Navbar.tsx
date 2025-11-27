import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserProfile from '../UserProfile';
import LanguageSwitcher from '../LanguageSwitcher';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.process'), path: '/process' },
    { name: t('nav.tracking'), path: '/tracking' },
    { name: t('nav.schedule'), path: '/schedule' },
    { name: t('nav.calculator'), path: '/calculator' },
    { name: t('nav.portfolio'), path: '/portfolio' },
    { name: t('nav.review'), path: '/review' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b-2 border-primary-300/50">
      <div className="flex items-center justify-between w-full px-4 py-2 mx-auto max-w-7xl">
        {/* Logo */}
        <Link to="/" className="flex items-center group transition-all duration-300 hover:scale-105 shrink-0">
          <div className="relative">
            <img
              src="/pakkuneko-logo.png"
              alt="PakkuNeko Logo"
              className="h-8 w-auto rounded-full object-cover mr-2 ring-2 ring-primary-300 group-hover:ring-primary-500 transition-all duration-300 shadow-md"
            />
          </div>
          <span className="hidden sm:block self-center font-extrabold text-lg whitespace-nowrap bg-gradient-to-r from-gray-800 via-primary-700 to-gray-800 bg-clip-text text-transparent">
            แพ็คคุเนโกะ
          </span>
        </Link>

        {/* Desktop Navigation - Center */}
        <div className="hidden xl:flex items-center justify-center flex-1 mx-4">
          <ul className="flex items-center space-x-0.5">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="block relative px-2.5 py-1.5 text-gray-700 hover:text-primary-600 text-sm font-medium rounded-md transition-all duration-200 group whitespace-nowrap"
                >
                  <span className="relative z-10">{link.name}</span>
                  <div className="absolute inset-0 bg-primary-100 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-200"></div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side - Language, Login & Mobile Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Switcher - Desktop */}
          <div className="hidden xl:block">
            <LanguageSwitcher variant="minimal" />
          </div>

          {/* Desktop Login Button */}
          <div className="hidden xl:block">
            <UserProfile />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="xl:hidden relative inline-flex items-center justify-center p-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white hover:from-primary-600 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-md transition-all duration-300"
            type="button"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Open main menu</span>
            <div className="relative w-5 h-5">
              <Menu
                className={`w-5 h-5 absolute top-0 left-0 transition-all duration-300 ${
                  isOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                }`}
                strokeWidth={2.5}
              />
              <X
                className={`w-5 h-5 absolute top-0 left-0 transition-all duration-300 ${
                  isOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                }`}
                strokeWidth={2.5}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`xl:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
        id="mobile-menu"
      >
        <div className="px-4 pb-4">
          <ul className="flex flex-col bg-white rounded-xl shadow-lg p-3 space-y-1">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="block px-4 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 font-medium rounded-lg transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            {/* Mobile Language & Login */}
            <li className="pt-3 mt-2 border-t border-gray-200">
              <div className="flex items-center justify-between gap-3 px-2">
                <LanguageSwitcher variant="compact" />
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
