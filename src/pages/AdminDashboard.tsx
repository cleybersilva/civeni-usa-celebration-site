
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCMS } from '@/contexts/CMSContext';
import SpeakersManager from '@/components/admin/SpeakersManager';
import BannerManager from '@/components/admin/BannerManager';
import RegistrationManager from '@/components/admin/RegistrationManager';
import EventConfigManager from '@/components/admin/EventConfigManager';
import SiteTextsManager from '@/components/admin/SiteTextsManager';
import VenueConfigManager from '@/components/admin/VenueConfigManager';
import OnlineConfigManager from '@/components/admin/OnlineConfigManager';
import PartnersManager from '@/components/admin/PartnersManager';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Credenciais temporárias para demonstração
    if (username === 'admin' && password === 'civeni2025') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Credenciais inválidas');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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
                <label className="block text-sm font-medium mb-2">Usuário</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
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
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <Button type="submit" className="w-full bg-civeni-blue hover:bg-blue-700">
                Entrar
              </Button>
            </form>
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
              <strong>Demo:</strong> Use "admin" e "civeni2025"
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-civeni-blue">
              Painel Administrativo - III Civeni USA 2025
            </h1>
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
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="speakers">Palestrantes</TabsTrigger>
            <TabsTrigger value="banner">Banner</TabsTrigger>
            <TabsTrigger value="registration">Inscrições</TabsTrigger>
            <TabsTrigger value="event">Contador</TabsTrigger>
            <TabsTrigger value="texts">Textos</TabsTrigger>
            <TabsTrigger value="venue">Local</TabsTrigger>
            <TabsTrigger value="online">Online</TabsTrigger>
            <TabsTrigger value="partners">Parceiros</TabsTrigger>
          </TabsList>

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
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
