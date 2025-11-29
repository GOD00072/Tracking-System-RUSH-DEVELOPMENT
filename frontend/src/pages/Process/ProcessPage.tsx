import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Calculator,
  CreditCard,
  ShoppingCart,
  Package,
  Scale,
  Bell,
  Truck,
  CheckCircle,
  ArrowDown,
  Sparkles
} from 'lucide-react';

type PhaseType = 'thailand' | 'japan' | 'return';

interface Step {
  number: string;
  titleKey: string;
  descriptionKey: string;
  benefitsKey: string;
  icon: React.ReactNode;
  phase: PhaseType;
}

const steps: Step[] = [
  {
    number: "1",
    titleKey: "process.steps.step1.title",
    descriptionKey: "process.steps.step1.description",
    benefitsKey: "process.steps.step1.benefits",
    icon: <MessageCircle className="w-7 h-7" />,
    phase: "thailand"
  },
  {
    number: "2",
    titleKey: "process.steps.step2.title",
    descriptionKey: "process.steps.step2.description",
    benefitsKey: "process.steps.step2.benefits",
    icon: <Calculator className="w-7 h-7" />,
    phase: "thailand"
  },
  {
    number: "3",
    titleKey: "process.steps.step3.title",
    descriptionKey: "process.steps.step3.description",
    benefitsKey: "process.steps.step3.benefits",
    icon: <CreditCard className="w-7 h-7" />,
    phase: "thailand"
  },
  {
    number: "4",
    titleKey: "process.steps.step4.title",
    descriptionKey: "process.steps.step4.description",
    benefitsKey: "process.steps.step4.benefits",
    icon: <ShoppingCart className="w-7 h-7" />,
    phase: "japan"
  },
  {
    number: "5",
    titleKey: "process.steps.step5.title",
    descriptionKey: "process.steps.step5.description",
    benefitsKey: "process.steps.step5.benefits",
    icon: <Package className="w-7 h-7" />,
    phase: "japan"
  },
  {
    number: "6",
    titleKey: "process.steps.step6.title",
    descriptionKey: "process.steps.step6.description",
    benefitsKey: "process.steps.step6.benefits",
    icon: <Scale className="w-7 h-7" />,
    phase: "return"
  },
  {
    number: "7",
    titleKey: "process.steps.step7.title",
    descriptionKey: "process.steps.step7.description",
    benefitsKey: "process.steps.step7.benefits",
    icon: <Bell className="w-7 h-7" />,
    phase: "return"
  },
  {
    number: "8",
    titleKey: "process.steps.step8.title",
    descriptionKey: "process.steps.step8.description",
    benefitsKey: "process.steps.step8.benefits",
    icon: <Truck className="w-7 h-7" />,
    phase: "return"
  },
  {
    number: "9",
    titleKey: "process.steps.step9.title",
    descriptionKey: "process.steps.step9.description",
    benefitsKey: "process.steps.step9.benefits",
    icon: <CheckCircle className="w-7 h-7" />,
    phase: "return"
  }
];

const phaseColors: Record<PhaseType, { bg: string; border: string; badge: string; icon: string; line: string }> = {
  thailand: {
    bg: "bg-primary-50",
    border: "border-primary-200",
    badge: "bg-primary-500",
    icon: "bg-primary-500",
    line: "from-primary-500 to-primary-300"
  },
  japan: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-500",
    icon: "bg-red-500",
    line: "from-red-500 to-red-300"
  },
  return: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-500",
    icon: "bg-amber-500",
    line: "from-amber-500 to-amber-300"
  }
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, rotateX: -15 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      delay: 0.2
    }
  }
};

const badgeVariants = {
  hidden: { scale: 0, x: -20 },
  visible: {
    scale: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

const arrowVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

const floatAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const ProcessPage = () => {
  const { t } = useTranslation();

  const groupedSteps = {
    thailand: steps.filter(s => s.phase === 'thailand'),
    japan: steps.filter(s => s.phase === 'japan'),
    return: steps.filter(s => s.phase === 'return')
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-white overflow-hidden">
      {/* Hero Section */}
      <motion.section
        className="container-custom py-16"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-center max-w-3xl mx-auto">
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div animate={floatAnimation}>
              <Sparkles className="w-4 h-4" />
            </motion.div>
            {t('process.title')}
          </motion.span>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            variants={itemVariants}
          >
            {t('process.title')}
          </motion.h1>

          <motion.p
            className="text-lg text-gray-500 mb-2"
            variants={itemVariants}
          >
            {t('process.subtitle')}
          </motion.p>

          <motion.p
            className="text-xl text-gray-600"
            variants={itemVariants}
          >
            {t('process.description')}
          </motion.p>
        </div>
      </motion.section>

      {/* Phase Legend */}
      <motion.section
        className="container-custom pb-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          className="flex flex-wrap justify-center gap-4"
          variants={containerVariants}
        >
          {(['thailand', 'japan', 'return'] as PhaseType[]).map((phase, index) => (
            <motion.div
              key={phase}
              className="flex items-center gap-2"
              variants={itemVariants}
              whileHover={{ scale: 1.1 }}
            >
              <motion.span
                className={`w-4 h-4 rounded-full ${phaseColors[phase].badge}`}
                animate={pulseAnimation}
              />
              <span className="text-sm font-medium text-gray-600">
                {t(`process.phases.${phase}`)}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Steps Timeline */}
      <section className="container-custom pb-16">
        {(['thailand', 'japan', 'return'] as PhaseType[]).map((phase, phaseIndex) => (
          <motion.div
            key={phase}
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
          >
            {/* Phase Header */}
            <motion.div
              className="flex items-center gap-3 mb-8"
              variants={itemVariants}
            >
              <motion.div
                className={`h-1 flex-1 bg-gradient-to-r ${phaseColors[phase].line} rounded-full origin-left`}
                variants={lineVariants}
              />
              <motion.h2
                className={`px-6 py-2 rounded-full text-white font-semibold ${phaseColors[phase].badge} shadow-lg`}
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.95 }}
              >
                {t(`process.phases.${phase}`)}
              </motion.h2>
              <motion.div
                className={`h-1 flex-1 bg-gradient-to-l ${phaseColors[phase].line} rounded-full origin-right`}
                variants={lineVariants}
              />
            </motion.div>

            {/* Steps Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
            >
              {groupedSteps[phase].map((step, index) => (
                <motion.div
                  key={step.number}
                  className={`relative ${phaseColors[step.phase].bg} ${phaseColors[step.phase].border} border-2 rounded-2xl p-6 cursor-pointer`}
                  variants={cardVariants}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Step Number Badge */}
                  <motion.div
                    className="absolute -top-4 -left-2"
                    variants={badgeVariants}
                  >
                    <motion.span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${phaseColors[step.phase].badge} text-white font-bold text-lg shadow-lg`}
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      {step.number}
                    </motion.span>
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    className="flex justify-end mb-4"
                    variants={iconVariants}
                  >
                    <motion.div
                      className={`p-3 rounded-xl ${phaseColors[step.phase].icon} text-white shadow-md`}
                      whileHover={{
                        scale: 1.15,
                        rotate: [0, -10, 10, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      {step.icon}
                    </motion.div>
                  </motion.div>

                  {/* Content */}
                  <motion.h3
                    className="text-lg font-bold text-gray-800 mb-3 pr-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {t(step.titleKey)}
                  </motion.h3>

                  <motion.p
                    className="text-gray-600 text-sm mb-4 leading-relaxed"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {t(step.descriptionKey)}
                  </motion.p>

                  {/* Benefits */}
                  <motion.div
                    className="flex flex-wrap gap-2"
                    initial="hidden"
                    whileInView="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                          delayChildren: 0.5
                        }
                      }
                    }}
                  >
                    {(t(step.benefitsKey, { returnObjects: true }) as string[]).map((benefit, i) => (
                      <motion.span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 text-xs font-medium text-gray-700 shadow-sm"
                        variants={{
                          hidden: { opacity: 0, scale: 0.8, y: 10 },
                          visible: { opacity: 1, scale: 1, y: 0 }
                        }}
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,1)" }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                        >
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        </motion.div>
                        {benefit}
                      </motion.span>
                    ))}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            {/* Arrow to next phase */}
            {phaseIndex < 2 && (
              <motion.div
                className="flex justify-center my-8"
                variants={arrowVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <motion.div
                  className="flex flex-col items-center text-gray-400"
                  animate={{
                    y: [0, 8, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ArrowDown className="w-8 h-8" />
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </section>

      {/* CTA Section */}
      <motion.section
        className="container-custom pb-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <motion.div
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl overflow-hidden relative"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background decoration */}
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [360, 180, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-4 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {t('process.cta.title')}
          </motion.h2>
          <motion.p
            className="text-primary-100 mb-8 max-w-2xl mx-auto relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t('process.cta.description')}
          </motion.p>
          <motion.a
            href="https://www.facebook.com/pakkuneko"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-full font-semibold shadow-lg relative z-10"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
              backgroundColor: "#FEF4ED"
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.div>
            {t('process.cta.button')}
          </motion.a>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default ProcessPage;
