
import React from 'react';

const HybridFormatSection = () => {
  const activities = [
    {
      title: "Exhibition Stands",
      image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=600&q=80",
      description: "Explore innovative research and technology displays"
    },
    {
      title: "Keynote Lectures", 
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
      description: "Inspiring presentations from world-class speakers"
    },
    {
      title: "Panel Discussions",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80",
      description: "Interactive debates on cutting-edge topics"
    },
    {
      title: "Oral Communications",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
      description: "Present your research to an international audience"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            Hybrid Format Experience
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose between in-person and online participation to suit your needs and preferences
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="relative overflow-hidden">
                  <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-civeni-blue bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-civeni-blue mb-3 font-poppins">
                    {activity.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {activity.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-civeni-blue mb-4 font-poppins">
              Why Choose Hybrid Format?
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-left">
                <h4 className="text-lg font-semibold text-civeni-red mb-3">In-Person Benefits</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Direct networking opportunities</li>
                  <li>• Hands-on workshop participation</li>
                  <li>• Access to exhibition stands</li>
                  <li>• Face-to-face interactions</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-lg font-semibold text-civeni-red mb-3">Online Benefits</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Global accessibility</li>
                  <li>• Cost-effective participation</li>
                  <li>• Recorded session access</li>
                  <li>• Interactive Q&A sessions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HybridFormatSection;
