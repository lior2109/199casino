import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomInt } from 'crypto';
import { authenticate, requireRole, getUser } from '../../middleware/auth.js';

const ADJECTIVES = ['GOLD', 'LUCKY', 'ROYAL', 'PRIME', 'MEGA', 'SUPER', 'STAR', 'CASH', 'BONUS', 'ELITE'];

function generateCode(): string {
  const adj = ADJECTIVES[randomInt(ADJECTIVES.length)];
  const num = randomInt(1000, 9999).toString();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[randomInt(chars.length)];
  }
  return `${adj}-${num}-${suffix}`;
}

function generatePin(): string {
  return randomInt(1000, 9999).toString();
}

const createVoucherSchema = z.object({
  amount: z.number().positive().max(1000000),
  currency: z.string().length(3).default('ILS'),
  expires_in_hours: z.number().positive().default(48),
});

const redeemVoucherSchema = z.object({
  code: z.string().min(1),
  pin: z.string().length(4),
});

export async function cashierRoutes(fastify: FastifyInstance) {
  fastify.post('/vouchers', { preHandler: [requireRole('cashier', 'admin', 'superadmin')] }, async (request, reply) => {
    const body = createVoucherSchema.parse(request.body);

    const code = generateCode();
    const pin = generatePin();
    const expiresAt = new Date(Date.now() + body.expires_in_hours * 60 * 60 * 1000);

    const reqUser = getUser(request);
    const result = await fastify.db.query(
      `INSERT INTO vouchers (tenant_id, cashier_id, code, pin, amount, currency, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, code, pin, amount, currency, status, expires_at, created_at`,
      [reqUser.tenantId, reqUser.userId, code, pin, body.amount, body.currency, expiresAt]
    );

    await fastify.db.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip_address, metadata)
       VALUES ($1, 'voucher_created', 'voucher', $2, $3, $4)`,
      [reqUser.userId, result.rows[0].id, request.ip, JSON.stringify({ amount: body.amount, currency: body.currency })]
    );

    return reply.status(201).send({ voucher: result.rows[0] });
  });

  fastify.post('/vouchers/redeem', { preHandler: [authenticate] }, async (request, reply) => {
    const body = redeemVoucherSchema.parse(request.body);

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      const voucherResult = await client.query(
        `SELECT * FROM vouchers WHERE code = $1 AND pin = $2 FOR UPDATE`,
        [body.code.toUpperCase(), body.pin]
      );

      if (voucherResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ error: 'Invalid code or PIN' });
      }

      const voucher = voucherResult.rows[0];

      if (voucher.status !== 'active') {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: `Voucher is ${voucher.status}` });
      }

      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        await client.query(
          "UPDATE vouchers SET status = 'expired' WHERE id = $1",
          [voucher.id]
        );
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'Voucher has expired' });
      }

      const redeemUser = getUser(request);
      const walletResult = await client.query(
        'SELECT real_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [redeemUser.userId]
      );

      if (walletResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ error: 'Wallet not found' });
      }

      const balanceBefore = parseFloat(walletResult.rows[0].real_balance);
      const amount = parseFloat(voucher.amount);
      const balanceAfter = balanceBefore + amount;

      await client.query(
        'UPDATE wallets SET real_balance = $1, updated_at = NOW() WHERE user_id = $2',
        [balanceAfter.toFixed(2), redeemUser.userId]
      );

      await client.query(
        `UPDATE vouchers SET status = 'redeemed', redeemed_by = $1, redeemed_at = NOW() WHERE id = $2`,
        [redeemUser.userId, voucher.id]
      );

      await client.query(
        `INSERT INTO transactions (user_id, type, amount, currency, balance_before, balance_after, reference_id, metadata)
         VALUES ($1, 'voucher_redeem', $2, $3, $4, $5, $6, $7)`,
        [
          redeemUser.userId, amount.toFixed(2), voucher.currency,
          balanceBefore.toFixed(2), balanceAfter.toFixed(2),
          voucher.code, JSON.stringify({ voucher_id: voucher.id }),
        ]
      );

      await client.query('COMMIT');

      return reply.send({
        message: 'Voucher redeemed successfully',
        amount: amount.toFixed(2),
        currency: voucher.currency,
        new_balance: balanceAfter.toFixed(2),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  fastify.get('/vouchers', { preHandler: [requireRole('cashier', 'admin', 'superadmin')] }, async (request, reply) => {
    const { status, page = '1', per_page = '20' } = request.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(per_page);

    const listUser = getUser(request);
    let query = 'SELECT * FROM vouchers WHERE cashier_id = $1';
    const params: (string | number)[] = [listUser.userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(per_page), offset);

    const result = await fastify.db.query(query, params);

    return reply.send({ vouchers: result.rows });
  });
}
