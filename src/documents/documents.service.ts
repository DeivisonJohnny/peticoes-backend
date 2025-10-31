import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { GenerateBatchDto } from './dto/generate-batch.dto';
import { generateProcuracaoDeclaracaoJudiciais } from './generators/procuracao-declaracao-judiciais.generator';
import { generateContratoHonorarios } from './generators/contrato-honorarios.generator';
import { Client, DocumentTemplate } from '@prisma/client';

// Mantemos o mapa de geradores como está
const documentGenerators = {
  'Procuração e Declaração Judicial': generateProcuracaoDeclaracaoJudiciais,
  'Contrato de Honorários': generateContratoHonorarios,
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {
    // A configuração do diretório e dos helpers do Handlebars continua a mesma
    this.setup();
  }

  private async setup() {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de uploads:', error);
    }
    // O helper de data continua útil, mantemos ele.
  }

  // MÉTODO PÚBLICO PARA GERAÇÃO ÚNICA
  async generatePdf(dto: GenerateDocumentDto, generatorId: string) {
    const { clientId, templateId, extraData } = dto;

    const [client, template] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: clientId } }),
      this.prisma.documentTemplate.findUnique({ where: { id: templateId } }),
    ]);

    if (!client || !template) {
      throw new NotFoundException('Cliente ou Modelo de Documento não encontrado.');
    }

    // Agora, chamamos nosso novo método privado para fazer o trabalho pesado
    return this._generateAndSaveDocument(client, template, extraData, generatorId);
  }

  // MÉTODO PÚBLICO PARA GERAÇÃO EM LOTE
  async generatePdfBatch(dto: GenerateBatchDto, generatorId: string) {
    const { clientId, documents } = dto;

    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const generationPromises = documents.map(async (docInfo) => {
      const template = await this.prisma.documentTemplate.findUnique({
        where: { id: docInfo.templateId },
      });

      if (!template) {
        console.error(`Template com ID ${docInfo.templateId} não encontrado. Pulando.`);
        return null;
      }
      
      return this._generateAndSaveDocument(client, template, docInfo.extraData, generatorId);
    });

    const results = await Promise.all(generationPromises);
    const successfulDocuments = results.filter((doc) => doc !== null);

    return {
      message: `Geração em lote concluída. ${successfulDocuments.length} de ${documents.length} documentos gerados.`,
      generated: successfulDocuments,
    };
  }

  /**
   * NOVO MÉTODO PRIVADO: Centraliza a lógica de geração e salvamento.
   */
  private async _generateAndSaveDocument(
    client: Client,
    template: DocumentTemplate,
    extraData: Record<string, any>,
    generatorId: string,
  ) {
    // 1. LÓGICA CENTRAL: Mesclar os dados do cliente com os dados extras.
    // O spread operator (...) expande os objetos. Colocando `extraData` por último,
    // qualquer chave com o mesmo nome (ex: 'name') em `extraData`
    // irá SOBRESCREVER a chave de `client`.
    const finalPayload = {
      ...client,
      ...extraData,
    };

    const generator = documentGenerators[template.title];
    if (!generator) {
      console.error(`Gerador não implementado para o template: ${template.title}.`);
      // Em vez de lançar um erro que quebraria um lote, retornamos null
      return null;
    }

    // 2. O `finalPayload` É usado tanto para o gerador...
    const pdfBuffer = await generator(finalPayload);

    const fileName = `${template.title}-${client.name.replace(/\s/g, '_')}-${Date.now()}.pdf`;
    const filePath = path.join('uploads', fileName);

    await fs.writeFile(filePath, pdfBuffer);

    const createdDocument = await this.prisma.generatedDocument.create({
      data: {
        title: template.title,
        filePath: filePath,
        // 3. ...quanto para o dataSnapshot, garantindo a integridade histórica.
        dataSnapshot: finalPayload as any,
        clientId: client.id,
        generatorId: generatorId,
      },
    });

    return {
      message: 'Documento gerado com sucesso!',
      path: filePath,
      documentId: createdDocument.id,
    };
  }
}