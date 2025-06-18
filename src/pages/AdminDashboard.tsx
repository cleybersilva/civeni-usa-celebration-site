import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home } from 'lucide-react';
import SpeakersManager from '@/components/admin/SpeakersManager';
import BannerManager from '@/components/admin/BannerManager';
import RegistrationManager from '@/components/admin/RegistrationManager';
import EventConfigManager from '@/components/admin/EventConfigManager';
import SiteTextsManager from '@/components/admin/SiteTextsManager';
import VenueConfigManager from '@/components/admin/VenueConfigManager';
import OnlineConfigManager from '@/components/admin/OnlineConfigManager';
import PartnersManager from '@/components/admin/PartnersManager';
import VideosManager from '@/components/admin/VideosManager';
import CopyrightManager from '@/components/admin/CopyrightManager';
import PasswordResetDialog from '@/components/admin/PasswordResetDialog';
import { useAdminAuth, AdminAuthProvider } from '@/hooks/useAdminAuth';
import { CMSProvider } from '@/contexts/CMSContext';

const AdminLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
          className="mb-4 text-civeni-blue border-civeni-blue hover:bg-civeni-blue hover:text-white transition-colors"
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
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
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

const AdminDashboardContent = () => {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserTypeLabel = (userType: string) => {
    const labels = {
      admin: 'Administrador',
      editor: 'Editor',
      viewer: 'Visualizador'
    };
    return labels[userType as keyof typeof labels] || userType;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-civeni-blue">
                Painel Administrativo - III Civeni USA 2025
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Logado como: {user?.email} ({getUserTypeLabel(user?.user_type || '')})
              </p>
            </div>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Ver Site
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="speakers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            {hasPermission('write') && <TabsTrigger value="speakers">Palestrantes</TabsTrigger>}
            {hasPermission('write') && <TabsTrigger value="banner">Banner</TabsTrigger>}
            {hasPermission('write') && <TabsTrigger value="registration">Inscrições</TabsTrigger>}
            {hasPermission('write') && <TabsTrigger value="event">Contador</TabsTrigger>}
            {hasPermission('write') && <TabsTrigger value="texts">Textos</TabsTrigger>}
            {hasPermission('write') && <TabsTrigger value="venue">Local</TabsTrigger>}
            {hasPermission('write') && <TabsTrigger value="online">Online</TabsTrigger>}
            {hasPermission('write') && <TabsTrigger value="partners">Parceiros</TabsTrigger>}
            {hasPermission('write') && <TabsTrigger value="videos">Vídeos</TabsTrigger>}
            {hasPermission('write') && <TabsTrigger value="copyright">Copyright</TabsTrigger>}
          </TabsList>

          {hasPermission('write') && (
            <>
              <TabsContent value="speakers">
                <SpeakersManager />
              </TabsContent>

              <TabsContent value="banner">
                <BannerManager />
              </TabsContent>

              <TabsContent value="registration">
                <RegistrationManager />
              </TabsContent>

              <TabsContent value="event">
                <EventConfigManager />
              </TabsContent>

              <TabsContent value="texts">
                <SiteTextsManager />
              </TabsContent>

              <TabsContent value="venue">
                <VenueConfigManager />
              </TabsContent>

              <TabsContent value="online">
                <OnlineConfigManager />
              </TabsContent>

              <TabsContent value="partners">
                <PartnersManager />
              </TabsContent>

              <TabsContent value="videos">
                <VideosManager />
              </TabsContent>

              <TabsContent value="copyright">
                <CopyrightManager />
              </TabsContent>
            </>
          )}

          {!hasPermission('write') && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                Você não tem permissão para editar conteúdo. 
                Contate um administrador para obter acesso.
              </p>
            </div>
          )}
        </Tabs>
      </main>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <AdminAuthProvider>
      <CMSProvider>
        <AdminDashboardInner />
      </CMSProvider>
    </AdminAuthProvider>
  );
};

const AdminDashboardInner = () => {
  const { user } = useAdminAuth();

  if (!user) {
    return <AdminLoginForm />;
  }

  return <AdminDashboardContent />;
};

export default AdminDashboard;
