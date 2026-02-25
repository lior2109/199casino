import pg from 'pg';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../../.env') });

async function seed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const tenantCheck = await pool.query("SELECT id FROM tenants WHERE slug = 'default'");
    let tenantId: string;

    if (tenantCheck.rows.length === 0) {
      const tenantResult = await pool.query(
        `INSERT INTO tenants (slug, name, domain, currency, language)
         VALUES ('default', 'BetPro Default', 'localhost:3000', 'ILS', 'he')
         RETURNING id`
      );
      tenantId = tenantResult.rows[0].id;
      console.log('Default tenant created:', tenantId);
    } else {
      tenantId = tenantCheck.rows[0].id;
      console.log('Default tenant already exists:', tenantId);
    }

    const adminCheck = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      const passwordHash = await bcryptjs.hash('admin123', 12);
      const adminResult = await pool.query(
        `INSERT INTO users (tenant_id, username, email, password_hash, first_name, last_name, role, kyc_status)
         VALUES ($1, 'admin', 'admin@betpro.local', $2, 'System', 'Admin', 'superadmin', 'verified')
         RETURNING id`,
        [tenantId, passwordHash]
      );
      const adminId = adminResult.rows[0].id;

      await pool.query(
        `INSERT INTO wallets (user_id, currency) VALUES ($1, 'ILS')`,
        [adminId]
      );
      console.log('Admin user created:', adminId);
    } else {
      console.log('Admin user already exists');
    }

    const cashierCheck = await pool.query("SELECT id FROM users WHERE username = 'cashier1'");
    if (cashierCheck.rows.length === 0) {
      const passwordHash = await bcryptjs.hash('cashier123', 12);
      const cashierResult = await pool.query(
        `INSERT INTO users (tenant_id, username, email, password_hash, first_name, last_name, role, kyc_status)
         VALUES ($1, 'cashier1', 'cashier1@betpro.local', $2, 'Main', 'Cashier', 'cashier', 'verified')
         RETURNING id`,
        [tenantId, passwordHash]
      );
      const cashierId = cashierResult.rows[0].id;

      await pool.query(
        `INSERT INTO wallets (user_id, currency) VALUES ($1, 'ILS')`,
        [cashierId]
      );
      console.log('Cashier user created:', cashierId);
    } else {
      console.log('Cashier user already exists');
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
