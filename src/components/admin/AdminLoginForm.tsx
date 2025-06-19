
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Eye, EyeOff } from 'lucide-react';
import PasswordResetDialog from '@/components/admin/PasswordResetDialog';
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
    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-8">
      {/* Logo and Header Section */}
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/d8e1ac06-1b50-4838-b9b9-f0803a553602.png" 
            alt="III Civeni 2025 Logo" 
            className="h-20 w-auto"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="mb-4 text-white bg-civeni-red border-civeni-red hover:bg-civeni-blue hover:text-white transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Voltar ao Site
        </Button>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-civeni-blue">
            Painel Administrativo
            <br />
            III Civeni USA 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
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
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-civeni-blue hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <PasswordResetDialog>
              <Button variant="link" className="text-civeni-blue">
                Esqueceu sua senha?
              </Button>
            </PasswordResetDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginForm;
