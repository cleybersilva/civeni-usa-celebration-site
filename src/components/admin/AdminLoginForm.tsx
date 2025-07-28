
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email é obrigatório');
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
      {/* Left Side - Logo and Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-civeni-red to-civeni-orange p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img 
              src="/lovable-uploads/d8e1ac06-1b50-4838-b9b9-f0803a553602.png" 
              alt="III Civeni 2025 Logo" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold">CIVENI</h1>
              <p className="text-sm opacity-90">Sistema Administrativo</p>
            </div>
          </div>
          
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">Gestão Completa do Evento</h2>
            <p className="text-lg opacity-90 mb-8">
              Gerencie inscrições, palestrantes, cronograma e muito mais em um só lugar com nossa plataforma integrada.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Dashboard em Tempo Real</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Gestão de Inscrições</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Relatórios Avançados</span>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="relative z-10 w-fit bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
        >
          <Home className="w-4 h-4 mr-2" />
          Voltar ao Site
        </Button>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/lovable-uploads/d8e1ac06-1b50-4838-b9b9-f0803a553602.png" 
              alt="III Civeni 2025 Logo" 
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">CIVENI</h1>
            <p className="text-gray-600">Sistema Administrativo</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo!</h2>
              <p className="text-gray-600">Acesse sua conta ou crie uma nova para começar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-12 text-base border-gray-200 focus:border-civeni-red focus:ring-civeni-red"
                  required
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 text-base border-gray-200 focus:border-civeni-red focus:ring-civeni-red pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
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
                className="w-full h-12 bg-civeni-red hover:bg-civeni-red/90 text-white font-medium rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button 
                type="button"
                className="text-sm text-civeni-red hover:text-civeni-red/80 font-medium"
                onClick={() => {/* TODO: Implement password reset */}}
              >
                Esqueceu sua senha?
              </button>
            </div>

            <div className="mt-8 text-center text-xs text-gray-500">
              Ao continuar, você concorda com nossos termos de uso
            </div>

            <div className="mt-4 text-center text-xs text-gray-400">
              © 2025 CIVENI. Transformando a gestão de eventos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginForm;
