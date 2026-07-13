import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.appInstance.update({
    where: { slug: 'demo-smartlex-docai' },
    data: {
      config: {
        externalUrl: 'https://smartlex.architechia.co',
        extraCategories: ['gestor_documental'],
      },
    },
  });
  console.log('Config actualizado:', JSON.stringify(updated.config));
}

main().catch(console.error).finally(() => prisma.$disconnect());
