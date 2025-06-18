
import React from 'react';

const ScheduleSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            CHECK THE CONGRESS SCHEDULE
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your preferred format and explore our comprehensive program
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="group cursor-pointer">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="h-64 bg-gradient-to-br from-civeni-blue to-blue-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="relative z-10 text-center text-white">
                  <div className="text-6xl mb-4">🏢</div>
                  <h3 className="text-3xl font-bold font-poppins mb-2">IN PERSON</h3>
                  <p className="text-lg opacity-90">Live Experience in Celebration, FL</p>
                </div>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                    <span className="text-gray-700">Face-to-face networking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                    <span className="text-gray-700">Interactive workshops</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                    <span className="text-gray-700">Exhibition stands</span>
                  </div>
                </div>
                <button className="w-full mt-6 bg-civeni-blue text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors font-poppins">
                  View In-Person Schedule
                </button>
              </div>
            </div>
          </div>
          
          <div className="group cursor-pointer">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="h-64 bg-gradient-to-br from-civeni-red to-red-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="relative z-10 text-center text-white">
                  <div className="text-6xl mb-4">💻</div>
                  <h3 className="text-3xl font-bold font-poppins mb-2">ONLINE</h3>
                  <p className="text-lg opacity-90">Virtual Participation via YouTube</p>
                </div>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                    <span className="text-gray-700">Live streaming</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                    <span className="text-gray-700">Q&A sessions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                    <span className="text-gray-700">Digital certificate</span>
                  </div>
                </div>
                <button className="w-full mt-6 bg-civeni-red text-white py-3 rounded-full font-semibold hover:bg-red-700 transition-colors font-poppins">
                  View Online Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScheduleSection;
