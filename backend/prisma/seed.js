import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Create categories with nested products
  const beverages = await prisma.category.create({
    data: {
      name: 'Bebidas',
      sort_order: 1,
      products: {
        create: [
          {
            name: 'Refrigerante Cola 350ml',
            description: 'Lata bem gelada',
            price: 6.5,
            image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500',
            is_available: true,
          },
          {
            name: 'Suco Natural de Laranja',
            description: 'Feito na hora, sem açúcar',
            price: 9,
            image_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500',
            is_available: true,
          },
        ],
      },
    },
  });

  const foods = await prisma.category.create({
    data: {
      name: 'Comidas',
      sort_order: 2,
      products: {
        create: [
          {
            name: 'Hambúrguer Artesanal Premium',
            description: 'Pão brioche, blend 180g, queijo cheddar, bacon, salada e molho especial',
            price: 35.9,
            image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
            is_available: true,
          },
          {
            name: 'Batata Frita com Cheddar e Bacon',
            description: 'Porção individual de batatas rústicas com muito queijo',
            price: 22,
            image_url: 'https://images.unsplash.com/photo-1576107223847-c3b889505c21?w=500',
            is_available: true,
          },
        ],
      },
    },
  });

  console.log('Seed completed');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
