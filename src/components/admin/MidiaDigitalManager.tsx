import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Image, Play, Layers } from 'lucide-react';
import VideosManager from './VideosManager';
import CiveniII2024ImagesManager from './CiveniII2024ImagesManager';
import BannerManager from './BannerManager';

const MidiaDigitalManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('videos');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          {t('admin.digitalMedia.title', 'Mídia Digital')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          {t('admin.digitalMedia.description', 'Gerencie todos os conteúdos visuais e audiovisuais do evento')}
        </p>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1 sm:gap-0">
              <TabsTrigger value="videos" className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
                <Play className="h-4 w-4 shrink-0" />
                <span className="truncate">{t('admin.digitalMedia.videos2024', 'Vídeos 2024')}</span>
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
                <Image className="h-4 w-4 shrink-0" />
                <span className="truncate">{t('admin.digitalMedia.images2024', 'Imagens 2024')}</span>
              </TabsTrigger>
              <TabsTrigger value="banners" className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
                <Layers className="h-4 w-4 shrink-0" />
                <span className="truncate">{t('admin.digitalMedia.banners', 'Banners')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-4 sm:mt-6">
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {t('admin.digitalMedia.videosTitle', 'Gerenciar Vídeos')}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t('admin.digitalMedia.videosDesc', 'Vídeos oficiais do II CIVENI 2024 e futuros eventos')}
                  </p>
                </div>
                <VideosManager />
              </div>
            </TabsContent>

            <TabsContent value="images" className="mt-4 sm:mt-6">
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {t('admin.digitalMedia.imagesTitle', 'Galeria de Imagens')}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t('admin.digitalMedia.imagesDesc', 'Imagens oficiais do II CIVENI 2024')}
                  </p>
                </div>
                <CiveniII2024ImagesManager />
              </div>
            </TabsContent>

            <TabsContent value="banners" className="mt-4 sm:mt-6">
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {t('admin.digitalMedia.bannersTitle', 'Gerenciar Banners')}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t('admin.digitalMedia.bannersDesc', 'Banners utilizados no site e materiais de divulgação')}
                  </p>
                </div>
                <BannerManager />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MidiaDigitalManager;
