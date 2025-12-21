import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { launchBrowser } from './puppeteer.config';

const FOLDER_NAME = 'procuracao-declaracao-judiciais'; 

export async function generateProcuracaoDeclaracaoJudiciais(dataSnapshot: any): Promise<Buffer> {

  const templatePath = path.resolve(process.cwd(), 'templates', FOLDER_NAME, 'template.hbs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  const compiledTemplate = handlebars.compile(templateContent);
  const finalHtml = compiledTemplate(dataSnapshot);

  const logoPath = path.resolve(process.cwd(), 'templates', 'assets', 'souzalogo.png');
  const logoBuffer = await fs.readFile(logoPath);
  const imgHeader = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

  const pdfAsUint8Array = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    margin: { top: '200px', bottom: '80px' },
    headerTemplate: `
      <div style="width:100%; display: flex; align-items: center; justify-content: center;">
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

  return Buffer.from(pdfAsUint8Array);
}