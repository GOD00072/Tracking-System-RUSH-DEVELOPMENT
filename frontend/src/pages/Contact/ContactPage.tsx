import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Facebook, Twitter, Clock, MessageCircle, ArrowRight, Send, Globe, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pageTransition, staggerContainer, staggerItem } from '../../lib/animations';

const ContactPage = () => {
  const { t } = useTranslation();

  const faq = [
    {
      question: t('contact.faq.q1'),
      answer: t('contact.faq.a1')
    },
    {
      question: t('contact.faq.q2'),
      answer: t('contact.faq.a2')
    },
    {
      question: t('contact.faq.q3'),
      answer: t('contact.faq.a3')
    }
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-primary-200 text-primary-600 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Send className="w-4 h-4" />
              {t('contact.badge')}
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              {t('contact.title')}
            </h1>
            <p className="text-lg text-gray-500 mb-2">{t('contact.subtitle')}</p>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {t('contact.tagline')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Info - Left Side */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {/* Address Card */}
              <motion.div
                variants={staggerItem}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{t('contact.address.title')}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {t('contact.address.line1')}<br />
                      {t('contact.address.line2')}<br />
                      {t('contact.address.line3')}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Phone Card */}
              <motion.div
                variants={staggerItem}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">{t('contact.phone.title')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇹🇭</span>
                          <span className="text-sm text-gray-500">{t('contact.phone.thailand')}</span>
                        </div>
                        <a href={`tel:${t('contact.phone.thNumber')}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {t('contact.phone.thNumber')}
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇯🇵</span>
                          <span className="text-sm text-gray-500">{t('contact.phone.japan')}</span>
                        </div>
                        <a href={`tel:${t('contact.phone.jpNumber')}`} className="font-semibold text-gray-900 hover:text-red-600 transition-colors">
                          {t('contact.phone.jpNumber')}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Email Card */}
              <motion.div
                variants={staggerItem}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/25 flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{t('contact.email.title')}</h3>
                    <a
                      href={`mailto:${t('contact.email.address')}`}
                      className="text-gray-600 hover:text-rose-600 transition-colors inline-flex items-center gap-2"
                    >
                      {t('contact.email.address')}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Business Hours Card */}
              <motion.div
                variants={staggerItem}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 flex-shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">{t('contact.hours.title')}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('contact.hours.weekday')}</span>
                        <span className="font-semibold text-gray-900">{t('contact.hours.weekdayTime')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('contact.hours.weekend')}</span>
                        <span className="font-semibold text-gray-900">{t('contact.hours.weekendTime')}</span>
                      </div>
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {t('contact.hours.timezone')}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Social & CTA */}
            <motion.div
              className="lg:col-span-3 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Social Media Cards */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/50 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary-600" />
                  </span>
                  {t('contact.social.title')}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/profile.php?id=100088990964702"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Facebook className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{t('contact.social.facebook')}</p>
                      <p className="text-sm text-gray-500">{t('contact.social.facebookPage')}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </a>

                  {/* Twitter/X */}
                  <a
                    href="https://x.com/mirinpotter?s=21"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Twitter className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-gray-700 transition-colors">{t('contact.social.twitter')}</p>
                      <p className="text-sm text-gray-500">{t('contact.social.twitterHandle')}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* CTA Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-8 md:p-10 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    {t('contact.cta.title')}
                  </h3>
                  <p className="text-white/90 mb-8 text-lg">
                    {t('contact.cta.description')}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="https://www.facebook.com/profile.php?id=100088990964702"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      <Facebook className="w-5 h-5" />
                      {t('contact.cta.chatFacebook')}
                    </a>
                    <a
                      href={`mailto:${t('contact.email.address')}`}
                      className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all duration-300 border border-white/30"
                    >
                      <Mail className="w-5 h-5" />
                      {t('contact.cta.sendEmail')}
                    </a>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/50 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-primary-600" />
                  </span>
                  {t('contact.faq.title')}
                </h3>
                <div className="space-y-4">
                  {faq.map((item, index) => (
                    <motion.div
                      key={index}
                      className="p-5 rounded-xl bg-white/80 border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-300"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <h4 className="font-bold text-gray-900 mb-2 flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {item.question}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed pl-9">
                        {item.answer}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map or Location Visual Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-white/50 shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
                <span className="text-2xl">🇯🇵</span>
                <span className="font-semibold text-gray-700">{t('contact.team.japan')}</span>
              </div>
              <div className="flex items-center">
                <ArrowRight className="w-6 h-6 text-primary-500" />
                <ArrowRight className="w-6 h-6 text-primary-500 -ml-3" />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                <span className="text-2xl">🇹🇭</span>
                <span className="font-semibold text-gray-700">{t('contact.team.thailand')}</span>
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {t('contact.team.title')}
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('contact.team.description')}
            </p>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default ContactPage;
