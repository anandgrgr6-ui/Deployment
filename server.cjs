// require('dotenv').config();

// const path = require('path');
// const express = require('express');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const nodemailer = require('nodemailer');
// const { createClient } = require('@supabase/supabase-js');

// const PORT = process.env.PORT || 3006;
// const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret';

// // --------------------------------------------------------------------
// // Supabase
// // --------------------------------------------------------------------
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// // --------------------------------------------------------------------
// // Plant directory: code + notification recipients
// // --------------------------------------------------------------------
// const PLANTS = {
//   Mysore:      { 
//     code: 'P2', 
//     safetyEmails: ['s.sanjana@ranegroup.com', 'm.sanjay@ranegroup.com'],       
//     hrEmail: 'n.harisha@ranegroup.com' 
//   },
//   Pondicherry: { 
//     code: 'P3', 
//     safetyEmails: ['k.chandraprakash@ranegroup.com', 'm.sanjay@ranegroup.com'],      
//     hrEmail: 'a.shajahan@ranegroup.com' 
//   },
//   Varanavasi:  { 
//     code: 'P4', 
//     safetyEmails: ['s.joelpraveen@ranegroup.com', 'm.sanjay@ranegroup.com'],      
//     hrEmail: 'r.krishnamoorthy@ranegroup.com' 
//   },
//   Pantnagar:   { 
//     code: 'P5', 
//     safetyEmails: ['a.asimkumar@ranegroup.com', 'm.sanjay@ranegroup.com'],      
//     hrEmail: 'ritu.kandpal@ranegroup.com' 
//   },
// };

// // --------------------------------------------------------------------
// // Gmail SMTP transporter (nodemailer)
// // --------------------------------------------------------------------
// let transporter = null;
// if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
//   transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.GMAIL_USER,
//       pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
//     },
//   });
//   transporter.verify()
//     .then(() => console.log('📮 Gmail SMTP ready'))
//     .catch((e) => console.warn('⚠️  Gmail SMTP not verified:', e.message));
// } else {
//   console.warn('⚠️  GMAIL_USER / GMAIL_APP_PASSWORD not set - emails will be skipped.');
// }

// function buildEmailHtml(o) {
//   return `
//     <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e9f0;border-radius:10px;overflow:hidden">
//       <div style="background:#003366;color:#fff;padding:18px 24px">
//         <div style="font-size:20px;font-weight:800;letter-spacing:.5px">RANE</div>
//         <div style="font-size:13px;opacity:.85">Driver Behaviour Observation System</div>
//       </div>
//       <div style="padding:24px;color:#333">
//         <p style="margin:0 0 16px">A new driver-behaviour observation has been logged for
//           <strong>${o.plant_name} (${o.plant_code})</strong>.</p>
//         <table style="width:100%;border-collapse:collapse;font-size:14px">
//           ${row('Plant', `${o.plant_name} (${o.plant_code})`)}
//           ${row('Reported by', `${o.emp_name} (${o.emp_no || '-'})`)}
//           ${row('Route & Location', o.route_loc)}
//           ${row('Cab Number', o.cab_no)}
//           ${row('Driver', o.driver_name)}
//           ${row('Logged at', new Date(o.created_at).toLocaleString('en-IN'))}
//         </table>
//         <p style="margin:18px 0 6px;font-weight:700;color:#003366">Observation</p>
//         <p style="margin:0;padding:12px 14px;background:#f5f7fb;border-left:3px solid #003366;border-radius:4px;white-space:pre-wrap">${o.description}</p>
//       </div>
//       <div style="background:#f0f2f5;color:#8a93a5;padding:12px 24px;font-size:12px">
//         Automated notification. Please do not reply to this email.
//       </div>
//     </div>`;
// }
// function row(label, value) {
//   return `<tr>
//     <td style="padding:6px 0;color:#8a93a5;width:150px;vertical-align:top">${label}</td>
//     <td style="padding:6px 0;color:#222;font-weight:600">${value || '-'}</td>
//   </tr>`;
// }

// async function sendObservationEmail(plant, o) {
//   if (!transporter) return 'skipped (no SMTP configured)';
  
//   // Combine all safety emails with the HR email, filtering out any missing/empty ones
//   const recipients = [...(plant.safetyEmails || []), plant.hrEmail].filter(Boolean);
  
//   if (recipients.length === 0) return 'skipped (no recipients)';
  
//   await transporter.sendMail({
//     from: `"Rane Observation System" <${process.env.GMAIL_USER}>`,
//     to: recipients.join(','),
//     subject: `[${o.plant_code}] Driver Observation - ${o.driver_name || 'Cab ' + (o.cab_no || '')}`,
//     html: buildEmailHtml(o),
//   });
  
//   return `sent to ${recipients.join(', ')}`;
// }

// // --------------------------------------------------------------------
// // App
// // --------------------------------------------------------------------
// const app = express();
// app.use(cors());
// app.use(express.json());

// // Auth middleware
// function auth(req, res, next) {
//   const header = req.headers.authorization || '';
//   const token = header.startsWith('Bearer ') ? header.slice(7) : null;
//   if (!token) return res.status(401).json({ error: 'Authentication required.' });
//   try {
//     req.user = jwt.verify(token, JWT_SECRET);
//     next();
//   } catch {
//     return res.status(401).json({ error: 'Session expired. Please sign in again.' });
//   }
// }

// // ---- Health --------------------------------------------------------
// app.get('/api/health', (_req, res) => res.json({ ok: true }));

// // ---- Login ---------------------------------------------------------
// app.post('/api/login', async (req, res) => {
//   const { username, password } = req.body || {};
//   if (!username || !password) return res.status(400).json({ error: 'Enter username and password.' });

//   const { data: user, error } = await supabase
//     .from('users').select('*').eq('username', username).single();

//   if (error || !user || !bcrypt.compareSync(password, user.password_hash)) {
//     return res.status(401).json({ error: 'Invalid username or password.' });
//   }

//   const payload = { sub: user.id, username: user.username, role: user.role, plant: user.plant };
//   const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
//   res.json({ token, user: { username: user.username, role: user.role, plant: user.plant } });
// });

// // ---- Current user --------------------------------------------------
// app.get('/api/me', auth, (req, res) => {
//   res.json({ username: req.user.username, role: req.user.role, plant: req.user.plant });
// });

// // ---- List observations (role-filtered) -----------------------------
// app.get('/api/observations', auth, async (req, res) => {
//   let query = supabase.from('observations').select('*').order('created_at', { ascending: false });

//   if (req.user.role === 'plant') {
//     query = query.eq('plant_name', req.user.plant);          // locked to their plant
//   } else if (req.query.plant && PLANTS[req.query.plant]) {
//     query = query.eq('plant_name', req.query.plant);         // admin optional filter
//   }

//   const { data, error } = await query;
//   if (error) return res.status(500).json({ error: error.message });
//   res.json(data);
// });

// // ---- Create observation (PUBLIC - no auth required) ----------------
// app.post('/api/observations', async (req, res) => {
//   let { plantName, empName, empNo, routeLoc, cabNo, driverName, description } = req.body || {};

//   const plant = PLANTS[plantName];
//   if (!plant) return res.status(400).json({ error: 'Invalid or missing plant selection.' });
//   if (!empName || !description) return res.status(400).json({ error: 'Employee name and description are required.' });

//   const { data, error } = await supabase
//     .from('observations')
//     .insert([{
//       plant_name: plantName,
//       plant_code: plant.code,
//       emp_name: empName,
//       emp_no: empNo,
//       route_loc: routeLoc,
//       cab_no: cabNo,
//       driver_name: driverName,
//       description,
//     }])
//     .select()
//     .single();

//   if (error) return res.status(500).json({ error: error.message });

//   let emailStatus;
//   try {
//     emailStatus = await sendObservationEmail(plant, data);
//   } catch (e) {
//     emailStatus = `failed: ${e.message}`;
//   }

//   res.json({ success: true, observation: data, emailStatus });
// });

// // --------------------------------------------------------------------
// // Optional: serve the built frontend
// // --------------------------------------------------------------------
// const distDir = path.join(__dirname, '..', 'Frontend', 'dist');
// app.use(express.static(distDir));
// app.get(/^(?!\/api).*/, (_req, res) => {
//   res.sendFile(path.join(distDir, 'index.html'), (err) => {
//     if (err) res.status(404).send('Frontend not built. Run "npm run build" in the Frontend folder.');
//   });
// });

// app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));
// module.exports = app;

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret';

// --------------------------------------------------------------------
// Supabase
// --------------------------------------------------------------------
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --------------------------------------------------------------------
// Plant directory: code + notification recipients
// --------------------------------------------------------------------
const PLANTS = {
  Mysore:      { code: 'P2', safetyEmail: 'm.sanjay@ranegroup.com',        hrEmail: 'anandgrgr6@gmail.com' },
  Pondicherry: { code: 'P3', safetyEmail: 'placeholder@ranegroup.com',     hrEmail: '' },
  Varanavasi:  { code: 'P4', safetyEmail: 'placeholder@ranegroup.com',     hrEmail: '' },
  Pantnagar:   { code: 'P5', safetyEmail: 'placeholder@ranegroup.com',     hrEmail: '' },
};

// --------------------------------------------------------------------
// Gmail SMTP transporter (nodemailer)
// --------------------------------------------------------------------
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
    },
  });
  transporter.verify()
    .then(() => console.log('📮 Gmail SMTP ready'))
    .catch((e) => console.warn('⚠️  Gmail SMTP not verified:', e.message));
} else {
  console.warn('⚠️  GMAIL_USER / GMAIL_APP_PASSWORD not set - emails will be skipped.');
}

function buildEmailHtml(o) {
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e9f0;border-radius:10px;overflow:hidden">
      <div style="background:#003366;color:#fff;padding:18px 24px">
        <div style="font-size:20px;font-weight:800;letter-spacing:.5px">RANE</div>
        <div style="font-size:13px;opacity:.85">Driver Behaviour Observation System</div>
      </div>
      <div style="padding:24px;color:#333">
        <p style="margin:0 0 16px">A new driver-behaviour observation has been logged for
          <strong>${o.plant_name} (${o.plant_code})</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${row('Plant', `${o.plant_name} (${o.plant_code})`)}
          ${row('Reported by', `${o.emp_name} (${o.emp_no || '-'})`)}
          ${row('Route & Location', o.route_loc)}
          ${row('Cab Number', o.cab_no)}
          ${row('Driver', o.driver_name)}
          ${row('Behavior', o.behavior_type)} <!-- Added this line -->
          ${row('Logged at', new Date(o.created_at).toLocaleString('en-IN'))}
        </table>
        <p style="margin:18px 0 6px;font-weight:700;color:#003366">Observation</p>
        <p style="margin:0;padding:12px 14px;background:#f5f7fb;border-left:3px solid #003366;border-radius:4px;white-space:pre-wrap">${o.description}</p>
      </div>
      <div style="background:#f0f2f5;color:#8a93a5;padding:12px 24px;font-size:12px">
        Automated notification. Please do not reply to this email.
      </div>
    </div>`;
}
function row(label, value) {
  return `<tr>
    <td style="padding:6px 0;color:#8a93a5;width:150px;vertical-align:top">${label}</td>
    <td style="padding:6px 0;color:#222;font-weight:600">${value || '-'}</td>
  </tr>`;
}

async function sendObservationEmail(plant, o) {
  if (!transporter) return 'skipped (no SMTP configured)';
  const recipients = [plant.safetyEmail, plant.hrEmail].filter(Boolean);
  if (recipients.length === 0) return 'skipped (no recipients)';
  await transporter.sendMail({
    from: `"Rane Observation System" <${process.env.GMAIL_USER}>`,
    to: recipients.join(','),
    subject: `[${o.plant_code}] Driver Observation - ${o.driver_name || 'Cab ' + (o.cab_no || '')}`,
    html: buildEmailHtml(o),
  });
  return `sent to ${recipients.join(', ')}`;
}

// --------------------------------------------------------------------
// App
// --------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

// ---- Health --------------------------------------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---- Login ---------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Enter username and password.' });

  const { data: user, error } = await supabase
    .from('users').select('*').eq('username', username).single();

  if (error || !user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const payload = { sub: user.id, username: user.username, role: user.role, plant: user.plant };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { username: user.username, role: user.role, plant: user.plant } });
});

// ---- Current user --------------------------------------------------
app.get('/api/me', auth, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role, plant: req.user.plant });
});

// ---- List observations (role-filtered) -----------------------------
app.get('/api/observations', auth, async (req, res) => {
  let query = supabase.from('observations').select('*').order('created_at', { ascending: false });

  if (req.user.role === 'plant') {
    query = query.eq('plant_name', req.user.plant);          // locked to their plant
  } else if (req.query.plant && PLANTS[req.query.plant]) {
    query = query.eq('plant_name', req.query.plant);         // admin optional filter
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---- Create observation (PUBLIC - no auth required) ----------------
// ---- Create observation (PUBLIC - no auth required) ----------------
app.post('/api/observations', async (req, res) => {
  // 1. Add behaviorType to the destructuring
  let { plantName, empName, empNo, routeLoc, cabNo, driverName, behaviorType, description } = req.body || {};

  const plant = PLANTS[plantName];
  if (!plant) return res.status(400).json({ error: 'Invalid or missing plant selection.' });
  if (!empName || !description) return res.status(400).json({ error: 'Employee name and description are required.' });

  const { data, error } = await supabase
    .from('observations')
    .insert([{
      plant_name: plantName,
      plant_code: plant.code,
      emp_name: empName,
      emp_no: empNo,
      route_loc: routeLoc,
      cab_no: cabNo,
      driver_name: driverName,
      behavior_type: behaviorType, // 2. Add it to the Supabase insert object
      description,
    }])
    .select()
    .single();

  

  if (error) return res.status(500).json({ error: error.message });

  let emailStatus;
  try {
    emailStatus = await sendObservationEmail(plant, data);
  } catch (e) {
    emailStatus = `failed: ${e.message}`;
  }

  res.json({ success: true, observation: data, emailStatus });
});



app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));
module.exports = app;
