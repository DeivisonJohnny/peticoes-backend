import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';

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

    async createZipStream(documentIds: string[]) {
        const documents = await this.prisma.generatedDocument.findMany({
            where: {
                id: { in: documentIds }
            },
            select: {
                filePath: true,
                title: true,
            }
        });

        if (documents.length === 0) {
            throw new NotFoundException('Nenhum documento encontrado para os IDs fornecidos.');
        }

        const archive = archiver('zip', { zlib: { level: 9 } });
        for (const doc of documents) {
            const fileName = path.basename(doc.filePath);
            archive.file(doc.filePath, { name: fileName });
        }

        archive.finalize();

        return archive;
    }
}
