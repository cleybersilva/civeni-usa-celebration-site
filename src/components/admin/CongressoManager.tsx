import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Presentation, Users } from 'lucide-react';
import CongressoApresentacaoManager from './CongressoApresentacaoManager';
import CongressoComiteManager from './CongressoComiteManager';

const CongressoManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apresentacao');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('admin.congress.title', 'Gerenciar Congresso')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('admin.congress.description', 'Gerencie o conteúdo das páginas de apresentação e comitê do congresso')}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apresentacao" className="flex items-center gap-2">
            <Presentation className="w-4 h-4" />
            {t('admin.congress.presentation.title', 'Apresentação')}
          </TabsTrigger>
          <TabsTrigger value="comite" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('admin.congress.committee.title', 'Comitê')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apresentacao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Presentation className="w-5 h-5" />
                {t('admin.congress.presentation.manage', 'Gerenciar Apresentação')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CongressoApresentacaoManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('admin.congress.committee.manage', 'Gerenciar Comitê')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CongressoComiteManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CongressoManager;