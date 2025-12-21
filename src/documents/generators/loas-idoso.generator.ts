import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { launchBrowser } from './puppeteer.config';

export async function generateLoasIdoso(dataSnapshot: any): Promise<Buffer> {
  const templatePath = path.resolve(
    process.cwd(),
    'templates',
    'loas-idoso',
    'template.hbs',
  );
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  const compiledTemplate = handlebars.compile(templateContent);
  const finalHtml = compiledTemplate(dataSnapshot);

  const logoPath = path.resolve(process.cwd(), 'templates', 'assets', 'souzalogo.png');
  const logoBuffer = await fs.readFile(logoPath);
  const imgHeader = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    margin: {
      top: '140px',
      right: '20px',
      bottom: '100px',
      left: '20px',
    },
    headerTemplate: `
      <div style="width:100%; display: flex; align-items: center; justify-content: flex-end;">
        <img src="${imgHeader}" style="height:80px; margin-top: 30px; margin-right: 100px;" />
      </div>
    `,
    footerTemplate: `
      <div style="width: 100%; text-align: center; font-size: 10pt; color: #777; padding-top: 10px; line-height: 1.4;">
        <hr style="border: 0; border-top: 1px solid #000; margin: 0 auto 10px auto; width: 90%;" />
        <div>
          Rua Flademir Roberto Lopes, n.º 96, Polvilho, Cajamar/SP<br>
          Tel.: (11) 4448-2301<br>
          E-mail: contato@sousabritoeribeiro.com.br
        </div>
      </div>
    `,
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}

