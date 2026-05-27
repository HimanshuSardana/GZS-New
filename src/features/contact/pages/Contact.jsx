import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiClock, FiChevronDown, FiSend, FiCheckCircle, FiHelpCircle } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { usePageTheme } from '@/app/providers/ThemeProvider';

const SUBJECT_OPTIONS = [
  'General Inquiry', 
  'Bug Report', 
  'Partnership', 
  'Career', 
  'Press'
];

const FAQS = [
  { 
    q: "How long does verification take?", 
    a: "Our moderation team typically reviews verification requests within 48-72 hours." 
  },
  { 
    q: "Can I host my own tournament?", 
    a: "Yes! Any user with a verified profile can create and manage community tournaments." 
  },
  { 
    q: "Is GzoneSphere free to use?", 
    a: "GzoneSphere is free for creators and gamers. We offer premium features for studios and agencies." 
  }
];

export default function Contact() {
  usePageTheme('contact');

  const [status, setStatus] = useState('idle'); // idle | loading | success
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [openFaq, setOpenFaq] = useState(null);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      error = 'Please enter a valid email address';
    }
    if (!value) {
      error = 'This field is required';
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation
    const newErrors = {};
    Object.keys(form).forEach(key => {
      const err = validateField(key, form[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStatus('loading');
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatus('success');
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] selection:bg-[var(--theme-primary)]/30 overflow-hidden">
      <Helmet>
        <title>Contact Us | GzoneSphere</title>
      </Helmet>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="container-global relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] leading-[0.85]">
              Let's <br />
              <span className="text-[var(--theme-primary)]">Talk.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-[var(--theme-text-muted)] max-w-xl mx-auto font-bold italic opacity-60">
              Whether you're looking for support, partnership, or just want to say hi — we're here.
            </p>
          </motion.div>
        </div>
        
        {/* Background Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--theme-primary)] blur-[120px] rounded-full"
          />
        </div>
      </section>

      <section className="pb-24">
        <div className="container-global">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-20 items-start">
            
            {/* Left Column: Form (60%) */}
            <div className="lg:col-span-6">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[var(--theme-bg-section)] border-2 border-[var(--status-success)]/30 rounded-3xl p-10 md:p-16 text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-[var(--status-success)]/10 rounded-full flex items-center justify-center mx-auto text-[var(--status-success)]">
                      <FiCheckCircle size={40} />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black uppercase italic tracking-tight text-[var(--theme-text)]">Message Sent!</h2>
                      <p className="text-[var(--theme-text-muted)] font-bold italic">
                        We've received your inquiry and our team will get back to you within 24 hours.
                      </p>
                    </div>
                    <button 
                      onClick={() => setStatus('idle')}
                      className="gzs-btn-secondary !border-[var(--status-success)]/20 hover:!bg-[var(--status-success)]/10"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-[var(--theme-bg-section)] border-2 border-[var(--theme-border)] rounded-3xl p-8 md:p-12 shadow-2xl"
                  >
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-60">Full Name</label>
                          <input 
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Alex Mercer"
                            className={`w-full px-5 py-4 bg-[var(--theme-bg)] border-2 rounded-2xl text-sm font-bold italic text-[var(--theme-text)] outline-none transition-all ${errors.name ? 'border-red-500/50' : 'border-[var(--theme-border)] focus:border-[var(--theme-primary)]'}`}
                          />
                          {errors.name && <p className="text-[10px] text-red-400 font-bold italic">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-60">Email Address</label>
                          <input 
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="alex@gzs.dev"
                            className={`w-full px-5 py-4 bg-[var(--theme-bg)] border-2 rounded-2xl text-sm font-bold italic text-[var(--theme-text)] outline-none transition-all ${errors.email ? 'border-red-500/50' : 'border-[var(--theme-border)] focus:border-[var(--theme-primary)]'}`}
                          />
                          {errors.email && <p className="text-[10px] text-red-400 font-bold italic">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-60">Subject</label>
                        <div className="relative">
                          <select 
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            className={`w-full px-5 py-4 bg-[var(--theme-bg)] border-2 rounded-2xl text-sm font-bold italic text-[var(--theme-text)] outline-none appearance-none transition-all ${errors.subject ? 'border-red-500/50' : 'border-[var(--theme-border)] focus:border-[var(--theme-primary)]'}`}
                          >
                            <option value="">Select a topic...</option>
                            {SUBJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                        </div>
                        {errors.subject && <p className="text-[10px] text-red-400 font-bold italic">{errors.subject}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-60">Message</label>
                        <textarea 
                          name="message"
                          rows={6}
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Tell us everything..."
                          className={`w-full px-5 py-4 bg-[var(--theme-bg)] border-2 rounded-2xl text-sm font-bold italic text-[var(--theme-text)] outline-none resize-none transition-all ${errors.message ? 'border-red-500/50' : 'border-[var(--theme-border)] focus:border-[var(--theme-primary)]'}`}
                        />
                        {errors.message && <p className="text-[10px] text-red-400 font-bold italic">{errors.message}</p>}
                      </div>

                      <button 
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-5 bg-[var(--theme-text)] text-[var(--theme-bg)] hover:bg-[var(--theme-primary)] hover:text-white rounded-2xl text-sm font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                      >
                        {status === 'loading' ? (
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>Deploy Message <FiSend size={14} /></>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: Info (40%) */}
            <div className="lg:col-span-4 space-y-10">
              
              {/* Primary Contact Cards */}
              <div className="space-y-4">
                <a 
                  href="https://discord.gg/gzonesphere" 
                  target="_blank" 
                  rel="noreferrer"
                  className="group flex items-center gap-6 p-6 bg-[#5865F2]/10 border-2 border-[#5865F2]/20 rounded-3xl hover:border-[#5865F2]/40 transition-all"
                >
                  <div className="w-14 h-14 bg-[#5865F2] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#5865F2]/20">
                    <FaDiscord size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase italic text-[var(--theme-text)]">Join Discord</h4>
                    <p className="text-xs font-bold text-[#5865F2] opacity-80 uppercase tracking-wider">Fastest Support Hub</p>
                  </div>
                </a>

                <div className="flex items-center gap-6 p-6 bg-[var(--theme-bg-section)] border-2 border-[var(--theme-border)] rounded-3xl">
                  <div className="w-14 h-14 bg-[var(--theme-primary)]/10 border-2 border-[var(--theme-primary)]/20 rounded-2xl flex items-center justify-center text-[var(--theme-primary)]">
                    <FiMail size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase italic text-[var(--theme-text)]">Email Us</h4>
                    <p className="text-xs font-bold text-[var(--theme-text-muted)] opacity-60 italic">hello@gzonesphere.dev</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 px-6 py-4 bg-[var(--theme-bg-section)]/40 border-2 border-dashed border-[var(--theme-border)] rounded-3xl">
                  <FiClock className="text-[var(--theme-primary)]" size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-50 italic">
                    Average response time: 24 hours
                  </p>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                  <FiHelpCircle className="text-[var(--theme-primary)]" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--theme-text)] italic">Quick FAQ</h3>
                </div>
                
                <div className="space-y-2">
                  {FAQS.map((faq, idx) => (
                    <div 
                      key={idx}
                      className="bg-[var(--theme-bg-section)] border-2 border-[var(--theme-border)] rounded-2xl overflow-hidden"
                    >
                      <button 
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--theme-primary)]/[0.03] transition-colors"
                      >
                        <span className="text-xs font-bold italic text-[var(--theme-text)]">{faq.q}</span>
                        <FiChevronDown className={`transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {openFaq === idx && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-5 pt-0 text-[10px] leading-relaxed font-bold italic text-[var(--theme-text-muted)] opacity-60">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
