import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion';

const glowNodes = [
  {
    className: '-top-32 -right-24 h-96 w-96 bg-[radial-gradient(circle,rgba(217,70,239,0.48),rgba(88,28,135,0.16),transparent_70%)]',
    duration: 16,
  },
  {
    className: 'top-[18%] -left-28 h-[28rem] w-[28rem] bg-[radial-gradient(circle,rgba(34,211,238,0.38),rgba(8,47,73,0.18),transparent_72%)]',
    duration: 19,
  },
  {
    className: '-bottom-24 right-[18%] h-[24rem] w-[24rem] bg-[radial-gradient(circle,rgba(251,146,60,0.38),rgba(127,29,29,0.12),transparent_72%)]',
    duration: 15,
  },
  {
    className: 'bottom-[12%] left-[24%] h-80 w-80 bg-[radial-gradient(circle,rgba(163,230,53,0.28),rgba(20,83,45,0.08),transparent_72%)]',
    duration: 18,
  },
];

export const PsychedelicOverlay = () => {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const hueShift = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 24]);
  const reverseRotate = useTransform(scrollYProgress, [0, 1], [0, -33.6]);
  const filter = useMotionTemplate`hue-rotate(${hueShift}deg)`;

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      setPointer({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, []);

  const sparks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: index,
        top: `${8 + ((index * 6.5) % 82)}%`,
        left: `${4 + ((index * 11) % 90)}%`,
        size: 6 + (index % 4) * 4,
        delay: index * 0.18,
      })),
    []
  );

  return (
    <motion.div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ filter }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(8,47,73,0.04),rgba(10,10,25,0.18))]" />

      {glowNodes.map((node, index) => (
        <motion.div
          key={node.className}
          className={`absolute rounded-full blur-3xl ${node.className}`}
          animate={{
            x: [0, index % 2 === 0 ? 36 : -28, 10, 0],
            y: [0, index % 2 === 0 ? -24 : 32, -8, 0],
            scale: [1, 1.14, 0.94, 1],
            opacity: [0.34, 0.52, 0.3, 0.34],
          }}
          transition={{ duration: node.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        className="absolute left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/10"
        style={{ rotate }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10"
        style={{ rotate: reverseRotate }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)] opacity-20 animate-spectrum-pan" />
      <div className="absolute inset-0 opacity-[0.08] mix-blend-screen bg-spectrum-grid" />

      {sparks.map((spark) => (
        <motion.span
          key={spark.id}
          className="absolute rounded-full bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.65)]"
          style={{ top: spark.top, left: spark.left, width: spark.size, height: spark.size }}
          animate={{ opacity: [0.15, 0.95, 0.25], scale: [0.6, 1.25, 0.75], y: [0, -14, 6, 0] }}
          transition={{ duration: 3.8 + (spark.id % 5), repeat: Infinity, delay: spark.delay, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        className="absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.34),rgba(34,211,238,0.15),rgba(217,70,239,0.04),transparent_72%)] blur-2xl mix-blend-screen"
        animate={{ opacity: [0.4, 0.8, 0.45], scale: [0.9, 1.18, 0.96] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ left: pointer.x, top: pointer.y }}
      />

      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(100, 200, 255, 0.05) 2px, rgba(100, 200, 255, 0.05) 4px)',
          animation: 'grain 12s steps(10) infinite',
        }}
      />
    </motion.div>
  );
};

export default PsychedelicOverlay;
