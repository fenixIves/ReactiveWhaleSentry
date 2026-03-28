"use client";
import { Waves, Github, Twitter, MessageCircle, Send } from 'lucide-react';

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'API Docs', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Status', href: '#' },
      { label: 'Partners', href: '#' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Cookies', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: MessageCircle, href: '#', label: 'Discord' },
  { icon: Send, href: '#', label: 'Telegram' },
];

export default function Footer() {
  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="relative bg-black border-t border-white/10">
      <div className="section-padding py-16">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2">
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 mb-6 group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0066CC] to-[#00D4FF] flex items-center justify-center group-hover:glow-cyan transition-all">
                  <Waves className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-white">
                  Whale<span className="text-[#00D4FF]">Sentry</span>
                </span>
              </a>
              
              <p className="text-white/50 text-sm mb-6 max-w-xs">
                Intelligent whale transaction monitoring system powered by Reactive Network. 
                Real-time alerts, automated strategies, and risk management for Web3.
              </p>

              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      aria-label={social.label}
                      className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#00D4FF]/20 hover:border-[#00D4FF]/50 border border-transparent transition-all"
                    >
                      <Icon className="w-5 h-5 text-white/60 hover:text-[#00D4FF] transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Link Columns */}
            {Object.values(footerLinks).map((section, index) => (
              <div key={index}>
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-white/50 text-sm hover:text-[#00D4FF] transition-colors relative group"
                      >
                        {link.label}
                        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#00D4FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              &copy; {new Date().getFullYear()} WhaleSentry. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <span className="text-white/40 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                System Operational
              </span>
              <span className="text-white/30 text-sm">
                Powered by Reactive Network
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
