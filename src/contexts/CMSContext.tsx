
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

export interface EventConfig {
  eventDate: string;
  eventLocation: string;
  eventCity: string;
  startTime?: string;
  endTime?: string;
}

export interface VenueConfig {
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  venueZip: string;
  venueCountry: string;
  facilities: string[];
  mapEmbedUrl: string;
  nearbyAirport: string;
  airportDistance: string;
  parkingInfo: string;
  accommodationInfo: string;
}

export interface OnlineConfig {
  platform: string;
  channelName: string;
  features: string[];
  accessInfo: string;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  type: 'organizer' | 'academic' | 'sponsor';
  order: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoType: 'youtube' | 'upload';
  youtubeUrl?: string;
  uploadedVideoUrl?: string;
  thumbnail: string;
  order: number;
}

export interface SiteTexts {
  siteTitle: string;
  aboutTitle: string;
  aboutDescription: string;
  scheduleTitle: string;
  scheduleDescription: string;
  speakersTitle: string;
  speakersDescription: string;
  registrationTitle: string;
  registrationDescription: string;
  venueTitle: string;
  venueDescription: string;
  partnersTitle: string;
  partnersDescription: string;
  videosTitle: string;
  videosDescription: string;
  footerCopyright: string;
  contactEmail: string;
  contactPhone: string;
  institutionalLink?: string;
  organizedBy?: string;
  copyrightEn?: string;
  copyrightPt?: string;
  copyrightEs?: string;
}

export interface HybridActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  image_url: string;
  order_index: number;
  is_active: boolean;
}

export interface CMSContent {
  speakers: Speaker[];
  bannerSlides: BannerSlide[];
  registrationTiers: RegistrationTier[];
  batchInfo: string;
  eventConfig: EventConfig;
  venueConfig: VenueConfig;
  onlineConfig: OnlineConfig;
  partners: Partner[];
  videos: Video[];
  siteTexts: SiteTexts;
  hybridActivities: HybridActivity[];
}

interface CMSContextType {
  content: CMSContent;
  loading: boolean;
  updateSpeakers: (speakers: Speaker[]) => Promise<void>;
  updateBannerSlides: (slides: BannerSlide[]) => Promise<void>;
  updateRegistrationTiers: (tiers: RegistrationTier[]) => Promise<void>;
  updateBatchInfo: (info: string) => Promise<void>;
  updateEventConfig: (config: EventConfig) => Promise<void>;
  updateVenueConfig: (config: VenueConfig) => Promise<void>;
  updateOnlineConfig: (config: OnlineConfig) => Promise<void>;
  updatePartners: (partners: Partner[]) => Promise<void>;
  updateVideos: (videos: Video[]) => Promise<void>;
  updateSiteTexts: (texts: SiteTexts) => Promise<void>;
}

const defaultContent: CMSContent = {
  speakers: [
    {
      id: '1',
      name: "Dr. Maria Rodriguez",
      title: "Professor of Biomedical Engineering",
      institution: "Harvard Medical School",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      bio: "Leading researcher in regenerative medicine and tissue engineering with over 20 years of experience.",
      order: 1
    },
    {
      id: '2',
      name: "Prof. James Chen",
      title: "Director of AI Research",
      institution: "Stanford University",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      bio: "Pioneer in artificial intelligence and machine learning applications in healthcare.",
      order: 2
    },
    {
      id: '3',
      name: "Dr. Elena Kowalski",
      title: "Environmental Scientist",
      institution: "MIT",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      bio: "Expert in climate change research and sustainable technology development.",
      order: 3
    },
    {
      id: '4',
      name: "Dr. Ahmed Hassan",
      title: "Professor of Psychology",
      institution: "Oxford University",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
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
  batchInfo: "FIRST BATCH: November 1 - December 15, 2024",
  eventConfig: {
    eventDate: "2025-12-08",
    eventLocation: "Celebration, Florida",
    eventCity: "Celebration",
    startTime: "09:00",
    endTime: "18:00"
  },
  venueConfig: {
    venueName: "VCCU Conference Center",
    venueAddress: "123 Innovation Drive",
    venueCity: "Celebration",
    venueState: "FL",
    venueZip: "34747",
    venueCountry: "United States",
    facilities: [
      "State-of-the-art auditoriums",
      "Modern exhibition spaces",
      "Networking lounges",
      "Free Wi-Fi and parking"
    ],
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.123456789!2d-81.234567!3d28.123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sCelebration%2C%20FL!5e0!3m2!1sen!2sus!4v1234567890",
    nearbyAirport: "Orlando International Airport (MCO)",
    airportDistance: "20 minutes drive",
    parkingInfo: "Free parking available",
    accommodationInfo: "Partner hotels nearby with special rates"
  },
  onlineConfig: {
    platform: "YouTube Live",
    channelName: "@CiveniUSA2025",
    features: [
      "HD video streaming",
      "Real-time interaction",
      "Session recordings",
      "Digital certificates"
    ],
    accessInfo: "Live streaming of keynote sessions with interactive chat and Q&A"
  },
  partners: [
    {
      id: '1',
      name: "VCCU",
      logo: "🎓",
      type: "organizer",
      order: 1
    },
    {
      id: '2',
      name: "Hope & Justice",
      logo: "⚖️",
      type: "organizer",
      order: 2
    },
    {
      id: '3',
      name: "Harvard University",
      logo: "🏛️",
      type: "academic",
      order: 1
    },
    {
      id: '4',
      name: "Stanford University",
      logo: "🌟",
      type: "academic",
      order: 2
    },
    {
      id: '5',
      name: "MIT",
      logo: "🔬",
      type: "academic",
      order: 3
    },
    {
      id: '6',
      name: "Oxford University",
      logo: "📚",
      type: "academic",
      order: 4
    }
  ],
  videos: [
    {
      id: '1',
      title: "II Civeni 2024 Opening Ceremony",
      description: "Highlights from the opening ceremony of the II International Congress",
      videoType: 'youtube',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&h=300&q=80',
      order: 1
    },
    {
      id: '2',
      title: "Key Research Presentations",
      description: "Best moments from the research presentations at II Civeni 2024",
      videoType: 'youtube',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&h=300&q=80',
      order: 2
    },
    {
      id: '3',
      title: "Networking and Cultural Exchange",
      description: "International collaboration and cultural exchange moments",
      videoType: 'youtube',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&h=300&q=80',
      order: 3
    }
  ],
  siteTexts: {
    siteTitle: "III International Multidisciplinary Congress",
    aboutTitle: "About the Congress",
    aboutDescription: "The III International Multidisciplinary Congress of VCCU brings together researchers, academics, and professionals from diverse fields to share knowledge, foster collaboration, and drive innovation.",
    scheduleTitle: "CHECK THE CONGRESS SCHEDULE",
    scheduleDescription: "Choose your preferred format and explore our comprehensive program",
    speakersTitle: "Keynote Speakers",
    speakersDescription: "Learn from world-renowned experts who are shaping the future of their fields",
    registrationTitle: "REGISTER NOW!",
    registrationDescription: "Secure your spot at the premier multidisciplinary congress",
    venueTitle: "Event Location",
    venueDescription: "Join us in beautiful Celebration, Florida, or participate online from anywhere in the world",
    partnersTitle: "Our Partners",
    partnersDescription: "Proudly organized and supported by leading international institutions",
    videosTitle: "Videos from II Civeni 2024",
    videosDescription: "Relive the highlights from our previous congress and get inspired to join us in 2025",
    footerCopyright: "© 2025 VCCU. All rights reserved.",
    contactEmail: "contact@civeni.com",
    contactPhone: "+1 (555) 123-4567",
    organizedBy: "Veni Creator Christian University"
  },
  hybridActivities: []
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
      // Carregar banner slides do Supabase
      const { data: bannerSlidesData, error: bannerError } = await supabase
        .from('banner_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (bannerError) {
        console.error('Error loading banner slides:', bannerError);
      }

      // Converter dados do Supabase para o formato do contexto
      const bannerSlides: BannerSlide[] = bannerSlidesData?.map(slide => {
        // Converter caminhos de assets locais para URLs públicas
        let bgImage = slide.bg_image;
        if (bgImage.startsWith('src/assets/')) {
          bgImage = bgImage.replace('src/assets/', '/assets/');
        }
        
        return {
          id: slide.id,
          title: slide.title,
          subtitle: slide.subtitle,
          description: slide.description,
          bgImage: bgImage,
          buttonText: slide.button_text,
          buttonLink: slide.button_link,
          order: slide.order_index
        };
      }) || defaultContent.bannerSlides;

      // Carregar configurações do evento do Supabase
      const { data: eventConfigData, error: eventError } = await supabase
        .from('event_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      let eventConfig = defaultContent.eventConfig;
      if (eventConfigData && !eventError) {
        eventConfig = {
          eventDate: eventConfigData.event_date,
          eventLocation: eventConfigData.event_location,
          eventCity: eventConfigData.event_city,
          startTime: eventConfigData.start_time ? eventConfigData.start_time.substring(0, 5) : '09:00',
          endTime: eventConfigData.end_time ? eventConfigData.end_time.substring(0, 5) : '18:00'
        };
        console.log('Event config loaded from DB:', eventConfig);
      }

      // Carregar atividades do formato híbrido
      console.log('CMSContext - Loading hybrid activities...');
      const { data: hybridData, error: hybridError } = await supabase
        .from('hybrid_format_config')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (hybridError) {
        console.error('Error loading hybrid activities:', hybridError);
      }

      const hybridActivities = hybridData || [];
      console.log('CMSContext - Loaded hybrid activities:', hybridActivities);

      setContent(prev => ({ 
        ...prev, 
        bannerSlides, 
        eventConfig, 
        hybridActivities 
      }));
      
      console.log('CMSContext - Final content state hybridActivities:', hybridActivities);
    } catch (error) {
      console.error('Error loading content:', error);
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  const updateSpeakers = async (speakers: Speaker[]) => {
    try {
      setContent(prev => ({ ...prev, speakers }));
    } catch (error) {
      console.error('Error updating speakers:', error);
    }
  };

  const updateBannerSlides = async (bannerSlides: BannerSlide[]) => {
    try {
      console.log('Updating banner slides:', bannerSlides);

      const dataUrlToBlob = (dataUrl: string): { blob: Blob; mime: string; extension: string } => {
        const parts = dataUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(parts[1] || '');
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const blob = new Blob([u8arr], { type: mime });
        const extension = (mime.split('/')[1] || 'jpg').replace('+xml','');
        return { blob, mime, extension };
      };

      // Processar cada slide individualmente
      for (let i = 0; i < bannerSlides.length; i++) {
        const slide = bannerSlides[i];

        // Se a imagem for um data URL (upload local), enviar para o bucket público e usar URL pública estável
        let finalBgImage = slide.bgImage || '';
        if (finalBgImage.startsWith('data:')) {
          try {
            const { blob, mime, extension } = dataUrlToBlob(finalBgImage);
            const filePath = `banners/${Date.now()}_${i}.${extension}`;
            const { error: uploadError } = await supabase.storage
              .from('site-civeni')
              .upload(filePath, blob, { upsert: true, contentType: mime });
            if (uploadError) throw uploadError;
            finalBgImage = supabase.storage.from('site-civeni').getPublicUrl(filePath).data.publicUrl;
          } catch (e) {
            console.error('Erro ao enviar imagem do banner para o Storage:', e);
            // mantém o data URL como fallback (funciona em dev), mas idealmente não deve ficar no banco
          }
        }

        const slideData = {
          title: slide.title || '',
          subtitle: slide.subtitle || '',
          description: slide.description || '',
          bg_image: finalBgImage || '',
          button_text: slide.buttonText || '',
          button_link: slide.buttonLink || '',
          order_index: slide.order || (i + 1),
          is_active: true
        };

        if (slide.id && slide.id !== 'new') {
          // Atualizar slide existente
          console.log('Updating existing slide:', slide.id);
          const { error: updateError } = await supabase
            .from('banner_slides')
            .update(slideData)
            .eq('id', slide.id);

          if (updateError) {
            console.error('Error updating slide:', updateError);
            throw updateError;
          }
        } else {
          // Inserir novo slide
          console.log('Inserting new slide');
          const { error: insertError } = await supabase
            .from('banner_slides')
            .insert([slideData]);

          if (insertError) {
            console.error('Error inserting slide:', insertError);
            throw insertError;
          }
        }
      }

      // Desativar slides que não estão na lista atual
      const activeSlideIds = bannerSlides
        .filter(slide => slide.id && slide.id !== 'new')
        .map(slide => slide.id);
      
      if (activeSlideIds.length > 0) {
        const { error: deactivateError } = await supabase
          .from('banner_slides')
          .update({ is_active: false })
          .not('id', 'in', `(${activeSlideIds.map(id => `'${id}'`).join(',')})`);

        if (deactivateError) {
          console.error('Error deactivating unused slides:', deactivateError);
          // Não throw aqui, só log
        }
      }

      console.log('Banner slides updated successfully');
      
      // Recarregar dados do banco para sincronizar
      await loadContent();
      
    } catch (error) {
      console.error('Error updating banner slides:', error);
      throw error;
    }
  };
  const updateRegistrationTiers = async (registrationTiers: RegistrationTier[]) => {
    try {
      setContent(prev => ({ ...prev, registrationTiers }));
    } catch (error) {
      console.error('Error updating registration tiers:', error);
    }
  };

  const updateBatchInfo = async (batchInfo: string) => {
    try {
      setContent(prev => ({ ...prev, batchInfo }));
    } catch (error) {
      console.error('Error updating batch info:', error);
    }
  };

  const updateEventConfig = async (eventConfig: EventConfig) => {
    try {
      console.log('Updating event config:', eventConfig);
      
      const configData = {
        event_date: eventConfig.eventDate,
        event_location: eventConfig.eventLocation,
        event_city: eventConfig.eventCity,
        start_time: eventConfig.startTime ? eventConfig.startTime + ':00' : '09:00:00',
        end_time: eventConfig.endTime ? eventConfig.endTime + ':00' : '18:00:00'
      };

      // Buscar o ID do primeiro registro
      const { data: existingData } = await supabase
        .from('event_config')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1);

      if (existingData && existingData.length > 0) {
        // Atualizar registro existente
        const { data, error } = await supabase
          .from('event_config')
          .update(configData)
          .eq('id', existingData[0].id)
          .select();

        if (error) throw error;
        console.log('Update successful:', data);
      } else {
        // Inserir novo registro se não existir
        const { data, error } = await supabase
          .from('event_config')
          .insert([configData])
          .select();

        if (error) throw error;
        console.log('Insert successful:', data);
      }
      
      // Recarregar dados para garantir consistência
      await loadContent();
      
      // Notificar componentes da atualização
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('eventConfigUpdated', { 
          detail: eventConfig 
        }));
      }, 200);
      
    } catch (error) {
      console.error('Error updating event config:', error);
      throw error;
    }
  };

  const updateVenueConfig = async (venueConfig: VenueConfig) => {
    try {
      setContent(prev => ({ ...prev, venueConfig }));
    } catch (error) {
      console.error('Error updating venue config:', error);
    }
  };

  const updateOnlineConfig = async (onlineConfig: OnlineConfig) => {
    try {
      setContent(prev => ({ ...prev, onlineConfig }));
    } catch (error) {
      console.error('Error updating online config:', error);
    }
  };

  const updatePartners = async (partners: Partner[]) => {
    try {
      setContent(prev => ({ ...prev, partners }));
    } catch (error) {
      console.error('Error updating partners:', error);
    }
  };

  const updateVideos = async (videos: Video[]) => {
    try {
      setContent(prev => ({ ...prev, videos }));
    } catch (error) {
      console.error('Error updating videos:', error);
    }
  };

  const updateSiteTexts = async (siteTexts: SiteTexts) => {
    try {
      setContent(prev => ({ ...prev, siteTexts }));
    } catch (error) {
      console.error('Error updating site texts:', error);
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
        updateEventConfig,
        updateVenueConfig,
        updateOnlineConfig,
        updatePartners,
        updateVideos,
        updateSiteTexts,
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
