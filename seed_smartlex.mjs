import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Obtener primer usuario disponible como owner
  const owner = await prisma.user.findFirst({ select: { id: true, name: true } });
  if (!owner) throw new Error('No hay usuarios en la BD');
  console.log('Owner:', owner.name, owner.id);

  // Crear AppType
  const appType = await prisma.appType.upsert({
    where: { slug: 'smartlex-docai' },
    update: {},
    create: {
      slug: 'smartlex-docai',
      name: 'Smartlex DocAI',
      description: 'Gestor documental legal con búsqueda semántica por IA. Sube, procesa y busca contratos, actas, poderes y demandas con embeddings vectoriales.',
      icon: 'FileText',
      color: 'from-amber-500 to-orange-600',
      category: 'ia',
      schema: { type: 'object', properties: { url: { type: 'string', title: 'URL de la aplicación' } }, required: [] },
      defaultConfig: { url: 'http://177.7.46.87:3002' },
    },
  });
  console.log('AppType:', appType.id);

  // Crear AppInstance
  const instance = await prisma.appInstance.upsert({
    where: { slug: 'demo-smartlex-docai' },
    update: {},
    create: {
      appTypeId: appType.id,
      name: 'Smartlex DocAI',
      description: 'Demo del gestor documental legal con IA para Ortega & Abogados. Búsqueda semántica, clasificación automática y visor de documentos.',
      slug: 'demo-smartlex-docai',
      status: 'ACTIVE',
      config: {
        url: 'http://177.7.46.87:3002',
        extraCategories: ['gestor_documental'],
      },
      ownerId: owner.id,
    },
  });
  console.log('AppInstance:', instance.id);
  console.log('DONE');
}

main().catch(console.error).finally(() => prisma.$disconnect());
