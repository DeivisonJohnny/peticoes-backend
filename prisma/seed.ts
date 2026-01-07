import { PrismaClient, Prisma, Role } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import bcrypt from 'bcrypt';

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
  {
    title: 'Termo de Representação INSS',
    folderName: 'termo-representacao-inss',
  },
];

async function main() {
  console.log('Iniciando o seeding do usuário admin...');
  const hashedPassword = await bcrypt.hash('12345678', 10);

  const usersRoot = [
    {
      email: 'admin@example.com',
      name: 'Admin',
      password: hashedPassword,
      role: Role.ADMIN,
    },
    {
      email: 'agata.fagundes@sousabritoeribeiro.com.br',
      name: 'Agata Fagundes',
      password: hashedPassword,
      role: Role.ADMIN,
    },
    {
      email: 'flavia.brito@sousabritoeribeiro.com.br',
      name: 'Flavia Brito',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  ];

  usersRoot.forEach(async (item) => {
    await prisma.user.upsert({
      where: {
        email: item.email,
      },
      update: {
        name: item.name,
        password: item.password,
        role: item.role,
      },
      create: item,
    });

    console.log(`- Usuário '${item.email}' criado/atualizado, Senha: 12345678`);
  });

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
    },
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`- Usuário 'admin@example.com' criado/atualizado.`);
  console.log('Iniciando o seeding dos templates de documento...');

  for (const template of templatesToSeed) {
    const templateDir = path.join(
      process.cwd(),
      'templates',
      template.folderName,
    );
    const content = await fs.readFile(
      path.join(templateDir, 'template.hbs'),
      'utf-8',
    );

    let payloadSchema: Prisma.JsonObject | undefined = undefined;
    const schemaPath = path.join(templateDir, 'payloadSchema.json');
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      payloadSchema = JSON.parse(schemaContent) as Prisma.JsonObject;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(
          `Aviso: Erro ao ler payloadSchema para '${template.title}'.`,
          error,
        );
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
