
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
        contact: "CONTACT",
        adminArea: "Restricted Access"
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
        onlineDescription: "Virtual Participation via YouTube",
        inPersonButton: "View In-Person Schedule",
        onlineButton: "View Online Schedule",
        faceToFaceNetworking: "Face-to-face networking",
        interactiveWorkshops: "Interactive workshops",
        exhibitionStands: "Exhibition stands",
        liveStreaming: "Live streaming",
        qaSessions: "Q&A sessions",
        digitalCertificate: "Digital certificate"
      },
      registration: {
        urgent: "🔥 REGISTRATIONS OPEN",
        title: "REGISTER NOW!",
        description: "Secure your spot at the premier multidisciplinary congress",
        batchInfo: "FIRST BATCH: November 1 - December 15, 2024",
        tier1: "Our Students and Partners",
        tier2: "Students from Other Institutions",
        tier3: "Other Professionals",
        newTitle: "Register for III Civeni USA 2025",
        currentBatch: "Current Batch",
        daysRemaining: "days remaining",
        validUntil: "Valid until",
        formTitle: "Registration Form",
        fullName: "Full Name",
        email: "Email",
        category: "Category",
        selectCategory: "Select a category",
        couponCode: "Coupon Code",
        couponPlaceholder: "Enter coupon code",
        totalAmount: "Total Amount",
        free: "FREE",
        proofRequired: "* Proof required",
        processing: "Processing...",
        registerNow: "REGISTER NOW!",
        noBatchActive: "No registration batches are currently active.",
        verifyingPayment: "Verifying payment...",
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
        mostPopular: "MOST POPULAR",
        categories: {
          vccuStudentPresentation: "VCCU Students (with presentation)",
          vccuStudentListener: "VCCU Students (listener)",
          vccuProfessorPartner: "VCCU Professors and Partners",
          generalParticipant: "General Participants"
        },
        success: {
          title: "Registration Confirmed!",
          message: "Your registration has been processed successfully.",
          emailSent: "Receipt Sent",
          checkEmail: "Check your email for registration details.",
          nextSteps: "Next Steps:",
          step1: "Save your registration receipt",
          step2: "Stay tuned for email updates",
          step3: "Get ready for the event in December!",
          freeRegistration: "Free registration completed successfully!"
        },
        canceled: {
          title: "Payment Canceled",
          message: "Your payment was canceled. No charges were made.",
          noCharge: "No charges were made to your card."
        },
        error: {
          title: "Payment Error",
          message: "There was a problem processing your payment. Please try again."
        },
        errors: {
          batchError: "Error loading batch information",
          categoriesError: "Error loading categories",
          invalidCoupon: "Invalid coupon code",
          general: "Internal error. Please try again."
        },
        tryAgain: "Try Again"
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
        onlineBenefits: "Online Benefits",
        directNetworking: "Direct networking opportunities",
        handsOnWorkshops: "Hands-on workshop participation",
        accessExhibition: "Access to exhibition stands",
        faceToFaceInteractions: "Face-to-face interactions",
        globalAccessibility: "Global accessibility",
        costEffective: "Cost-effective participation",
        recordedSessions: "Recorded session access",
        interactiveQA: "Interactive Q&A sessions",
        exhibitionStands: "Exhibition Stands",
        exhibitionDesc: "Explore innovative research and technology displays",
        keynoteLectures: "Keynote Lectures",
        keynoteDesc: "Inspiring presentations from world-class speakers",
        panelDiscussions: "Panel Discussions",
        panelDesc: "Interactive debates on cutting-edge topics",
        oralCommunications: "Oral Communications",
        oralDesc: "Present your research to an international audience"
      },
      venue: {
        title: "Event Location",
        description: "Join us in beautiful Celebration, Florida, or participate online from anywhere in the world",
        inPersonVenue: "In-Person Venue",
        onlinePlatform: "Online Platform",
        facilities: "Facilities",
        features: "Features",
        gettingTo: "Getting to Celebration, FL",
        byAir: "By Air",
        byCar: "By Car",
        accommodation: "Accommodation",
        airportDesc: "Orlando International Airport (MCO)\n20 minutes drive to venue\nMultiple airlines and connections",
        carDesc: "Easy access via I-4\nFree parking available\nGPS: 123 Innovation Drive",
        hotelDesc: "Partner hotels nearby\nSpecial congress rates\nShuttle service available"
      },
      partners: {
        title: "Our Partners",
        description: "Proudly organized and supported by leading international institutions",
        organizedBy: "Promoted and Organized By",
        academicPartners: "Academic Partners",
        becomePartner: "Become a Partner",
        partnerDesc: "Join our network of prestigious institutions and help advance multidisciplinary research",
        partnerButton: "Partnership Opportunities"
      },
      videos: {
        watchVideo: "Watch Video",
        maximize: "Maximize",
        minimize: "Minimize",
        openYoutube: "Open on YouTube",
        close: "Close",
        registerButton: "Register for III Civeni 2025"
      },
      footer: {
        quickLinks: "Quick Links",
        contactInfo: "Contact Info",
        about: "About",
        schedule: "Schedule",
        speakers: "Speakers",
        registration: "Registration",
        contact: "Contact",
        copyright: "© 2024 VCCU. All rights reserved.",
        organizedBy: "Organized by VCCU & Hope and Justice",
        privacyPolicy: "Privacy Policy | Terms of Service"
      },
      common: {
        backToHome: "Back to Home"
      }
    }
  },
  pt: {
    translation: {
      header: {
        home: "Início",
        about: "Sobre",
        schedule: "Cronograma",
        speakers: "Palestrantes",
        registration: "Inscrições",
        contact: "Contato",
        adminArea: "Área Restrita"
      },
      footer: {
        about: "Sobre",
        schedule: "Cronograma", 
        speakers: "Palestrantes",
        registration: "Inscrições",
        contact: "Contato",
        quickLinks: "Links Rápidos",
        contactInfo: "Informações de Contato",
        copyright: "© 2025 III Civeni USA. Todos os direitos reservados.",
        privacyPolicy: "Política de Privacidade"
      },
      registration: {
        urgent: "INSCRIÇÕES ABERTAS",
        newTitle: "Inscreva-se no III Civeni USA 2025",
        currentBatch: "Lote Atual",
        daysRemaining: "dias restantes",
        validUntil: "Válido até",
        formTitle: "Formulário de Inscrição",
        fullName: "Nome Completo",
        email: "E-mail",
        category: "Categoria",
        selectCategory: "Selecione uma categoria",
        couponCode: "Código do Cupom",
        couponPlaceholder: "Digite o código do cupom",
        totalAmount: "Valor Total",
        free: "GRATUITO",
        proofRequired: "* Comprovante obrigatório",
        processing: "Processando...",
        registerNow: "INSCREVER-SE AGORA!",
        noBatchActive: "Não há lotes de inscrição ativos no momento.",
        verifyingPayment: "Verificando pagamento...",
        categories: {
          vccuStudentPresentation: "Alunos VCCU (com apresentação)",
          vccuStudentListener: "Alunos VCCU (ouvinte)",
          vccuProfessorPartner: "Professores VCCU e Parceiros",
          generalParticipant: "Demais Participantes"
        },
        success: {
          title: "Inscrição Confirmada!",
          message: "Sua inscrição foi processada com sucesso.",
          emailSent: "Comprovante Enviado",
          checkEmail: "Verifique seu e-mail para detalhes da inscrição.",
          nextSteps: "Próximos Passos:",
          step1: "Guarde seu comprovante de inscrição",
          step2: "Fique atento aos e-mails com atualizações",
          step3: "Prepare-se para o evento em dezembro!",
          freeRegistration: "Inscrição gratuita realizada com sucesso!"
        },
        canceled: {
          title: "Pagamento Cancelado",
          message: "Seu pagamento foi cancelado. Nenhuma cobrança foi realizada.",
          noCharge: "Nenhuma cobrança foi feita em seu cartão."
        },
        error: {
          title: "Erro no Pagamento",
          message: "Houve um problema ao processar seu pagamento. Tente novamente."
        },
        errors: {
          batchError: "Erro ao carregar informações do lote",
          categoriesError: "Erro ao carregar categorias",
          invalidCoupon: "Código de cupom inválido",
          general: "Erro interno. Tente novamente."
        },
        tryAgain: "Tentar Novamente"
      },
      common: {
        backToHome: "Voltar ao Início"
      },
      videos: {
        watchVideo: "Assistir Vídeo",
        maximize: "Maximizar",
        minimize: "Minimizar",
        openYoutube: "Abrir no YouTube",
        close: "Fechar",
        registerButton: "Regístrate no III Civeni 2025"
      }
    }
  },
  es: {
    translation: {
      header: {
        home: "Inicio",
        about: "Acerca",
        schedule: "Cronograma",
        speakers: "Ponentes",
        registration: "Inscripción",
        contact: "Contacto",
        adminArea: "Acceso Restringido"
      },
      footer: {
        about: "Acerca",
        schedule: "Cronograma",
        speakers: "Ponentes",
        registration: "Inscripción", 
        contact: "Contacto",
        quickLinks: "Enlaces Rápidos",
        contactInfo: "Información de Contacto",
        copyright: "© 2025 III Civeni USA. Todos los derechos reservados.",
        privacyPolicy: "Política de Privacidad"
      },
      registration: {
        urgent: "INSCRIPCIONES ABIERTAS",
        newTitle: "Inscríbete en III Civeni USA 2025",
        currentBatch: "Lote Actual",
        daysRemaining: "días restantes",
        validUntil: "Válido hasta",
        formTitle: "Formulario de Inscripción",
        fullName: "Nombre Completo",
        email: "Correo Electrónico",
        category: "Categoría",
        selectCategory: "Seleccione una categoría",
        couponCode: "Código de Cupón",
        couponPlaceholder: "Ingrese el código de cupón",
        totalAmount: "Monto Total",
        free: "GRATIS",
        proofRequired: "* Comprobante obligatorio",
        processing: "Procesando...",
        registerNow: "¡INSCRIBIRSE AHORA!",
        noBatchActive: "No hay lotes de inscripción activos en este momento.",
        verifyingPayment: "Verificando pago...",
        categories: {
          vccuStudentPresentation: "Estudiantes VCCU (con presentación)",
          vccuStudentListener: "Estudiantes VCCU (oyente)",
          vccuProfessorPartner: "Profesores VCCU y Socios",
          generalParticipant: "Demás Participantes"
        },
        success: {
          title: "¡Inscripción Confirmada!",
          message: "Su inscripción ha sido procesada exitosamente.",
          emailSent: "Comprobante Enviado",
          checkEmail: "Revise su correo para detalles de la inscripción.",
          nextSteps: "Próximos Pasos:",
          step1: "Guarde su comprobante de inscripción",
          step2: "Esté atento a los correos con actualizaciones",
          step3: "¡Prepárese para el evento en diciembre!",
          freeRegistration: "¡Inscripción gratuita completada exitosamente!"
        },
        canceled: {
          title: "Pago Cancelado",
          message: "Su pago fue cancelado. No se realizaron cargos.",
          noCharge: "No se realizaron cargos a su tarjeta."
        },
        error: {
          title: "Error en el Pago",
          message: "Hubo un problema al procesar su pago. Inténtelo de nuevo."
        },
        errors: {
          batchError: "Error al cargar información del lote",
          categoriesError: "Error al cargar categorías",
          invalidCoupon: "Código de cupón inválido",
          general: "Error interno. Inténtelo de nuevo."
        },
        tryAgain: "Intentar de Nuevo"
      },
      common: {
        backToHome: "Volver al Inicio"
      },
      videos: {
        watchVideo: "Ver Video",
        minimize: "Minimizar",
        maximize: "Maximizar",
        openYoutube: "Abrir en YouTube", 
        close: "Cerrar",
        registerButton: "Inscríbete en III Civeni 2025"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
