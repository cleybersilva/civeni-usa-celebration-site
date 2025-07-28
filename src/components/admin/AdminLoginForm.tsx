import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Eye, EyeOff, GraduationCap, Users } from 'lucide-react';
import PasswordResetDialog from '@/components/admin/PasswordResetDialog';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { validateEmail } from '@/utils/inputValidation';
import conferenceImage from '@/assets/conference-event.jpg';

const AdminLoginForm = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [openDropdown, setOpenDropdown] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'pt', flag: '🇧🇷', name: 'Português' },
    { code: 'es', flag: '🇪🇸', name: 'Español' }
  ];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setSelectedLanguage(langCode);
    setOpenDropdown(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Email inválido');
      return;
    }

    if (!password.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    setIsLoading(true);

    const result = await login(email.trim(), password);
    
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Language Selector - Top Bar */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="flex items-center space-x-2 text-white hover:text-civeni-red transition-colors bg-black bg-opacity-20 px-3 py-2 rounded-md hover:bg-opacity-30"
          >
            <span className="text-xl">{languages.find(l => l.code === selectedLanguage)?.flag}</span>
            <span className="text-sm font-medium">{languages.find(l => l.code === selectedLanguage)?.name}</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl border border-gray-200 z-[99999] overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                    selectedLanguage === lang.code ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Left side - Image and Event Info */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-civeni-blue to-civeni-red">
        <div className="absolute inset-0">
          <img 
            src={conferenceImage} 
            alt="Evento de Conferência" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 text-white">
          <h1 className="text-4xl font-bold mb-8">
            III CIVENI USA 2025
          </h1>
          <p className="text-xl mb-8 leading-relaxed">
            {t('admin.eventDescription', 'Congresso Internacional de Inovação Educacional e Novas Tecnologias é o principal evento que reúne educadores, pesquisadores e profissionais de tecnologia de todo o mundo.')}
          </p>
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <GraduationCap className="w-6 h-6" />
              <span className="text-lg">{t('admin.educationalInnovation', 'Inovação Educacional')}</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Users className="w-6 h-6" />
              <span className="text-lg">{t('admin.globalNetworking', 'Networking Global')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo above login area - always visible */}
          <div className="mb-8 text-center">
            <img 
              src="/lovable-uploads/d8e1ac06-1b50-4838-b9b9-f0803a553602.png" 
              alt="III Civeni 2025 Logo" 
              className="h-16 w-auto mx-auto mb-4"
            />
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="text-civeni-red border-civeni-red hover:bg-civeni-red hover:text-white transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Site
            </Button>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-civeni-blue mb-2">
                Bem-vindo! 🎓
              </CardTitle>
              <p className="text-gray-600">Faça login em sua conta</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                      className="pl-10 h-12 border-gray-300 focus:border-civeni-blue focus:ring-civeni-blue"
                    />
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="pl-10 pr-10 h-12 border-gray-300 focus:border-civeni-blue focus:ring-civeni-blue"
                    />
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-red hover:to-civeni-blue text-white font-semibold text-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Login'}
                </Button>
              </form>
              
              <div className="text-center">
                <p className="text-gray-600 mb-2">Não tem credenciais ainda?</p>
                <PasswordResetDialog>
                  <Button variant="link" className="text-civeni-blue hover:text-civeni-red font-semibold">
                    Esqueceu sua senha?
                  </Button>
                </PasswordResetDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginForm;