import { Ship, Calculator, Calendar, Package, ShoppingCart, MessageCircle, MapPin, Phone, Mail, Facebook, Twitter, ArrowRight, Sparkles, CheckCircle2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pageTransition, staggerContainer, staggerItem } from '../../lib/animations';

const HomePage = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: ShoppingCart,
      titleKey: 'home.services.purchase.title',
      subtitleKey: 'home.services.purchase.subtitle',
      descriptionKey: 'home.services.purchase.description',
    },
    {
      icon: Package,
      titleKey: 'home.services.warehouse.title',
      subtitleKey: 'home.services.warehouse.subtitle',
      descriptionKey: 'home.services.warehouse.description',
    },
    {
      icon: Ship,
      titleKey: 'home.services.shipping.title',
      subtitleKey: 'home.services.shipping.subtitle',
      descriptionKey: 'home.services.shipping.description',
    },
    {
      icon: MessageCircle,
      titleKey: 'home.services.consultation.title',
      subtitleKey: 'home.services.consultation.subtitle',
      descriptionKey: 'home.services.consultation.description',
    },
  ];

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

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Content */}
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-primary-200 text-primary-600 text-sm font-medium mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4" />
                {t('home.tagline')}
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                {t('home.title')}
                <span className="block text-primary-500 mt-2">{t('home.subtitle')}</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('home.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="https://www.facebook.com/profile.php?id=100088990964702"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Facebook className="w-5 h-5" />
                  {t('home.startService')}
                </a>
                <Link
                  to="/process"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-primary-300 transition-all duration-300"
                >
                  {t('home.viewProcess')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>

            {/* Right Content - Logo Card */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl blur-2xl opacity-20 scale-110"></div>
                <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/50 shadow-2xl">
                  <img
                    src="/pakkuneko-logo.png"
                    alt="PakkuNeko Logo"
                    className="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover mx-auto shadow-xl"
                  />
                  <div className="mt-6 space-y-3">
                    {highlightKeys.map((key, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 text-gray-700"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        <span className="text-sm">{t(key)}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/50 shadow-xl">
              <div className="text-center mb-8">
                <span className="inline-block px-4 py-1.5 bg-primary-100/80 text-primary-600 rounded-full text-sm font-medium mb-4">
                  {t('home.about.badge')}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {t('home.about.title')}
                </h2>
              </div>

              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p className="text-lg">
                  <span className="text-2xl font-bold text-primary-500">PakkuNeko</span> {t('home.about.description')}
                </p>

                <div className="bg-gradient-to-r from-primary-50/80 to-orange-50/80 backdrop-blur-sm p-6 rounded-2xl border-l-4 border-primary-500">
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    "{t('home.about.quote')}"
                  </p>
                  <p className="text-gray-600">
                    {t('home.about.quoteDescription')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary-100/80 text-primary-600 rounded-full text-sm font-medium mb-4">
              {t('home.services.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {t('home.services.title')}
            </h2>
            <p className="text-gray-500">{t('home.services.subtitle')}</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  className="group bg-white/70 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300"
                  variants={staggerItem}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {t(service.titleKey)}
                      </h3>
                      <p className="text-sm text-primary-500 font-medium mb-3">
                        {t(service.subtitleKey)}
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        {t(service.descriptionKey)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Tracking Tools Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary-100/80 text-primary-600 rounded-full text-sm font-medium mb-4">
              {t('home.tracking.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t('home.tracking.title')}
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Link
                  to={feature.link}
                  className="group block bg-white/70 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300 h-full"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {t(feature.descriptionKey)}
                  </p>
                  <div className="mt-4 flex items-center text-primary-500 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('common.startNow')}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary-100/80 text-primary-600 rounded-full text-sm font-medium mb-4">
              {t('home.contact.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {t('home.contact.title')}
            </h2>
            <p className="text-gray-500">{t('home.contact.subtitle')}</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Contact Info */}
            <motion.div
              className="space-y-4"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <motion.div
                variants={staggerItem}
                className="group flex items-start gap-4 bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{t('contact.address.title')}</h4>
                  <p className="text-gray-600 text-sm">
                    {t('contact.address.line1')}<br />
                    {t('contact.address.line2')}<br />
                    {t('contact.address.line3')}
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="group flex items-start gap-4 bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{t('contact.phone.title')}</h4>
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">{t('contact.phone.thailand')}:</span> {t('contact.phone.thNumber')}<br />
                    <span className="font-medium">{t('contact.phone.japan')}:</span> {t('contact.phone.jpNumber')}
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="group flex items-start gap-4 bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{t('contact.email.title')}</h4>
                  <a
                    href="mailto:anongpotter01@gmail.com"
                    className="text-gray-600 text-sm hover:text-primary-600 transition-colors"
                  >
                    {t('contact.email.address')}
                  </a>
                </div>
              </motion.div>
            </motion.div>

            {/* Social & CTA */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Social Links */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-lg">
                <h4 className="font-bold text-gray-900 mb-4 text-center">{t('home.contact.followUs')}</h4>
                <div className="space-y-3">
                  <a
                    href="https://www.facebook.com/profile.php?id=100088990964702"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white/80 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{t('contact.social.facebook')}</p>
                      <p className="text-xs text-gray-500">{t('contact.social.facebookPage')}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </a>

                  <a
                    href="https://x.com/mirinpotter?s=21"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white/80 hover:bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Twitter className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{t('contact.social.twitter')}</p>
                      <p className="text-xs text-gray-500">{t('contact.social.twitterHandle')}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </a>
                </div>
              </div>

              {/* CTA */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-8 text-center text-white shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">
                    {t('home.contact.cta.title')}
                  </h3>
                  <p className="text-white/90 mb-6">
                    {t('home.contact.cta.description')}
                  </p>
                  <a
                    href="https://www.facebook.com/profile.php?id=100088990964702"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    <Facebook className="w-5 h-5" />
                    {t('home.contact.cta.button')}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default HomePage;
