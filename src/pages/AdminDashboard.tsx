
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
import DashboardOverview from '@/components/admin/AdminDashboard';
import UserInfo from '@/components/admin/UserInfo';
import UsersManager from '@/components/admin/UsersManager';
import PermissionGuard from '@/components/admin/PermissionGuard';
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
  const { user, logout, hasPermission, isAdminRoot } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserTypeLabel = (userType: string) => {
    const labels = {
      admin_root: 'Admin Root',
      admin: 'Administrador',
      design: 'Designer',
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
                Dashboard - VCCU/Civeni USA
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Logado como: {user?.email} ({getUserTypeLabel(user?.user_type || '')})
                {isAdminRoot() && <span className="ml-2 text-red-600 font-bold">[ROOT ACCESS]</span>}
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
        <UserInfo />
        
        <Tabs defaultValue="financeiro" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            {(hasPermission('banner') || isAdminRoot()) && <TabsTrigger value="banner">Banner</TabsTrigger>}
            {(hasPermission('contador') || isAdminRoot()) && <TabsTrigger value="contador">Contador</TabsTrigger>}
            {(hasPermission('copyright') || isAdminRoot()) && <TabsTrigger value="copyright">Copyright</TabsTrigger>}
            {(hasPermission('inscricoes') || isAdminRoot()) && <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>}
            {(hasPermission('local') || isAdminRoot()) && <TabsTrigger value="local">Local</TabsTrigger>}
            {(hasPermission('online') || isAdminRoot()) && <TabsTrigger value="online">Online</TabsTrigger>}
            {(hasPermission('palestrantes') || isAdminRoot()) && <TabsTrigger value="palestrantes">Palestrantes</TabsTrigger>}
            {(hasPermission('parceiros') || isAdminRoot()) && <TabsTrigger value="parceiros">Parceiros</TabsTrigger>}
            {(hasPermission('textos') || isAdminRoot()) && <TabsTrigger value="textos">Textos</TabsTrigger>}
            {(hasPermission('videos') || isAdminRoot()) && <TabsTrigger value="videos">Vídeos</TabsTrigger>}
            {isAdminRoot() && <TabsTrigger value="usuarios">Usuários</TabsTrigger>}
          </TabsList>

          <TabsContent value="financeiro">
            <DashboardOverview />
          </TabsContent>

          {(hasPermission('banner') || isAdminRoot()) && (
            <TabsContent value="banner">
              <PermissionGuard resource="banner">
                <BannerManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {(hasPermission('contador') || isAdminRoot()) && (
            <TabsContent value="contador">
              <PermissionGuard resource="contador">
                <EventConfigManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {(hasPermission('copyright') || isAdminRoot()) && (
            <TabsContent value="copyright">
              <PermissionGuard resource="copyright">
                <CopyrightManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {(hasPermission('inscricoes') || isAdminRoot()) && (
            <TabsContent value="inscricoes">
              <PermissionGuard resource="inscricoes">
                <RegistrationManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {(hasPermission('local') || isAdminRoot()) && (
            <TabsContent value="local">
              <PermissionGuard resource="local">
                <VenueConfigManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {(hasPermission('online') || isAdminRoot()) && (
            <TabsContent value="online">
              <PermissionGuard resource="online">
                <OnlineConfigManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {(hasPermission('palestrantes') || isAdminRoot()) && (
            <TabsContent value="palestrantes">
              <PermissionGuard resource="palestrantes">
                <SpeakersManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {(hasPermission('parceiros') || isAdminRoot()) && (
            <TabsContent value="parceiros">
              <PermissionGuard resource="parceiros">
                <PartnersManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {(hasPermission('textos') || isAdminRoot()) && (
            <TabsContent value="textos">
              <PermissionGuard resource="textos">
                <SiteTextsManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {(hasPermission('videos') || isAdminRoot()) && (
            <TabsContent value="videos">
              <PermissionGuard resource="videos">
                <VideosManager />
              </PermissionGuard>
            </TabsContent>
          )}

          {isAdminRoot() && (
            <TabsContent value="usuarios">
              <UsersManager />
            </TabsContent>
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
