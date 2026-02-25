import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createHmac } from 'crypto';

interface WebhookBody {
  type: 'authenticate' | 'bet' | 'win' | 'rollback';
  player_id: string;
  currency: string;
  game_id?: number;
  transaction_id?: string;
  amount?: number;
  round_id?: string;
  finished?: boolean;
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === signature;
}

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    done(null, body);
  });

  fastify.post('/game-aggregator', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawBody = request.body as string;
    const signature = request.headers['x-signature'] as string;
    const webhookSecret = process.env.GAMEHUB_WEBHOOK_SECRET || '';

    fastify.log.info({ signature, bodyLength: rawBody.length }, 'Incoming webhook');

    if (!signature || !verifySignature(rawBody, signature, webhookSecret)) {
      fastify.log.warn('Webhook signature verification failed');
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    let body: WebhookBody;
    try {
      body = JSON.parse(rawBody) as WebhookBody;
    } catch {
      return reply.status(400).send({ error: 'Invalid JSON' });
    }

    fastify.log.info({ type: body.type, player_id: body.player_id, transaction_id: body.transaction_id }, 'Processing webhook');

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      switch (body.type) {
        case 'authenticate': {
          const walletResult = await client.query(
            `SELECT w.real_balance, w.bonus_balance, w.currency
             FROM wallets w JOIN users u ON u.id = w.user_id
             WHERE u.id = $1 AND u.is_active = true`,
            [body.player_id]
          );

          if (walletResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return reply.status(404).send({ error: 'Player not found' });
          }

          const wallet = walletResult.rows[0];
          await client.query('COMMIT');
          return reply.send({
            player_id: body.player_id,
            currency: wallet.currency,
            balance: parseFloat(wallet.real_balance) + parseFloat(wallet.bonus_balance),
            real_balance: parseFloat(wallet.real_balance),
            bonus_balance: parseFloat(wallet.bonus_balance),
          });
        }

        case 'bet': {
          const existingTx = await client.query(
            'SELECT id FROM game_transactions WHERE provider_transaction_id = $1',
            [body.transaction_id]
          );
          if (existingTx.rows.length > 0) {
            await client.query('ROLLBACK');
            return reply.status(409).send({ error: 'Duplicate transaction' });
          }

          const walletResult = await client.query(
            'SELECT real_balance, bonus_balance, currency FROM wallets WHERE user_id = $1 FOR UPDATE',
            [body.player_id]
          );

          if (walletResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return reply.status(404).send({ error: 'Player not found' });
          }

          const wallet = walletResult.rows[0];
          const amount = body.amount || 0;
          const realBalance = parseFloat(wallet.real_balance);
          const bonusBalance = parseFloat(wallet.bonus_balance);
          const totalBalance = realBalance + bonusBalance;

          if (totalBalance < amount) {
            await client.query('ROLLBACK');
            return reply.status(400).send({ error: 'Insufficient balance' });
          }

          let newBonusBalance = bonusBalance;
          let newRealBalance = realBalance;
          let remaining = amount;

          if (newBonusBalance >= remaining) {
            newBonusBalance -= remaining;
          } else {
            remaining -= newBonusBalance;
            newBonusBalance = 0;
            newRealBalance -= remaining;
          }

          await client.query(
            'UPDATE wallets SET real_balance = $1, bonus_balance = $2, updated_at = NOW() WHERE user_id = $3',
            [newRealBalance.toFixed(2), newBonusBalance.toFixed(2), body.player_id]
          );

          await client.query(
            `INSERT INTO game_transactions (user_id, provider_transaction_id, game_id, type, amount, currency, balance_before, balance_after, raw_payload)
             VALUES ($1, $2, $3, 'bet', $4, $5, $6, $7, $8)`,
            [
              body.player_id, body.transaction_id, body.game_id, amount, wallet.currency,
              totalBalance.toFixed(2), (newRealBalance + newBonusBalance).toFixed(2),
              rawBody,
            ]
          );

          await client.query('COMMIT');
          return reply.send({
            balance: newRealBalance + newBonusBalance,
            real_balance: newRealBalance,
            bonus_balance: newBonusBalance,
          });
        }

        case 'win': {
          const existingTx = await client.query(
            'SELECT id FROM game_transactions WHERE provider_transaction_id = $1',
            [body.transaction_id]
          );
          if (existingTx.rows.length > 0) {
            await client.query('ROLLBACK');
            return reply.status(409).send({ error: 'Duplicate transaction' });
          }

          const walletResult = await client.query(
            'SELECT real_balance, bonus_balance, currency FROM wallets WHERE user_id = $1 FOR UPDATE',
            [body.player_id]
          );

          if (walletResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return reply.status(404).send({ error: 'Player not found' });
          }

          const wallet = walletResult.rows[0];
          const amount = body.amount || 0;
          const balanceBefore = parseFloat(wallet.real_balance) + parseFloat(wallet.bonus_balance);
          const newRealBalance = parseFloat(wallet.real_balance) + amount;

          await client.query(
            'UPDATE wallets SET real_balance = $1, updated_at = NOW() WHERE user_id = $2',
            [newRealBalance.toFixed(2), body.player_id]
          );

          await client.query(
            `INSERT INTO game_transactions (user_id, provider_transaction_id, game_id, type, amount, currency, balance_before, balance_after, raw_payload)
             VALUES ($1, $2, $3, 'win', $4, $5, $6, $7, $8)`,
            [
              body.player_id, body.transaction_id, body.game_id, amount, wallet.currency,
              balanceBefore.toFixed(2), (newRealBalance + parseFloat(wallet.bonus_balance)).toFixed(2),
              rawBody,
            ]
          );

          await client.query('COMMIT');
          return reply.send({
            balance: newRealBalance + parseFloat(wallet.bonus_balance),
            real_balance: newRealBalance,
            bonus_balance: parseFloat(wallet.bonus_balance),
          });
        }

        case 'rollback': {
          const existingTx = await client.query(
            'SELECT id FROM game_transactions WHERE provider_transaction_id = $1',
            [body.transaction_id]
          );
          if (existingTx.rows.length > 0) {
            await client.query('ROLLBACK');
            return reply.status(409).send({ error: 'Duplicate transaction' });
          }

          const originalTx = await client.query(
            "SELECT * FROM game_transactions WHERE provider_transaction_id = $1 AND type = 'bet'",
            [body.round_id]
          );

          const walletResult = await client.query(
            'SELECT real_balance, bonus_balance, currency FROM wallets WHERE user_id = $1 FOR UPDATE',
            [body.player_id]
          );

          if (walletResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return reply.status(404).send({ error: 'Player not found' });
          }

          const wallet = walletResult.rows[0];
          const amount = body.amount || (originalTx.rows.length > 0 ? parseFloat(originalTx.rows[0].amount) : 0);
          const balanceBefore = parseFloat(wallet.real_balance) + parseFloat(wallet.bonus_balance);
          const newRealBalance = parseFloat(wallet.real_balance) + amount;

          await client.query(
            'UPDATE wallets SET real_balance = $1, updated_at = NOW() WHERE user_id = $2',
            [newRealBalance.toFixed(2), body.player_id]
          );

          await client.query(
            `INSERT INTO game_transactions (user_id, provider_transaction_id, game_id, type, amount, currency, balance_before, balance_after, raw_payload)
             VALUES ($1, $2, $3, 'rollback', $4, $5, $6, $7, $8)`,
            [
              body.player_id, body.transaction_id, body.game_id, amount, wallet.currency,
              balanceBefore.toFixed(2), (newRealBalance + parseFloat(wallet.bonus_balance)).toFixed(2),
              rawBody,
            ]
          );

          await client.query('COMMIT');
          return reply.send({
            balance: newRealBalance + parseFloat(wallet.bonus_balance),
            real_balance: newRealBalance,
            bonus_balance: parseFloat(wallet.bonus_balance),
          });
        }

        default:
          await client.query('ROLLBACK');
          return reply.status(400).send({ error: 'Unknown webhook type' });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error({ err: error }, 'Webhook processing error');
      return reply.status(500).send({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  });
}
