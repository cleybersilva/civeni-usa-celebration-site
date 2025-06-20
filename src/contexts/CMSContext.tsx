
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteTexts {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  aboutTitle: string;
  aboutDescription: string;
  partnersTitle: string;
  partnersDescription: string;
  copyrightText: string;
  siteTitle: string;
  contactEmail: string;
  contactPhone: string;
  footerCopyright: string;
  institutionalLink: string;
  organizedBy: string;
  copyrightEn: string;
  copyrightPt: string;
  copyrightEs: string;
  scheduleTitle: string;
  scheduleDescription: string;
  speakersTitle: string;
  speakersDescription: string;
  registrationTitle: string;
  registrationDescription: string;
  venueTitle: string;
  venueDescription: string;
  videosTitle: string;
  videosDescription: string;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  image: string;
  institution: string;
  bio: string;
  order: number;
}

export interface Video {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  videoType: 'youtube' | 'upload';
  youtubeUrl?: string;
  uploadedVideoUrl?: string;
  thumbnail: string;
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

export interface EventConfig {
  eventDate: string;
  eventLocation: string;
  eventCity: string;
}

export interface OnlineConfig {
  platformName: string;
  platformUrl: string;
  accessInstructions: string;
}

export interface VenueConfig {
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  venueZip: string;
  venueCountry: string;
  venuePhone: string;
  venueEmail: string;
  venueWebsite: string;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  type: 'organizer' | 'academic' | 'sponsor';
  sort_order?: number;
}

export interface CMSContent {
  siteTexts: SiteTexts;
  speakers: Speaker[];
  videos: Video[];
  partners: Partner[];
  bannerSlides: BannerSlide[];
  registrationTiers: RegistrationTier[];
  batchInfo: string;
  eventConfig: EventConfig;
  onlineConfig: OnlineConfig;
  venueConfig: VenueConfig;
}

interface CMSContextType {
  content: CMSContent;
  updateSiteTexts: (newTexts: Partial<SiteTexts>) => Promise<void>;
  updateSpeakers: (speakers: Speaker[]) => Promise<void>;
  updateVideos: (videos: Video[]) => Promise<void>;
  updatePartners: (partners: Partner[]) => Promise<void>;
  updateBannerSlides: (slides: BannerSlide[]) => Promise<void>;
  updateEventConfig: (config: Partial<EventConfig>) => Promise<void>;
  updateOnlineConfig: (config: Partial<OnlineConfig>) => Promise<void>;
  updateVenueConfig: (config: Partial<VenueConfig>) => Promise<void>;
  isLoading: boolean;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider = ({ children }: { children: React.ReactNode }) => {
  const [content, setContent] = useState<CMSContent>({
    siteTexts: {
      heroTitle: 'III CIVENI USA 2025',
      heroSubtitle: 'International Congress of Educational Innovation and New Technologies',
      heroDescription: 'Join us for the most important educational event of the year, featuring renowned international speakers, innovative workshops, and cutting-edge technology showcases.',
      aboutTitle: 'About III CIVENI USA 2025',
      aboutDescription: 'The III International Congress of Educational Innovation and New Technologies is the premier event bringing together educators, researchers, and technology professionals from around the world.',
      partnersTitle: 'Our Partners',
      partnersDescription: 'Join us in shaping the future of education',
      copyrightText: '© 2025 III CIVENI USA. All rights reserved.',
      siteTitle: 'III CIVENI USA 2025',
      contactEmail: 'contact@civeni.com',
      contactPhone: '+1 (407) 555-0123',
      footerCopyright: '© 2025 III CIVENI USA. All rights reserved.',
      institutionalLink: 'https://www.veniuniversity.net',
      organizedBy: 'Organized by VCCU',
      copyrightEn: '© 2025 III CIVENI USA. All rights reserved.',
      copyrightPt: '© 2025 III CIVENI USA. Todos os direitos reservados.',
      copyrightEs: '© 2025 III CIVENI USA. Todos los derechos reservados.',
      scheduleTitle: 'Schedule',
      scheduleDescription: 'Check out the complete schedule for III Civeni USA 2025',
      speakersTitle: 'Featured Speakers',
      speakersDescription: 'Meet our renowned international speakers',
      registrationTitle: 'Registration',
      registrationDescription: 'Secure your spot at the most important educational event of the year',
      venueTitle: 'Venue & Location',
      venueDescription: 'Join us at our state-of-the-art venue in Celebration, Florida',
      videosTitle: 'Videos from II Civeni 2024',
      videosDescription: 'Watch highlights from our previous congress'
    },
    speakers: [],
    videos: [],
    partners: [],
    bannerSlides: [],
    registrationTiers: [],
    batchInfo: 'Early Bird Registration - Save 30%',
    eventConfig: {
      eventDate: '2025-12-08',
      eventLocation: 'Celebration, Florida',
      eventCity: 'Celebration'
    },
    onlineConfig: {
      platformName: 'Zoom',
      platformUrl: 'https://zoom.us/j/123456789',
      accessInstructions: 'Access instructions will be sent via email'
    },
    venueConfig: {
      venueName: 'Celebration Community Center',
      venueAddress: '800 Celebration Ave',
      venueCity: 'Celebration',
      venueState: 'FL',
      venueZip: '34747',
      venueCountry: 'USA',
      venuePhone: '+1 (407) 555-0123',
      venueEmail: 'venue@civeni.com',
      venueWebsite: 'https://www.veniuniversity.net'
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching partners:', error);
      return [];
    }
  };

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const partners = await fetchPartners();
      
      setContent(prev => ({
        ...prev,
        partners
      }));
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const updatePartners = async (partners: Partner[]) => {
    try {
      // First, delete all existing partners
      await supabase.from('partners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Then insert new partners
      if (partners.length > 0) {
        const { error } = await supabase
          .from('partners')
          .insert(partners.map(partner => ({
            name: partner.name,
            logo: partner.logo,
            type: partner.type,
            sort_order: partner.sort_order || 1
          })));

        if (error) throw error;
      }

      // Reload partners from database
      const updatedPartners = await fetchPartners();
      setContent(prev => ({
        ...prev,
        partners: updatedPartners
      }));
    } catch (error) {
      console.error('Error updating partners:', error);
      throw error;
    }
  };

  const updateSiteTexts = async (newTexts: Partial<SiteTexts>) => {
    setContent(prev => ({
      ...prev,
      siteTexts: {
        ...prev.siteTexts,
        ...newTexts
      }
    }));
  };

  const updateSpeakers = async (speakers: Speaker[]) => {
    setContent(prev => ({
      ...prev,
      speakers: speakers
    }));
  };

  const updateVideos = async (videos: Video[]) => {
    setContent(prev => ({
      ...prev,
      videos: videos
    }));
  };

  const updateBannerSlides = async (slides: BannerSlide[]) => {
    setContent(prev => ({
      ...prev,
      bannerSlides: slides
    }));
  };

  const updateEventConfig = async (config: Partial<EventConfig>) => {
    setContent(prev => ({
      ...prev,
      eventConfig: {
        ...prev.eventConfig,
        ...config
      }
    }));
  };

  const updateOnlineConfig = async (config: Partial<OnlineConfig>) => {
    setContent(prev => ({
      ...prev,
      onlineConfig: {
        ...prev.onlineConfig,
        ...config
      }
    }));
  };

  const updateVenueConfig = async (config: Partial<VenueConfig>) => {
    setContent(prev => ({
      ...prev,
      venueConfig: {
        ...prev.venueConfig,
        ...config
      }
    }));
  };

  return (
    <CMSContext.Provider value={{
      content,
      updateSiteTexts,
      updateSpeakers,
      updateVideos,
      updatePartners,
      updateBannerSlides,
      updateEventConfig,
      updateOnlineConfig,
      updateVenueConfig,
      isLoading
    }}>
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (context === undefined) {
    throw new Error("useCMS must be used within a CMSProvider");
  }
  return context;
};
