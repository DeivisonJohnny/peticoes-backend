import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { launchBrowser } from './puppeteer.config';

const FOLDER_NAME = 'loas-deficiencia';

// Registrar helper para formatar datas
handlebars.registerHelper('formatDate', (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
});

export async function generateLoasDeficiencia(dataSnapshot: any): Promise<Buffer> {
  const templatePath = path.resolve(process.cwd(), 'templates', FOLDER_NAME, 'template.hbs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // Gerar URL do mapa a partir do endereço do cliente usando Puppeteer
  if (dataSnapshot.client?.address && !dataSnapshot.document?.mapaUrl) {
    const address = encodeURIComponent(dataSnapshot.client.address);

    // Vamos capturar o mapa usando Puppeteer visitando o Google Maps
    // t=k = satellite (satélite), t=h = hybrid (híbrido com ruas), t=m = roadmap (padrão)
    dataSnapshot.document = dataSnapshot.document || {};
    dataSnapshot.document.mapaUrl = `https://maps.google.com/maps?q=${address}&t=k&z=18&ie=UTF8&iwloc=&output=embed`;
  }

  const compiledTemplate = handlebars.compile(templateContent);
  const finalHtml = compiledTemplate(dataSnapshot);

  const logoPath = path.resolve(process.cwd(), 'templates', 'assets', 'souzalogo.png');
  const logoBuffer = await fs.readFile(logoPath);
  const imgHeader = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  // Substitui a referência da logo no HTML com a logo padrão
  const htmlWithLogo = finalHtml.replace(
    /src="\{\{\s*document\.logoUrl\s*\}\}"/g,
    `src="${imgHeader}"`
  );

  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.setContent(htmlWithLogo, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: false, // Este template não usa header/footer do PDF
    margin: { 
      top: '1cm', 
      bottom: '1cm', 
      left: '1cm', 
      right: '1cm' 
    },
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}