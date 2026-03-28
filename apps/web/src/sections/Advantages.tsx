"use client";
import { useEffect, useRef, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Clock, 
  TrendingUp,
  Lock
} from 'lucide-react';

const painPoints = [
  {
    icon: AlertTriangle,
    title: '多币种交易复杂',
    description: '链上交易涉及多种加密货币，人工计算难度大，易出错',
  },
  {
    icon: Clock,
    title: '高频交易追踪困难',
    description: 'DeFi 协议交互频繁，交易记录分散，难以完整追踪',
  },
  {
    icon: Lock,
    title: '合规风险高',
    description: '各国税务法规不断更新，缺乏专业知识容易违规',
  },
];

const advantages = [
  {
    icon: Zap,
    title: '交易即合规',
    description: '税务合规在交易发生时主动完成，无需事后整理',
  },
  {
    icon: CheckCircle2,
    title: '零错误计算',
    description: '确定性算法确保 99.9% 的计算准确率',
  },
  {
    icon: TrendingUp,
    title: '成本极低',
    description: '自动化流程大幅降低人力和时间成本',
  },
];

export default function Advantages() {
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
      id="advantages" 
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#3898EC]/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#3898EC]/5 rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="section-padding relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#3898EC]/30 mb-6">
            <span className="text-sm text-[#3898EC]">解决方案</span>
          </div>
          <h2 className="text-responsive-section font-bold text-white mb-6">
            从<span className="text-red-400">痛点</span>到<span className="text-[#3898EC]">优势</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            了解 KiteTax Pal 如何解决 Web3 税务合规的核心挑战
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
              <h3 className="text-2xl font-semibold text-white">传统痛点</h3>
            </div>

            <div className="space-y-4">
              {painPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <div
                    key={index}
                    className="glass-card rounded-xl p-5 border-l-4 border-red-400/50 hover:border-red-400 transition-all"
                    style={{ 
                      animationDelay: `${index * 150}ms`,
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

          {/* Advantages */}
          <div 
            className={`transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-[#3898EC]/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#3898EC]" />
              </div>
              <h3 className="text-2xl font-semibold text-white">KiteTax Pal 优势</h3>
            </div>

            <div className="space-y-4">
              {advantages.map((advantage, index) => {
                const Icon = advantage.icon;
                return (
                  <div
                    key={index}
                    className="glass-card rounded-xl p-5 border-l-4 border-[#3898EC]/50 hover:border-[#3898EC] transition-all group"
                    style={{ 
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                      transition: `all 0.5s ease ${index * 150 + 300}ms`
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#3898EC]/10 flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-[#3898EC]/20 transition-colors">
                        <Icon className="w-4 h-4 text-[#3898EC]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-2 group-hover:text-[#3898EC] transition-colors">
                          {advantage.title}
                        </h4>
                        <p className="text-white/50 text-sm">
                          {advantage.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div 
              className="mt-8 p-6 rounded-xl bg-gradient-to-r from-[#3898EC]/20 to-transparent border border-[#3898EC]/30"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease 600ms'
              }}
            >
              <p className="text-white/80 text-sm mb-4">
                准备好体验无感自动报税了吗？
              </p>
              <button 
                onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary text-sm py-3 px-6"
              >
                立即开始
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Diagram */}
        <div 
          className={`max-w-5xl mx-auto mt-20 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="text-center mb-10">
            <h3 className="text-xl font-semibold text-white">简单三步，完成合规</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: '连接钱包', desc: '安全授权您的链上钱包' },
              { step: '02', title: '自动计算', desc: 'AI 实时分析并计算税额' },
              { step: '03', title: '一键支付', desc: '确认后自动完成税务申报' },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="glass-card rounded-xl p-6 text-center group hover:border-[#3898EC]/50 transition-all">
                  <div className="text-4xl font-bold text-[#3898EC]/30 mb-4 group-hover:text-[#3898EC]/50 transition-colors">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-white/50 text-sm">{item.desc}</p>
                </div>
                
                {/* Arrow */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 border-t-2 border-r-2 border-[#3898EC]/30 rotate-45" />
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
