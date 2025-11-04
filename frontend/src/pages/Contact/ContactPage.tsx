import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Facebook, Twitter, Clock, MessageCircle } from 'lucide-react';
import { pageTransition, staggerContainer, staggerItem } from '../../lib/animations';

const ContactPage = () => {
  const contactMethods = [
    {
      icon: Phone,
      title: 'เบอร์โทรศัพท์',
      details: [
        { label: 'ประเทศไทย', value: '095-938-0717' },
        { label: 'ประเทศญี่ปุ่น', value: '080-2643-6975' }
      ],
      color: 'bg-blue-500'
    },
    {
      icon: Mail,
      title: 'อีเมล',
      details: [
        { label: 'ติดต่อทั่วไป', value: 'anongpotter01@gmail.com' }
      ],
      color: 'bg-red-500'
    },
    {
      icon: MapPin,
      title: 'ที่อยู่',
      details: [
        { label: 'ที่อยู่ในไทย', value: '76/3 ม.9 ต.อากาศ อ.อากาศอำนวย จ.สกลนคร 47170' }
      ],
      color: 'bg-green-500'
    }
  ];

  const socialMedia = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/profile.php?id=100088990964702',
      description: 'ติดตามข่าวสารและโปรโมชั่น',
      color: 'hover:bg-blue-600'
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      url: 'https://x.com/mirinpotter?s=21',
      description: 'อัพเดทข้อมูลล่าสุด',
      color: 'hover:bg-sky-500'
    }
  ];

  const faq = [
    {
      question: 'PakkuNeko ให้บริการอะไรบ้าง?',
      answer: 'เราให้บริการฝากซื้อสินค้าจากญี่ปุ่น บริการฝากรับพัสดุและรวมกล่อง บริการจัดส่งระหว่างประเทศ และให้คำปรึกษาเป็นภาษาไทยและญี่ปุ่น'
    },
    {
      question: 'ระยะเวลาจัดส่งนานแค่ไหน?',
      answer: 'ขึ้นอยู่กับประเภทการจัดส่ง ทางอากาศ (Air) ประมาณ 7-14 วัน และทางเรือ (Sea) ประมาณ 30-45 วัน'
    },
    {
      question: 'ชำระเงินอย่างไร?',
      answer: 'รองรับการชำระเงินผ่านโอนเงินธนาคาร และช่องทางอื่นๆ ตามที่ตกลง'
    }
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Contact Us
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
              ติดต่อเรา
            </h1>
            <p className="text-xl md:text-2xl text-white/95 font-light">
              พร้อมให้บริการและตอบคำถามทุกข้อสงสัย
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-gradient-to-b from-secondary-50 to-white">
        <div className="container-custom">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block px-6 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Contact Information
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              ช่องทางติดต่อ
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              const gradients = [
                'from-blue-500 to-blue-600',
                'from-red-500 to-red-600',
                'from-green-500 to-green-600'
              ];
              return (
                <motion.div
                  key={index}
                  className="group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 text-center relative overflow-hidden"
                  variants={staggerItem}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-transparent rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br ${gradients[index]} shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-primary-600 transition-colors">{method.title}</h3>
                  <div className="space-y-3">
                    {method.details.map((detail, idx) => (
                      <div key={idx} className="text-center">
                        <p className="text-xs text-gray-500 mb-1 font-medium">{detail.label}</p>
                        <p className="text-sm font-semibold text-gray-700">{detail.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Social Media */}
      <section className="py-20 bg-gradient-to-b from-white via-secondary-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(246,135,59,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(250,245,238,0.8),transparent_50%)]"></div>
        <div className="container-custom relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block px-6 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Social Media
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              ติดตามเราบนโซเชียลมีเดีย
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {socialMedia.map((social, index) => {
              const Icon = social.icon;
              const socialColors = [
                { bg: 'from-blue-500 to-blue-600', hover: 'hover:from-blue-50 hover:to-white', border: 'hover:border-blue-200', text: 'group-hover:text-blue-600' },
                { bg: 'from-gray-800 to-gray-900', hover: 'hover:from-sky-50 hover:to-white', border: 'hover:border-sky-200', text: 'group-hover:text-sky-600' }
              ];
              return (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-6 border border-gray-100 ${socialColors[index].border}`}
                  variants={staggerItem}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${socialColors[index].bg} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold text-gray-900 mb-2 transition-colors ${socialColors[index].text}`}>{social.name}</h3>
                    <p className="text-gray-600">{social.description}</p>
                  </div>
                  <div className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</div>
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-secondary-100 to-gray-50">
        <div className="container-custom">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block px-6 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              FAQ
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              คำถามที่พบบ่อย
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto space-y-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {faq.map((item, index) => (
              <motion.div
                key={index}
                className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                variants={staggerItem}
                whileHover={{ y: -3 }}
              >
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-3 text-gray-900 group-hover:text-primary-600 transition-colors">{item.question}</h3>
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="py-20 bg-gradient-to-b from-white to-secondary-50">
        <div className="container-custom">
          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white p-10 md:p-12 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-200 rounded-full -ml-16 -mb-16 opacity-50"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">เวลาทำการ</h2>
                <div className="space-y-4 max-w-lg mx-auto">
                  <div className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-secondary-50 to-white rounded-2xl border border-gray-100">
                    <span className="text-gray-700 font-medium text-lg">จันทร์ - ศุกร์</span>
                    <span className="font-bold text-primary-600 text-lg">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-secondary-50 to-white rounded-2xl border border-gray-100">
                    <span className="text-gray-700 font-medium text-lg">เสาร์ - อาทิตย์</span>
                    <span className="font-bold text-primary-600 text-lg">9:00 - 17:00</span>
                  </div>
                </div>
                <div className="mt-8 inline-block px-6 py-3 bg-primary-50 rounded-full">
                  <p className="text-sm text-primary-700 font-medium">
                    * เวลาญี่ปุ่น (GMT+9)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNk0yMCAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTYiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="container-custom relative z-10">
          <motion.div
            className="text-center text-white max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              มีคำถามเพิ่มเติม?
            </motion.h2>
            <motion.p
              className="text-xl md:text-2xl mb-12 text-white/95 font-light"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              ติดต่อเราได้ทุกช่องทาง เรายินดีให้บริการ
            </motion.p>
            <motion.div
              className="flex flex-wrap gap-5 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <a
                href="https://www.facebook.com/profile.php?id=100088990964702"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white text-primary-600 px-10 py-4 rounded-full font-bold hover:bg-secondary-100 hover:scale-105 transition-all duration-300 inline-flex items-center gap-3 shadow-2xl"
              >
                <Facebook className="w-6 h-6 group-hover:scale-110 transition-transform" />
                แชทผ่าน Facebook
              </a>
              <a
                href="mailto:anongpotter01@gmail.com"
                className="group bg-white/10 backdrop-blur-sm text-white border-2 border-white px-10 py-4 rounded-full font-bold hover:bg-white/20 hover:scale-105 transition-all duration-300 inline-flex items-center gap-3 shadow-2xl"
              >
                <Mail className="w-6 h-6 group-hover:scale-110 transition-transform" />
                ส่งอีเมลหาเรา
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default ContactPage;
