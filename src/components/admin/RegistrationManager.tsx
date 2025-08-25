
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CouponManager from './CouponManager';
import FormConfigManager from './FormConfigManager';
import ConfiguredCategoriesManager from './ConfiguredCategoriesManager';

const RegistrationManager = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Inscrições</h2>
        <p className="text-muted-foreground">
          Configure cupons, categorias e formulários
        </p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categorias Configuradas</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="form-config">Configurações do Formulário</TabsTrigger>
        </TabsList>
        
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
