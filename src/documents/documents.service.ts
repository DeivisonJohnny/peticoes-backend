import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { GenerateBatchDto } from './dto/generate-batch.dto';
import { generateProcuracaoDeclaracaoJudiciais } from './generators/procuracao-declaracao-judiciais.generator';
import { generateContratoHonorarios } from './generators/contrato-honorarios.generator';
import { generateAutodeclaracaoRural } from './generators/autodeclaracao-rural.generator';
import { generateProcuracaoPp } from './generators/procuracao-pp.generator';
import { generateLoasDeficiencia } from './generators/loas-deficiencia.generator';
import { Client, DocumentTemplate } from '@prisma/client';

// Mapa de geradores - deve corresponder exatamente aos títulos no banco
const documentGenerators = {
  'Procuração e Declaração Judicial': generateProcuracaoDeclaracaoJudiciais,
  'Contrato de Honorários': generateContratoHonorarios,
  'Autodeclaração Rural': generateAutodeclaracaoRural,
  'Procuração Pessoa Física': generateProcuracaoPp,
  'LOAS - Benefício para Deficiente': generateLoasDeficiencia,
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
    
    // Registra helpers do Handlebars para garantir compatibilidade
    const handlebars = require('handlebars');
    
    // Helper para formatação de datas
    handlebars.registerHelper('formatDate', (dateString: string | Date) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      date.setUTCDate(date.getUTCDate() + 1);

      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
    });
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
    // 1. LÓGICA CENTRAL: Organizar os dados na estrutura esperada pelos templates
    // Os templates esperam: client.* e document.*
    const finalPayload = {
      client: {
        ...client,
        // Sobrescreve campos do cliente com dados extras se fornecidos
        ...(extraData.client || {}),
      },
      document: {
        // Dados padrão do documento
        documentLocation: 'São Paulo/SP',
        documentDate: new Date(),
        // Sobrescreve com dados extras se fornecidos
        ...(extraData.document || {}),
      },
      // Inclui outros dados extras no nível raiz
      ...Object.fromEntries(
        Object.entries(extraData).filter(([key]) => !['client', 'document'].includes(key))
      ),
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
        // 3. Salva o payload completo estruturado para o dataSnapshot
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