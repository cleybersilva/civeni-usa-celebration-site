import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import CMSPagesManager from './cms/CMSPagesManager';
import CMSCommitteesManager from './cms/CMSCommitteesManager';

const CongressoManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apresentacao');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {t('admin.congress.title', 'Gerenciar Congresso')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('admin.congress.description', 'Configure o conteúdo das páginas do congresso através do CMS')}
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="apresentacao">
            {t('admin.congress.tabs.presentation', 'Apresentação')}
          </TabsTrigger>
          <TabsTrigger value="comite">
            {t('admin.congress.tabs.committee', 'Comitê')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="apresentacao">
          <Card className="p-6">
            <CMSPagesManager />
          </Card>
        </TabsContent>
        
        <TabsContent value="comite">
          <Card className="p-6">
            <CMSCommitteesManager />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CongressoManager;