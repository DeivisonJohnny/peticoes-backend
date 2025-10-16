import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeneratedDocumentsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAllByClient(clientId: string) {
        return this.prisma.generatedDocument.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                createdAt: true,
            }
            });
    }

    async getFilePathById(id: string): Promise<string> {
        const document = await this.prisma.generatedDocument.findUnique({
            where: { id },
            select: { filePath: true },
        });

        if (!document) {
            throw new NotFoundException('Documento gerado não encontrado.');
        }

        return document.filePath;
    }
}
