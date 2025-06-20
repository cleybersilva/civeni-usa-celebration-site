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
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface Video {
  id: string;
  title: string;
  youtubeId: string;
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
}

interface CMSContextType {
  content: CMSContent;
  updateSiteTexts: (newTexts: Partial<SiteTexts>) => Promise<void>;
  updateSpeakers: (speakers: Speaker[]) => Promise<void>;
  updateVideos: (videos: Video[]) => Promise<void>;
  updatePartners: (partners: Partner[]) => Promise<void>;
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
      copyrightText: '© 2025 III CIVENI USA. All rights reserved.'
    },
    speakers: [],
    videos: [],
    partners: []
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

  return (
    <CMSContext.Provider value={{
      content,
      updateSiteTexts,
      updateSpeakers,
      updateVideos,
      updatePartners,
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
