
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Recursos de tradução
const resources = {
  en: {
    translation: {
      header: {
        congress: "THE CONGRESS",
        presentation: "Presentation",
        committee: "Organization Committee",
        schedule: "SCHEDULE",
        inPerson: "In-Person",
        online: "Online",
        papers: "PAPERS",
        oralPresentation: "Oral Presentation",
        posterSessions: "Poster Sessions",
        manuscripts: "Accepted Manuscripts",
        thematicAreas: "THEMATIC AREAS",
        speakers: "SPEAKERS",
        registration: "REGISTRATION",
        contact: "CONTACT"
      },
      hero: {
        title1: "III International Multidisciplinary Congress",
        subtitle1: "Join us for three days of innovation and discovery",
        description1: "December 8-10, 2025 • Celebration, Florida",
        title2: "World-Class Speakers",
        subtitle2: "Learn from international experts in various fields",
        description2: "Keynote presentations and panel discussions",
        title3: "Submit Your Research",
        subtitle3: "Share your work with the global community",
        description3: "Oral presentations and poster sessions available",
        registerButton: "Register Here"
      },
      countdown: {
        title: "Event Starts In",
        description: "December 8-10, 2025 • Celebration, Florida",
        days: "Days",
        hours: "Hours",
        minutes: "Minutes",
        seconds: "Seconds"
      },
      schedule: {
        title: "CHECK THE CONGRESS SCHEDULE",
        description: "Choose your preferred format and explore our comprehensive program",
        inPersonTitle: "IN PERSON",
        inPersonDescription: "Live Experience in Celebration, FL",
        onlineTitle: "ONLINE",
        onlineDescription: "Virtual Participation via YouTube"
      },
      registration: {
        urgent: "🔥 FEW IN-PERSON SPOTS LEFT",
        title: "REGISTER NOW!",
        description: "Secure your spot at the premier multidisciplinary congress",
        batchInfo: "FIRST BATCH: November 1 - December 15, 2024",
        tier1: "Our Students and Partners",
        tier2: "Students from Other Institutions",
        tier3: "Other Professionals",
        features: {
          sessions: "Access to all sessions",
          certificate: "Digital certificate",
          materials: "Conference materials",
          networking: "Networking opportunities",
          coffee: "Coffee breaks included",
          discount: "Student discount applied",
          premium: "Premium networking access",
          meals: "All meals included",
          vip: "VIP reception access"
        },
        registerButton: "Register Here",
        mostPopular: "MOST POPULAR"
      },
      about: {
        title: "About the Congress",
        description: "The III International Multidisciplinary Congress of VCCU brings together researchers, academics, and professionals from diverse fields to share knowledge, foster collaboration, and drive innovation. Join us for an inspiring three-day journey of discovery and learning.",
        highlight1Title: "3 Days of Innovation",
        highlight1Desc: "Comprehensive program covering multiple disciplines",
        highlight2Title: "International Speakers",
        highlight2Desc: "Renowned experts from around the world",
        highlight3Title: "Live Streaming",
        highlight3Desc: "Selected sessions broadcast globally",
        highlight4Title: "Participation Certificate",
        highlight4Desc: "Official recognition for all attendees",
        learnMore: "Learn More About VCCU"
      },
      speakers: {
        title: "Keynote Speakers",
        description: "Learn from world-renowned experts who are shaping the future of their fields",
        previous: "← Previous",
        next: "Next →"
      },
      hybrid: {
        title: "Hybrid Format Experience",
        description: "Choose between in-person and online participation to suit your needs and preferences",
        whyChoose: "Why Choose Hybrid Format?",
        inPersonBenefits: "In-Person Benefits",
        onlineBenefits: "Online Benefits"
      }
    }
  },
  pt: {
    translation: {
      header: {
        congress: "O CONGRESSO",
        presentation: "Apresentação",
        committee: "Comitê Organizador",
        schedule: "PROGRAMAÇÃO",
        inPerson: "Presencial",
        online: "Online",
        papers: "TRABALHOS",
        oralPresentation: "Apresentação Oral",
        posterSessions: "Sessões de Pôster",
        manuscripts: "Manuscritos Aceitos",
        thematicAreas: "ÁREAS TEMÁTICAS",
        speakers: "PALESTRANTES",
        registration: "INSCRIÇÕES",
        contact: "CONTATO"
      },
      hero: {
        title1: "III Congresso Internacional Multidisciplinar",
        subtitle1: "Junte-se a nós por três dias de inovação e descoberta",
        description1: "8-10 de Dezembro, 2025 • Celebration, Flórida",
        title2: "Palestrantes de Classe Mundial",
        subtitle2: "Aprenda com especialistas internacionais em várias áreas",
        description2: "Palestras principais e discussões em painel",
        title3: "Submeta Sua Pesquisa",
        subtitle3: "Compartilhe seu trabalho com a comunidade global",
        description3: "Apresentações orais e sessões de pôster disponíveis",
        registerButton: "Inscreva-se Aqui"
      },
      countdown: {
        title: "Evento Começa Em",
        description: "8-10 de Dezembro, 2025 • Celebration, Flórida",
        days: "Dias",
        hours: "Horas",
        minutes: "Minutos",
        seconds: "Segundos"
      },
      schedule: {
        title: "CONFIRA A PROGRAMAÇÃO DO CONGRESSO",
        description: "Escolha seu formato preferido e explore nosso programa abrangente",
        inPersonTitle: "PRESENCIAL",
        inPersonDescription: "Experiência Ao Vivo em Celebration, FL",
        onlineTitle: "ONLINE",
        onlineDescription: "Participação Virtual via YouTube"
      },
      registration: {
        urgent: "🔥 POUCAS VAGAS PRESENCIAIS RESTANTES",
        title: "INSCREVA-SE AGORA!",
        description: "Garante sua vaga no principal congresso multidisciplinar",
        batchInfo: "PRIMEIRO LOTE: 1º de Novembro - 15 de Dezembro, 2024",
        tier1: "Nossos Estudantes e Parceiros",
        tier2: "Estudantes de Outras Instituições",
        tier3: "Outros Profissionais",
        features: {
          sessions: "Acesso a todas as sessões",
          certificate: "Certificado digital",
          materials: "Materiais da conferência",
          networking: "Oportunidades de networking",
          coffee: "Coffee breaks inclusos",
          discount: "Desconto estudantil aplicado",
          premium: "Acesso premium ao networking",
          meals: "Todas as refeições incluídas",
          vip: "Acesso à recepção VIP"
        },
        registerButton: "Inscreva-se Aqui",
        mostPopular: "MAIS POPULAR"
      },
      about: {
        title: "Sobre o Congresso",
        description: "O III Congresso Internacional Multidisciplinar da VCCU reúne pesquisadores, acadêmicos e profissionais de diversas áreas para compartilhar conhecimento, promover colaboração e impulsionar a inovação. Junte-se a nós em uma jornada inspiradora de três dias de descoberta e aprendizado.",
        highlight1Title: "3 Dias de Inovação",
        highlight1Desc: "Programa abrangente cobrindo múltiplas disciplinas",
        highlight2Title: "Palestrantes Internacionais",
        highlight2Desc: "Especialistas renomados de todo o mundo",
        highlight3Title: "Transmissão Ao Vivo",
        highlight3Desc: "Sessões selecionadas transmitidas globalmente",
        highlight4Title: "Certificado de Participação",
        highlight4Desc: "Reconhecimento oficial para todos os participantes",
        learnMore: "Saiba Mais Sobre a VCCU"
      },
      speakers: {
        title: "Palestrantes Principais",
        description: "Aprenda com especialistas de renome mundial que estão moldando o futuro de suas áreas",
        previous: "← Anterior",
        next: "Próximo →"
      },
      hybrid: {
        title: "Experiência em Formato Híbrido",
        description: "Escolha entre participação presencial e online para atender às suas necessidades e preferências",
        whyChoose: "Por Que Escolher Formato Híbrido?",
        inPersonBenefits: "Benefícios Presenciais",
        onlineBenefits: "Benefícios Online"
      }
    }
  },
  es: {
    translation: {
      header: {
        congress: "EL CONGRESO",
        presentation: "Presentación",
        committee: "Comité Organizador",
        schedule: "PROGRAMACIÓN",
        inPerson: "Presencial",
        online: "En Línea",
        papers: "TRABAJOS",
        oralPresentation: "Presentación Oral",
        posterSessions: "Sesiones de Póster",
        manuscripts: "Manuscritos Aceptados",
        thematicAreas: "ÁREAS TEMÁTICAS",
        speakers: "PONENTES",
        registration: "INSCRIPCIONES",
        contact: "CONTACTO"
      },
      hero: {
        title1: "III Congreso Internacional Multidisciplinario",
        subtitle1: "Únete a nosotros por tres días de innovación y descubrimiento",
        description1: "8-10 de Diciembre, 2025 • Celebration, Florida",
        title2: "Ponentes de Clase Mundial",
        subtitle2: "Aprende de expertos internacionales en varios campos",
        description2: "Conferencias magistrales y discusiones de panel",
        title3: "Envía Tu Investigación",
        subtitle3: "Comparte tu trabajo con la comunidad global",
        description3: "Presentaciones orales y sesiones de póster disponibles",
        registerButton: "Regístrate Aquí"
      },
      countdown: {
        title: "El Evento Comienza En",
        description: "8-10 de Diciembre, 2025 • Celebration, Florida",
        days: "Días",
        hours: "Horas",
        minutes: "Minutos",
        seconds: "Segundos"
      },
      schedule: {
        title: "CONSULTA LA PROGRAMACIÓN DEL CONGRESO",
        description: "Elige tu formato preferido y explora nuestro programa integral",
        inPersonTitle: "PRESENCIAL",
        inPersonDescription: "Experiencia en Vivo en Celebration, FL",
        onlineTitle: "EN LÍNEA",
        onlineDescription: "Participación Virtual vía YouTube"
      },
      registration: {
        urgent: "🔥 POCAS PLAZAS PRESENCIALES DISPONIBLES",
        title: "¡REGÍSTRATE AHORA!",
        description: "Asegura tu lugar en el congreso multidisciplinario premier",
        batchInfo: "PRIMER LOTE: 1 de Noviembre - 15 de Diciembre, 2024",
        tier1: "Nuestros Estudiantes y Socios",
        tier2: "Estudiantes de Otras Instituciones",
        tier3: "Otros Profesionales",
        features: {
          sessions: "Acceso a todas las sesiones",
          certificate: "Certificado digital",
          materials: "Materiales de la conferencia",
          networking: "Oportunidades de networking",
          coffee: "Pausas de café incluidas",
          discount: "Descuento estudiantil aplicado",
          premium: "Acceso premium al networking",
          meals: "Todas las comidas incluidas",
          vip: "Acceso a recepción VIP"
        },
        registerButton: "Regístrate Aquí",
        mostPopular: "MÁS POPULAR"
      },
      about: {
        title: "Sobre el Congreso",
        description: "El III Congreso Internacional Multidisciplinario de VCCU reúne a investigadores, académicos y profesionales de diversos campos para compartir conocimiento, fomentar la colaboración e impulsar la innovación. Únete a nosotros en un viaje inspirador de tres días de descubrimiento y aprendizaje.",
        highlight1Title: "3 Días de Innovación",
        highlight1Desc: "Programa integral que abarca múltiples disciplinas",
        highlight2Title: "Ponentes Internacionales",
        highlight2Desc: "Expertos de renombre de todo el mundo",
        highlight3Title: "Transmisión en Vivo",
        highlight3Desc: "Sesiones seleccionadas transmitidas globalmente",
        highlight4Title: "Certificado de Participación",
        highlight4Desc: "Reconocimiento oficial para todos los asistentes",
        learnMore: "Conoce Más Sobre VCCU"
      },
      speakers: {
        title: "Ponentes Principales",
        description: "Aprende de expertos de renombre mundial que están dando forma al futuro de sus campos",
        previous: "← Anterior",
        next: "Siguiente →"
      },
      hybrid: {
        title: "Experiencia en Formato Híbrido",
        description: "Elige entre participación presencial y en línea para satisfacer tus necesidades y preferencias",
        whyChoose: "¿Por Qué Elegir Formato Híbrido?",
        inPersonBenefits: "Benefícios Presenciales",
        onlineBenefits: "Benefícios En Línea"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
