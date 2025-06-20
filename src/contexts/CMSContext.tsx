
import React, { createContext, useState, useContext, useEffect } from 'react';
import { CMSContent, CMSContextType, SiteTexts, Speaker, Video, Partner, BannerSlide, EventConfig, OnlineConfig, VenueConfig } from './types';
import { defaultContent } from './defaultContent';
import { fetchPartners, updatePartnersInDatabase } from './partnerService';

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider = ({ children }: { children: React.ReactNode }) => {
  const [content, setContent] = useState<CMSContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(false);

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
      await updatePartnersInDatabase(partners);
      
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

// Re-export types for backward compatibility
export type {
  SiteTexts,
  Speaker,
  Video,
  BannerSlide,
  RegistrationTier,
  EventConfig,
  OnlineConfig,
  VenueConfig,
  Partner,
  CMSContent
};
