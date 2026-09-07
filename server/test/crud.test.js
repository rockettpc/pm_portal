import assert from 'node:assert';
import { pool } from '../src/db.js';

async function runCrudTests() {
  console.log('--- RUNNING PM PORTAL ADMIN CRUD VERIFICATION TESTS ---');

  try {
    // 1. Equipment CRUD test
    console.log('Testing Equipment CRUD...');
    const createEq = await pool.query(
      `INSERT INTO equipment (asset_id, name, category, status, criticality, runtime_hours)
       VALUES ('EQ-TEST-99', 'Test Polisher', 'Finishing', 'Active', 'Low', 10.0)
       RETURNING *`
    );
    const eq = createEq.rows[0];
    assert.strictEqual(eq.asset_id, 'EQ-TEST-99');

    // Update Equipment
    const updateEq = await pool.query(
      `UPDATE equipment SET name = 'Updated Polisher', criticality = 'High' WHERE id = $1 RETURNING *`,
      [eq.id]
    );
    assert.strictEqual(updateEq.rows[0].name, 'Updated Polisher');
    assert.strictEqual(updateEq.rows[0].criticality, 'High');

    // Delete Equipment
    await pool.query('DELETE FROM equipment WHERE id = $1', [eq.id]);
    const checkEq = await pool.query('SELECT * FROM equipment WHERE id = $1', [eq.id]);
    assert.strictEqual(checkEq.rows.length, 0);
    console.log('✓ Equipment CRUD verified');

    // 2. Parts CRUD test
    console.log('Testing Parts CRUD...');
    const createPart = await pool.query(
      `INSERT INTO parts (part_number, name, category, quantity_on_hand, min_stock_level, reorder_point, unit_cost)
       VALUES ('TEST-PART-01', 'Test Belt', 'Mechanical', 20, 5, 10, 15.50)
       RETURNING *`
    );
    const part = createPart.rows[0];
    assert.strictEqual(part.part_number, 'TEST-PART-01');

    // Update Part
    const updatePart = await pool.query(
      `UPDATE parts SET quantity_on_hand = 25, unit_cost = 18.00 WHERE id = $1 RETURNING *`,
      [part.id]
    );
    assert.strictEqual(updatePart.rows[0].quantity_on_hand, 25);
    assert.strictEqual(parseFloat(updatePart.rows[0].unit_cost), 18.00);

    // Delete Part
    await pool.query('DELETE FROM parts WHERE id = $1', [part.id]);
    const checkPart = await pool.query('SELECT * FROM parts WHERE id = $1', [part.id]);
    assert.strictEqual(checkPart.rows.length, 0);
    console.log('✓ Parts CRUD verified');

    // 3. User CRUD test
    console.log('Testing Users CRUD...');
    const createUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ('testuser99', 'testuser99@cgi.internal', 'hash123', 'Test Worker', 'technician')
       RETURNING *`
    );
    const u = createUser.rows[0];
    assert.strictEqual(u.username, 'testuser99');

    // Update User
    const updateUser = await pool.query(
      `UPDATE users SET full_name = 'Updated Worker', role = 'manager' WHERE id = $1 RETURNING *`,
      [u.id]
    );
    assert.strictEqual(updateUser.rows[0].full_name, 'Updated Worker');
    assert.strictEqual(updateUser.rows[0].role, 'manager');

    // Delete User
    await pool.query('DELETE FROM users WHERE id = $1', [u.id]);
    const checkUser = await pool.query('SELECT * FROM users WHERE id = $1', [u.id]);
    assert.strictEqual(checkUser.rows.length, 0);
    console.log('✓ Users CRUD verified');

    console.log('\nALL ADMIN CRUD VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
  } finally {
    await pool.end();
  }
}

runCrudTests().catch(err => {
  console.error('CRUD test failed:', err);
  process.exit(1);
});
