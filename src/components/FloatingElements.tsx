import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  emoji: string;
  duration?: number;
  delay?: number;
  scale?: number;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  emoji,
  duration = 3,
  delay = 0,
  scale = 1,
}) => {
  const randomX = Math.random() * 300 - 150;
  const randomY = Math.random() * 300 - 150;
  const randomRotation = Math.random() * 360;

  return (
    <motion.div
      className="fixed pointer-events-none select-none"
      initial={{
        x: 0,
        y: 0,
        opacity: 0,
        rotate: 0,
        scale: scale * 0.5,
      }}
      animate={{
        x: randomX,
        y: -randomY,
        opacity: [0, 1, 1, 0],
        rotate: randomRotation,
        scale: scale,
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: 'easeOut',
      }}
      style={{
        fontSize: '2rem',
        textShadow: '0 0 10px hsl(280 100% 70%)',
      }}
    >
      {emoji}
    </motion.div>
  );
};

export const FloatingElements: React.FC<{ emojis?: string[] }> = ({
  emojis = ['🌈', '✨', '🎉', '🚀', '💫', '⭐', '🔮', '🎊'],
}) => {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <FloatingElement
          key={i}
          emoji={emojis[i % emojis.length]}
          duration={2 + Math.random() * 2}
          delay={i * 0.2}
          scale={0.8 + Math.random() * 0.4}
        />
      ))}
    </>
  );
};

export default FloatingElements;
