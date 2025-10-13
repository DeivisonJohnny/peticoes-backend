import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DocumentTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDocumentTemplateDto) {
    try {
      return await this.prisma.documentTemplate.create({
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Um template com o título '${data.title}' já existe.`,
        );
      }
      throw error;
    }
  }

  // find, update, delete
}
