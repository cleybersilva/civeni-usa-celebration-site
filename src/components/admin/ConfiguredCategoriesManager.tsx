import React from 'react';
import EventCategoriesManager from './EventCategoriesManager';
import ParticipantTypesManager from './ParticipantTypesManager';

const ConfiguredCategoriesManager = () => {
  return (
    <div className="space-y-6">
      <EventCategoriesManager />
      <ParticipantTypesManager />
    </div>
  );
};

export default ConfiguredCategoriesManager;