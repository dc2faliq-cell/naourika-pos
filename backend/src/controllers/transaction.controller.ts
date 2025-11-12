import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    // PERHATIAN: Tambahkan customerId di sini (satu-satunya tempat deklarasi)
    const { items, paymentMethod, customerName, customerPhone, notes, customerId } = req.body;
    const userId = req.user.id;

    // Generate invoice number with sequential numbering per day
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    
    // Get today's transactions to determine next number
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    const todayTransactions = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    
    const sequenceNumber = String(todayTransactions + 1).padStart(6, '0');
    const invoiceNumber = `INV-${dateStr}-${sequenceNumber}`;
    
    // Calculate total
    let totalAmount = 0;
    const transactionItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      const subtotal = product.hargaJual * item.quantity;
      totalAmount += subtotal;

      transactionItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.hargaJual,
        subtotal,
      });

      // Update stock
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: product.stock - item.quantity },
      });

      // Log stock history
      await prisma.stockHistory.create({
        data: {
          productId: product.id,
          quantity: item.quantity,
          type: 'OUT',
          notes: `Sale - ${invoiceNumber}`,
        },
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        invoiceNumber,
        totalAmount,
        paymentMethod,
        customerName,
        customerPhone,
        notes,
        userId,
        customerId,  // Tambahkan customerId di sini
        items: {
          create: transactionItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};