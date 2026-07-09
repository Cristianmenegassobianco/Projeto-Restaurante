import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportBlingProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
  });

  const columns = [
    "Código Único do Produto",
    "SKU / Código",
    "Descrição do Produto ou Serviço",
    "Descrição Curta",
    "NCM",
    "Origem",
    "Preço de Venda",
    "Un. Medida",
    "Custo (Valor Base de Compra)",
    "Estoque",
    "Custo da Última Compra",
    "Data da Última Compra",
    "Marca",
    "Categoria",
    "Sub Categoria",
    "Tipo de Produto",
    "Observações",
    "CFOP",
    "CSOSN",
    "PIS",
    "COFINS",
    "IPI",
    "ICMS"
  ];

  let csvContent = columns.join(';') + '\n';

  for (const p of products) {
    const row = [
      "", // Código Único
      p.id.slice(0, 8), // SKU / Código - usando inicio do ID como SKU
      p.name, // Descrição do Produto
      p.description || "", // Descrição Curta
      p.ncm || "N/C", // NCM
      p.origem_mercadoria || "0", // Origem
      p.price.toFixed(2).replace('.', ','), // Preço de Venda
      "UN", // Un. Medida
      "", // Custo
      "", // Estoque
      "", // Custo Última
      "", // Data Última
      "", // Marca
      p.category ? p.category.name : "", // Categoria
      "", // Sub Categoria
      "Produto Acabado", // Tipo de Produto
      "", // Observações
      p.cfop || "5102", // CFOP
      p.csosn || "102", // CSOSN
      "", // PIS
      "", // COFINS
      "", // IPI
      "" // ICMS
    ];

    // Escape double quotes and wrap in quotes if contains ; or newlines
    const formattedRow = row.map(field => {
      if (field === null || field === undefined) return '';
      let fieldStr = String(field);
      if (fieldStr.includes(';') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        fieldStr = `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    });

    csvContent += formattedRow.join(';') + '\n';
  }

  const outputPath = path.join(__dirname, 'planilha_produtos_bling.csv');
  fs.writeFileSync(outputPath, '\ufeff' + csvContent, 'utf8'); // \ufeff for BOM so Excel reads UTF-8 correctly
  console.log(`Planilha gerada com sucesso em: ${outputPath}`);
}

exportBlingProducts()
  .catch(e => {
    console.error('Erro ao gerar planilha:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
