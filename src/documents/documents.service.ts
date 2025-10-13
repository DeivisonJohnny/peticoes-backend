import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import { promises as fs } from 'fs';
import * as path from 'path';
import { GenerateDocumentDto } from './dto/generate-document.dto';

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

    const compiledTemplate = handlebars.compile(template.content);
    const finalHtml = compiledTemplate(dataSnapshot);

    const logoPath = path.resolve(process.cwd(), 'templates', 'assets', 'souzalogo.png');
    const logoBuffer = await fs.readFile(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const imgHeader = `data:image/png;base64,${logoBase64}`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: '200px',
        bottom: '80px',
      },
      headerTemplate: `
        <div style="width:100%; display: flex; align-items: center; justify-content: end; padding-right: 70px;">
          <img src="${imgHeader}" style="height:80px; margin-top: 30px;" />
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; font-size: 9px; text-align: center; color: #888; font-family: sans-serif;">
            <p style="margin: 2px 0;">Avenida Copacabana, n.º 268, Sala 1702, Alphaville, Barueri/SP, CEP: 06472-001 Tel.: (11) 4208-7569</p>
            <p style="margin: 2px 0;">E-mail: contato@sousabritoeribeiro.com.br</p>
        </div>
      `,
    });
    
    await browser.close();

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
}