import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let category = await prisma.category.findFirst({
    where: { name: 'Vinhos' }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Vinhos', sort_order: 2 }
    });
  }

  const wines = [
    {
      name: 'Altezza Cabernet Sauvignon (Reserva)',
      description: 'Frutas negras maduras, madeira marcante, notas adocicadas de baunilha, chocolate, tabaco e defumado.',
      price: 89,
      ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    },
    {
      name: 'Bianco Merlot',
      description: 'Notas de frutas vermelhas frescas, como amora, ameixa e cereja negra. Leve floral e figo maduro com a evolução.',
      price: 45,
      ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    },
    {
      name: 'Bianco Malbec',
      description: 'Coloração rubi e corpo médio, acidez equilibrada, aromas de frutas frescas como ameixa, cereja e amora.',
      price: 45,
      ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    },
    {
      name: 'Bianco Moscatel Espumante',
      description: 'Grande intensidade e fineza com destaque para aromas florais e frutados. Leve e fresco.',
      price: 45,
      ncm: '2204.10.10', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    },
    {
      name: 'Fiorella Rosé Demi-Sec',
      description: 'Elaborado com uvas Goethe e Moscato. Aromas que lembram frutas cítricas, pêssego, maçã e flores brancas.',
      price: 45,
      ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    },
    {
      name: 'Famíglia Bianco Goethe',
      description: 'Aromas frutados de pêssego, melão amarelo e maçã com frescor vibrante, típico da uva Goethe.',
      price: 38,
      ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    },
    {
      name: 'Bianco Estações Pinot Noir',
      description: 'Vinho tinto fino seco, elegante e leve, expressando as características marcantes da casta Pinot Noir.',
      price: 45,
      ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    },
    {
      name: 'Fiorella Branco Demi-Sec',
      description: 'Vinho branco levemente adocicado, refrescante, trazendo as notas frutadas e florais marcantes da uva Goethe.',
      price: 45,
      ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    },
    {
      name: 'Bianco Brut Chardonnay',
      description: 'Aromas que remetem a pêssego, pera e maçã verde, com toques florais. Paladar fresco e cremoso.',
      price: 50,
      ncm: '2204.10.10', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    },
    {
      name: 'Altezza Rosé',
      description: 'Aromas elegantes de pitanga, toranja e morango. Sabores que remetem à romã e sutil tutti-frutti.',
      price: 49,
      ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
    }
  ];

  for (const p of wines) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } });
    if (!exists) {
      await prisma.product.create({ data: p });
      console.log('Created wine:', p.name);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
