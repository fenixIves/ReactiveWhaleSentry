"use client";
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mail, MessageCircle, Send } from 'lucide-react';

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
    }, 1500);
  };

  return (
    <section 
      id="contact" 
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00D4FF]/10 rounded-full blur-3xl" />
        
        {/* Animated lines */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-[#00D4FF]/30 to-transparent"
              style={{
                top: `${20 + i * 15}%`,
                left: 0,
                right: 0,
                animation: `scan ${3 + i * 0.5}s linear infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="section-padding relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main CTA Card */}
          <div 
            className={`glass-card rounded-3xl p-8 md:p-12 text-center border-gradient transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/30 mb-8">
              <MessageCircle className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-sm text-[#00D4FF]">Get Started</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Monitor the{' '}
              <span className="text-[#00D4FF] text-glow">Whales</span>?
            </h2>

            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10">
              Join thousands of Web3 traders and institutions who trust WhaleSentry 
              for real-time whale monitoring and automated risk management.
            </p>

            {/* Email Form */}
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#00D4FF] transition-colors"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Get Started Free
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="max-w-md mx-auto mb-8 p-6 rounded-xl bg-[#00D4FF]/20 border border-[#00D4FF]/30">
                <div className="flex items-center justify-center gap-3 text-[#00D4FF]">
                  <div className="w-8 h-8 rounded-full bg-[#00D4FF] flex items-center justify-center">
                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Thanks! Check your email to get started.</span>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div 
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            {[
              { 
                title: 'Support', 
                desc: '24/7 live chat assistance',
                action: 'Contact Support'
              },
              { 
                title: 'Demo', 
                desc: 'See WhaleSentry in action',
                action: 'Book Demo'
              },
              { 
                title: 'Documentation', 
                desc: 'API & integration guides',
                action: 'View Docs'
              },
            ].map((item, index) => (
              <div 
                key={index}
                className="glass-card rounded-xl p-6 hover:border-[#00D4FF]/30 transition-all group"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 mb-4">{item.desc}</p>
                <button className="inline-flex items-center gap-2 text-[#00D4FF] text-sm font-medium group-hover:gap-3 transition-all">
                  {item.action}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
