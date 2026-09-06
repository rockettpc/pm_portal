import assert from 'node:assert';
import { pool } from '../src/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pm_portal_super_secure_jwt_secret_2026';

async function runTests() {
  console.log('--- RUNNING PM PORTAL AUTH & SCOPING TESTS ---');

  try {
    // 1. Verify DB connection and seed users
    const usersRes = await pool.query('SELECT id, username, password_hash, role, language_preference FROM users');
    assert(usersRes.rows.length >= 5, 'Should have at least 5 seed users');
    console.log('✓ Database seeded with', usersRes.rows.length, 'users');

    // 2. Test Admin Password Comparison
    const admin = usersRes.rows.find(u => u.username === 'admin');
    assert(admin, 'Admin user exists');
    const adminPassMatch = await bcrypt.compare('admin123', admin.password_hash);
    assert.strictEqual(adminPassMatch, true, 'Admin password matches bcrypt hash');
    const badPassMatch = await bcrypt.compare('wrongpass', admin.password_hash);
    assert.strictEqual(badPassMatch, false, 'Invalid password rejected');
    console.log('✓ Password hashing and verification passed');

    // 3. Test JWT signing & decoding
    const token = jwt.sign({ userId: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.userId, admin.id);
    assert.strictEqual(decoded.role, 'admin');
    console.log('✓ JWT generation and verification passed');

    // 4. Test Operator Equipment Scoping
    const op = usersRes.rows.find(u => u.username === 'operator1');
    assert(op, 'Operator1 exists');
    const opEqRes = await pool.query(
      `SELECT e.id, e.asset_id, e.name 
       FROM operator_equipment oe 
       JOIN equipment e ON oe.equipment_id = e.id 
       WHERE oe.operator_id = $1`,
      [op.id]
    );
    const assignedAssetIds = opEqRes.rows.map(r => r.asset_id);
    console.log('Operator1 assigned assets:', assignedAssetIds);
    assert(assignedAssetIds.includes('EQ-CUT-01'), 'Operator assigned to EQ-CUT-01');
    assert(assignedAssetIds.includes('EQ-EDGE-01'), 'Operator assigned to EQ-EDGE-01');
    assert(!assignedAssetIds.includes('EQ-FURN-01'), 'Operator NOT assigned to furnace (scoping enforced)');
    console.log('✓ Operator M:N scoping verified');

    // 5. Test Audit Log
    const auditRes = await pool.query('SELECT COUNT(*) FROM audit_log');
    console.log('✓ Audit log table accessible (count:', auditRes.rows[0].count, ')');

    console.log('\nALL AUTH & SCOPING UNIT CHECKS PASSED SUCCESSFULLY!\n');
  } finally {
    await pool.end();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
