import { Ship, Plane, Calculator, Calendar, Package, ShoppingCart, MessageCircle, MapPin, Phone, Mail, Facebook, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem, buttonTap } from '../../lib/animations';

const HomePage = () => {
  const services = [
    {
      icon: ShoppingCart,
      title: 'บริการฝากซื้อสินค้า',
      subtitle: '代理購入サービス',
      description: 'เราเป็นตัวกลางในการซื้อสินค้าจากเว็บไซต์ญี่ปุ่น เช่น Mercari, Rakuten, Yahoo! Japan, Amazon JP ฯลฯ',
    },
    {
      icon: Package,
      title: 'บริการฝากรับพัสดุ / รวมกล่อง',
      subtitle: '荷物お預かり・同梱サービス',
      description: 'รวมหลายกล่องให้เป็นหนึ่งเพื่อลดค่าส่ง พร้อมถ่ายรูปสินค้าให้ตรวจเช็กก่อนส่ง',
    },
    {
      icon: Ship,
      title: 'บริการจัดส่งระหว่างประเทศ',
      subtitle: '国際配送サービス',
      description: 'จัดส่งทั้งทางอากาศ (Air) และทางเรือ (Sea) พร้อมหมายเลขติดตามพัสดุ',
    },
    {
      icon: MessageCircle,
      title: 'บริการให้คำปรึกษา 2 ภาษา',
      subtitle: '日本語・タイ語対応',
      description: 'ทีมงานสามารถสื่อสารทั้งภาษาญี่ปุ่นและภาษาไทย ช่วยแปลรายละเอียดสินค้า',
    },
  ];

  const features = [
    {
      icon: Ship,
      title: 'ติดตามเรือ',
      description: 'ตรวจสอบสถานะสินค้าทางเรือแบบเรียลไทม์',
      link: '/ship-tracking',
    },
    {
      icon: Plane,
      title: 'ติดตามเครื่องบิน',
      description: 'ติดตามพัสดุทางอากาศได้ทุกที่ทุกเวลา',
      link: '/air-tracking',
    },
    {
      icon: Calculator,
      title: 'คำนวณค่าขนส่ง',
      description: 'คำนวณค่าใช้จ่ายล่วงหน้าได้ทันที',
      link: '/calculator',
    },
    {
      icon: Calendar,
      title: 'ตารางเรือ',
      description: 'ดูตารางเดินเรือและเที่ยวบินล่วงหน้า',
      link: '/schedule',
    },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNk0yMCAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTYiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="container-custom relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <img
                src="/pakkuneko-logo.png"
                alt="PakkuNeko Logo"
                className="h-32 w-32 rounded-full object-cover mx-auto shadow-2xl ring-4 ring-white/30"
              />
            </motion.div>
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              แพ็คคุเนโกะ
            </motion.h1>
            <motion.p
              className="text-2xl md:text-3xl mb-2 text-white/95 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              PakkuNeko
            </motion.p>
            <motion.div
              className="w-32 h-1.5 bg-white/90 mx-auto mb-8 rounded-full shadow-lg"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            ></motion.div>
            <motion.p
              className="text-xl md:text-2xl text-white/95 leading-relaxed font-light max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              บริการ "ฝากซื้อและฝากส่งสินค้าจากญี่ปุ่นสู่ไทย"<br />
              <span className="text-white/90 text-lg">โดยทีมงานที่อาศัยอยู่ในญี่ปุ่นจริง</span>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-b from-secondary-50 to-white">
        <div className="container-custom">
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <motion.div
                className="inline-block px-6 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                About Us
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                เกี่ยวกับเรา
              </h2>
              <div className="w-24 h-1 bg-primary-500 mx-auto rounded-full"></div>
            </div>
            <div className="relative bg-white p-10 md:p-12 rounded-3xl shadow-2xl border border-gray-100">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-200 rounded-full -ml-16 -mb-16 opacity-50"></div>
              <div className="relative z-10 text-gray-700 leading-relaxed space-y-6 text-lg">
                <p>
                  <span className="text-2xl font-bold text-primary-600">PakkuNeko</span> คือบริการ "ฝากซื้อและฝากส่งสินค้าจากญี่ปุ่นสู่ไทย"
                  โดยทีมงานที่อาศัยอยู่ในญี่ปุ่นจริง ช่วยลูกค้าซื้อสินค้าจากเว็บต่าง ๆ เช่น Mercari, Rakuten, Amazon JP
                  พร้อมตรวจเช็กสินค้า แพ็กอย่างปลอดภัย และส่งตรงถึงมือคุณที่ประเทศไทย
                </p>
                <div className="bg-gradient-to-r from-primary-50 to-secondary-100 p-6 rounded-2xl border-l-4 border-primary-500">
                  <p className="text-xl font-semibold text-primary-700 mb-2">
                    เราเชื่อว่า "การช้อปของจากญี่ปุ่นไม่ควรยุ่งยาก"
                  </p>
                  <p className="text-gray-700">
                    ทุกคนควรเข้าถึงสินค้าคุณภาพดีในราคายุติธรรม
                    ด้วยการบริการที่อบอุ่น เหมือนมีเพื่อนญี่ปุ่นช่วยดูแลทุกขั้นตอน
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-b from-white via-secondary-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(246,135,59,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(250,245,238,0.8),transparent_50%)]"></div>
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-block px-6 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Our Services
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              商品・サービス内容
            </h2>
            <p className="text-xl text-gray-600">บริการของเรา</p>
            <div className="w-24 h-1 bg-primary-500 mx-auto mt-4 rounded-full"></div>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {services.map((service, index) => {
              const Icon = service.icon;
              const gradients = [
                'from-primary-500 to-primary-600',
                'from-primary-600 to-primary-700',
                'from-primary-400 to-primary-600',
                'from-primary-500 to-primary-700'
              ];
              return (
                <motion.div
                  key={index}
                  className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
                  variants={staggerItem}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-transparent rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${gradients[index]} shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 font-medium">
                    {service.subtitle}
                  </p>

                  <p className="text-gray-700 leading-relaxed">
                    {service.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Tracking Features */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-secondary-100 to-gray-50">
        <div className="container-custom">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="inline-block px-6 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Tracking Tools
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              เครื่องมือติดตามพัสดุ
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Link
                  to={feature.link}
                  className="group block bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary-200 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <motion.div
                    className="relative z-10"
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                    <div className="mt-4 text-primary-500 font-semibold text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      เริ่มใช้งาน →
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-b from-white to-secondary-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-block px-6 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Contact Us
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              ติดต่อเรา
            </h2>
            <p className="text-xl text-gray-600">お問い合わせ</p>
            <div className="w-24 h-1 bg-primary-500 mx-auto mt-4 rounded-full"></div>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {/* Contact Info */}
            <motion.div variants={staggerItem} className="space-y-5">
              <div className="group flex items-start gap-4 bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">ที่อยู่ในไทย</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    76/3 ม.9 ต.อากาศ อ.อากาศอำนวย<br />
                    จ.สกลนคร 47170
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-4 bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">เบอร์โทร</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    <span className="font-medium">ไทย:</span> 095-938-0717<br />
                    <span className="font-medium">ญี่ปุ่น:</span> 080-2643-6975
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-4 bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">อีเมล</h4>
                  <a
                    href="mailto:anongpotter01@gmail.com"
                    className="text-gray-600 text-sm hover:text-primary-600 hover:underline transition-colors"
                  >
                    anongpotter01@gmail.com
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Social Media */}
            <motion.div variants={staggerItem} className="space-y-5">
              <div className="bg-gradient-to-br from-white to-secondary-50 p-8 rounded-3xl shadow-xl border border-gray-100">
                <h4 className="font-bold mb-6 text-center text-gray-900 text-xl">
                  ติดตามเราได้ที่
                </h4>
                <div className="space-y-4">
                  <a
                    href="https://www.facebook.com/profile.php?id=100088990964702"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-5 rounded-2xl bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all duration-300 shadow-md hover:shadow-lg border border-gray-100 hover:border-blue-200"
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Facebook className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Facebook</p>
                      <p className="text-sm text-gray-500">PakkuNeko Official</p>
                    </div>
                    <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                  </a>

                  <a
                    href="https://x.com/mirinpotter?s=21"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-5 rounded-2xl bg-white hover:bg-gradient-to-r hover:from-sky-50 hover:to-white transition-all duration-300 shadow-md hover:shadow-lg border border-gray-100 hover:border-sky-200"
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Twitter className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-sky-600 transition-colors">X (Twitter)</p>
                      <p className="text-sm text-gray-500">@mirinpotter</p>
                    </div>
                    <div className="text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                  </a>
                </div>
              </div>

              {/* CTA */}
              <div className="relative p-10 rounded-3xl text-center text-white bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNk0yMCAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTYiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-3">
                    พร้อมช้อปจากญี่ปุ่นแล้วหรือยัง?
                  </h3>
                  <p className="mb-8 text-white/90 text-lg">
                    ติดต่อเราวันนี้เพื่อเริ่มต้นการช้อปปิ้ง
                  </p>
                  <a
                    href="https://www.facebook.com/profile.php?id=100088990964702"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-primary-600 px-10 py-4 rounded-full font-bold hover:bg-secondary-100 hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    <Facebook className="w-5 h-5" />
                    ติดต่อทาง Facebook
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default HomePage;
