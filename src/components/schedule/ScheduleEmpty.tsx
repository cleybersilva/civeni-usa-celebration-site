
import React from 'react';
import { Calendar } from 'lucide-react';

const ScheduleEmpty: React.FC = () => {
  return (
    <div className="text-center py-12">
      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-600 mb-2">
        Nenhuma atividade encontrada
      </h3>
      <p className="text-gray-500">
        Ajuste os filtros ou volte mais tarde para ver a programação.
      </p>
    </div>
  );
};

export default ScheduleEmpty;
