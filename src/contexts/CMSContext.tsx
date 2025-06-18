import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  institution?: string;
  bio: string;
  image: string;
  order?: number;
}

interface BannerSlide {
  id: string;
  image: string;
  bgImage?: string;
  title: string;
  subtitle: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  order?: number;
}

interface RegistrationTier {
  id: string;
  name: string;
  title?: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  recommended?: boolean;
  order?: number;
}

interface CMSContent {
  speakers: Speaker[];
  bannerSlides: BannerSlide[];
  registrationTiers: RegistrationTier[];
  batchInfo?: string;
}

interface CMSContextType {
  content: CMSContent;
  updateSpeakers: (speakers: Speaker[]) => void;
  updateBannerSlides: (slides: BannerSlide[]) => void;
  updateRegistrationTiers: (tiers: RegistrationTier[]) => void;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

const initialContent: CMSContent = {
  speakers: [
    {
      id: '1',
      name: 'Dr. Maria Silva',
      title: 'Director of Research',
      company: 'International University',
      institution: 'International University',
      bio: 'Leading expert in multidisciplinary research with over 20 years of experience.',
      image: '/placeholder.svg',
      order: 1
    },
    {
      id: '2',
      name: 'Prof. John Anderson',
      title: 'Department Head',
      company: 'Global Institute',
      institution: 'Global Institute',
      bio: 'Renowned scientist and educator in innovative methodologies.',
      image: '/placeholder.svg',
      order: 2
    }
  ],
  bannerSlides: [
    {
      id: '1',
      image: '/placeholder.svg',
      bgImage: '/placeholder.svg',
      title: 'III International Multidisciplinary Congress',
      subtitle: 'Join us for three days of innovation and discovery',
      description: 'December 8-10, 2025 • Celebration, Florida',
      buttonText: 'Register Now',
      buttonLink: '#registration',
      order: 1
    }
  ],
  registrationTiers: [
    {
      id: '1',
      name: 'Students and Partners',
      title: 'Students and Partners',
      price: '$150',
      description: 'Special rate for our students and institutional partners',
      features: ['Access to all sessions', 'Digital certificate', 'Conference materials', 'Coffee breaks included'],
      order: 1
    },
    {
      id: '2',
      name: 'Students from Other Institutions',
      title: 'Students from Other Institutions',
      price: '$200',
      description: 'Discounted rate for students from other institutions',
      features: ['Access to all sessions', 'Digital certificate', 'Conference materials', 'Networking opportunities', 'Coffee breaks included'],
      highlighted: true,
      recommended: true,
      order: 2
    },
    {
      id: '3',
      name: 'Other Professionals',
      title: 'Other Professionals',
      price: '$300',
      description: 'Standard rate for professionals and researchers',
      features: ['Access to all sessions', 'Digital certificate', 'Conference materials', 'Premium networking access', 'All meals included', 'VIP reception access'],
      order: 3
    }
  ],
  batchInfo: 'FIRST BATCH: November 1 - December 15, 2024'
};

export const CMSProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<CMSContent>(initialContent);

  const updateSpeakers = (speakers: Speaker[]) => {
    setContent(prev => ({ ...prev, speakers }));
  };

  const updateBannerSlides = (bannerSlides: BannerSlide[]) => {
    setContent(prev => ({ ...prev, bannerSlides }));
  };

  const updateRegistrationTiers = (registrationTiers: RegistrationTier[]) => {
    setContent(prev => ({ ...prev, registrationTiers }));
  };

  return (
    <CMSContext.Provider value={{
      content,
      updateSpeakers,
      updateBannerSlides,
      updateRegistrationTiers
    }}>
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};
