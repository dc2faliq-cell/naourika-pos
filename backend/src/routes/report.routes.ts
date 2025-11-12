import express from 'express';
import { getDailyReport, getMonthlyReport } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/daily', authenticateToken, getDailyReport);
router.get('/monthly', authenticateToken, getMonthlyReport);

export default router;