import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

// Helper para comparar valores no Handlebars
handlebars.registerHelper('eq', (a, b) => a === b);
// Helper para formatar datas (exemplo simples)
handlebars.registerHelper('formatDate', (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR');
});

export async function generateAutodeclaracaoRural(dataSnapshot: any): Promise<Buffer> {
  const templatePath = path.resolve(
    process.cwd(),
    'templates',
    'autodeclaracao-rural',
    'template.hbs',
  );
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // Carrega a imagem do brasão e converte para base64
  const brasaoPath = path.resolve(process.cwd(), 'templates', 'assets', 'brasaooficialcolorido.png');
  const brasaoBuffer = await fs.readFile(brasaoPath);
  const brasaoBase64 = `data:image/png;base64,${brasaoBuffer.toString('base64')}`;
  
  // Adiciona a imagem ao dataSnapshot para que o template possa usá-la
  const finalDataSnapshot = {
    ...dataSnapshot,
    document: {
        ...dataSnapshot.document,
        brasaoImage: brasaoBase64,
    }
  };

  const compiledTemplate = handlebars.compile(templateContent);
  const finalHtml = compiledTemplate(finalDataSnapshot);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '40px',
      left: '20px',
    },
    // Este documento tem várias páginas, um rodapé com número de página é útil.
    displayHeaderFooter: true,
    footerTemplate: `
        <div style="width: 100%; font-size: 10px; text-align: center; padding: 0 20px;">
            <p style="font-style: italic;">NOTA: esta declaração deverá ser assinada em todas as suas páginas.</p>
            <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
    `,
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}