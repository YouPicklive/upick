import { useState, useEffect, useRef } from 'react';

interface FortuneWheelProps {
  items: string[];
  onSpinComplete: (winner: string) => void;
  spinning: boolean;
}

export function FortuneWheel({ items, onSpinComplete, spinning }: FortuneWheelProps) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const hasSpunRef = useRef(false);

  useEffect(() => {
    if (spinning && items.length > 0 && !hasSpunRef.current) {
      hasSpunRef.current = true;

      const winningIndex = Math.floor(Math.random() * items.length);
      const segmentAngle = 360 / items.length;
      const spins = 5 + Math.random() * 3;
      const targetRotation = rotationRef.current + (spins * 360) + (360 - (winningIndex * segmentAngle) - segmentAngle / 2);

      setRotation(targetRotation);
      rotationRef.current = targetRotation;

      const timer = setTimeout(() => {
        onSpinComplete(items[winningIndex]);
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [spinning, items, onSpinComplete]);

  // Muted, sophisticated palette
  const colors = [
    'hsl(18, 65%, 56%)',   // burnt orange
    'hsl(32, 55%, 52%)',   // warm amber
    'hsl(40, 45%, 50%)',   // muted gold
    'hsl(152, 40%, 44%)',  // sage
    'hsl(200, 45%, 48%)',  // slate blue
    'hsl(260, 35%, 55%)',  // muted purple
    'hsl(340, 40%, 52%)',  // dusty rose
    'hsl(25, 55%, 48%)',   // terra cotta
  ];

  const segmentAngle = 360 / items.length;

  return (
    <div className="relative w-64 h-64 md:w-72 md:h-72 mx-auto">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 flex flex-col items-center">
        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] border-l-transparent border-r-transparent border-t-primary" />
      </div>

      {/* Outer glow when spinning */}
      {spinning && (
        <div className="absolute inset-[-8px] rounded-full bg-primary/10 animate-pulse-glow" />
      )}

      {/* Wheel */}
      <div
        className="w-full h-full rounded-full shadow-card-hover overflow-hidden border border-border relative"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 4.5s cubic-bezier(0.15, 0.7, 0.1, 1)' : 'none',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {items.map((item, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);

            const x1 = 50 + 50 * Math.cos(startRad);
            const y1 = 50 + 50 * Math.sin(startRad);
            const x2 = 50 + 50 * Math.cos(endRad);
            const y2 = 50 + 50 * Math.sin(endRad);

            const largeArc = segmentAngle > 180 ? 1 : 0;
            const pathD = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;

            const midAngle = (startAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
            const textX = 50 + 32 * Math.cos(midAngle);
            const textY = 50 + 32 * Math.sin(midAngle);
            const textRotation = startAngle + segmentAngle / 2;

            return (
              <g key={index}>
                <path
                  d={pathD}
                  fill={colors[index % colors.length]}
                  stroke="hsl(0 0% 100% / 0.15)"
                  strokeWidth="0.3"
                />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize={item.length <= 2 ? "10" : "4"}
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                >
                  {item}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card shadow-card border border-border flex items-center justify-center z-10">
        <span className="text-lg">🥢</span>
      </div>

      {/* Soft shimmer when spinning */}
      {spinning && (
        <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{ animation: 'shimmer 1s ease-in-out infinite' }}
          />
        </div>
      )}
    </div>
  );
}