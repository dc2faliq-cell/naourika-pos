import express from 'express';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, getAllTransactions);
router.get('/:id', authenticateToken, getTransactionById);
router.post('/', authenticateToken, createTransaction);
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  deleteTransaction
);

export default router;