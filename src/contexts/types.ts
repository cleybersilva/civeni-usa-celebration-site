
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
  platform: string;
  channelName: string;
  accessInfo: string;
  features: string[];
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
  mapEmbedUrl: string;
  nearbyAirport: string;
  airportDistance: string;
  parkingInfo: string;
  accommodationInfo: string;
  facilities: string[];
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

export interface CMSContextType {
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
