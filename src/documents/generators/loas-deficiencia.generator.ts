import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

const FOLDER_NAME = 'loas-deficiencia';

export async function generateLoasDeficiencia(dataSnapshot: any): Promise<Buffer> {
  const templatePath = path.resolve(process.cwd(), 'templates', FOLDER_NAME, 'template.hbs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');

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

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
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