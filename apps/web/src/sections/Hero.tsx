"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import Marquee from '../app/components/Marquee';

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Content */}
      <div className="content-layer relative z-10 pt-24 pb-12">
        {/* Main Hero Content */}
        <div className="section-padding flex flex-col items-center text-center">
          {/* Badge */}
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#00D4FF]/30 mb-8 transition-all duration-700 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-sm text-white/80">Powered by Reactive Network</span>
          </div>

          {/* Main Title */}
          <h1
            className={`text-responsive-hero font-bold text-8xl mb-6 transition-all duration-1000 delay-200 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="text-white">Whale </span>
            <span className="text-[#00D4FF] text-glow">Sentry</span>
          </h1>

          {/* Subtitle */}
          <p 
            className={`text-xl md:text-2xl text-white/70 max-w-3xl mb-4 transition-all duration-1000 delay-400 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Intelligent Whale Transaction Monitoring System
          </p>

          {/* Description */}
          <p 
            className={`text-base md:text-lg text-white/50 max-w-2xl mb-10 transition-all duration-1000 delay-500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Decentralized Risk Alert Platform for Web3
            <br className="hidden md:block" />
            Detect, Analyze, and Respond to Whale Movements in Real-Time
          </p>

          {/* CTA Buttons */}
          <div 
            className={`flex flex-col sm:flex-row gap-4 mb-16 transition-all duration-1000 delay-600 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <button 
              onClick={() => router.push('/demopage')}
              className="btn-primary flex items-center justify-center gap-2 group"
            >
              Start Monitoring
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => scrollToSection('#features')}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              View Demo
            </button>
          </div>
        </div>

        {/* Marquee */}
        <div 
          className={`transition-all duration-1000 delay-700 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Marquee />
        </div>

        {/* Stats */}
        <div 
          className={`section-padding mt-16 transition-all duration-1000 delay-800 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '< 100ms', label: 'Response Time' },
              { value: '50+', label: 'Chains Supported' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Monitoring' },
            ].map((stat, index) => (
              <div 
                key={index}
                className="text-center group"
              >
                <div className="text-3xl md:text-4xl font-bold text-[#00D4FF] mb-2 group-hover:text-glow transition-all">
                  {stat.value}
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
    </section>
  );
}
