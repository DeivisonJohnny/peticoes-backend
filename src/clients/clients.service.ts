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

  async findAll() {
    return this.prisma.client.findMany({
      select: {
        id: true,
        name: true,
        cpf: true,
        cnpj: true,
        phone: true,
        occupation: true,
        createdAt: true,
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
  async remove(id: string) {
    try {
      return await this.prisma.client.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Cliente com o ID #${id} não encontrado.`);
      }
      throw error;
    }
  }
}
