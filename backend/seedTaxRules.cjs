const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rules = [
    { id: '1', name: 'Produção da Cozinha (Pratos)', cfop: '5101', csosn: '102', origem_mercadoria: '0' },
    { id: '2', name: 'Revenda com ST (Bebidas/Vinhos)', cfop: '5405', csosn: '500', origem_mercadoria: '0' }
  ];
  for (const rule of rules) {
    await prisma.taxRule.create({ data: rule });
  }
  console.log('Regras fiscais criadas com sucesso!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
