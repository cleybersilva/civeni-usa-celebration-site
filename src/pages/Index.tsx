import React from 'react';
import Header from '../components/Header';
import HeroBanner from '../components/HeroBanner';
import CountdownTimer from '../components/CountdownTimer';
import ScheduleSection from '../components/ScheduleSection';
import NewRegistrationSection from '../components/NewRegistrationSection';
import AboutSection from '../components/AboutSection';
import SpeakersSection from '../components/SpeakersSection';
import VideosSection from '../components/VideosSection';
import CiveniII2024ImagesSection from '../components/CiveniII2024ImagesSection';
import VenueSection from '../components/VenueSection';
import PartnersSection from '../components/PartnersSection';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white font-poppins p-0 m-0">
      <Header />
      <HeroBanner />
      <CountdownTimer />
      <ScheduleSection />
      <NewRegistrationSection />
      <AboutSection />
      <SpeakersSection />
      <VideosSection />
      <CiveniII2024ImagesSection />
      <VenueSection />
      <PartnersSection />
      <Footer />
    </div>
  );
};

export default Index;
