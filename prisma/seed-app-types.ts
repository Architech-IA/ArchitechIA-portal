import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando tipos de mini-apps...');

  const appTypes = [
    {
      slug: 'crm',
      name: 'CRM',
      description: 'Gestión de relaciones con clientes, leads y oportunidades comerciales.',
      icon: 'Users',
      color: 'from-blue-500 to-indigo-600',
      category: 'comercial',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          modules: {
            type: 'array',
            title: 'Módulos activos',
            items: { type: 'string', enum: ['dashboard', 'contacts', 'deals', 'tasks', 'reports'] },
          },
          pipelineStages: {
            type: 'array',
            title: 'Etapas del pipeline',
            items: { type: 'string' },
          },
          theme: { type: 'string', title: 'Tema', enum: ['light', 'dark'], default: 'dark' },
        },
        required: ['companyName'],
      },
      defaultConfig: {
        modules: ['dashboard', 'contacts', 'deals'],
        pipelineStages: ['Nuevo', 'Contactado', 'Propuesta', 'Negociación', 'Cerrado'],
        theme: 'dark',
      },
    },
    {
      slug: 'landing-page',
      name: 'Landing Page',
      description: 'Página de aterrizaje para campañas de marketing y captación de leads.',
      icon: 'Layout',
      color: 'from-pink-500 to-rose-600',
      category: 'marketing',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          headline: { type: 'string', title: 'Título principal' },
          subheadline: { type: 'string', title: 'Subtítulo' },
          ctaText: { type: 'string', title: 'Texto del botón CTA', default: 'Solicitar demo' },
          formFields: {
            type: 'array',
            title: 'Campos del formulario',
            items: { type: 'string' },
          },
          primaryColor: { type: 'string', title: 'Color primario', default: '#FF5A00' },
        },
        required: ['headline'],
      },
      defaultConfig: {
        headline: 'Transforma tu negocio con IA',
        subheadline: 'Automatiza procesos, toma mejores decisiones y escala tu operación con agentes inteligentes.',
        ctaText: 'Solicitar demo',
        formFields: ['Nombre', 'Email', 'Empresa'],
        primaryColor: '#FF5A00',
      },
    },
    {
      slug: 'webpage',
      name: 'Webpage',
      description: 'Sitio web corporativo o de producto con múltiples páginas.',
      icon: 'Globe',
      color: 'from-cyan-500 to-blue-600',
      category: 'marketing',
      schema: {
        type: 'object',
        properties: {
          siteName: { type: 'string', title: 'Nombre del sitio' },
          pages: {
            type: 'array',
            title: 'Páginas',
            items: { type: 'string' },
          },
          navigation: {
            type: 'array',
            title: 'Navegación',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', title: 'Etiqueta' },
                href: { type: 'string', title: 'URL' },
              },
              required: ['label', 'href'],
            },
          },
          seoTitle: { type: 'string', title: 'SEO Title' },
          seoDescription: { type: 'string', title: 'SEO Description' },
        },
        required: ['siteName'],
      },
      defaultConfig: {
        pages: ['Inicio', 'Nosotros', 'Servicios', 'Contacto'],
        navigation: [
          { label: 'Inicio', href: '/' },
          { label: 'Nosotros', href: '/nosotros' },
          { label: 'Servicios', href: '/servicios' },
          { label: 'Contacto', href: '/contacto' },
        ],
      },
    },
    {
      slug: 'dashboard',
      name: 'Tablero Analítico',
      description: 'Visualización de KPIs, métricas y datos de negocio.',
      icon: 'BarChart3',
      color: 'from-emerald-500 to-teal-600',
      category: 'data',
      schema: {
        type: 'object',
        properties: {
          dataSources: {
            type: 'array',
            title: 'Fuentes de datos',
            items: { type: 'string' },
          },
          widgets: {
            type: 'array',
            title: 'Widgets',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', title: 'Tipo', enum: ['chart', 'kpi', 'table'] },
                title: { type: 'string', title: 'Título' },
                dataSource: { type: 'string', title: 'Fuente de datos' },
              },
              required: ['type', 'title'],
            },
          },
          refreshInterval: { type: 'number', title: 'Intervalo de refresco (seg)', default: 60 },
        },
      },
      defaultConfig: {
        dataSources: ['Ventas', 'Leads', 'Proyectos'],
        widgets: [
          { type: 'kpi', title: 'Leads activos', dataSource: 'Leads' },
          { type: 'chart', title: 'Pipeline mensual', dataSource: 'Ventas' },
        ],
        refreshInterval: 60,
      },
    },
    {
      slug: 'ai-chatbot',
      name: 'AI Chatbot',
      description: 'Asistente virtual con IA para atención al cliente o consultoría interna.',
      icon: 'Bot',
      color: 'from-violet-500 to-purple-600',
      category: 'ia',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          botName: { type: 'string', title: 'Nombre del asistente', default: 'Asistente AI' },
          welcomeMessage: { type: 'string', title: 'Mensaje de bienvenida' },
          suggestedQuestions: {
            type: 'array',
            title: 'Preguntas sugeridas',
            items: { type: 'string' },
          },
          primaryColor: { type: 'string', title: 'Color primario', default: '#8B5CF6' },
        },
        required: ['companyName'],
      },
      defaultConfig: {
        botName: 'Asistente AI',
        welcomeMessage: 'Hola, soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        suggestedQuestions: [
          '¿Qué servicios ofrecen?',
          '¿Cómo puedo agendar una reunión?',
          '¿Cuáles son los precios?',
        ],
        primaryColor: '#8B5CF6',
      },
    },
    {
      slug: 'bi-dashboard',
      name: 'Dashboard BI',
      description: 'Visualización de KPIs, métricas y datos de negocio en tiempo real.',
      icon: 'BarChart3',
      color: 'from-emerald-500 to-teal-600',
      category: 'data',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          kpiCards: {
            type: 'array',
            title: 'KPIs',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', title: 'Etiqueta' },
                value: { type: 'string', title: 'Valor' },
                change: { type: 'string', title: 'Cambio' },
              },
              required: ['label', 'value'],
            },
          },
          charts: {
            type: 'array',
            title: 'Gráficos',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', title: 'Título' },
                type: { type: 'string', title: 'Tipo', enum: ['line', 'bar', 'pie'] },
                dataSource: { type: 'string', title: 'Fuente de datos' },
              },
              required: ['title', 'type'],
            },
          },
          refreshInterval: { type: 'number', title: 'Intervalo de refresco (seg)', default: 60 },
        },
        required: ['companyName'],
      },
      defaultConfig: {
        kpiCards: [
          { label: 'Leads', value: '1,248', change: '+12%' },
          { label: 'Conversiones', value: '8.4%', change: '+2.1%' },
          { label: 'Ingresos', value: '$42.5M', change: '+5.3%' },
          { label: 'Tickets', value: '87', change: '-4%' },
        ],
        charts: [
          { title: 'Ventas mensuales', type: 'line', dataSource: 'Ventas' },
          { title: 'Leads por canal', type: 'bar', dataSource: 'Leads' },
          { title: 'Satisfacción', type: 'pie', dataSource: 'Encuestas' },
        ],
        refreshInterval: 60,
      },
    },
    {
      slug: 'rpa-invoicing',
      name: 'RPA Facturación',
      description: 'Automatización del flujo de recepción, validación y aprobación de facturas.',
      icon: 'FileText',
      color: 'from-amber-500 to-orange-600',
      category: 'operacion',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          steps: {
            type: 'array',
            title: 'Pasos del flujo',
            items: { type: 'string' },
          },
          approvalRules: {
            type: 'array',
            title: 'Reglas de aprobación',
            items: { type: 'string' },
          },
          autoApproveBelow: { type: 'number', title: 'Aprobar automáticamente debajo de ($)', default: 1000 },
        },
        required: ['companyName'],
      },
      defaultConfig: {
        steps: ['Recepción', 'Validación OCR', 'Conciliación', 'Aprobación', 'Pago'],
        approvalRules: [
          '< $1.000: automático',
          '$1.000 - $10.000: aprobador directo',
          '> $10.000: comité',
        ],
        autoApproveBelow: 1000,
      },
    },
    {
      slug: 'customer-portal',
      name: 'Customer Portal',
      description: 'Portal de clientes para consultar proyectos, facturas, tickets y documentos.',
      icon: 'UserCircle',
      color: 'from-sky-500 to-blue-600',
      category: 'comercial',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          modules: {
            type: 'array',
            title: 'Módulos activos',
            items: { type: 'string', enum: ['projects', 'invoices', 'tickets', 'documents', 'profile'] },
          },
          welcomeMessage: { type: 'string', title: 'Mensaje de bienvenida' },
          primaryColor: { type: 'string', title: 'Color primario', default: '#0EA5E9' },
        },
        required: ['companyName'],
      },
      defaultConfig: {
        modules: ['projects', 'invoices', 'tickets'],
        welcomeMessage: 'Bienvenido a tu portal de cliente',
        primaryColor: '#0EA5E9',
      },
    },
    {
      slug: 'helpdesk',
      name: 'Helpdesk',
      description: 'Sistema de tickets de soporte con categorías, prioridades y SLA.',
      icon: 'Headphones',
      color: 'from-rose-500 to-pink-600',
      category: 'operacion',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          categories: {
            type: 'array',
            title: 'Categorías',
            items: { type: 'string' },
          },
          priorities: {
            type: 'array',
            title: 'Prioridades',
            items: { type: 'string' },
          },
          slaHours: { type: 'number', title: 'SLA estándar (horas)', default: 24 },
        },
        required: ['companyName'],
      },
      defaultConfig: {
        categories: ['Técnico', 'Facturación', 'Consulta General', 'Incidente'],
        priorities: ['Baja', 'Media', 'Alta', 'Crítica'],
        slaHours: 24,
      },
    },
    {
      slug: 'security-dashboard',
      name: 'Security Dashboard',
      description: 'Panel de ciberseguridad con activos, amenazas, incidentes y estado de endpoints.',
      icon: 'Shield',
      color: 'from-green-500 to-emerald-600',
      category: 'seguridad',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          assets: {
            type: 'array',
            title: 'Activos protegidos',
            items: { type: 'string' },
          },
          threatLevels: {
            type: 'array',
            title: 'Niveles de amenaza',
            items: { type: 'string' },
          },
          showCompliance: { type: 'boolean', title: 'Mostrar cumplimiento', default: true },
        },
        required: ['companyName'],
      },
      defaultConfig: {
        assets: ['Servidores', 'Endpoints', 'Red', 'Aplicaciones', 'Bases de datos'],
        threatLevels: ['Crítica', 'Alta', 'Media', 'Baja'],
        showCompliance: true,
      },
    },
    {
      slug: 'integration-hub',
      name: 'Integration Hub',
      description: 'Panel visual de integraciones entre sistemas, APIs y flujos de datos.',
      icon: 'Plug',
      color: 'from-yellow-500 to-amber-600',
      category: 'integracion',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          integrations: {
            type: 'array',
            title: 'Integraciones',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', title: 'Nombre' },
                source: { type: 'string', title: 'Origen' },
                target: { type: 'string', title: 'Destino' },
                status: { type: 'string', title: 'Estado', enum: ['active', 'paused', 'error'], default: 'active' },
              },
              required: ['name', 'source', 'target'],
            },
          },
          syncFrequency: { type: 'string', title: 'Frecuencia de sincronización', enum: ['realtime', 'hourly', 'daily'], default: 'hourly' },
        },
        required: ['companyName'],
      },
      defaultConfig: {
        integrations: [
          { name: 'CRM → ERP', source: 'CRM', target: 'ERP', status: 'active' },
          { name: 'E-commerce → Warehouse', source: 'E-commerce', target: 'Warehouse', status: 'active' },
          { name: 'Forms → Email', source: 'Forms', target: 'Email', status: 'paused' },
        ],
        syncFrequency: 'hourly',
      },
    },
    {
      slug: 'project-manager',
      name: 'Project Manager',
      description: 'Gestión de proyectos con tablero Kanban, tareas, hitos y equipo.',
      icon: 'Kanban',
      color: 'from-indigo-500 to-blue-600',
      category: 'operacion',
      schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', title: 'Nombre de la empresa' },
          stages: {
            type: 'array',
            title: 'Etapas del tablero',
            items: { type: 'string' },
          },
          teamRoles: {
            type: 'array',
            title: 'Roles del equipo',
            items: { type: 'string' },
          },
          showTimeline: { type: 'boolean', title: 'Mostrar timeline', default: true },
        },
        required: ['companyName'],
      },
      defaultConfig: {
        stages: ['Backlog', 'Por hacer', 'En progreso', 'Revisión', 'Hecho'],
        teamRoles: ['Product Owner', 'Tech Lead', 'Developer', 'QA', 'Designer'],
        showTimeline: true,
      },
    },
    {
      slug: 'secop-ai-analyzer',
      name: 'SECOP AI Analyzer',
      description: 'Analiza procesos de contratación pública SECOP II con IA y compáralos contra el perfil de tu empresa.',
      icon: 'Gavel',
      color: 'from-indigo-500 to-violet-600',
      category: 'ia',
      schema: {
        type: 'object',
        properties: {
          embedUrl: { type: 'string', title: 'URL de la app desplegada (Vercel)' },
          height: { type: 'number', title: 'Alto del iframe (px)', default: 900 },
        },
        required: ['embedUrl'],
      },
      defaultConfig: {
        // TODO: verificar/actualizar con la URL real de producción en Vercel.
        embedUrl: 'https://secop2-agentai-insights.vercel.app',
        height: 900,
      },
    },
  ];

  for (const appType of appTypes) {
    await prisma.appType.upsert({
      where: { slug: appType.slug },
      update: {},
      create: appType,
    });
  }

  console.log('✓ Tipos de mini-apps creados');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
