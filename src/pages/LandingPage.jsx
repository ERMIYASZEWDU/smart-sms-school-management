import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Users,
  BookOpen,
  Shield,
  Zap,
  ArrowRight,
  GraduationCap,
  Globe,
  CheckCircle2,
  Layers,
  LineChart,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Presentation,
  HeartHandshake,
  ShieldCheck,
  TrendingUp
} from 'lucide-react'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' }
}

const navLinks = [
  { href: '#features', key: 'landing.featuresAnchor' },
  { href: '#portals', key: 'landing.portalsTitle' },
  { href: '#how', key: 'landing.howTitle' },
  { href: '#faq', key: 'landing.faqTitle' }
]

export const LandingPage = () => {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  const features = [
    { icon: Users, title: t('landing.features.multiRole'), desc: t('landing.features.multiRoleDesc') },
    { icon: BarChart3, title: t('landing.features.analytics'), desc: t('landing.features.analyticsDesc') },
    { icon: BookOpen, title: t('landing.features.academics'), desc: t('landing.features.academicsDesc') },
    { icon: Shield, title: t('landing.features.secure'), desc: t('landing.features.secureDesc') },
    { icon: Zap, title: t('landing.features.fastModern'), desc: t('landing.features.fastModernDesc') },
    { icon: Globe, title: t('landing.features.localized'), desc: t('landing.features.localizedDesc') }
  ]

  const stats = [
    { value: t('landing.stat1Value'), label: t('landing.stat1Label') },
    { value: t('landing.stat2Value'), label: t('landing.stat2Label') },
    { value: t('landing.stat3Value'), label: t('landing.stat3Label') },
    { value: t('landing.stat4Value'), label: t('landing.stat4Label') }
  ]

  const trustPoints = [
    t('landing.trust1'),
    t('landing.trust2'),
    t('landing.trust3'),
    t('landing.trust4')
  ]

  const steps = [
    { icon: Layers, title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { icon: Users, title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { icon: LineChart, title: t('landing.step3Title'), desc: t('landing.step3Desc') }
  ]

  const portals = [
    { icon: BookOpen, title: t('landing.portalStudent'), desc: t('landing.portalStudentDesc'), accent: 'from-sky-500 to-blue-600' },
    { icon: Presentation, title: t('landing.portalTeacher'), desc: t('landing.portalTeacherDesc'), accent: 'from-emerald-500 to-teal-600' },
    { icon: HeartHandshake, title: t('landing.portalParent'), desc: t('landing.portalParentDesc'), accent: 'from-violet-500 to-purple-600' },
    { icon: ShieldCheck, title: t('landing.portalAdmin'), desc: t('landing.portalAdminDesc'), accent: 'from-amber-500 to-orange-600' }
  ]

  const faqs = [
    { q: t('landing.faq1q'), a: t('landing.faq1a') },
    { q: t('landing.faq2q'), a: t('landing.faq2a') },
    { q: t('landing.faq3q'), a: t('landing.faq3a') },
    { q: t('landing.faq4q'), a: t('landing.faq4a') },
    { q: t('landing.faq5q'), a: t('landing.faq5a') }
  ]

  const mockBars = [40, 65, 50, 80, 70, 95, 60]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-200/80 dark:border-gray-700/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Smart SMS</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden xs:block">{t('landing.subtitle')}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t(link.key)}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm sm:text-base shadow-sm hover:shadow-md shrink-0"
            >
              {t('auth.login')}
              <ArrowRight size={16} />
            </Link>
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition shrink-0"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    {t(link.key)}
                  </a>
                ))}
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                >
                  {t('auth.login')} <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 sm:pt-36 pb-14 sm:pb-16 px-4 sm:px-6">
        {/* Decorative animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-20 -left-20 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-400/30 dark:from-blue-600/25 dark:to-indigo-600/25 blur-3xl animate-drift" />
          <div
            className="absolute top-1/4 -right-24 w-80 h-80 sm:w-[26rem] sm:h-[26rem] rounded-full bg-gradient-to-br from-violet-400/25 to-sky-400/25 dark:from-violet-600/20 dark:to-sky-600/20 blur-3xl animate-drift"
            style={{ animationDelay: '-6s', animationDuration: '19s' }}
          />
          <div
            className="absolute -bottom-16 left-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-cyan-300/25 to-blue-500/25 dark:from-cyan-500/15 dark:to-blue-700/15 blur-3xl animate-drift"
            style={{ animationDelay: '-11s', animationDuration: '22s' }}
          />
          {[8, 18, 28, 38, 50, 62, 74, 86].map((left, i) => (
            <span
              key={i}
              className="absolute bottom-8 w-1 h-1 rounded-full bg-blue-400/70 dark:bg-blue-300/50 animate-rise"
              style={{ left: `${left}%`, animationDelay: `${i * 1.4}s`, animationDuration: `${6 + (i % 3) * 1.5}s` }}
            />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium mb-6"
          >
            <Sparkles size={14} />
            {t('landing.tagline')}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 sm:mb-6 text-gray-900 dark:text-white leading-tight tracking-tight"
          >
            {t('welcome')}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto"
          >
            {t('landing.description')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-10"
          >
            <Link
              to="/login"
              className="w-full xs:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-lg hover:shadow-xl"
            >
              {t('landing.getStarted')} <ArrowRight size={18} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-12 sm:mb-14"
          >
            {trustPoints.map((point) => (
              <span key={point} className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                {point}
              </span>
            ))}
          </motion.div>

          {/* ── Dashboard mockup ── */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="max-w-3xl mx-auto text-left"
          >
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl shadow-blue-900/10 dark:shadow-black/40 overflow-hidden">
              {/* Window bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-gray-400 dark:text-gray-500 font-medium">admin.smartsms.et</span>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* Stat mini-cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 font-medium truncate">{t('landing.mockAttendance')}</p>
                    <p className="text-lg sm:text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">95%</p>
                    <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp size={12} /> +4.2%
                    </p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-300 font-medium truncate">{t('landing.mockStudents')}</p>
                    <p className="text-lg sm:text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">540</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">12 classes</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-300 font-medium truncate">{t('landing.mockAverage')}</p>
                    <p className="text-lg sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">87%</p>
                    <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp size={12} /> +1.8%
                    </p>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
                  <div className="flex items-end justify-between h-24 sm:h-28 gap-1.5 sm:gap-2">
                    {mockBars.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div
                          className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-400 dark:from-blue-500 dark:to-indigo-400 transition-all"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-medium">W{i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {t('landing.features.analytics')} — 8 weeks
                  </p>
                </div>

                {/* Fake activity rows */}
                <div className="space-y-2">
                  {[['Abebe Kebede', 'Grade 10 · A', 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', '95%'],
                    ['Tigist Worku', 'Grade 10 · A', 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', '97%'],
                    ['Sara Mohammed', 'Grade 11 · B', 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300', '91%']].map((row, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900/60 px-3 py-2 sm:px-4 sm:py-2.5">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">{row[0]}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{row[1]}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${row[2]}`}>{row[3]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Glow behind mockup */}
            <div className="mx-auto -mt-24 sm:-mt-28 w-3/4 h-24 sm:h-28 bg-gradient-to-r from-blue-400/40 to-indigo-400/40 dark:from-blue-600/20 dark:to-indigo-600/20 blur-3xl rounded-full pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="px-4 sm:px-6 pb-14 sm:pb-16">
        <motion.div
          {...fadeUp}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 text-center shadow-sm"
            >
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-14 sm:py-20 px-4 sm:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <motion.h3
            {...fadeUp}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 text-gray-900 dark:text-white"
          >
            {t('landing.featuresTitle')}
          </motion.h3>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 sm:mb-12"
          >
            {t('landing.description')}
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: idx * 0.05 }}
                  className="feature-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h4>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Portals ── */}
      <section id="portals" className="py-14 sm:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <motion.h3
            {...fadeUp}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 text-gray-900 dark:text-white"
          >
            {t('landing.portalsTitle')}
          </motion.h3>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 sm:mb-12"
          >
            {t('landing.portalsDesc')}
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {portals.map((portal, idx) => {
              const Icon = portal.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: idx * 0.08 }}
                  className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${portal.accent} flex items-center justify-center shadow-md mb-4`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{portal.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">{portal.desc}</p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:gap-2.5 transition-all"
                  >
                    {t('landing.explore')} <ArrowRight size={15} />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-14 sm:py-20 px-4 sm:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <motion.h3
            {...fadeUp}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-14 text-gray-900 dark:text-white"
          >
            {t('landing.howTitle')}
          </motion.h3>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative text-center"
                >
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg mb-5">
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-[calc(50%+2.75rem)] hidden md:flex items-center">
                    {idx < steps.length - 1 && (
                      <ArrowRight size={20} className="text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                    {String(idx + 1).padStart(2, '0')}
                  </p>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{step.title}</h4>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xs mx-auto">{step.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-14 sm:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <motion.h3
            {...fadeUp}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 text-gray-900 dark:text-white"
          >
            {t('landing.faqTitle')}
          </motion.h3>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 sm:mb-12"
          >
            {t('landing.faqDesc')}
          </motion.p>
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left"
                  >
                    <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 sm:px-5 pb-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-20">
        <motion.div
          {...fadeUp}
          className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 sm:p-14 text-center shadow-xl relative overflow-hidden"
        >
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-20 -left-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="relative">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 sm:mb-4">
              {t('landing.ctaTitle')}
            </h3>
            <p className="text-blue-100 text-sm sm:text-lg mb-8 max-w-xl mx-auto">
              {t('landing.ctaDesc')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition font-semibold shadow-lg"
            >
              {t('landing.getStarted')} <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-300 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Smart SMS</p>
              <p className="text-xs text-gray-400">{t('landing.subtitle')}</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition-colors">
                {t(link.key)}
              </a>
            ))}
            <Link to="/login" className="hover:text-white transition-colors">{t('auth.login')}</Link>
          </nav>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">{t('landing.footer')}</p>
        </div>
      </footer>
    </div>
  )
}
