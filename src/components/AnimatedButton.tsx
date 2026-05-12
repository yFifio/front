import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
    secondary: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
    accent: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-6 py-2 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-semibold overflow-hidden relative ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
        animate={{
          x: isHovering ? 100 : -100,
        }}
        transition={{
          duration: 0.5,
        }}
        style={{
          opacity: 0.3,
          width: '100%',
        }}
      />

      {isHovering &&
        [...Array(5)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              opacity: 1,
            }}
            animate={{
              x: Math.random() * 200 - 100,
              y: Math.random() * 200 - 100,
              opacity: 0,
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}

      <motion.span
        className="relative z-10 inline-block"
        animate={{
          textShadow: isHovering ? '0 0 10px rgba(255, 255, 255, 0.8)' : 'none',
        }}
      >
        {children}
      </motion.span>

      {isHovering && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
          }}
        />
      )}
    </motion.button>
  );
};

export default AnimatedButton;
