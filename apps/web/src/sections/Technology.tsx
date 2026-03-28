"use client";
import { useEffect, useRef, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Globe,
  Cpu,
  ShieldAlert
} from 'lucide-react';

const painPoints = [
  {
    icon: Clock,
    title: 'Manual Monitoring',
    description: 'Constantly watching multiple chains is time-consuming and exhausting',
  },
  {
    icon: AlertTriangle,
    title: 'Missed Opportunities',
    description: 'Delayed reactions cause you to miss profitable whale movements',
  },
  {
    icon: Globe,
    title: 'Complex Operations',
    description: 'Cross-chain transactions require technical expertise and manual coordination',
  },
  {
    icon: ShieldAlert,
    title: 'High Risk Exposure',
    description: 'Volatile markets can wipe out positions without proper risk management',
  },
];

const solutions = [
  {
    icon: CheckCircle2,
    title: '24/7 Automated Detection',
    description: 'Never miss a whale movement with continuous AI-powered monitoring',
  },
  {
    icon: Cpu,
    title: 'Millisecond Response',
    description: 'React instantly to market changes with automated strategy execution',
  },
  {
    icon: Globe,
    title: 'One-Click Multi-Chain',
    description: 'Execute complex cross-chain strategies with a single confirmation',
  },
  {
    icon: ShieldAlert,
    title: 'AI Risk Protection',
    description: 'Smart hedging and stop-loss protect your assets automatically',
  },
];

export default function Technology() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  return (
    <section 
      id="technology" 
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#00D4FF]/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#0066CC]/5 rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="section-padding relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#00D4FF]/30 mb-6">
            <span className="text-sm text-[#00D4FF]">The Solution</span>
          </div>
          <h2 className="text-responsive-section font-bold text-white mb-6">
            From <span className="text-red-400">Pain Points</span> to <span className="text-[#00D4FF]">Solutions</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            See how WhaleSentry solves the core challenges of Web3 whale monitoring
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Pain Points */}
          <div 
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Traditional Pain Points</h3>
            </div>

            <div className="space-y-4">
              {painPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <div
                    key={index}
                    className="glass-card rounded-xl p-5 border-l-4 border-red-400/50 hover:border-red-400 transition-all"
                    style={{ 
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                      transition: `all 0.5s ease ${index * 150}ms`
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-2">
                          {point.title}
                        </h4>
                        <p className="text-white/50 text-sm">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solutions */}
          <div 
            className={`transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#00D4FF]" />
              </div>
              <h3 className="text-2xl font-semibold text-white">WhaleSentry Solutions</h3>
            </div>

            <div className="space-y-4">
              {solutions.map((solution, index) => {
                const Icon = solution.icon;
                return (
                  <div
                    key={index}
                    className="glass-card rounded-xl p-5 border-l-4 border-[#00D4FF]/50 hover:border-[#00D4FF] transition-all group"
                    style={{ 
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                      transition: `all 0.5s ease ${index * 150 + 300}ms`
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-[#00D4FF]/20 transition-colors">
                        <Icon className="w-4 h-4 text-[#00D4FF]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-2 group-hover:text-[#00D4FF] transition-colors">
                          {solution.title}
                        </h4>
                        <p className="text-white/50 text-sm">
                          {solution.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div 
              className="mt-8 p-6 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease 600ms'
              }}
            >
              <p className="text-white/80 text-sm mb-4">
                Ready to experience automated whale monitoring?
              </p>
              <button 
                onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary text-sm py-3 px-6"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div 
          className={`max-w-5xl mx-auto mt-20 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="text-center mb-10">
            <h3 className="text-xl font-semibold text-white">How It Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Connect', desc: 'Link your wallets and exchanges' },
              { step: '02', title: 'Configure', desc: 'Set up monitoring rules and strategies' },
              { step: '03', title: 'Monitor', desc: 'Let WhaleSentry watch the markets 24/7' },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="glass-card rounded-xl p-6 text-center group hover:border-[#00D4FF]/50 transition-all">
                  <div className="text-4xl font-bold text-[#00D4FF]/30 mb-4 group-hover:text-[#00D4FF]/50 transition-colors">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-white/50 text-sm">{item.desc}</p>
                </div>
                
                {/* Arrow */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 border-t-2 border-r-2 border-[#00D4FF]/30 rotate-45" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
