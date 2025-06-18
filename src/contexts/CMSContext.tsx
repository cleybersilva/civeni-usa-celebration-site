
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  image: string;
}

interface BannerSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

interface RegistrationTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

interface CMSContent {
  speakers: Speaker[];
  bannerSlides: BannerSlide[];
  registrationTiers: RegistrationTier[];
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
      bio: 'Leading expert in multidisciplinary research with over 20 years of experience.',
      image: '/placeholder.svg'
    },
    {
      id: '2',
      name: 'Prof. John Anderson',
      title: 'Department Head',
      company: 'Global Institute',
      bio: 'Renowned scientist and educator in innovative methodologies.',
      image: '/placeholder.svg'
    }
  ],
  bannerSlides: [
    {
      id: '1',
      image: '/placeholder.svg',
      title: 'III International Multidisciplinary Congress',
      subtitle: 'Join us for three days of innovation and discovery',
      buttonText: 'Register Now',
      buttonLink: '#registration'
    }
  ],
  registrationTiers: [
    {
      id: '1',
      name: 'Students and Partners',
      price: '$150',
      description: 'Special rate for our students and institutional partners',
      features: ['Access to all sessions', 'Digital certificate', 'Conference materials', 'Coffee breaks included']
    },
    {
      id: '2',
      name: 'Students from Other Institutions',
      price: '$200',
      description: 'Discounted rate for students from other institutions',
      features: ['Access to all sessions', 'Digital certificate', 'Conference materials', 'Networking opportunities', 'Coffee breaks included'],
      highlighted: true
    },
    {
      id: '3',
      name: 'Other Professionals',
      price: '$300',
      description: 'Standard rate for professionals and researchers',
      features: ['Access to all sessions', 'Digital certificate', 'Conference materials', 'Premium networking access', 'All meals included', 'VIP reception access']
    }
  ]
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
