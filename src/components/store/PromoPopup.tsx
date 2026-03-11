import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { Popup } from '@/types/popup';

interface PromoPopupProps {
  popup: Popup;
  onClose: () => void;
}

export function PromoPopup({ popup, onClose }: PromoPopupProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const showPopup = useCallback(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const storageKey = `popup_dismissed_${popup.id}`;
    const dismissedAt = localStorage.getItem(storageKey);
    
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = Date.now();
      const hoursSinceDismiss = (now - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        return;
      }
    }

    const timer = setTimeout(showPopup, popup.display_delay_seconds * 1000);

    const handleMouseLeave = (e: MouseEvent) => {
      if (popup.show_on_exit_intent && e.clientY <= 0) {
        showPopup();
      }
    };

    if (popup.show_on_exit_intent) {
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [popup.id, popup.display_delay_seconds, popup.show_on_exit_intent, showPopup]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(`popup_dismissed_${popup.id}`, new Date().toISOString());
    onClose();
  };

  const handleButtonClick = () => {
    handleClose();
    if (popup.button_link) {
      if (popup.button_link.startsWith('http')) {
        window.open(popup.button_link, '_blank');
      } else {
        navigate(popup.button_link);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-1.5 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>

        {popup.image_url && (
          <div className="relative aspect-video bg-muted">
            <img
              src={popup.image_url}
              alt={popup.title}
              className="w-full h-full object-cover"
            />
            {popup.discount_percent && popup.discount_percent > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute top-4 left-4 text-lg px-3 py-1"
              >
                {popup.discount_percent}% OFF
              </Badge>
            )}
          </div>
        )}

        <div className="p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-display flex items-center gap-2">
              {popup.title}
              {!popup.image_url && popup.discount_percent && popup.discount_percent > 0 && (
                <Badge variant="destructive">{popup.discount_percent}% OFF</Badge>
              )}
            </DialogTitle>
            {popup.content && (
              <DialogDescription className="text-base mt-2">
                {popup.content}
              </DialogDescription>
            )}
          </DialogHeader>

          {popup.button_text && (
            <Button 
              className="w-full mt-6" 
              size="lg"
              onClick={handleButtonClick}
            >
              {popup.button_text}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
