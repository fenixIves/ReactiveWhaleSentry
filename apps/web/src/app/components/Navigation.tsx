"use client";
import { useState, useEffect } from 'react';
import { Menu, X, Waves } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Technology', href: '#technology' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: '#Images' },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'py-3 px-4 md:px-8'
            : 'py-6 px-4 md:px-8'
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 ${
            isScrolled
              ? 'max-w-5xl glass rounded-full px-6 py-3'
              : 'max-w-7xl'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a 
              href="#" 
              className="flex items-center gap-2 group"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0066CC] to-[#00D4FF] flex items-center justify-center group-hover:glow-cyan transition-all">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                Whale<span className="text-[#00D4FF]">Sentry</span>
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="text-sm font-medium text-white/80 transition-all hover:text-[#00D4FF] relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00D4FF] transition-all group-hover:w-full" />
                </button>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              <button 
                onClick={() => scrollToSection('#contact')}
                className="btn-primary text-sm py-2.5 px-6"
              >
                Start Monitoring
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          className={`absolute top-20 left-4 right-4 glass-card rounded-2xl p-6 transition-all duration-300 ${
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-left text-white/80 hover:text-[#00D4FF] py-3 px-4 rounded-lg hover:bg-white/5 transition-all"
              >
                {link.label}
              </button>
            ))}
            <button 
              onClick={() => scrollToSection('#contact')}
              className="btn-primary text-center mt-4"
            >
              Start Monitoring
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
