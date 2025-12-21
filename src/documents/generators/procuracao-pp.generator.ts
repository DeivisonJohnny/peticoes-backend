import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { launchBrowser } from './puppeteer.config';

export async function generateProcuracaoPp(dataSnapshot: any): Promise<Buffer> {
  const templatePath = path.resolve(
    process.cwd(),
    'templates',
    'procuracao-pp',
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
      top: "140px",
      bottom: "80px",
    },
    headerTemplate: `
      <div style="width:100%; display: flex; align-items: center; justify-content: end;">
        <img src="${imgHeader}" style="height:80px; margin-top: 30px; vertical-align:middle; margin-right: 140px;" />
      </div>
    `,
    footerTemplate: `
      <section style='
        width: 100%;
        font-family: sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 auto;
      '>
          <div style='width: 65%; border-bottom: 1px solid black;'></div>
          <div style='width: 75px; margin-top: 5px; border-bottom: 1px solid black;'></div>
          
          <p style='
          color: #888;
          font-size: 12px;
          text-align: center;
          margin: 5px 0 0 0;
          line-height: 1.5;
        '>
              Avenida Copacabana, n.� 268, Sala 1702, Alphaville, Barueri/SP, CEP: 06472-001 Tel.: (11) 4208-7569
              <br/>
              E-mail: contato@sousabritoeribeiro.com.br
          </p>
      </section>
    `,
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}