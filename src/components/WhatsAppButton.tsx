import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = '14073388661'; // +1 (407) 338-8661 formatted for WhatsApp
  const message = encodeURIComponent("Hello! 👋😊\nI just visited the III CIVENI 2025 website and I'm very interested in the event. I have a few questions regarding registration, the schedule, and the online/in-person participation.\nCould you please help me with more information? 🙏✨");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

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
