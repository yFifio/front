import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
  cursor?: boolean;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 50,
  delay = 0,
  onComplete,
  className = '',
  cursor = true,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    let timeout: NodeJS.Timeout;

    const type = () => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
        timeout = setTimeout(type, speed);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    const delayTimeout = setTimeout(type, delay);

    return () => {
      clearTimeout(delayTimeout);
      clearTimeout(timeout);
    };
  }, [text, speed, delay, onComplete]);

  return (
    <div className={className}>
      <span>{displayedText}</span>
      {cursor && !isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
          }}
          className="text-cyan-400 animate-pulse"
        >
          |
        </motion.span>
      )}
    </div>
  );
};

export default Typewriter;
