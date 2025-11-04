import { motion } from 'framer-motion';
import { Ship, Heart, Users, Globe, Target, Award } from 'lucide-react';
import { pageTransition, staggerContainer, staggerItem } from '../../lib/animations';

const AboutPage = () => {
  const values = [
    {
      icon: Heart,
      title: 'บริการที่อบอุ่น',
      description: 'เหมือนมีเพื่อนญี่ปุ่นช่วยดูแลทุกขั้นตอน'
    },
    {
      icon: Users,
      title: 'ทีมงานในญี่ปุ่น',
      description: 'ทีมงานที่อาศัยอยู่ในญี่ปุ่นจริง พร้อมให้บริการ'
    },
    {
      icon: Globe,
      title: 'เข้าถึงได้ง่าย',
      description: 'ทุกคนควรเข้าถึงสินค้าคุณภาพดีในราคายุติธรรม'
    },
    {
      icon: Target,
      title: 'ไม่ยุ่งยาก',
      description: 'การช้อปของจากญี่ปุ่นไม่ควรยุ่งยาก'
    }
  ];

  const features = [
    {
      icon: Ship,
      title: 'การจัดส่งที่น่าเชื่อถือ',
      description: 'เราเลือกใช้บริษัทขนส่งที่มีประสบการณ์และน่าเชื่อถือ พร้อมระบบติดตามพัสดุแบบเรียลไทม์'
    },
    {
      icon: Award,
      title: 'ตรวจสอบคุณภาพ',
      description: 'ทุกชิ้นจะถูกตรวจสอบคุณภาพอย่างละเอียดก่อนส่งถึงมือคุณ'
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
      <section className="bg-gradient-to-r from-primary-500 to-primary-700 text-white py-20">
        <div className="container-custom">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Noto Sans JP' }}>
              เกี่ยวกับ PakkuNeko
            </h1>
            <p className="text-xl text-primary-50">
              ฝากซื้อและฝากส่งสินค้าจากญี่ปุ่นสู่ไทย
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-primary-500">
                เรื่องราวของเรา
              </h2>
              <div className="w-24 h-1 bg-primary-500 mx-auto mb-6"></div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
              <p>
                <strong className="text-primary-600">PakkuNeko (แพ็คคุเนโกะ)</strong> เกิดจากความต้องการที่จะทำให้การช้อปปิ้งสินค้าจากญี่ปุ่น
                เป็นเรื่องง่ายและสะดวกสบายสำหรับทุกคน เราเข้าใจว่าหลายคนต้องการสินค้าคุณภาพดีจากญี่ปุ่น
                แต่กลับเจอกับปัญหาต่างๆ เช่น ภาษาที่ไม่เข้าใจ ค่าส่งที่แพง หรือกังวลเรื่องความปลอดภัยของสินค้า
              </p>

              <p>
                ด้วยทีมงานที่<strong className="text-primary-600">อาศัยอยู่ในญี่ปุ่นจริง</strong> เราจึงสามารถช่วยคุณ
                ตั้งแต่การค้นหาสินค้า การสั่งซื้อ การตรวจสอบคุณภาพ ไปจนถึงการจัดส่งถึงมือคุณในประเทศไทย
                โดยไม่ต้องกังวลเรื่องภาษาหรือความซับซ้อนของกระบวนการ
              </p>

              <p>
                เราเชื่อว่า <strong className="text-primary-600">"การช้อปของจากญี่ปุ่นไม่ควรยุ่งยาก"</strong>
                และทุกคนควรเข้าถึงสินค้าคุณภาพดีในราคายุติธรรม ด้วยการบริการที่อบอุ่น
                เหมือนมีเพื่อนญี่ปุ่นช่วยดูแลทุกขั้นตอน 🧡
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-secondary-200">
        <div className="container-custom">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-primary-500">
              คุณค่าของเรา
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto"></div>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-lg text-center"
                  variants={staggerItem}
                  whileHover={{ y: -5 }}
                >
                  <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-primary-500">
              ทำไมต้อง PakkuNeko
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto"></div>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="flex gap-4 p-6 bg-secondary-100 rounded-xl"
                  variants={staggerItem}
                >
                  <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-primary-700">
        <div className="container-custom">
          <motion.div
            className="text-center text-white max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">
              พร้อมเริ่มต้นช้อปปิ้งจากญี่ปุ่นแล้วหรือยัง?
            </h2>
            <p className="text-xl mb-8 text-primary-50">
              ติดต่อเราวันนี้เพื่อรับคำปรึกษาฟรี
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="https://www.facebook.com/profile.php?id=100088990964702"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary-600 px-8 py-3 rounded-full font-medium hover:bg-primary-50 transition-colors inline-flex items-center gap-2"
              >
                ติดต่อทาง Facebook
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default AboutPage;
