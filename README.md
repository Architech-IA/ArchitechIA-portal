# ArchiTechIA - Portal Interno

Portal de gestión interna para la startup ArchiTechIA, especializado en automatización IA y Agentic AI.

## 🚀 Características

### Módulos Principales

#### 1. **Dashboard**
- KPIs en tiempo real (leads, propuestas, proyectos, actividades)
- Desglose por estados con visualizaciones
- Actividad reciente del equipo
- Valor estimado total del pipeline

#### 2. **Gestión de Leads**
- Registro completo de prospectos
- Seguimiento por etapas del pipeline:
  - Nuevo → Contactado → Calificado → Propuesta Enviada → Negociación → Ganado/Perdido
- Asignación de responsables
- Valor estimado por oportunidad
- Fuente de procedencia
- Filtrado y búsqueda avanzada

#### 3. **Propuestas Comerciales**
- Creación y seguimiento de propuestas
- Estados: Borrador → Enviado → En Revisión → Aceptado/Rechazado
- Vinculación con leads
- Montos y fechas de envío
- Historial completo

#### 4. **Proyectos**
- Gestión de desarrollo de productos
- Estados: Planificación → En Progreso → En Pausa → Completado → Cancelado
- Prioridades: Baja → Media → Alta → Crítica
- Barra de progreso visual
- Hitos y milestones
- Fechas de inicio y fin

#### 5. **Trazabilidad y Control**
- Timeline completo de actividades
- Registro de todos los cambios
- Filtros por tipo de entidad
- Trazabilidad completa de acciones por usuario

#### 6. **Equipo**
- Gestión de socios y colaboradores
- Roles: Administrador, Socio, Colaborador
- Registro de nuevos miembros
- Información de contacto

## 🛠️ Tecnologías

- **Frontend/Backend**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: SQLite con Prisma ORM
- **Estilos**: Tailwind CSS
- **UI Components**: Componentes personalizados

## 📋 Instalación y Uso

### Requisitos Previos
- Node.js 18+ 
- npm o yarn

### Instalación

1. **Instalar dependencias**
```bash
cd portal
npm install
```

2. **Configurar base de datos**
```bash
npx prisma generate
npx prisma db push
```

3. **Cargar datos de prueba**
```bash
npx tsx prisma/seed.ts
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

El portal estará disponible en: **http://localhost:3000**

## 👥 Credenciales de Acceso

El sistema viene pre-configurado con los siguientes usuarios:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@architechia.com | admin123 |
| Socio 1 | maria@architechia.com | partner123 |
| Socio 2 | carlos@architechia.com | partner123 |
| Colaborador | ana@architechia.com | collab123 |

## 📊 Estructura de la Base de Datos

### Modelos Principales

- **User**: Usuarios del sistema (socios, colaboradores, admin)
- **Lead**: Prospectos y oportunidades comerciales
- **Proposal**: Propuestas enviadas a clientes
- **Project**: Proyectos en desarrollo
- **Milestone**: Hitos dentro de proyectos
- **Activity**: Registro de actividades y cambios

### Pipeline de Ventas

```
Lead → Propuesta → Proyecto (si se acepta)
```

Cada entidad tiene su propio ciclo de vida y estados.

## 🎨 Módulos y Rutas

- `/` - Dashboard principal
- `/leads` - Gestión de leads
- `/proposals` - Propuestas comerciales
- `/projects` - Proyectos en desarrollo
- `/traceability` - Trazabilidad y control
- `/team` - Gestión del equipo

## 🔌 APIs REST

El portal incluye APIs completas:

- `GET/POST /api/leads` - Gestión de leads
- `GET/POST /api/proposals` - Gestión de propuestas
- `GET/POST /api/projects` - Gestión de proyectos
- `GET/POST /api/activities` - Registro de actividades
- `GET/POST /api/users` - Gestión de usuarios
- `GET /api/dashboard` - Datos del dashboard

## 🚀 Producción

Para desplegar en producción:

1. **Build**
```bash
npm run build
```

2. **Start**
```bash
npm start
```

3. **Base de datos**
- Para producción, considerar PostgreSQL o MySQL
- Configurar variable DATABASE_URL en .env

## 📝 Datos de Prueba

El seed incluye:
- 4 usuarios (1 admin, 2 socios, 1 colaborador)
- 4 leads en diferentes estados
- 3 propuestas comerciales
- 3 proyectos con diferentes prioridades
- 4 hitos de proyecto
- 8 actividades de ejemplo

## 🔄 Próximos Pasos (Mejoras Futuras)

- [ ] Autenticación con NextAuth.js
- [ ] Sistema de notificaciones
- [ ] Exportación a Excel/PDF
- [ ] Gráficos avanzados con Recharts
- [ ] Integración con email (envío de propuestas)
- [ ] Chat interno entre equipo
- [ ] Calendario de reuniones
- [ ] Integración con CRM externo
- [ ] Migración a PostgreSQL para producción

## 📄 Licencia

Propietario - ArchiTechIA 2026

---

**Desarrollado con ❤️ para ArchiTechIA**
