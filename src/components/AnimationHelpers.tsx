import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerChildren?: number;
  delayChildren?: number;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerChildren = 0.1,
  delayChildren = 0,
  className = '',
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
};

interface GlitchTextProps {
  text: string;
  className?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '' }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        textShadow: [
          '0 0 0px hsl(280 100% 70%)',
          '-2px 0px hsl(160 100% 65%), 2px 0px hsl(15 100% 60%)',
          '0 0 0px hsl(280 100% 70%)',
        ],
      }}
      transition={{
        duration: 0.3,
        repeat: Infinity,
        repeatDelay: 3,
      }}
    >
      {text}
    </motion.div>
  );
};

interface NumberCounterProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
  from = 0,
  to,
  duration = 2,
  className = '',
}) => {
  const [count, setCount] = useState(from);

  React.useEffect(() => {
    let animationFrame: number;
    let start: number;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(from + (to - from) * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [from, to, duration]);

  return <span className={className}>{count}</span>;
};

export default { PageTransition, StaggerContainer, GlitchText, NumberCounter };
