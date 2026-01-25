export type Language = 'en' | 'es' | 'fr' | 'pt' | 'ar';

export interface Translations {
  // Sidebar
  sidebar: {
    title: string;
    subtitle: string;
    overview: string;
    analytics: string;
    syncStatus: string;
  };
  // Overview Page
  overview: {
    title: string;
    description: string;
    totalRecords: string;
    lastSync: string;
    appStatus: string;
    quickActions: string;
    quickActionsDescription: string;
  };
  // Analytics Page
  analytics: {
    title: string;
    description: string;
    comingSoon: string;
    comingSoonDescription: string;
    totalSites: string;
    activeProjects: string;
    dataPoints: string;
    lastUpdated: string;
  };
  // Sync Status Page
  sync: {
    title: string;
    description: string;
    currentStatus: string;
    online: string;
    offline: string;
    syncing: string;
    onlineDescription: string;
    offlineDescription: string;
    syncingDescription: string;
    connected: string;
    disconnected: string;
    synchronizing: string;
    aboutSyncStatus: string;
    aboutSyncDescription1: string;
    aboutSyncDescription2: string;
    aboutSyncNote: string;
    demoToggleLabel: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    sidebar: {
      title: 'Water Mapper',
      subtitle: 'NGO Dashboard',
      overview: 'Overview',
      analytics: 'Analytics',
      syncStatus: 'Sync Status',
    },
    overview: {
      title: 'Welcome to Your Dashboard',
      description: "Overview of your NGO's water mapping data and system status",
      totalRecords: 'Total Records',
      lastSync: 'Last Sync',
      appStatus: 'App Status',
      quickActions: 'Quick Actions',
      quickActionsDescription:
        'Navigate to Analytics or Sync Status using the sidebar to view more details about your data and synchronization.',
    },
    analytics: {
      title: 'Analytics',
      description: 'Data insights and visualizations for your water mapping operations',
      comingSoon: 'Coming Soon',
      comingSoonDescription:
        'Analytics and data visualizations will be available here. This section will display charts, statistics, and insights from your water mapping data.',
      totalSites: 'Total Sites',
      activeProjects: 'Active Projects',
      dataPoints: 'Data Points',
      lastUpdated: 'Last Updated',
    },
    sync: {
      title: 'Sync Status',
      description: 'Monitor the synchronization status of your local data with the cloud',
      currentStatus: 'Current Status:',
      online: 'Online',
      offline: 'Offline',
      syncing: 'Syncing',
      onlineDescription: 'All systems operational. Data is syncing normally.',
      offlineDescription: 'No connection detected. Changes will sync when connection is restored.',
      syncingDescription: 'Synchronizing data with the server. Please wait...',
      connected: 'Connected',
      disconnected: 'Disconnected',
      synchronizing: 'Synchronizing...',
      aboutSyncStatus: 'About Sync Status',
      aboutSyncDescription1:
        'This dashboard shows the real-time synchronization status between your local database and the cloud.',
      aboutSyncDescription2:
        'When online, changes are automatically synced. When offline, all changes are stored locally and will sync when connection is restored.',
      aboutSyncNote: 'Note: This is a placeholder UI. PowerSync integration will be added in a future update.',
      demoToggleLabel: 'Demo: Toggle status (for development only)',
    },
  },
  es: {
    sidebar: {
      title: 'Water Mapper',
      subtitle: 'Panel de ONG',
      overview: 'Resumen',
      analytics: 'Análisis',
      syncStatus: 'Estado de Sincronización',
    },
    overview: {
      title: 'Bienvenido a su Panel',
      description: 'Resumen de los datos de mapeo de agua de su ONG y el estado del sistema',
      totalRecords: 'Registros Totales',
      lastSync: 'Última Sincronización',
      appStatus: 'Estado de la Aplicación',
      quickActions: 'Acciones Rápidas',
      quickActionsDescription:
        'Navegue a Análisis o Estado de Sincronización usando la barra lateral para ver más detalles sobre sus datos y sincronización.',
    },
    analytics: {
      title: 'Análisis',
      description: 'Información y visualizaciones de datos para sus operaciones de mapeo de agua',
      comingSoon: 'Próximamente',
      comingSoonDescription:
        'Los análisis y visualizaciones de datos estarán disponibles aquí. Esta sección mostrará gráficos, estadísticas e información de sus datos de mapeo de agua.',
      totalSites: 'Sitios Totales',
      activeProjects: 'Proyectos Activos',
      dataPoints: 'Puntos de Datos',
      lastUpdated: 'Última Actualización',
    },
    sync: {
      title: 'Estado de Sincronización',
      description: 'Monitoree el estado de sincronización de sus datos locales con la nube',
      currentStatus: 'Estado Actual:',
      online: 'En Línea',
      offline: 'Sin Conexión',
      syncing: 'Sincronizando',
      onlineDescription: 'Todos los sistemas operativos. Los datos se están sincronizando normalmente.',
      offlineDescription: 'No se detectó conexión. Los cambios se sincronizarán cuando se restaure la conexión.',
      syncingDescription: 'Sincronizando datos con el servidor. Por favor espere...',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      synchronizing: 'Sincronizando...',
      aboutSyncStatus: 'Acerca del Estado de Sincronización',
      aboutSyncDescription1:
        'Este panel muestra el estado de sincronización en tiempo real entre su base de datos local y la nube.',
      aboutSyncDescription2:
        'Cuando está en línea, los cambios se sincronizan automáticamente. Cuando está sin conexión, todos los cambios se almacenan localmente y se sincronizarán cuando se restaure la conexión.',
      aboutSyncNote: 'Nota: Esta es una interfaz de marcador de posición. La integración de PowerSync se agregará en una actualización futura.',
      demoToggleLabel: 'Demo: Alternar estado (solo para desarrollo)',
    },
  },
  fr: {
    sidebar: {
      title: 'Water Mapper',
      subtitle: 'Tableau de Bord ONG',
      overview: 'Vue d\'ensemble',
      analytics: 'Analyses',
      syncStatus: 'État de Synchronisation',
    },
    overview: {
      title: 'Bienvenue sur votre Tableau de Bord',
      description: 'Vue d\'ensemble des données de cartographie de l\'eau de votre ONG et de l\'état du système',
      totalRecords: 'Enregistrements Totaux',
      lastSync: 'Dernière Synchronisation',
      appStatus: 'État de l\'Application',
      quickActions: 'Actions Rapides',
      quickActionsDescription:
        'Naviguez vers Analyses ou État de Synchronisation en utilisant la barre latérale pour voir plus de détails sur vos données et la synchronisation.',
    },
    analytics: {
      title: 'Analyses',
      description: 'Informations et visualisations de données pour vos opérations de cartographie de l\'eau',
      comingSoon: 'Bientôt Disponible',
      comingSoonDescription:
        'Les analyses et visualisations de données seront disponibles ici. Cette section affichera des graphiques, des statistiques et des informations de vos données de cartographie de l\'eau.',
      totalSites: 'Sites Totaux',
      activeProjects: 'Projets Actifs',
      dataPoints: 'Points de Données',
      lastUpdated: 'Dernière Mise à Jour',
    },
    sync: {
      title: 'État de Synchronisation',
      description: 'Surveillez l\'état de synchronisation de vos données locales avec le cloud',
      currentStatus: 'État Actuel:',
      online: 'En Ligne',
      offline: 'Hors Ligne',
      syncing: 'Synchronisation',
      onlineDescription: 'Tous les systèmes opérationnels. Les données se synchronisent normalement.',
      offlineDescription: 'Aucune connexion détectée. Les modifications seront synchronisées lorsque la connexion sera rétablie.',
      syncingDescription: 'Synchronisation des données avec le serveur. Veuillez patienter...',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      synchronizing: 'Synchronisation...',
      aboutSyncStatus: 'À Propos de l\'État de Synchronisation',
      aboutSyncDescription1:
        'Ce tableau de bord affiche l\'état de synchronisation en temps réel entre votre base de données locale et le cloud.',
      aboutSyncDescription2:
        'Lorsque vous êtes en ligne, les modifications sont automatiquement synchronisées. Lorsque vous êtes hors ligne, toutes les modifications sont stockées localement et seront synchronisées lorsque la connexion sera rétablie.',
      aboutSyncNote: 'Note: Ceci est une interface de démonstration. L\'intégration PowerSync sera ajoutée dans une mise à jour future.',
      demoToggleLabel: 'Démo: Basculer l\'état (pour le développement uniquement)',
    },
  },
  pt: {
    sidebar: {
      title: 'Water Mapper',
      subtitle: 'Painel de ONG',
      overview: 'Visão Geral',
      analytics: 'Análises',
      syncStatus: 'Status de Sincronização',
    },
    overview: {
      title: 'Bem-vindo ao seu Painel',
      description: 'Visão geral dos dados de mapeamento de água da sua ONG e status do sistema',
      totalRecords: 'Registros Totais',
      lastSync: 'Última Sincronização',
      appStatus: 'Status do Aplicativo',
      quickActions: 'Ações Rápidas',
      quickActionsDescription:
        'Navegue para Análises ou Status de Sincronização usando a barra lateral para ver mais detalhes sobre seus dados e sincronização.',
    },
    analytics: {
      title: 'Análises',
      description: 'Insights e visualizações de dados para suas operações de mapeamento de água',
      comingSoon: 'Em Breve',
      comingSoonDescription:
        'Análises e visualizações de dados estarão disponíveis aqui. Esta seção exibirá gráficos, estatísticas e insights de seus dados de mapeamento de água.',
      totalSites: 'Sites Totais',
      activeProjects: 'Projetos Ativos',
      dataPoints: 'Pontos de Dados',
      lastUpdated: 'Última Atualização',
    },
    sync: {
      title: 'Status de Sincronização',
      description: 'Monitore o status de sincronização dos seus dados locais com a nuvem',
      currentStatus: 'Status Atual:',
      online: 'Online',
      offline: 'Offline',
      syncing: 'Sincronizando',
      onlineDescription: 'Todos os sistemas operacionais. Os dados estão sincronizando normalmente.',
      offlineDescription: 'Nenhuma conexão detectada. As alterações serão sincronizadas quando a conexão for restaurada.',
      syncingDescription: 'Sincronizando dados com o servidor. Por favor aguarde...',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      synchronizing: 'Sincronizando...',
      aboutSyncStatus: 'Sobre o Status de Sincronização',
      aboutSyncDescription1:
        'Este painel mostra o status de sincronização em tempo real entre seu banco de dados local e a nuvem.',
      aboutSyncDescription2:
        'Quando online, as alterações são sincronizadas automaticamente. Quando offline, todas as alterações são armazenadas localmente e serão sincronizadas quando a conexão for restaurada.',
      aboutSyncNote: 'Nota: Esta é uma interface de demonstração. A integração PowerSync será adicionada em uma atualização futura.',
      demoToggleLabel: 'Demo: Alternar status (apenas para desenvolvimento)',
    },
  },
  ar: {
    sidebar: {
      title: 'Water Mapper',
      subtitle: 'لوحة تحكم المنظمات غير الحكومية',
      overview: 'نظرة عامة',
      analytics: 'التحليلات',
      syncStatus: 'حالة المزامنة',
    },
    overview: {
      title: 'مرحباً بك في لوحة التحكم',
      description: 'نظرة عامة على بيانات رسم خرائط المياه لمنظمتك غير الحكومية وحالة النظام',
      totalRecords: 'إجمالي السجلات',
      lastSync: 'آخر مزامنة',
      appStatus: 'حالة التطبيق',
      quickActions: 'إجراءات سريعة',
      quickActionsDescription:
        'انتقل إلى التحليلات أو حالة المزامنة باستخدام الشريط الجانبي لعرض المزيد من التفاصيل حول بياناتك والمزامنة.',
    },
    analytics: {
      title: 'التحليلات',
      description: 'رؤى البيانات والتصورات لعمليات رسم خرائط المياه الخاصة بك',
      comingSoon: 'قريباً',
      comingSoonDescription:
        'ستكون التحليلات وتصورات البيانات متاحة هنا. ستعرض هذه القسم الرسوم البيانية والإحصائيات والرؤى من بيانات رسم خرائط المياه الخاصة بك.',
      totalSites: 'إجمالي المواقع',
      activeProjects: 'المشاريع النشطة',
      dataPoints: 'نقاط البيانات',
      lastUpdated: 'آخر تحديث',
    },
    sync: {
      title: 'حالة المزامنة',
      description: 'راقب حالة المزامنة لبياناتك المحلية مع السحابة',
      currentStatus: 'الحالة الحالية:',
      online: 'متصل',
      offline: 'غير متصل',
      syncing: 'جاري المزامنة',
      onlineDescription: 'جميع الأنظمة تعمل. البيانات تتم مزامنتها بشكل طبيعي.',
      offlineDescription: 'لم يتم اكتشاف اتصال. سيتم مزامنة التغييرات عند استعادة الاتصال.',
      syncingDescription: 'جاري مزامنة البيانات مع الخادم. يرجى الانتظار...',
      connected: 'متصل',
      disconnected: 'غير متصل',
      synchronizing: 'جاري المزامنة...',
      aboutSyncStatus: 'حول حالة المزامنة',
      aboutSyncDescription1:
        'تعرض هذه اللوحة حالة المزامنة في الوقت الفعلي بين قاعدة البيانات المحلية والسحابة.',
      aboutSyncDescription2:
        'عند الاتصال، يتم مزامنة التغييرات تلقائياً. عند عدم الاتصال، يتم تخزين جميع التغييرات محلياً وسيتم مزامنتها عند استعادة الاتصال.',
      aboutSyncNote: 'ملاحظة: هذه واجهة تجريبية. سيتم إضافة تكامل PowerSync في تحديث مستقبلي.',
      demoToggleLabel: 'تجريبي: تبديل الحالة (للتطوير فقط)',
    },
  },
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  ar: 'العربية',
};
