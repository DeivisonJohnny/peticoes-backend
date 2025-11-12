import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function generateProcuracaoInss(dataSnapshot: any): Promise<Buffer> {
  const templatePath = path.resolve(
    process.cwd(),
    'templates',
    'procuracao-inss',
    'template.hbs',
  );
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // Carrega o brasão oficial do INSS e converte para base64
  const brasaoPath = path.resolve(process.cwd(), 'templates', 'assets', 'brasaooficialcolorido.png');
  const brasaoBuffer = await fs.readFile(brasaoPath);
  const brasaoBase64 = `data:image/png;base64,${brasaoBuffer.toString('base64')}`;
  
  // Adiciona a imagem do brasão ao dataSnapshot
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
      bottom: '20px',
      left: '20px',
    },
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}

