import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateClientDto } from './dto/update-client.dto';
import { FindAllClientsDto } from './dto/find-all-clients.dto';
import { DocumentStatusDto } from '../clients/dto/document-status.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    const { cpf, cnpj } = createClientDto;

    if (!cpf && !cnpj) {
      throw new BadRequestException('É necessário fornecer um CPF ou um CNPJ.');
    }

    try {
      const client = await this.prisma.client.create({
        data: createClientDto,
      });
      return client;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          throw new ConflictException(
            `O campo '${target.join(', ')}' já está em uso.`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(query: FindAllClientsDto) {

    const { page = 1, limit = 10, name, cpfCnpj, email, phone} = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      isActive: true,
    };

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (cpfCnpj) {
      where.AND = [
        {
          OR: [
            { cpf: { contains: cpfCnpj } },
            { cnpj: { contains: cpfCnpj } },
          ],
        },
      ];
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (phone) {
      where.phone = { contains: phone };
    }

    // Define ordenação: se há filtros, ordena por nome; senão, por data de criação (mais recentes primeiro)
    const hasFilters = name || cpfCnpj || email || phone;
    
    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: hasFilters 
          ? { name: 'asc' }           // Com filtros: ordem alfabética
          : { createdAt: 'desc' },    // Sem filtros: mais recentes primeiro
      }),
      this.prisma.client.count({ where }),
    ]);

     return {
      data: clients,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    try {
      const client = await this.prisma.client.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          cnpj: true,
          address: true,
          phone: true,
          dateOfBirth: true,
          rg: true,
          maritalStatus: true,
          birthPlace: true,
          rgIssuer: true,
          nickname: true,
          nationality: true,
          motherName: true,
          occupation: true,
          createdAt: true,
          updatedAt: true,
          documents: {
            select: {
              id: true,
              title: true,
              dataSnapshot: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
      
      const documentsByType = new Map<string, any>();

      for (const doc of client.documents) {
        if (!documentsByType.has(doc.title)) {
          documentsByType.set(doc.title, {
            id: doc.id,
            title: doc.title,
            dataSnapshot: doc.dataSnapshot,
            createdAt: doc.createdAt,
          });
        }
      }

      const { documents, ...clientData } = client;

      return {
        ...clientData,
        lastDocuments: Array.from(documentsByType.values()),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Cliente com o ID #${id} não encontrado.`,
          );
        }
      }
      throw error;
    }
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    try {
      return await this.prisma.client.update({
        where: { id },
        data: updateClientDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Cliente com o ID #${id} não encontrado.`,
          );
        }

        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          throw new ConflictException(
            `O campo '${target.join(', ')}' já está em uso.`,
          );
        }
      }
      throw error;
    }
  }

  // Este método implementa um SOFT DELETE
  async remove(id: string): Promise<{ message: string }> {

    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Cliente com o ID #${id} não encontrado.`);
    }

    if (!client.isActive) {
      return { message: 'Cliente já estava inativo.' };
    }

    await this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Cliente desativado com sucesso.' };
  }

  async getDocumentStatus(clientId: string): Promise<DocumentStatusDto[]> {
  // 1. Garante que o cliente existe
  await this.prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  // 2. Busca todos os templates e os documentos do cliente em paralelo
  const [allTemplates, generatedForClient] = await Promise.all([
    this.prisma.documentTemplate.findMany({
      select: { id: true, title: true },
    }),
    this.prisma.generatedDocument.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' }, // Ordena do mais recente para o mais antigo
      include: { // Inclui o nome do usuário que gerou o documento [cite: 360, 402]
        generator: {
          select: { name: true },
        },
      },
    }),
  ]);

  // 3. Cria um Map para armazenar apenas o documento MAIS RECENTE de cada tipo
  const latestGeneratedMap = new Map();
  for (const doc of generatedForClient) {
    // Como a lista está ordenada, o primeiro que encontrarmos para cada título é o mais recente
    if (!latestGeneratedMap.has(doc.title)) {
      latestGeneratedMap.set(doc.title, doc);
    }
  }

  // 4. Mapeia todos os templates para construir a resposta final
  const documentStatuses = allTemplates.map((template) => {
    const latestDoc = latestGeneratedMap.get(template.title);

    if (latestDoc) {
      // Se o documento já foi gerado, monta o objeto completo
      return {
        templateId: template.id,
        title: template.title,
        status: 'gerado' as const,
        lastGenerated: {
          generatedDocumentId: latestDoc.id,
          createdAt: latestDoc.createdAt,
          generatorName: latestDoc.generator.name,
          dataSnapshot: latestDoc.dataSnapshot, // Retorna o snapshot conforme solicitado [cite: 397]
        },
      };
    } else {
      // Se não foi gerado, monta o objeto simples
      return {
        templateId: template.id,
        title: template.title,
        status: 'nao_gerado' as const,
        lastGenerated: null,
      };
    }
  });
  return documentStatuses;
}
}