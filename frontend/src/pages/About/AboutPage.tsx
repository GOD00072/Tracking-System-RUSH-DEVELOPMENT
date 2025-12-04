import { motion } from 'framer-motion';
import { Heart, Home, ShoppingBag, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const values = [
    {
      icon: Heart,
      title: "บริการที่อบอุ่น",
      description: "เหมือนมีเพื่อนญี่ปุ่นช่วยดูแลทุกขั้นตอน ใส่ใจในทุกรายละเอียดเพื่อความพึงพอใจสูงสุดของคุณ",
      color: "bg-red-100 text-red-500"
    },
    {
      icon: Home,
      title: "ทีมงานในญี่ปุ่น",
      description: "ทีมงานที่อาศัยอยู่ในญี่ปุ่นจริง เชี่ยวชาญภาษาและวัฒนธรรม พร้อมให้บริการอย่างมืออาชีพ",
      color: "bg-blue-100 text-blue-500"
    },
    {
      icon: ShoppingBag,
      title: "เข้าถึงได้ง่าย",
      description: "ทุกคนควรเข้าถึงสินค้าคุณภาพดีในราคายุติธรรม ไม่มีค่าธรรมเนียมซ่อนเร้น",
      color: "bg-green-100 text-green-500"
    },
    {
      icon: Sparkles,
      title: "ไม่ยุ่งยาก",
      description: "การช้อปของจากญี่ปุ่นไม่ควรยุ่งยาก เราจัดการเรื่องภาษีและเอกสารให้ครบจบในที่เดียว",
      color: "bg-yellow-100 text-yellow-600"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF2]">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container-custom mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-6">
              เกี่ยวกับ PakkuNeko
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-snug">
              ฝากซื้อและฝากส่งสินค้า<br />
              <span className="text-orange-500 block mt-4 md:mt-6">จากญี่ปุ่นสู่ไทย</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              บริการครบวงจร ดูแลโดยทีมงานมืออาชีพที่ญี่ปุ่น<br className="hidden md:block" />
              ให้การช้อปปิ้งของคุณเป็นเรื่องง่าย ปลอดภัย และคุ้มค่าที่สุด
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4">
        <div className="container-custom mx-auto">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-orange-100/50 border border-orange-50/50 overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-20 -mt-20 opacity-50" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full -ml-16 -mb-16 opacity-50" />

            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              <motion.div 
                {...fadeIn}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-gray-900">เรื่องราวของเรา</h2>
                <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
                  <p>
                    <span className="font-bold text-orange-500">PakkuNeko (แพ็คคุเนโกะ)</span> เกิดจากความต้องการที่จะทำให้การช้อปปิ้งสินค้าจากญี่ปุ่น เป็นเรื่องง่ายและสะดวกสบายสำหรับทุกคน
                  </p>
                  <p>
                    เราเข้าใจว่าหลายคนต้องการสินค้าคุณภาพดีจากญี่ปุ่น แต่กลับเจอกับปัญหาต่างๆ เช่น ภาษาที่ไม่เข้าใจ ค่าส่งที่แพง หรือกังวลเรื่องความปลอดภัยของสินค้า
                  </p>
                  <p>
                    ด้วยทีมงานที่อาศัยอยู่ในญี่ปุ่นจริง เราจึงสามารถช่วยคุณ ตั้งแต่การค้นหาสินค้า การสั่งซื้อ การตรวจสอบคุณภาพ ไปจนถึงการจัดส่งถึงมือคุณในประเทศไทย โดยไม่ต้องกังวลเรื่องภาษาหรือความซับซ้อนของกระบวนการ
                  </p>
                  <div className="bg-orange-50 p-6 rounded-2xl border-l-4 border-orange-500 italic text-gray-700 mt-6">
                    "เราเชื่อว่าการช้อปของจากญี่ปุ่นไม่ควรยุ่งยาก และทุกคนควรเข้าถึงสินค้าคุณภาพดีในราคายุติธรรม ด้วยการบริการที่อบอุ่น เหมือนมีเพื่อนญี่ปุ่นช่วยดูแลทุกขั้นตอน 🧡"
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg group"
              >
                <img 
                  src="/business/2.jpeg" 
                  alt="PakkuNeko Team" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="font-medium text-lg">ทีมงาน PakkuNeko</p>
                  <p className="text-white/80 text-sm">พร้อมให้บริการจากโตเกียว</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container-custom mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">คุณค่าของเรา</h2>
            <p className="text-gray-500">สิ่งที่เรายึดมั่นในการให้บริการลูกค้าทุกคน</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${value.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <value.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-16 px-4">
        <div className="container-custom mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl -ml-20 -mb-20" />
            
            <div className="flex-1 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">ทำไมต้อง PakkuNeko?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">การจัดส่งที่น่าเชื่อถือ</h3>
                    <p className="text-white/90 leading-relaxed">
                      เราเลือกใช้บริษัทขนส่งที่มีประสบการณ์และน่าเชื่อถือ พร้อมระบบติดตามพัสดุแบบเรียลไทม์ มั่นใจได้ว่าของถึงมือแน่นอน
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">ตรวจสอบคุณภาพ</h3>
                    <p className="text-white/90 leading-relaxed">
                      ทุกชิ้นจะถูกตรวจสอบคุณภาพอย่างละเอียดและถ่ายรูปยืนยันให้คุณดูก่อนส่ง หากมีปัญหาเราแจ้งทันที
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 relative z-10">
              <img 
                src="/business/8.jpeg" 
                alt="Quality Check" 
                className="w-full h-64 object-cover rounded-3xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-white/30" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="container-custom mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              พร้อมเริ่มต้นช้อปปิ้งจากญี่ปุ่นแล้วหรือยัง?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              ติดต่อเราวันนี้เพื่อรับคำปรึกษาฟรี เราพร้อมดูแลคุณเหมือนเพื่อนสนิท
            </p>
            <a
              href="https://line.me/R/ti/p/@279jlkpc?oat_content=url&ts=10030235"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#06C755] hover:bg-[#05B04C] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-green-500/40 hover:-translate-y-1 transition-all duration-300"
            >
              <img src="/brands/line.png" alt="LINE" className="w-6 h-6 object-contain " />
              ติดต่อทาง LINE Official
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;