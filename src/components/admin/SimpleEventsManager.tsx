import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';

const SimpleEventsManager = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Gerenciar Eventos
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie eventos, palestras e atividades
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lista de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">
              Nenhum evento encontrado
            </p>
            <p className="text-gray-500">
              Clique em "Novo Evento" para criar seu primeiro evento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleEventsManager;