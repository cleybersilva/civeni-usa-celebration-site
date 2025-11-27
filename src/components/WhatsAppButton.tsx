import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = '15613586510'; // +1 (561) 358-6510 formatted for WhatsApp
  const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-6 z-50 p-3 md:p-4 rounded-full bg-[#25D366] text-white shadow-2xl hover:shadow-[#25D366]/40 hover:scale-110 transition-all duration-300"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle size={24} className="md:w-6 md:h-6" fill="white" />
    </a>
  );
};

export default WhatsAppButton;
