import { Ship, Mail, Phone, MapPin, Facebook, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-20 border-t-4 border-primary-500">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/pakkuneko-logo.png"
                alt="PakkuNeko Logo"
                className="h-16 w-16 rounded-full object-cover"
              />
              <div>
                <span className="text-xl font-bold" style={{ fontFamily: 'Noto Sans JP' }}>แพ็คคุเนโกะ</span>
                <p className="text-xs text-gray-400">PakkuNeko</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              บริการฝากซื้อและฝากส่งสินค้าจากญี่ปุ่นสู่ไทย โดยทีมงานที่อาศัยอยู่ในญี่ปุ่นจริง
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4 text-primary-400">ลิงก์ด่วน</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2">
                  <span className="text-primary-500">›</span> หน้าแรก
                </Link>
              </li>
              <li>
                <Link to="/ship-tracking" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2">
                  <span className="text-primary-500">›</span> ติดตามเรือ
                </Link>
              </li>
              <li>
                <Link to="/air-tracking" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2">
                  <span className="text-primary-500">›</span> ติดตามเครื่องบิน
                </Link>
              </li>
              <li>
                <Link to="/calculator" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2">
                  <span className="text-primary-500">›</span> คำนวณค่าขนส่ง
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2">
                  <span className="text-primary-500">›</span> ตารางเรือ
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold mb-4 text-primary-400">บริการของเรา</h3>
            <ul className="space-y-2">
              <li className="text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span> บริการฝากซื้อสินค้า
              </li>
              <li className="text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span> บริการฝากรับพัสดุ
              </li>
              <li className="text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span> จัดส่งระหว่างประเทศ
              </li>
              <li className="text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span> ให้คำปรึกษา 2 ภาษา
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4 text-primary-400">ติดต่อเรา</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-gray-400">
                <Phone className="w-4 h-4 mt-1 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">ไทย</p>
                  <span className="text-sm">095-938-0717</span>
                </div>
              </li>
              <li className="flex items-start space-x-2 text-gray-400">
                <Phone className="w-4 h-4 mt-1 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">ญี่ปุ่น</p>
                  <span className="text-sm">080-2643-6975</span>
                </div>
              </li>
              <li className="flex items-start space-x-2 text-gray-400">
                <Mail className="w-4 h-4 mt-1 text-primary-500 flex-shrink-0" />
                <span className="text-sm">anongpotter01@gmail.com</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-400">
                <MapPin className="w-4 h-4 mt-1 text-primary-500 flex-shrink-0" />
                <span className="text-sm">จ.สกลนคร 47170</span>
              </li>
            </ul>
            <div className="flex space-x-3 mt-4">
              <a
                href="https://www.facebook.com/profile.php?id=100088990964702"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-500 transition-all flex items-center justify-center group"
              >
                <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a
                href="https://x.com/mirinpotter?s=21"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-500 transition-all flex items-center justify-center group"
              >
                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            &copy; 2025 <span className="text-primary-400 font-semibold">PakkuNeko</span> - แพ็คคุเนโกะ.
            <span className="text-gray-500"> ฝากซื้อและฝากส่งสินค้าจากญี่ปุ่นสู่ไทย</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Developed with 🧡 for better shopping experience
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
