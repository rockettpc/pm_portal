import { query } from '../src/db.js';
import { signToken } from '../src/middleware/auth.js';

async function runAuditTests() {
  console.log('--- RUNNING AUDIT LOG & COMPLIANCE VERIFICATION TESTS ---');

  // Test admin user
  const adminRes = await query(`SELECT id, username, email, full_name, role, language_preference FROM users WHERE role = 'admin' LIMIT 1`);
  if (adminRes.rows.length === 0) throw new Error('No admin user found in DB');
  const admin = adminRes.rows[0];
  const token = signToken(admin);

  // Insert a test audit record
  await query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) 
     VALUES ($1, $2, $3, $4, $5)`,
    [admin.id, 'PHASE_6_VERIFICATION', 'system', 9999, JSON.stringify({ phase: 6, test: true })]
  );

  // Query audit logs
  const logRes = await query(`
    SELECT al.id, al.action, al.entity_type, al.entity_id, al.details, u.username
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.action = 'PHASE_6_VERIFICATION'
  `);

  if (logRes.rows.length === 0) throw new Error('Failed to retrieve inserted audit record');
  console.log('✓ Audit record verified in database:', logRes.rows[0].action);

  // Test CSV export SQL logic
  const csvRes = await query(`
    SELECT 
      al.id,
      al.created_at,
      COALESCE(u.username, 'System') as username,
      al.action,
      al.entity_type,
      al.details::text as details
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 5
  `);

  if (csvRes.rows.length === 0) throw new Error('Failed to run audit CSV export query');
  console.log('✓ Audit export query returned rows:', csvRes.rows.length);

  // Clean up test audit record
  await query(`DELETE FROM audit_log WHERE action = 'PHASE_6_VERIFICATION'`);

  console.log('\nALL AUDIT LOG VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runAuditTests().catch(err => {
  console.error('Audit tests failed:', err);
  process.exit(1);
});
