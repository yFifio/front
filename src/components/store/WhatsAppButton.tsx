import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export function WhatsAppButton({ message = 'Olá! Preciso de ajuda.' }: WhatsAppButtonProps) {
  const cleanNumber = '5544999043230';
  
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BA5C] text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
      size="icon"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="w-7 h-7" fill="currentColor" />
    </Button>
  );
}
