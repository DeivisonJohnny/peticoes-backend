import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { launchBrowser } from './puppeteer.config';


handlebars.registerHelper('monthName', (monthNumber: string) => {
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const index = parseInt(monthNumber, 10) - 1;
  return months[index] || monthNumber;
});

handlebars.registerHelper('numberToWords', (number: string | number) => {
  const num = typeof number === 'string' ? parseInt(number, 10) : number;
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (num === 0) return 'zero';
  if (num < 10) return unidades[num];
  if (num >= 10 && num < 20) return especiais[num - 10];
  if (num >= 20 && num < 100) {
    const dezena = Math.floor(num / 10);
    const unidade = num % 10;
    return dezenas[dezena] + (unidade > 0 ? ' e ' + unidades[unidade] : '');
  }
  if (num === 100) return 'cem';
  if (num > 100 && num < 1000) {
    const centena = Math.floor(num / 100);
    const resto = num % 100;
    return centenas[centena] + (resto > 0 ? ' e ' + handlebars.helpers.numberToWords(resto) : '');
  }

  return number.toString();
});

export async function generateContratoHonorarios(dataSnapshot: any): Promise<Buffer> {
  const templatePath = path.resolve(process.cwd(), 'templates', 'contrato-honorarios', 'template.hbs');
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