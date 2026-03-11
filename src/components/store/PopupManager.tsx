import { useState, useEffect } from 'react';
import { useActivePopups } from '@/hooks/usePopups';
import { PromoPopup } from './PromoPopup';
import type { Popup } from '@/types/popup';

interface PopupManagerProps {
  type: 'homepage' | 'funnel';
}

export function PopupManager({ type }: PopupManagerProps) {
  const { data: popups } = useActivePopups(type);
  const [currentPopup, setCurrentPopup] = useState<Popup | null>(null);
  const [shownPopups, setShownPopups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!popups || popups.length === 0) return;

    const nextPopup = popups.find(p => !shownPopups.has(p.id));
    if (nextPopup) {
      setCurrentPopup(nextPopup);
    }
  }, [popups, shownPopups]);

  const handleClose = () => {
    if (currentPopup) {
      setShownPopups(prev => new Set([...prev, currentPopup.id]));
      setCurrentPopup(null);
    }
  };

  if (!currentPopup) return null;

  return <PromoPopup popup={currentPopup} onClose={handleClose} />;
}
