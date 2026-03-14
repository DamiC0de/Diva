/**
 * Simple migrations runner — executes SQL via Supabase service role
 */
import { getSupabase } from './supabase.js';

const MIGRATIONS = [
  {
    id: 'add_expires_at_to_memories',
    sql: `ALTER TABLE memories ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;`,
  },
];

export async function runMigrations(logger: { info: (...args: any[]) => void; error: (...args: any[]) => void }) {
  const db = getSupabase();
  
  for (const migration of MIGRATIONS) {
    try {
      // Check if column already exists by trying a query
      const { error } = await db.from('memories').select('expires_at').limit(1);
      if (!error) {
        logger.info({ msg: `Migration already applied: ${migration.id}` });
        continue;
      }
      
      // Column doesn't exist — we can't run raw SQL through Supabase REST API
      // Log a warning so the admin knows to run it manually
      logger.info({ 
        msg: `Migration pending: ${migration.id}`,
        sql: migration.sql,
        action: 'Run this SQL in the Supabase SQL Editor',
      });
    } catch (err) {
      logger.error({ msg: `Migration check failed: ${migration.id}`, error: err });
    }
  }
}
