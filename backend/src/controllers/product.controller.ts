import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, brand, hargaModal, hargaJual, hargaReseller, stock } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        brand,
        hargaModal,
        hargaJual,
        hargaReseller,
        stock: stock || 0,
      },
    });

    // Log stock history
    if (stock > 0) {
      await prisma.stockHistory.create({
        data: {
          productId: product.id,
          quantity: stock,
          type: 'IN',
          notes: 'Initial stock',
        },
      });
    }

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, brand, hargaModal, hargaJual, hargaReseller, stock, isActive } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        hargaModal,
        hargaJual,
        hargaReseller,
        stock,
        isActive,
      },
    });

    // Log stock change
    if (stock !== undefined && stock !== existingProduct.stock) {
      const diff = stock - existingProduct.stock;
      await prisma.stockHistory.create({
        data: {
          productId: product.id,
          quantity: Math.abs(diff),
          type: diff > 0 ? 'IN' : 'OUT',
          notes: 'Stock adjustment',
        },
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};