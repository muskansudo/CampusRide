import { Router } from 'express';
import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  completePayment,
  getPaymentByRide,
  getPassengerPaymentHistory,
  getDriverPaymentHistory,
} from '../services/payment.service.js';

const router = Router();

router.get('/ride/:rideId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const payment = await getPaymentByRide(String(req.params.rideId));
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/complete', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { method, upiTransactionId } = z
      .object({
        method: z.nativeEnum(PaymentMethod),
        upiTransactionId: z.string().optional(),
      })
      .parse(req.body);

    const payment = await completePayment(String(req.params.id), req.user!.userId, method, upiTransactionId);
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userId, role } = req.user!;
    const history =
      role === 'DRIVER'
        ? await getDriverPaymentHistory(userId)
        : await getPassengerPaymentHistory(userId);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

export default router;
