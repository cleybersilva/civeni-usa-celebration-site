import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkContentManager from './WorkContentManager';
import { Users, Presentation, BookOpen, FileText } from 'lucide-react';

const WorksManager = () => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6">
        <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-xl">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span>{t('admin.works.title')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <Tabs defaultValue="apresentacao-oral" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="apresentacao-oral" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-2 px-1 sm:px-3">
              <Users className="h-4 w-4 shrink-0" />
              <span className="text-center leading-tight">{t('admin.works.oralPresentation')}</span>
            </TabsTrigger>
            <TabsTrigger value="sessoes-poster" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-2 px-1 sm:px-3">
              <Presentation className="h-4 w-4 shrink-0" />
              <span className="text-center leading-tight">{t('admin.works.posterSessions')}</span>
            </TabsTrigger>
            <TabsTrigger value="manuscritos" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-2 px-1 sm:px-3">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="text-center leading-tight">{t('admin.works.manuscripts')}</span>
            </TabsTrigger>
            <TabsTrigger value="templates-artigos-slides" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-2 px-1 sm:px-3">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="text-center leading-tight">Templates Artigos/Slides</span>
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
          
          <TabsContent value="templates-artigos-slides" className="mt-6">
            <WorkContentManager 
              workType="templates-artigos-slides" 
              title="Gestão de Conteúdo - Templates Artigos/Slides" 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WorksManager;