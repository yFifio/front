import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ParticleProps {
  id: number;
  delay: number;
}

const Particle: React.FC<ParticleProps> = ({ id, delay }) => {
  const randomX = Math.random() * 100 - 50;
  const randomY = Math.random() * 100 - 50;
  const randomRotation = Math.random() * 360;
  const randomDuration = 2 + Math.random() * 1;
  const colors = ['bg-purple-500', 'bg-cyan-400', 'bg-orange-500', 'bg-lime-400', 'bg-pink-500'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.div
      key={id}
      className={`absolute w-2 h-2 ${randomColor} rounded-full pointer-events-none`}
      initial={{
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        rotate: 0,
      }}
      animate={{
        x: randomX,
        y: randomY,
        opacity: 0,
        scale: 0,
        rotate: randomRotation,
      }}
      transition={{
        duration: randomDuration,
        delay: delay,
        ease: 'easeOut',
      }}
      style={{
        boxShadow: `0 0 10px ${randomColor}`,
      }}
    />
  );
};

export const Confetti: React.FC<{ trigger: boolean; position?: { x: number; y: number } }> = ({
  trigger,
  position = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
}) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 30 }, (_, i) => i);
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 9000,
      }}
    >
      {particles.map((id) => (
        <Particle key={id} id={id} delay={Math.random() * 0.2} />
      ))}
    </div>
  );
};

export default Confetti;
