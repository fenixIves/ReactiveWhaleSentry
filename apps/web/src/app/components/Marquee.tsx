import { useEffect, useRef } from 'react';

const marqueeItems = [
  'Real-Time Whale Monitoring',
  'AI-Powered Detection',
  'Millisecond Response',
  'Cross-Chain Execution',
  'Automated Strategies',
  'Risk Management',
  '7×24 Operation',
  'Reactive Network',
];

export default function Marquee() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Duplicate content for seamless loop
    const content = container.querySelector('.marquee-content');
    if (content && container.children.length === 1) {
      const clone = content.cloneNode(true);
      container.appendChild(clone);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden bg-black/50 backdrop-blur-sm border-y border-[#00D4FF]/20 py-4">
      <div 
        ref={containerRef}
        className="flex animate-marquee"
        style={{ width: 'max-content' }}
      >
        <div className="marquee-content flex items-center gap-8 px-4">
          {marqueeItems.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 whitespace-nowrap group cursor-default"
            >
              <span className="text-[#00D4FF] text-xs">◆</span>
              <span className="text-white/90 font-medium text-sm md:text-base group-hover:text-[#00D4FF] transition-colors">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
