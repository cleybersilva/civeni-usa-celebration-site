import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BatchManager from './form-config/BatchManager';
import CategoriesManager from './form-config/CategoriesManager';
import CoursesManager from './form-config/CoursesManager';
import ClassesManager from './form-config/ClassesManager';

const FormConfigManager = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t('admin.formConfig.title', 'Configurações do Formulário')}
        </h2>
        <p className="text-muted-foreground">
          {t('admin.formConfig.subtitle', 'Gerencie todos os aspectos do formulário de inscrições')}
        </p>
      </div>

      <Tabs defaultValue="batches" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="batches">
            {t('admin.formConfig.batches', 'Lotes')}
          </TabsTrigger>
          <TabsTrigger value="categories">
            {t('admin.formConfig.categories', 'Categorias')}
          </TabsTrigger>
          <TabsTrigger value="courses">
            {t('admin.formConfig.courses', 'Cursos')}
          </TabsTrigger>
          <TabsTrigger value="classes">
            {t('admin.formConfig.classes', 'Turmas')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.formConfig.batchesTitle', 'Gestão de Lotes de Inscrição')}</CardTitle>
            </CardHeader>
            <CardContent>
              <BatchManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.formConfig.categoriesTitle', 'Categorias de Participação')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoriesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.formConfig.coursesTitle', 'Cursos do Evento')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CoursesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.formConfig.classesTitle', 'Turmas por Curso')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ClassesManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormConfigManager;