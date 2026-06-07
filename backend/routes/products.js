import { Router } from 'express';

export default function productsRoutes(prisma) {
  const router = Router();

  // Create new product
  router.post('/', async (req, res) => {
    const { category_id, name, description, price, image_url, ncm, cfop, regime_tributario, suggested_products_ids, card_message } = req.body;
    if (!category_id || !name || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const product = await prisma.product.create({
        data: {
          category_id,
          name,
          description,
          price: parseFloat(price),
          image_url,
          is_available: true,
          ncm: ncm || "",
          cfop: cfop || "",
          regime_tributario: regime_tributario || "Substituição Tributária",
          card_message: card_message || "Toque para ver detalhes",
          suggestedProducts: suggested_products_ids && suggested_products_ids.length > 0 ? {
            connect: suggested_products_ids.map(id => ({ id }))
          } : undefined
        }
      });
      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create product', details: error.message });
    }
  });

  // Toggle availability
  router.put('/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const updated = await prisma.product.update({
        where: { id },
        data: { is_available: !product.is_available }
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle product availability' });
    }
  });

  // Update product details
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { category_id, name, description, price, image_url, ncm, cfop, regime_tributario, suggested_products_ids, card_message } = req.body;
    
    if (!category_id || !name || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          category_id,
          name,
          description,
          price: parseFloat(price),
          image_url,
          ncm: ncm || "",
          cfop: cfop || "",
          regime_tributario: regime_tributario || "Substituição Tributária",
          card_message: card_message || "Toque para ver detalhes",
          suggestedProducts: suggested_products_ids ? {
            set: suggested_products_ids.map(sid => ({ id: sid }))
          } : undefined
        }
      });
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // Toggle featured status
  router.put('/:id/featured', async (req, res) => {
    const { id } = req.params;
    const { is_featured } = req.body;
    try {
      const updated = await prisma.product.update({
        where: { id },
        data: { is_featured: !!is_featured }
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product featured status' });
    }
  });

  // Delete product
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      // Delete associated OrderItems first to avoid foreign key constraints
      await prisma.orderItem.deleteMany({
        where: { product_id: id }
      });

      await prisma.product.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete product', details: error.message });
    }
  });

  return router;
}
