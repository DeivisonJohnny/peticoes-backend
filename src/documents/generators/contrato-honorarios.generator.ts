import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function generateContratoHonorarios(dataSnapshot: any): Promise<Buffer> {
  const templatePath = path.resolve(process.cwd(), 'templates', 'contrato-honorarios', 'template.hbs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  const compiledTemplate = handlebars.compile(templateContent);
  const finalHtml = compiledTemplate(dataSnapshot);

  const logoPath = path.resolve(process.cwd(), 'templates', 'assets', 'souzalogo.png');
  const logoBuffer = await fs.readFile(logoPath);
  const imgHeader = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    margin: {
      top: "150px",
      bottom: "80px",
    },
    headerTemplate: `
      <div style="width:100%; display: flex; align-items: center; justify-content: center;">
        <img src="${imgHeader}" style="height:80px; margin-top: 30px;" />
      </div>
    `,
    footerTemplate: "",
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}