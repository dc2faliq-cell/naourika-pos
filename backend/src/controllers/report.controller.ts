import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getDailyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
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

    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTransactions = transactions.length;

    // Calculate profit
    const totalProfit = transactions.reduce((sum, t) => {
      const txProfit = t.items.reduce((itemSum, item) => {
        const profit = (item.price - item.product.hargaModal) * item.quantity;
        return itemSum + profit;
      }, 0);
      return sum + txProfit;
    }, 0);

    res.json({
      date: startOfDay,
      totalRevenue,
      totalProfit,
      totalTransactions,
      transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
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

    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTransactions = transactions.length;

    // Calculate profit
    const totalProfit = transactions.reduce((sum, t) => {
      const txProfit = t.items.reduce((itemSum, item) => {
        const profit = (item.price - item.product.hargaModal) * item.quantity;
        return itemSum + profit;
      }, 0);
      return sum + txProfit;
    }, 0);

    // Group by day
    const dailyData: any = {};
    transactions.forEach((t) => {
      const day = new Date(t.createdAt).getDate();
      if (!dailyData[day]) {
        dailyData[day] = { revenue: 0, profit: 0, count: 0 };
      }
      dailyData[day].revenue += t.totalAmount;
      dailyData[day].count += 1;
      
      // Calculate profit for this transaction
      const txProfit = t.items.reduce((itemSum, item) => {
        const profit = (item.price - item.product.hargaModal) * item.quantity;
        return itemSum + profit;
      }, 0);
      dailyData[day].profit += txProfit;
    });

    res.json({
      year: targetYear,
      month: targetMonth,
      totalRevenue,
      totalProfit,
      totalTransactions,
      dailyData,
      transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};