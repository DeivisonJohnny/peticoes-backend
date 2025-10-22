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
    const where: Prisma.ClientWhereInput = {};

    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    if (query.cpfCnpj) {
      where.OR = [
        { cpf: { contains: query.cpfCnpj, mode: 'insensitive' } },
        { cnpj: { contains: query.cpfCnpj, mode: 'insensitive' } },
      ];
    }

    if (query.email) {
      where.email = { contains: query.email, mode: 'insensitive' };
    }

    where.isActive = true;

    return this.prisma.client.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      include: {
        documents: true,
      },
    });
  }

  async findOne(id: string) {
    try {
      return await this.prisma.client.findUniqueOrThrow({
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
        },
      });
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

  async getDocumentStatus(id: string): Promise<DocumentStatusDto[]> {
    await this.prisma.client.findUniqueOrThrow({
      where: { id: id },
    });

    const [allTemplates, generatedForClient] = await Promise.all([
      this.prisma.documentTemplate.findMany({
        select: { id: true, title: true },
      }),
      this.prisma.generatedDocument.findMany({
        where: { clientId: id },
        select: { title: true },
        distinct: ['title'],
      }),
    ]);

    const generatedTitles = new Set(generatedForClient.map((doc) => doc.title));

    const documentStatusList: DocumentStatusDto[] = allTemplates.map(
      (template) => ({
        templateId: template.id,
        title: template.title,
        status: generatedTitles.has(template.title) ? 'gerado' : 'nao_gerado',
      }),
    );
    return documentStatusList;
  }
}
