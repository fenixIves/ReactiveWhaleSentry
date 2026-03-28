"use client";
import { useEffect, useRef, useState } from 'react';
import { Check, Zap, Crown, Building2 } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    icon: Zap,
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Monitor up to 3 chains',
      'Basic whale alerts',
      'Email notifications',
      '7-day data history',
      'Community support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    icon: Crown,
    price: '$49',
    period: '/month',
    description: 'For serious traders',
    features: [
      'Monitor up to 20 chains',
      'Advanced AI detection',
      'Real-time alerts',
      '90-day data history',
      'Automated strategies',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    icon: Building2,
    price: 'Custom',
    period: '',
    description: 'For institutions & funds',
    features: [
      'Unlimited chains',
      'Custom AI models',
      'Dedicated infrastructure',
      'Unlimited data history',
      'White-label solution',
      '24/7 dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section 
      id="pricing" 
      ref={sectionRef}
      className="relative py-24 md:py-32"
    >
      <div className="section-padding">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#00D4FF]/30 mb-6">
            <span className="text-sm text-[#00D4FF]">Pricing</span>
          </div>
          <h2 className="text-responsive-section font-bold text-white mb-6">
            Choose Your <span className="text-[#00D4FF]">Plan</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div 
          className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          onMouseMove={handleMouseMove}
        >
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={index}
                className={`relative glass-card rounded-2xl p-6 md:p-8 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                } ${plan.popular ? 'border-[#00D4FF]/50 md:scale-105' : ''}`}
                style={{ 
                  transitionDelay: `${index * 150}ms`,
                  background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 212, 255, 0.06), transparent 40%)`,
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#0066CC] to-[#00D4FF] rounded-full text-sm font-medium text-white">
                    Most Popular
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                    plan.popular ? 'bg-[#00D4FF]/20' : 'bg-white/5'
                  }`}>
                    <Icon className={`w-6 h-6 ${plan.popular ? 'text-[#00D4FF]' : 'text-white/60'}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-3xl md:text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/50">{plan.period}</span>
                  </div>
                  <p className="text-white/50 text-sm">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.popular ? 'bg-[#00D4FF]/20' : 'bg-white/10'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-[#00D4FF]' : 'text-white/60'}`} />
                      </div>
                      <span className="text-white/70 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button 
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                    plan.popular 
                      ? 'btn-primary' 
                      : 'border border-white/20 text-white hover:border-[#00D4FF] hover:text-[#00D4FF]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div 
          className={`max-w-3xl mx-auto mt-12 flex flex-wrap justify-center gap-6 text-sm text-white/40 transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#00D4FF]" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#00D4FF]" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#00D4FF]" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
