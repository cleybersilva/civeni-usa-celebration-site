// Course name translations
// Since the database only has Portuguese names, we provide translations here
export const courseTranslations: Record<string, { en: string; es: string }> = {
  'Doutorado em Ciências Jurídicas': {
    en: 'PhD in Legal Sciences',
    es: 'Doctorado en Ciencias Jurídicas'
  },
  'Mestrado em Ciências Jurídicas': {
    en: 'Master in Legal Sciences',
    es: 'Maestría en Ciencias Jurídicas'
  },
  'Direito': {
    en: 'Law',
    es: 'Derecho'
  },
  'Administração': {
    en: 'Business Administration',
    es: 'Administración'
  },
  'Ciências Contábeis': {
    en: 'Accounting',
    es: 'Ciencias Contables'
  },
  'Engenharia Civil': {
    en: 'Civil Engineering',
    es: 'Ingeniería Civil'
  },
  'Arquitetura e Urbanismo': {
    en: 'Architecture and Urbanism',
    es: 'Arquitectura y Urbanismo'
  },
  'Medicina': {
    en: 'Medicine',
    es: 'Medicina'
  },
  'Enfermagem': {
    en: 'Nursing',
    es: 'Enfermería'
  },
  'Farmácia': {
    en: 'Pharmacy',
    es: 'Farmacia'
  },
  'Fisioterapia': {
    en: 'Physical Therapy',
    es: 'Fisioterapia'
  },
  'Odontologia': {
    en: 'Dentistry',
    es: 'Odontología'
  },
  'Psicologia': {
    en: 'Psychology',
    es: 'Psicología'
  },
  'Pedagogia': {
    en: 'Pedagogy',
    es: 'Pedagogía'
  },
  'Letras': {
    en: 'Letters',
    es: 'Letras'
  },
  'História': {
    en: 'History',
    es: 'Historia'
  },
  'Geografia': {
    en: 'Geography',
    es: 'Geografía'
  },
  'Matemática': {
    en: 'Mathematics',
    es: 'Matemáticas'
  },
  'Física': {
    en: 'Physics',
    es: 'Física'
  },
  'Química': {
    en: 'Chemistry',
    es: 'Química'
  },
  'Biologia': {
    en: 'Biology',
    es: 'Biología'
  },
  'Educação Física': {
    en: 'Physical Education',
    es: 'Educación Física'
  },
  'Ciências da Computação': {
    en: 'Computer Science',
    es: 'Ciencias de la Computación'
  },
  'Sistemas de Informação': {
    en: 'Information Systems',
    es: 'Sistemas de Información'
  },
  'Engenharia de Software': {
    en: 'Software Engineering',
    es: 'Ingeniería de Software'
  },
  'Design': {
    en: 'Design',
    es: 'Diseño'
  },
  'Publicidade e Propaganda': {
    en: 'Advertising and Marketing',
    es: 'Publicidad y Propaganda'
  },
  'Jornalismo': {
    en: 'Journalism',
    es: 'Periodismo'
  },
  'Relações Internacionais': {
    en: 'International Relations',
    es: 'Relaciones Internacionales'
  },
  'Economia': {
    en: 'Economics',
    es: 'Economía'
  },
  'Ciências Sociais': {
    en: 'Social Sciences',
    es: 'Ciencias Sociales'
  },
  'Filosofia': {
    en: 'Philosophy',
    es: 'Filosofía'
  },
  'Teologia': {
    en: 'Theology',
    es: 'Teología'
  },
  'Serviço Social': {
    en: 'Social Work',
    es: 'Trabajo Social'
  },
  'Nutrição': {
    en: 'Nutrition',
    es: 'Nutrición'
  },
  'Medicina Veterinária': {
    en: 'Veterinary Medicine',
    es: 'Medicina Veterinaria'
  },
  'Zootecnia': {
    en: 'Animal Science',
    es: 'Zootecnia'
  },
  'Agronomia': {
    en: 'Agronomy',
    es: 'Agronomía'
  },
  'Engenharia Elétrica': {
    en: 'Electrical Engineering',
    es: 'Ingeniería Eléctrica'
  },
  'Engenharia Mecânica': {
    en: 'Mechanical Engineering',
    es: 'Ingeniería Mecánica'
  },
  'Engenharia de Produção': {
    en: 'Production Engineering',
    es: 'Ingeniería de Producción'
  },
  'Engenharia Química': {
    en: 'Chemical Engineering',
    es: 'Ingeniería Química'
  },
  'Engenharia Ambiental': {
    en: 'Environmental Engineering',
    es: 'Ingeniería Ambiental'
  },
  'Biomedicina': {
    en: 'Biomedicine',
    es: 'Biomedicina'
  },
  'Gastronomia': {
    en: 'Gastronomy',
    es: 'Gastronomía'
  },
  'Turismo': {
    en: 'Tourism',
    es: 'Turismo'
  },
  'Hotelaria': {
    en: 'Hospitality',
    es: 'Hotelería'
  }
};

export const getTranslatedCourseName = (courseName: string, language: string): string => {
  // Return original if Portuguese or no translation available
  if (language === 'pt' || !courseTranslations[courseName]) {
    return courseName;
  }
  
  // Return English or Spanish translation
  if (language === 'en') {
    return courseTranslations[courseName].en;
  }
  
  if (language === 'es') {
    return courseTranslations[courseName].es;
  }
  
  // Fallback to original
  return courseName;
};
