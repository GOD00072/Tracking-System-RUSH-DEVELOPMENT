import { 
  Ship, Calculator, Calendar, Package, ShoppingCart, MessageCircle, 
  MapPin, Phone, Mail, Facebook, Twitter, ArrowRight, Sparkles, 
  CheckCircle2, Search 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pageTransition, staggerContainer, staggerItem } from '../../lib/animations';

const HomePage = () => {
  const { t } = useTranslation();


  const topServices = [
    {
      icon: ShoppingCart,
      title: "บริการฝากซื้อสินค้า",
      subtitle: "Buying Service / 代行購入サービス",
      description: "เราเป็นตัวกลางในการซื้อสินค้าจากเว็บไซต์ญี่ปุ่น เช่น Mercari, Rakuten, Yahoo! Japan, Amazon JP"
    },
    {
      icon: Package,
      title: "บริการฝากรับพัสดุ / รวมกล่อง",
      subtitle: "Consolidate Service / 荷物お預かり・同梱サービス",
      description: "รวมหลายกล่องให้เป็นหนึ่งเพื่อลดค่าส่ง พร้อมถ่ายรูปสินค้าให้ตรวจเช็คก่อนส่ง"
    }
  ];

  const bottomServices = [
    {
      icon: Ship,
      title: "บริการจัดส่งระหว่างประเทศ",
      subtitle: "International Shipping / 国際配送サービス",
      description: "จัดส่งทั้งทางอากาศ (Air) และทางเรือ (Sea) พร้อมหมายเลขติดตามพัสดุ"
    },
    {
      icon: MessageCircle,
      title: "บริการให้คำปรึกษา 2 ภาษา",
      subtitle: "Bilingual Support / 日本語・タイ語対応",
      description: "ทีมงานสามารถสื่อสารทั้งภาษาญี่ปุ่นและภาษาไทย ช่วยแปลรายละเอียดสินค้า"
    }
  ];

  const brands = [
    { name: "Rakuma", logo: "/brands/rakuma.png" },
    { name: "Mercari", logo: "/brands/mercari.png" },
    { name: "Amazon", logo: "/brands/amazon.png" },
    { name: "Rakuten", logo: "/brands/rakuten.png" },
    { name: "Yahoo! Japan", logo: "/brands/yahoo-japan.png" },
  ];
  // ------------------------------------------------

  // --- ข้อมูลเดิมสำหรับส่วนอื่นๆ (Hero, Tracking) ---
  const features = [
    {
      icon: Search,
      titleKey: 'home.tracking.product.title',
      descriptionKey: 'home.tracking.product.description',
      link: '/tracking',
    },
    {
      icon: Calculator,
      titleKey: 'home.tracking.calculator.title',
      descriptionKey: 'home.tracking.calculator.description',
      link: '/calculator',
    },
    {
      icon: Calendar,
      titleKey: 'home.tracking.schedule.title',
      descriptionKey: 'home.tracking.schedule.description',
      link: '/schedule',
    },
  ];

  const highlightKeys = [
    'home.highlights.team',
    'home.highlights.check',
    'home.highlights.combine',
    'home.highlights.track',
  ];

  // Style 4: Premium Showcase (Best Design - Orange Theme)
  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition} className="min-h-screen bg-white overflow-hidden">

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-200/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-[15%] w-20 h-20 bg-orange-400/20 rounded-2xl backdrop-blur-sm border border-orange-200/50 hidden lg:block"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-[10%] w-16 h-16 bg-amber-400/20 rounded-full backdrop-blur-sm border border-amber-200/50 hidden lg:block"
        />
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 right-[20%] w-12 h-12 bg-orange-300/30 rounded-lg backdrop-blur-sm hidden lg:block"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-100 shadow-lg shadow-orange-100/50 mb-8"
              >
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                <span className="text-orange-600 font-medium text-sm">{t('home.tagline')}</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6">
                {t('home.title')}
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
                  {t('home.subtitle')}
                </span>
              </h1>

              <p className="text-xl text-gray-500 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                {t('home.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://www.facebook.com/profile.php?id=100088990964702"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-semibold shadow-xl shadow-orange-200/50 hover:shadow-2xl hover:shadow-orange-300/50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {t('home.startService')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Link
                    to="/process"
                    className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl font-semibold border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {t('home.viewProcess')}
                  </Link>
                </motion.div>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-500">500+</p>
                  <p className="text-sm text-gray-400">ลูกค้าไว้วางใจ</p>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-500">5,000+</p>
                  <p className="text-sm text-gray-400">พัสดุจัดส่งแล้ว</p>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-500">99%</p>
                  <p className="text-sm text-gray-400">ความพึงพอใจ</p>
                </div>
              </div>
            </motion.div>

            {/* Right: Image Collage */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative h-[500px] lg:h-[600px] hidden md:block"
            >
              {/* Main Image */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-96 rounded-3xl overflow-hidden shadow-2xl shadow-orange-200/50 z-20 border-4 border-white">
                <img src="/business/1.jpeg" alt="Main" className="w-full h-full object-cover" />
              </div>

              {/* Secondary Images */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="absolute top-8 left-0 w-40 h-52 rounded-2xl overflow-hidden shadow-xl z-10 border-4 border-white"
              >
                <img src="/business/5.jpeg" alt="Packages" className="w-full h-full object-cover" />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="absolute bottom-8 left-8 w-36 h-44 rounded-2xl overflow-hidden shadow-xl z-10 border-4 border-white"
              >
                <img src="/business/7.jpeg" alt="Storage" className="w-full h-full object-cover" />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="absolute top-16 right-0 w-44 h-56 rounded-2xl overflow-hidden shadow-xl z-10 border-4 border-white"
              >
                <img src="/business/6.jpeg" alt="Delivery" className="w-full h-full object-cover" />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="absolute bottom-12 right-4 w-32 h-40 rounded-2xl overflow-hidden shadow-xl z-10 border-4 border-white"
              >
                <img src="/business/8.jpeg" alt="Packing" className="w-full h-full object-cover" />
              </motion.div>

              {/* Decorative Badge */}
              <motion.div
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg border border-orange-100 z-30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇯🇵</span>
                  <span className="font-medium text-gray-700">Japan → Thailand</span>
                  <span className="text-2xl">🇹🇭</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-orange-300 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-orange-400 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* ==================== BRANDS MARQUEE ==================== */}
      <section className="py-8 bg-gradient-to-r from-orange-50 via-white to-orange-50 border-y border-orange-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-200"></div>
            <p className="text-sm text-orange-500 font-medium tracking-wider uppercase">Supported Platforms</p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-200"></div>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {brands.map((b, i) => (
              <motion.img
                key={i}
                whileHover={{ scale: 1.1 }}
                src={b.logo}
                alt={b.name}
                className="h-10 md:h-12 object-contain opacity-70 hover:opacity-100 transition-all cursor-pointer"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SERVICES SECTION ==================== */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(251,146,60,0.05),transparent_50%)]"></div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4">
              Our Services
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              บริการครบวงจร
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              เราดูแลทุกขั้นตอนตั้งแต่ฝากซื้อ รับของ รวมกล่อง จนถึงจัดส่งถึงมือคุณ
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...topServices, ...bottomServices].map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-2xl hover:shadow-orange-100/50 hover:border-orange-200 transition-all duration-500"
              >
                {/* Number Badge */}
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                  0{i + 1}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-amber-500 transition-all duration-300">
                  <service.icon className="w-8 h-8 text-orange-500 group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-orange-500 text-sm font-medium mb-3">{service.subtitle}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SHOWCASE GALLERY ==================== */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Gallery Grid */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-6 grid-rows-4 gap-4 h-[500px]"
            >
              <div className="col-span-4 row-span-2 rounded-3xl overflow-hidden shadow-xl group">
                <img src="/business/2.jpeg" alt="Office" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="col-span-2 row-span-2 rounded-3xl overflow-hidden shadow-xl group">
                <img src="/business/3.jpeg" alt="Items" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="col-span-2 row-span-2 rounded-3xl overflow-hidden shadow-xl group">
                <img src="/business/4.jpeg" alt="Labels" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="col-span-4 row-span-2 rounded-3xl overflow-hidden shadow-xl group relative">
                <img src="/business/5.jpeg" alt="Packages" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                  <p className="text-white font-medium">พร้อมจัดส่งทุกวัน</p>
                </div>
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-6">
                Why Choose Us
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                มาตรฐานการดูแลพัสดุ<br/>
                <span className="text-orange-500">ระดับพรีเมียม</span>
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                เราใส่ใจทุกรายละเอียด ตั้งแต่การรับของจากร้านค้าญี่ปุ่น ตรวจเช็คสภาพสินค้า
                ถ่ายรูปยืนยัน จนถึงการแพ็คอย่างดีเพื่อส่งถึงมือคุณอย่างปลอดภัย
              </p>

              <div className="space-y-4">
                {[
                  { icon: CheckCircle2, text: 'ถ่ายรูปเช็คสินค้าทุกชิ้นก่อนจัดส่ง' },
                  { icon: Package, text: 'รวมกล่องฟรี ประหยัดค่าขนส่งสูงสุด 50%' },
                  { icon: Ship, text: 'ส่งทั้งทางเรือและทางอากาศ พร้อมติดตามพัสดุ' },
                  { icon: MessageCircle, text: 'ทีมงานคนไทยพร้อมให้บริการ 2 ภาษา' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-gray-700 font-medium">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-[3rem] blur-2xl opacity-30"></div>
          <div className="relative bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 rounded-[3rem] p-12 md:p-16 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-2xl rotate-12"></div>

            <div className="relative z-10 text-center text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  {t('home.contact.cta.title')}
                </h2>
                <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
                  {t('home.contact.cta.description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://www.facebook.com/profile.php?id=100088990964702"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 bg-white text-orange-600 px-8 py-4 rounded-2xl font-bold hover:bg-orange-50 transition-colors shadow-xl"
                  >
                    <Facebook className="w-5 h-5" />
                    ติดต่อผ่าน Facebook
                  </motion.a>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/tracking"
                      className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition-colors border border-white/30"
                    >
                      <Search className="w-5 h-5" />
                      ตรวจสอบพัสดุ
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/pakkuneko-logo.png" alt="PakkuNeko" className="w-10 h-10 rounded-xl" />
            <span className="font-bold text-gray-900">PakkuNeko</span>
          </div>
          <p className="text-gray-400 text-sm">© 2024 PakkuNeko. บริการนำเข้าสินค้าจากญี่ปุ่น</p>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/profile.php?id=100088990964702" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 hover:bg-orange-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-orange-500 transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://x.com/mirinpotter?s=21" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 hover:bg-orange-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-orange-500 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>

    </motion.div>
  );
};

export default HomePage;