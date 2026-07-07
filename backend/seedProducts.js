import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find or create category
  let category = await prisma.category.findFirst({
    where: { name: 'Entradas & Porções' }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Entradas & Porções', sort_order: 1 }
    });
  }

  const products = [
    {
      name: 'TÁBUA DE FRIOS',
      description: 'Copa, queijo colonial, salame italiano, pão caseiro e doce de frutas.',
      price: 60,
      sizes: JSON.stringify([
        { name: 'Inteira (Serve 04 pessoas)', price: 60 },
        { name: 'Meia Porção (Serve 02 pessoas)', price: 40 }
      ]),
      ncm: '2106.90.90',
      cfop: '5101',
      csosn: '102',
      origem_mercadoria: '0',
      category_id: category.id
    },
    {
      name: 'NHOQUE FRITO',
      description: '300g de nhoque de batata. Acompanhamento maionese caseira.',
      price: 35,
      ncm: '1902.30.00',
      cfop: '5101',
      csosn: '102',
      origem_mercadoria: '0',
      category_id: category.id
    },
    {
      name: 'ARANCINI',
      description: '06 und. de bolinho pomodoro recheado com queijo.',
      price: 42,
      ncm: '2106.90.90',
      cfop: '5101',
      csosn: '102',
      origem_mercadoria: '0',
      category_id: category.id
    },
    {
      name: 'BRUSCHETTA DE TOMATE CONFIT',
      description: '04 und. - Pão, tomate confit, manjericão, queijo e molho pesto.',
      price: 36,
      ncm: '1905.90.90',
      cfop: '5101',
      csosn: '102',
      origem_mercadoria: '0',
      category_id: category.id
    },
    {
      name: 'PASTEL DE COSTELA',
      description: '06 und. de pastel frito recheado de carne de costela com queijo. Acompanhamento maionese caseira.',
      price: 40,
      ncm: '1905.90.90',
      cfop: '5101',
      csosn: '102',
      origem_mercadoria: '0',
      category_id: category.id
    },
    {
      name: 'PASTEL DE RAGU DE LINGUIÇA',
      description: '06 und de pastel recheado com linguiça. Acompanhamento maionese caseira.',
      price: 36,
      ncm: '1905.90.90',
      cfop: '5101',
      csosn: '102',
      origem_mercadoria: '0',
      category_id: category.id
    },
    {
      name: 'STEAK COM FRITAS',
      description: '400g de carne tipo Entrecôte e 300 g de batata frita. Acompanhamento maionese caseira.',
      price: 85,
      ncm: '1602.50.00',
      cfop: '5101',
      csosn: '102',
      origem_mercadoria: '0',
      category_id: category.id
    }
  ];

  for (const p of products) {
    await prisma.product.create({
      data: p
    });
    console.log('Created product:', p.name);
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
