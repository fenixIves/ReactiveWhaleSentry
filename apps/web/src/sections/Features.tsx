"use client";
import { useEffect, useRef, useState } from 'react';
import { 
  Radar, 
  Zap, 
  Shield, 
  BarChart3,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Radar,
    title: 'Real-Time Whale Monitoring',
    subtitle: 'Full-Chain Surveillance',
    description: 'Monitor large transactions across multiple mainstream blockchains. AI-powered whale behavior analysis filters out noise and delivers instant alerts on market movements.',
    image: '/feature-1.jpg',
  },
  {
    icon: Zap,
    title: 'Automated Strategy Execution',
    subtitle: 'Event-Driven Automation',
    description: 'Detect whale transactions and automatically trigger preset strategies. Cross-chain coordination enables detection on one chain and execution on multiple chains.',
    image: '/feature-2.jpg',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    subtitle: 'Protect Your Assets',
    description: 'Auto-hedging mode activates during large transactions. Smart grid trading captures arbitrage opportunities during market volatility. Preset stop-loss protects your capital.',
    image: '/feature-3.jpg',
  },
  {
    icon: BarChart3,
    title: 'Data Insights',
    subtitle: 'Visualize & Predict',
    description: 'Intuitive dashboard displays whale flows and market trends. Deep historical analysis uncovers whale behavior patterns. AI models predict market movements based on historical data.',
    image: '/feature-4.jpg',
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    const cards = sectionRef.current?.querySelectorAll('.feature-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="features" 
      ref={sectionRef}
      className="relative py-24 md:py-32"
    >
      <div className="section-padding">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#00D4FF]/30 mb-6">
            <span className="text-sm text-[#00D4FF]">Core Features</span>
          </div>
          <h2 className="text-responsive-section font-bold text-white mb-6">
            Everything You Need to <span className="text-[#00D4FF]">Track Whales</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            WhaleSentry integrates real-time monitoring, automated execution, risk management, 
            and data analytics into one powerful platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isVisible = visibleCards.has(index);
            
            return (
              <div
                key={index}
                data-index={index}
                className={`feature-card glass-card rounded-2xl overflow-hidden card-hover group transition-all duration-700 ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden img-zoom">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Icon overlay */}
                  <div className="absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-[#00D4FF]/20 backdrop-blur-sm flex items-center justify-center border border-[#00D4FF]/30">
                    <Icon className="w-6 h-6 text-[#00D4FF]" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-3">
                    <p className="text-xs text-[#00D4FF]/60 uppercase tracking-wider mb-1">
                      {feature.subtitle}
                    </p>
                    <h3 className="text-xl font-semibold text-white group-hover:text-[#00D4FF] transition-colors">
                      {feature.title}
                    </h3>
                  </div>
                  
                  <p className="text-white/60 text-sm leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Learn more link */}
                  <button className="inline-flex items-center gap-2 text-[#00D4FF] text-sm font-medium group/link">
                    Learn More
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
