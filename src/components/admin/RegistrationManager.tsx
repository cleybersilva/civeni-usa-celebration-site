
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CouponManager from './CouponManager';
import FormConfigManager from './FormConfigManager';
import ConfiguredCategoriesManager from './ConfiguredCategoriesManager';
import RegistrantsManager from './RegistrantsManager';

const RegistrationManager = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Gerenciamento de Inscrições</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gerencie inscritos, cupons, categorias e formulários
        </p>
      </div>

      <Tabs defaultValue="registrants" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
          <TabsTrigger value="registrants" className="text-xs sm:text-sm py-2">Inscritos</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm py-2">Categorias</TabsTrigger>
          <TabsTrigger value="coupons" className="text-xs sm:text-sm py-2">Cupons</TabsTrigger>
          <TabsTrigger value="form-config" className="text-xs sm:text-sm py-2">Formulário</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registrants">
          <RegistrantsManager />
        </TabsContent>
        
        <TabsContent value="categories">
          <ConfiguredCategoriesManager />
        </TabsContent>
        
        <TabsContent value="coupons">
          <CouponManager />
        </TabsContent>

        <TabsContent value="form-config">
          <FormConfigManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegistrationManager;
