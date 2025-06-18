
import React, { useState } from 'react';

const SpeakersSection = () => {
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  
  const speakers = [
    {
      name: "Dr. Maria Rodriguez",
      title: "Professor of Biomedical Engineering",
      institution: "Harvard Medical School",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b5bb?auto=format&fit=crop&w=400&q=80",
      bio: "Leading researcher in regenerative medicine and tissue engineering with over 20 years of experience."
    },
    {
      name: "Prof. James Chen",
      title: "Director of AI Research",
      institution: "Stanford University",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
      bio: "Pioneer in artificial intelligence and machine learning applications in healthcare."
    },
    {
      name: "Dr. Elena Kowalski",
      title: "Environmental Scientist",
      institution: "MIT",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
      bio: "Expert in climate change research and sustainable technology development."
    },
    {
      name: "Dr. Ahmed Hassan",
      title: "Professor of Psychology",
      institution: "Oxford University",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      bio: "Renowned researcher in cognitive psychology and behavioral sciences."
    }
  ];

  const nextSpeaker = () => {
    setCurrentSpeaker((prev) => (prev + 1) % speakers.length);
  };

  const prevSpeaker = () => {
    setCurrentSpeaker((prev) => (prev - 1 + speakers.length) % speakers.length);
  };

  return (
    <section className="py-20 bg-civeni-blue">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-poppins">
            Keynote Speakers
          </h2>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Learn from world-renowned experts who are shaping the future of their fields
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <img
                  src={speakers[currentSpeaker].image}
                  alt={speakers[currentSpeaker].name}
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-3xl font-bold text-civeni-blue mb-2 font-poppins">
                  {speakers[currentSpeaker].name}
                </h3>
                <p className="text-xl text-civeni-red mb-2 font-semibold">
                  {speakers[currentSpeaker].title}
                </p>
                <p className="text-lg text-gray-600 mb-6">
                  {speakers[currentSpeaker].institution}
                </p>
                <p className="text-gray-700 leading-relaxed mb-8">
                  {speakers[currentSpeaker].bio}
                </p>
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={prevSpeaker}
                    className="bg-civeni-blue text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-poppins"
                  >
                    ← Previous
                  </button>
                  <div className="flex space-x-2">
                    {speakers.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSpeaker(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentSpeaker ? 'bg-civeni-red' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={nextSpeaker}
                    className="bg-civeni-blue text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-poppins"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpeakersSection;
