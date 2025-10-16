import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import { promises as fs } from 'fs';
import * as path from 'path';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { GenerateBatchDto } from './dto/generate-batch.dto';
import { generateProcuracaoDeclaracaoJudiciais } from './generators/procuracao-declaracao-judiciais.generator';
import { generateContratoHonorarios } from './generators/contrato-honorarios.generator';

const documentGenerators = {
  'Procuração e Declaração Judicial': generateProcuracaoDeclaracaoJudiciais,
  'Contrato de Honorários': generateContratoHonorarios,
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {
    this.setup();
  }

  private async setup() {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diret�rio de uploads:', error);
    }

    handlebars.registerHelper('formatDate', (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
    });
  }


  async generatePdf(dto: GenerateDocumentDto, generatorId: string) {
    const { clientId, templateId, extraData } = dto;

    const [client, template] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: clientId } }),
      this.prisma.documentTemplate.findUnique({ where: { id: templateId } }),
    ]);

    if (!client || !template) {
      throw new NotFoundException('Cliente ou Modelo de Documento não encontrado.');
    }

  
    const dataSnapshot = {
      client,
      document: dto.extraData,
    };

    const generator = documentGenerators[template.title];
    if (!generator) {
      throw new Error(`Gerador não implementado para o template: ${template.title}`);
    }

    const pdfBuffer = await generator(dataSnapshot);

    const fileName = `${template.title}-${client.name.replace(/\s/g, '_')}-${Date.now()}.pdf`;
    const filePath = path.join('uploads', fileName);
    
    await fs.writeFile(filePath, pdfBuffer);

    const createdDocument = await this.prisma.generatedDocument.create({
      data: {
        title: template.title,
        filePath: filePath,
        dataSnapshot: dataSnapshot as any, 
        clientId: clientId,
        generatorId: generatorId,
      },
    });

    return {
      message: 'Documento gerado com sucesso!',
      path: filePath,
      documentId: createdDocument.id,
    };
  }

  async generatePdfBatch(dto: GenerateBatchDto, generatorId: string) {
    const {clientId, documents } = dto;

    const client = await this.prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const generatedDocumentsPromises = documents.map(async (docInfo) => {
      const { templateId, extraData } = docInfo;

      const template = await this.prisma.documentTemplate.findUnique({ where: { id: templateId } });

      if (!template) {

        console.error(`Template com ID ${templateId} não encontrado. Pulando este documento.`);
        return null; 
      }

      const generator = documentGenerators[template.title];
      if (!generator) {
        console.error(`Gerador não implementado para o template: ${template.title}. Pulando este documento.`);
        return null; 
      }

      const dataSnapshot = {
        client,
        document: extraData,
      };

      const pdfBuffer = await generator(dataSnapshot);

      const fileName = `${template.title}-${client.name.replace(/\s/g, '_')}-${Date.now()}.pdf`;
      const filePath = path.join('uploads', fileName);
      
      await fs.writeFile(filePath, pdfBuffer);

      return this.prisma.generatedDocument.create({
        data: {
          title: template.title,
          filePath: filePath,
          dataSnapshot: dataSnapshot as any, 
          clientId: clientId,
          generatorId: generatorId,
        },
      });
    });
    
    const results = await Promise.all(generatedDocumentsPromises);
    const successfulDocuments = results.filter(doc => doc !== null);

    return {
     message: `Geração em lote concluída. ${successfulDocuments.length} de ${documents.length} documentos gerados com sucesso.`,
      generated: successfulDocuments,
    };
  }
}