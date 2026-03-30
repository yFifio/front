import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollAnimationProps {
  children: React.ReactNode;
  offset?: 'start' | 'center' | 'end';
  className?: string;
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  offset = 'center',
  className = '',
}) => {
  const { scrollYProgress } = useScroll();

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);
  const rotateZ = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <motion.div
      style={{
        opacity,
        scale,
        rotateZ,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ParallaxScroll: React.FC<ScrollAnimationProps> = ({
  children,
  className = '',
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 200]);

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

export const FadeInOnScroll: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true, amount: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollAnimation;
