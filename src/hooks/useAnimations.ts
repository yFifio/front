import { useCallback } from 'react';

export const useConfetti = () => {
  const triggerConfetti = useCallback(() => {
    const event = new CustomEvent('trigger-confetti', {
      detail: {
        position: {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        },
      },
    });
    window.dispatchEvent(event);
  }, []);

  return { triggerConfetti };
};

export const useBounce = () => {
  const bounce = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.2)' },
      { transform: 'scale(1)' },
    ], {
      duration: 300,
      easing: 'ease-out',
    });
  }, []);

  return { bounce };
};

export const useShake = () => {
  const shake = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' },
    ], {
      duration: 400,
      easing: 'ease-in-out',
    });
  }, []);

  return { shake };
};

export const useFlash = () => {
  const flash = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    element.animate([
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.5)' },
      { filter: 'brightness(1)' },
    ], {
      duration: 300,
      easing: 'ease-out',
    });
  }, []);

  return { flash };
};

export default { useConfetti, useBounce, useShake, useFlash };
