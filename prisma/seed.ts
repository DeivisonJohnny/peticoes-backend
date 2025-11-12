import { PrismaClient, Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const templatesToSeed = [
  {
    title: 'Procuração e Declaração Judicial',
    folderName: 'procuracao-declaracao-judiciais',
  },
  {
    title: 'Contrato de Honorários',
    folderName: 'contrato-honorarios',    
  },
  {
    title: 'Autodeclaração Rural',
    folderName: 'autodeclaracao-rural',
  },  
  {
    title: 'Procuração Pessoa Física',
    folderName: 'procuracao-pp',
  },
  {
    title: 'LOAS - Benefício para Deficiente',
    folderName: 'loas-deficiencia',
  },
  {
    title: 'Declaração de Não Recebimento',
    folderName: 'declaracao-nao-recebimento',
  },
  {
    title: 'LOAS - Auxílio-Doença',
    folderName: 'loas-auxilio-doenca',
  },
  {
    title: 'LOAS - Idoso',
    folderName: 'loas-idoso',
  },
  {
    title: 'Procuração INSS',
    folderName: 'procuracao-inss',
  },
];

async function main() {
  console.log('Iniciando o seeding dos templates de documento...');

  for (const template of templatesToSeed) {
    const templateDir = path.join(process.cwd(), 'templates', template.folderName);
    const content = await fs.readFile(path.join(templateDir, 'template.hbs'), 'utf-8');

    let payloadSchema: Prisma.JsonObject | undefined = undefined;
    const schemaPath = path.join(templateDir, 'payloadSchema.json');
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      payloadSchema = JSON.parse(schemaContent) as Prisma.JsonObject;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`Aviso: Erro ao ler payloadSchema para '${template.title}'.`, error);
      }
    }

    await prisma.documentTemplate.upsert({
      where: { title: template.title },
      update: {
        content,
        payloadSchema,
      },
      create: {
        title: template.title,
        content: content,
        payloadSchema: payloadSchema,
      },
    });

    console.log(`- Template '${template.title}' criado/atualizado.`);
  }

  console.log('Seeding conclu�do com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });