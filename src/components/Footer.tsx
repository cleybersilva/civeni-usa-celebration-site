import React from 'react';
import { Instagram, Facebook, Youtube, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const quickLinks = [
    { name: 'About', href: '#about' },
    { name: 'Schedule', href: '#schedule' },
    { name: 'Speakers', href: '#speakers' },
    { name: 'Registration', href: '#registration' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <footer className="bg-civeni-blue text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="text-3xl font-bold mb-4 font-poppins">
              CIVENI USA <span className="text-civeni-red">2025</span>
            </div>
            <p className="text-lg opacity-90 mb-6 leading-relaxed">
              III International Multidisciplinary Congress of VCCU<br/>
              December 8-10, 2025 • Celebration, Florida
            </p>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-white hover:text-civeni-red transition-colors transform hover:scale-110">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-white hover:text-civeni-red transition-colors transform hover:scale-110">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-white hover:text-civeni-red transition-colors transform hover:scale-110">
                <Youtube size={24} />
              </a>
            </div>
            
            {/* Seção de Acesso Restrito */}
            <div className="border-t border-white border-opacity-20 pt-4">
              <p className="text-sm opacity-75 mb-2">Acesso Restrito</p>
              <Link 
                to="/admin" 
                className="inline-flex items-center gap-2 text-sm opacity-90 hover:opacity-100 hover:text-civeni-red transition-all duration-300"
              >
                <Settings size={16} />
                Área Administrativa
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 font-poppins">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="opacity-90 hover:opacity-100 hover:text-civeni-red transition-all duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 font-poppins">Contact Info</h3>
            <div className="space-y-3 opacity-90">
              <p>📧 info@civeniusa.org</p>
              <p>📞 +1 (555) 123-4567</p>
              <p>📍 Celebration, FL 34747</p>
              <p>🌐 www.civeniusa.org</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white border-opacity-20 mt-12 pt-8 text-center">
          <div className="grid md:grid-cols-3 gap-4 items-center">
            <div className="text-sm opacity-75">
              © 2024 VCCU. All rights reserved.
            </div>
            <div className="text-sm opacity-75">
              Organized by VCCU & Hope and Justice
            </div>
            <div className="text-sm opacity-75">
              Privacy Policy | Terms of Service
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
