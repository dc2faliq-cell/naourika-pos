import express from 'express';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
} from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, getAllTransactions);
router.get('/:id', authenticateToken, getTransactionById);
router.post('/', authenticateToken, createTransaction);

export default router;