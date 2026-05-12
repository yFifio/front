import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Card3DProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
  onClick?: () => void;
}

export const Card3D: React.FC<Card3DProps> = ({ title, children, delay = 0, onClick }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = (e.clientY - rect.top - centerY) / 10;
    const y = -(e.clientX - rect.left - centerX) / 10;

    setRotation({ x, y });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovering(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovering(true)}
      onClick={onClick}
      className="cursor-pointer"
      style={{
        perspective: '1000px',
      }}
    >
      <motion.div
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          boxShadow: isHovering
            ? '0 0 40px hsl(280 100% 70%), 0 0 60px hsl(160 100% 65%)'
            : '0 0 20px hsl(280 100% 70%)',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className="relative w-full h-full p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 rounded-lg backdrop-blur-sm"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <motion.h3
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
          className="text-xl font-bold text-cyan-400 mb-3 psychedelic-text"
        >
          {title}
        </motion.h3>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="text-cyan-100"
        >
          {children}
        </motion.div>

        {isHovering && (
          <motion.div
            layoutId="gradient-border"
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 via-cyan-500 to-orange-500 p-px pointer-events-none"
            style={{ opacity: 0.2 }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default Card3D;
