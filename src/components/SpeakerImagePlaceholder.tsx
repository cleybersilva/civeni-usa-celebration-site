import { AlertCircle, RefreshCw, User } from 'lucide-react';
import React from 'react';

interface SpeakerImagePlaceholderProps {
  name: string;
  showError?: boolean;
  onRetry?: () => void;
  isLoading?: boolean;
}

const SpeakerImagePlaceholder: React.FC<SpeakerImagePlaceholderProps> = ({ 
  name, 
  showError = false, 
  onRetry,
  isLoading = false 
}) => {
  // Extrair iniciais do nome
  const getInitials = (fullName: string): string => {
    const words = fullName.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return words[0] ? words[0].substring(0, 2).toUpperCase() : 'SP';
  };

  // Gerar cor baseada no nome
  const getColorFromName = (name: string): string => {
    const colors = [
      'from-blue-500 to-blue-700',
      'from-green-500 to-green-700', 
      'from-purple-500 to-purple-700',
      'from-red-500 to-red-700',
      'from-indigo-500 to-indigo-700',
      'from-pink-500 to-pink-700',
      'from-yellow-500 to-yellow-700',
      'from-cyan-500 to-cyan-700'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const gradientColor = getColorFromName(name);

  return (
    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradientColor} text-white relative`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-8 h-8 rounded-full border-2 border-white"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full border-2 border-white"></div>
        <div className="absolute top-1/2 right-8 w-4 h-4 rounded-full border border-white"></div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Error state */}
      {showError && !isLoading && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-red-500 text-white p-1 rounded-full shadow-lg" title="Erro ao carregar imagem">
            <AlertCircle size={16} />
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-white text-gray-700 p-1 rounded-full shadow-lg hover:bg-gray-100 transition-colors mt-1 block"
              title="Tentar novamente"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="text-center z-10">
        <div className="text-4xl font-bold mb-2">
          {initials}
        </div>
        <div className="flex justify-center mb-2">
          <User size={32} className="opacity-80" />
        </div>
        <div className="text-xs opacity-75 px-2">
          {showError ? 'Imagem não disponível' : 'Foto do palestrante'}
        </div>
      </div>
    </div>
  );
};

export default SpeakerImagePlaceholder;