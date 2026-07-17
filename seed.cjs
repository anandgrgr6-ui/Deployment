require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Default logins. CHANGE THE PASSWORDS after first login (see README).
const USERS = [
  { username: 'admin',  password: process.env.SEED_ADMIN_PW || 'Admin@123', role: 'admin', plant: null },
  { username: 'p2user', password: 'Mysore@123', role: 'plant', plant: 'Mysore' },
  { username: 'p3user', password: 'Pondi@123',  role: 'plant', plant: 'Pondicherry' },
  { username: 'p4user', password: 'Varan@123',  role: 'plant', plant: 'Varanavasi' },
  { username: 'p5user', password: 'Pant@123',   role: 'plant', plant: 'Pantnagar' },
];

(async () => {
  console.log('Seeding users...\n');
  for (const u of USERS) {
    const password_hash = bcrypt.hashSync(u.password, 10);
    const { error } = await supabase
      .from('users')
      .upsert({ username: u.username, password_hash, role: u.role, plant: u.plant }, { onConflict: 'username' });

    if (error) console.error(`  ✗ ${u.username}: ${error.message}`);
    else console.log(`  ✓ ${u.username.padEnd(8)} ${String(u.password).padEnd(12)} (${u.role}${u.plant ? ' / ' + u.plant : ''})`);
  }
  console.log('\nDone. Please change these passwords in production.');
  process.exit(0);
})();
