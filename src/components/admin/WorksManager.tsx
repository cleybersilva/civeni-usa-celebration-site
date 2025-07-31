import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkContentManager from './WorkContentManager';
import { Users, Presentation, BookOpen } from 'lucide-react';

const WorksManager = () => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {t('admin.menu.works', 'Gestão de Trabalhos')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="apresentacao-oral" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="apresentacao-oral" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('admin.menu.oralPresentation', 'Apresentação Oral')}
            </TabsTrigger>
            <TabsTrigger value="sessoes-poster" className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              {t('admin.menu.posterSessions', 'Sessões de Pôster')}
            </TabsTrigger>
            <TabsTrigger value="manuscritos" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('admin.menu.manuscripts', 'Manuscritos')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="apresentacao-oral" className="mt-6">
            <WorkContentManager 
              workType="apresentacao-oral" 
              title="Gestão de Conteúdo - Apresentação Oral" 
            />
          </TabsContent>
          
          <TabsContent value="sessoes-poster" className="mt-6">
            <WorkContentManager 
              workType="sessoes-poster" 
              title="Gestão de Conteúdo - Sessões de Pôster" 
            />
          </TabsContent>
          
          <TabsContent value="manuscritos" className="mt-6">
            <WorkContentManager 
              workType="manuscritos" 
              title="Gestão de Conteúdo - Manuscritos" 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WorksManager;