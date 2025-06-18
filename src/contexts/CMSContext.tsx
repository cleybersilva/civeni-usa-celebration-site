
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Speaker {
  id: string;
  name: string;
  title: string;
  institution: string;
  image: string;
  bio: string;
  order: number;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  bgImage: string;
  buttonText: string;
  buttonLink: string;
  order: number;
}

export interface RegistrationTier {
  id: string;
  title: string;
  price: string;
  features: string[];
  recommended: boolean;
  order: number;
}

export interface CMSContent {
  speakers: Speaker[];
  bannerSlides: BannerSlide[];
  registrationTiers: RegistrationTier[];
  batchInfo: string;
}

interface CMSContextType {
  content: CMSContent;
  loading: boolean;
  updateSpeakers: (speakers: Speaker[]) => Promise<void>;
  updateBannerSlides: (slides: BannerSlide[]) => Promise<void>;
  updateRegistrationTiers: (tiers: RegistrationTier[]) => Promise<void>;
  updateBatchInfo: (info: string) => Promise<void>;
}

const defaultContent: CMSContent = {
  speakers: [
    {
      id: '1',
      name: "Dr. Maria Rodriguez",
      title: "Professor of Biomedical Engineering",
      institution: "Harvard Medical School",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b5bb?auto=format&fit=crop&w=400&q=80",
      bio: "Leading researcher in regenerative medicine and tissue engineering with over 20 years of experience.",
      order: 1
    },
    {
      id: '2',
      name: "Prof. James Chen",
      title: "Director of AI Research",
      institution: "Stanford University",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
      bio: "Pioneer in artificial intelligence and machine learning applications in healthcare.",
      order: 2
    },
    {
      id: '3',
      name: "Dr. Elena Kowalski",
      title: "Environmental Scientist",
      institution: "MIT",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
      bio: "Expert in climate change research and sustainable technology development.",
      order: 3
    },
    {
      id: '4',
      name: "Dr. Ahmed Hassan",
      title: "Professor of Psychology",
      institution: "Oxford University",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      bio: "Renowned researcher in cognitive psychology and behavioral sciences.",
      order: 4
    }
  ],
  bannerSlides: [
    {
      id: '1',
      title: "III International Multidisciplinary Congress",
      subtitle: "Join us for three days of innovation and discovery",
      description: "December 8-10, 2025 • Celebration, Florida",
      bgImage: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=2000&q=80",
      buttonText: "Register Here",
      buttonLink: "#registration",
      order: 1
    },
    {
      id: '2',
      title: "World-Class Speakers",
      subtitle: "Learn from international experts in various fields",
      description: "Keynote presentations and panel discussions",
      bgImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2000&q=80",
      buttonText: "Register Here",
      buttonLink: "#registration",
      order: 2
    },
    {
      id: '3',
      title: "Submit Your Research",
      subtitle: "Share your work with the global community",
      description: "Oral presentations and poster sessions available",
      bgImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=2000&q=80",
      buttonText: "Register Here",
      buttonLink: "#registration",
      order: 3
    }
  ],
  registrationTiers: [
    {
      id: '1',
      title: "Our Students and Partners",
      price: "$150",
      features: [
        "Access to all sessions",
        "Digital certificate",
        "Conference materials",
        "Networking opportunities",
        "Coffee breaks included"
      ],
      recommended: false,
      order: 1
    },
    {
      id: '2',
      title: "Students from Other Institutions",
      price: "$200",
      features: [
        "Access to all sessions",
        "Digital certificate",
        "Conference materials",
        "Networking opportunities",
        "Coffee breaks included",
        "Student discount applied"
      ],
      recommended: true,
      order: 2
    },
    {
      id: '3',
      title: "Other Professionals",
      price: "$300",
      features: [
        "Access to all sessions",
        "Digital certificate",
        "Conference materials",
        "Premium networking access",
        "All meals included",
        "VIP reception access"
      ],
      recommended: false,
      order: 3
    }
  ],
  batchInfo: "FIRST BATCH: November 1 - December 15, 2024"
};

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<CMSContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      // Para agora, usar conteúdo padrão
      // Em produção, isso carregaria do Supabase
      setContent(defaultContent);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSpeakers = async (speakers: Speaker[]) => {
    try {
      setContent(prev => ({ ...prev, speakers }));
      // Aqui salvaria no Supabase
    } catch (error) {
      console.error('Error updating speakers:', error);
    }
  };

  const updateBannerSlides = async (bannerSlides: BannerSlide[]) => {
    try {
      setContent(prev => ({ ...prev, bannerSlides }));
      // Aqui salvaria no Supabase
    } catch (error) {
      console.error('Error updating banner slides:', error);
    }
  };

  const updateRegistrationTiers = async (registrationTiers: RegistrationTier[]) => {
    try {
      setContent(prev => ({ ...prev, registrationTiers }));
      // Aqui salvaria no Supabase
    } catch (error) {
      console.error('Error updating registration tiers:', error);
    }
  };

  const updateBatchInfo = async (batchInfo: string) => {
    try {
      setContent(prev => ({ ...prev, batchInfo }));
      // Aqui salvaria no Supabase
    } catch (error) {
      console.error('Error updating batch info:', error);
    }
  };

  return (
    <CMSContext.Provider
      value={{
        content,
        loading,
        updateSpeakers,
        updateBannerSlides,
        updateRegistrationTiers,
        updateBatchInfo,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (context === undefined) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};
