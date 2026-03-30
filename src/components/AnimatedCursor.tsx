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

export const AnimatedCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [cursorColor, setCursorColor] = useState({ hex: '#8B00FF', label: 'purple' });

  const purpleRGB = { r: 139, g: 0, b: 255 };
  const cyanRGB = { r: 100, g: 229, b: 255 };
  const orangeRGB = { r: 255, g: 127, b: 0 };

  useEffect(() => {
    let sampleTimeout: NodeJS.Timeout;

    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX;
      const y = event.clientY;

      setMousePosition({
        x,
        y,
      });

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

  const shadowGlow = `0 0 20px ${cursorColor.hex}`;
  const ringGlow = `0 0 15px ${cursorColor.hex}88`;

  return (
    <>
      <motion.div
        className="fixed w-3 h-3 rounded-full pointer-events-none mix-blend-screen"
        animate={{
          x: mousePosition.x - 6,
          y: mousePosition.y - 6,
          backgroundColor: cursorColor.hex,
        }}
        transition={{
          type: 'tween',
          ease: 'linear',
          duration: 0,
          backgroundColor: { duration: 0.3 },
        }}
        style={{
          zIndex: 9999,
          boxShadow: shadowGlow,
        }}
      />

      <motion.div
        className="fixed w-8 h-8 rounded-full pointer-events-none"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHoveringButton ? 1.5 : 1,
          borderColor: cursorColor.hex,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28,
          borderColor: { duration: 0.3 },
        }}
        style={{
          zIndex: 9998,
          boxShadow: ringGlow,
          borderWidth: '2px',
        }}
      />

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9997 }}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            animate={{
              x: mousePosition.x,
              y: mousePosition.y,
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 1 + i * 0.2,
              ease: 'easeOut',
            }}
            style={{
              backgroundColor: cursorColor.hex,
              boxShadow: `0 0 10px ${cursorColor.hex}`,
            }}
          />
        ))}
      </div>
    </>
  );
};

export default AnimatedCursor;
