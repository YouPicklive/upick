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
      
      // Calculate winning segment
      const winningIndex = Math.floor(Math.random() * items.length);
      const segmentAngle = 360 / items.length;
      
      // Spin multiple times plus land on winner
      const spins = 5 + Math.random() * 3; // 5-8 full rotations
      const targetRotation = rotationRef.current + (spins * 360) + (360 - (winningIndex * segmentAngle) - segmentAngle / 2);
      
      setRotation(targetRotation);
      rotationRef.current = targetRotation;

      // Announce winner after spin
      const timer = setTimeout(() => {
        onSpinComplete(items[winningIndex]);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [spinning, items, onSpinComplete]);

  const colors = [
    'hsl(15, 85%, 60%)',   // coral
    'hsl(35, 90%, 55%)',   // orange
    'hsl(45, 95%, 55%)',   // yellow
    'hsl(145, 65%, 42%)',  // green
    'hsl(200, 80%, 50%)',  // blue
    'hsl(280, 70%, 60%)',  // purple
    'hsl(340, 75%, 55%)',  // pink
    'hsl(25, 85%, 50%)',   // burnt orange
  ];

  const segmentAngle = 360 / items.length;

  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Toothpick Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 flex flex-col items-center">
        <div className="w-1 h-8 bg-gradient-to-b from-amber-200 to-amber-600 rounded-full shadow-lg" />
        <div className="w-3 h-3 bg-amber-700 rounded-full -mt-1 shadow-md" />
        <span className="text-2xl -mt-1">🥢</span>
      </div>

      {/* Wheel */}
      <div
        className="w-full h-full rounded-full shadow-card-hover overflow-hidden border-4 border-primary/20 relative"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
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
            
            // Text position
            const midAngle = (startAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
            const textX = 50 + 32 * Math.cos(midAngle);
            const textY = 50 + 32 * Math.sin(midAngle);
            const textRotation = startAngle + segmentAngle / 2;

            return (
              <g key={index}>
                <path
                  d={pathD}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="0.5"
                />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize="4"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {item.length > 12 ? item.substring(0, 10) + '...' : item}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Center decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full gradient-warm shadow-glow flex items-center justify-center z-10">
        <span className="text-2xl">🎯</span>
      </div>

      {/* Glow effect when spinning */}
      {spinning && (
        <div className="absolute inset-0 rounded-full animate-pulse-glow pointer-events-none" />
      )}
    </div>
  );
}
