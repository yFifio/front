import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const getLuminance = (r: number, g: number, b: number) => {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const getColorUnderCursor = (x: number, y: number): { r: number; g: number; b: number } => {
  try {
    let element = document.elementFromPoint(x, y) as HTMLElement;
    if (!element) return { r: 100, g: 100, b: 100 };

    let style = window.getComputedStyle(element);
    let colorString = style.backgroundColor;

    let attempts = 0;
    while ((colorString === 'transparent' || !colorString || colorString === 'rgba(0, 0, 0, 0)') && element.parentElement && attempts < 3) {
      element = element.parentElement;
      style = window.getComputedStyle(element);
      colorString = style.backgroundColor;
      attempts++;
    }

    if (!colorString || colorString === 'transparent' || colorString === 'rgba(0, 0, 0, 0)') {
      colorString = style.color || 'rgb(100, 100, 100)';
    }

    const rgbMatch = colorString.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      return {
        r: parseInt(rgbMatch[0], 10),
        g: parseInt(rgbMatch[1], 10),
        b: parseInt(rgbMatch[2], 10),
      };
    }

    return { r: 100, g: 100, b: 100 };
  } catch {
    return { r: 100, g: 100, b: 100 };
  }
};

const getColorDifference = (
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
) => {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
};

export const StarCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [cursorColor, setCursorColor] = useState({ hex: '#8B00FF', label: 'purple' });
  const [rotation, setRotation] = useState(0);

  let sampleTimeout: NodeJS.Timeout;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX;
      const y = event.clientY;

      setMousePosition({ x, y });
      
      setRotation((prev) => (prev + 5) % 360);

      if (sampleTimeout) clearTimeout(sampleTimeout);

      sampleTimeout = setTimeout(() => {
        const bgColor = getColorUnderCursor(x, y);

        const purpleDiff = getColorDifference(
          bgColor.r,
          bgColor.g,
          bgColor.b,
          138,
          0,
          255
        );

        const cyanDiff = getColorDifference(
          bgColor.r,
          bgColor.g,
          bgColor.b,
          100,
          229,
          255
        );

        const orangeDiff = getColorDifference(
          bgColor.r,
          bgColor.g,
          bgColor.b,
          255,
          127,
          0
        );

        if (purpleDiff < 80) {
          if (cyanDiff > orangeDiff && cyanDiff > 60) {
            setCursorColor({ hex: '#64E5FF', label: 'cyan' });
          } else if (orangeDiff > 60) {
            setCursorColor({ hex: '#FF7F00', label: 'orange' });
          } else {
            setCursorColor({ hex: '#FF1493', label: 'pink' });
          }
        } else {
          setCursorColor({ hex: '#8B00FF', label: 'purple' });
        }
      }, 50);
    };

    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        setIsHoveringButton(true);
      }
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        setIsHoveringButton(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (sampleTimeout) clearTimeout(sampleTimeout);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const shadowGlow = `0 0 25px ${cursorColor.hex}, 0 0 50px ${cursorColor.hex}88`;

  return (
    <>
      <motion.div
        className="fixed pointer-events-none mix-blend-screen"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
          rotate: rotation,
          scale: isHoveringButton ? 1.3 : 1,
        }}
        transition={{
          type: 'tween',
          ease: 'linear',
          duration: 0,
          scale: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        style={{
          zIndex: 9999,
          width: '24px',
          height: '24px',
          filter: `drop-shadow(${shadowGlow})`,
        }}
      >
        <svg viewBox="0 0 24 24" fill={cursorColor.hex} style={{ width: '100%', height: '100%' }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </motion.div>

      <motion.div
        className="fixed rounded-full pointer-events-none"
        animate={{
          x: mousePosition.x - 24,
          y: mousePosition.y - 24,
          rotate: -rotation,
          scale: isHoveringButton ? 1.4 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        style={{
          zIndex: 9998,
          width: '48px',
          height: '48px',
          border: `2px solid ${cursorColor.hex}`,
          boxShadow: `0 0 20px ${cursorColor.hex}88, inset 0 0 10px ${cursorColor.hex}44`,
        }}
      />

      <motion.div
        className="fixed rounded-full pointer-events-none"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          zIndex: 9997,
          width: '16px',
          height: '16px',
          border: `1px solid ${cursorColor.hex}`,
          boxShadow: `0 0 10px ${cursorColor.hex}`,
          opacity: 0.6,
        }}
      />

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9996 }}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            animate={{
              x: mousePosition.x,
              y: mousePosition.y,
              opacity: [0.8, 0],
              scale: [1, 0.3],
            }}
            transition={{
              duration: 1.2 + i * 0.15,
              ease: 'easeOut',
            }}
            style={{
              width: '8px',
              height: '8px',
              filter: `drop-shadow(0 0 8px ${cursorColor.hex})`,
            }}
          >
            <svg viewBox="0 0 24 24" fill={cursorColor.hex} style={{ width: '100%', height: '100%' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.div>
        ))}
      </div>
    </>
  );
};

export default StarCursor;
