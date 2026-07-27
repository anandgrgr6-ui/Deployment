import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell,
} from 'recharts';
import { getObservations } from './api.js';

const PLANT_CODE = { Mysore: 'P2', Pondicherry: 'P3', Varanavasi: 'P4', Pantnagar: 'P5' };
const PLANTS = ['Mysore', 'Pondicherry', 'Varanavasi', 'Pantnagar'];
const PALETTE = ['#003366', '#0a6ebd', '#2e9e8f', '#e0a100', '#c0392b', '#6c5ce7'];

function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function Dashboard({ user }) {
  const isAdmin = user.role === 'admin';
  const [rows, setRows] = useState([]);
  const [plantFilter, setPlantFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    getObservations(isAdmin ? plantFilter : undefined)
      .then((data) => live && setRows(Array.isArray(data) ? data : []))
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [plantFilter, isAdmin]);

  const stats = useMemo(() => {
    const now = new Date();
    const wk = startOfWeek(now).getTime();
    const mo = startOfMonth(now).getTime();
    let week = 0, month = 0;
    const drivers = new Set();
    const plants = new Set();
    for (const r of rows) {
      const t = new Date(r.created_at).getTime();
      if (t >= wk) week++;
      if (t >= mo) month++;
      if (r.driver_name) drivers.add(r.driver_name.trim().toLowerCase());
      plants.add(r.plant_name);
    }
    return { total: rows.length, week, month, drivers: drivers.size, plants: plants.size };
  }, [rows]);

  const byPlant = useMemo(() => {
    const m = {};
    PLANTS.forEach((p) => (m[p] = 0));
    rows.forEach((r) => (m[r.plant_name] = (m[r.plant_name] || 0) + 1));
    return Object.entries(m).map(([plant, count]) => ({ name: PLANT_CODE[plant] || plant, plant, count }));
  }, [rows]);

  // UPDATED: Changed from topDrivers to topPlantCodes
  const topPlantCodes = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      // Use r.plant_code, fallback to mapping it from r.plant_name, or default to 'Unknown'
      const p = String(r.plant_code || PLANT_CODE[r.plant_name] || 'Unknown').trim() || 'Unknown';
      m[p] = (m[p] || 0) + 1;
    });
    return Object.entries(m)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [rows]);

  const scopeLabel = isAdmin
    ? plantFilter ? `${PLANT_CODE[plantFilter]} · ${plantFilter}` : 'All plants'
    : `${PLANT_CODE[user.plant]} · ${user.plant}`;

  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <h1>Observation Dashboard</h1>
          <p>{scopeLabel}</p>
        </div>
        {isAdmin && (
          <select className="plant-filter" value={plantFilter} onChange={(e) => setPlantFilter(e.target.value)}>
            <option value="">All plants</option>
            {PLANTS.map((p) => (
              <option key={p} value={p}>{PLANT_CODE[p]} · {p}</option>
            ))}
          </select>
        )}
      </div>

      {error && <div className="banner error">{error}</div>}
      {loading ? (
        <div className="empty">Loading observations…</div>
      ) : rows.length === 0 ? (
        <div className="empty">No observations recorded yet. Use “New Observation” to add the first one.</div>
      ) : (
        <>
          <div className="kpis">
            <Kpi label="Total observations" value={stats.total} />
            <Kpi label="This month" value={stats.month} />
            <Kpi label="This week" value={stats.week} />
            <Kpi label={isAdmin ? 'Plants reporting' : 'Drivers flagged'} value={isAdmin ? stats.plants : stats.drivers} />
          </div>

          <div className="card">
            <h3>Recent observations</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    {isAdmin && <th>Plant</th>}
                    <th>Reported by</th>
                    <th>Driver</th>
                    <th>Cab</th>
                    <th>Route</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((r) => (
                    <tr key={r.id}>
                      <td className="nowrap">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                      {isAdmin && (
                        <td><span className="pill">{r.plant_code || PLANT_CODE[r.plant_name]}</span> {r.plant_name}</td>
                      )}
                      <td>{r.emp_name}{r.emp_no ? ` (${r.emp_no})` : ''}</td>
                      <td>{r.driver_name || '—'}</td>
                      <td className="nowrap">{r.cab_no || '—'}</td>
                      <td>{r.route_loc || '—'}</td>
                      <td className="desc">{r.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="chart-grid">
            {isAdmin && (
              <div className="card">
                <h3>Observations by plant</h3>
                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byPlant} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5b6472' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5b6472' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f3f6fb' }} formatter={(v) => [v, 'Observations']} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
                        {byPlant.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* UPDATED: Changed Title and passed topPlantCodes into data */}
            <div className={isAdmin ? 'card' : 'card span-2'}>
              <h3>Most-flagged plant codes</h3>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPlantCodes} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#5b6472' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#333' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f3f6fb' }} formatter={(v) => [v, 'Observations']} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#003366" maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="kpi">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

// import { useEffect, useMemo, useState } from 'react';
// import {
//   ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
//   Cell,
// } from 'recharts';
// import { getObservations } from './api.js';

// const PLANT_CODE = { Mysore: 'P2', Pondicherry: 'P3', Varanavasi: 'P4', Pantnagar: 'P5' };
// const PLANTS = ['Mysore', 'Pondicherry', 'Varanavasi', 'Pantnagar'];
// const PALETTE = ['#003366', '#0a6ebd', '#2e9e8f', '#e0a100', '#c0392b', '#6c5ce7'];

// function startOfWeek(d) {
//   const x = new Date(d);
//   const day = (x.getDay() + 6) % 7; // Monday = 0
//   x.setDate(x.getDate() - day);
//   x.setHours(0, 0, 0, 0);
//   return x;
// }
// function startOfMonth(d) {
//   const x = new Date(d);
//   x.setDate(1);
//   x.setHours(0, 0, 0, 0);
//   return x;
// }

// export default function Dashboard({ user }) {
//   const isAdmin = user.role === 'admin';
//   const [rows, setRows] = useState([]);
//   const [plantFilter, setPlantFilter] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     let live = true;
//     setLoading(true);
//     setError('');
//     getObservations(isAdmin ? plantFilter : undefined)
//       .then((data) => live && setRows(Array.isArray(data) ? data : []))
//       .catch((e) => live && setError(e.message))
//       .finally(() => live && setLoading(false));
//     return () => { live = false; };
//   }, [plantFilter, isAdmin]);

//   const stats = useMemo(() => {
//     const now = new Date();
//     const wk = startOfWeek(now).getTime();
//     const mo = startOfMonth(now).getTime();
//     let week = 0, month = 0;
//     const drivers = new Set();
//     const plants = new Set();
//     for (const r of rows) {
//       const t = new Date(r.created_at).getTime();
//       if (t >= wk) week++;
//       if (t >= mo) month++;
//       if (r.driver_name) drivers.add(r.driver_name.trim().toLowerCase());
//       plants.add(r.plant_name);
//     }
//     return { total: rows.length, week, month, drivers: drivers.size, plants: plants.size };
//   }, [rows]);

//   const byPlant = useMemo(() => {
//     const m = {};
//     PLANTS.forEach((p) => (m[p] = 0));
//     rows.forEach((r) => (m[r.plant_name] = (m[r.plant_name] || 0) + 1));
//     return Object.entries(m).map(([plant, count]) => ({ name: PLANT_CODE[plant] || plant, plant, count }));
//   }, [rows]);

//   const topDrivers = useMemo(() => {
//     const m = {};
//     rows.forEach((r) => {
//       const d = (r.driver_name || 'Unknown').trim() || 'Unknown';
//       m[d] = (m[d] || 0) + 1;
//     });
//     return Object.entries(m)
//       .map(([name, count]) => ({ name, count }))
//       .sort((a, b) => b.count - a.count)
//       .slice(0, 6);
//   }, [rows]);


//   const scopeLabel = isAdmin
//     ? plantFilter ? `${PLANT_CODE[plantFilter]} · ${plantFilter}` : 'All plants'
//     : `${PLANT_CODE[user.plant]} · ${user.plant}`;

//   return (
//     <div className="page">
//       <div className="page-head row">
//         <div>
//           <h1>Observation Dashboard</h1>
//           <p>{scopeLabel}</p>
//         </div>
//         {isAdmin && (
//           <select className="plant-filter" value={plantFilter} onChange={(e) => setPlantFilter(e.target.value)}>
//             <option value="">All plants</option>
//             {PLANTS.map((p) => (
//               <option key={p} value={p}>{PLANT_CODE[p]} · {p}</option>
//             ))}
//           </select>
//         )}
//       </div>

//       {error && <div className="banner error">{error}</div>}
//       {loading ? (
//         <div className="empty">Loading observations…</div>
//       ) : rows.length === 0 ? (
//         <div className="empty">No observations recorded yet. Use “New Observation” to add the first one.</div>
//       ) : (
//         <>
//           <div className="kpis">
//             <Kpi label="Total observations" value={stats.total} />
//             <Kpi label="This month" value={stats.month} />
//             <Kpi label="This week" value={stats.week} />
//             <Kpi label={isAdmin ? 'Plants reporting' : 'Drivers flagged'} value={isAdmin ? stats.plants : stats.drivers} />
//           </div>

//           <div className="card">
//             <h3>Recent observations</h3>
//             <div className="table-wrap">
//               <table>
//                 <thead>
//                   <tr>
//                     <th>Date</th>
//                     {isAdmin && <th>Plant</th>}
//                     <th>Reported by</th>
//                     <th>Driver</th>
//                     <th>Cab</th>
//                     <th>Route</th>
//                     <th>Description</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {rows.slice(0, 20).map((r) => (
//                     <tr key={r.id}>
//                       <td className="nowrap">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
//                       {isAdmin && (
//                         <td><span className="pill">{r.plant_code || PLANT_CODE[r.plant_name]}</span> {r.plant_name}</td>
//                       )}
//                       <td>{r.emp_name}{r.emp_no ? ` (${r.emp_no})` : ''}</td>
//                       <td>{r.driver_name || '—'}</td>
//                       <td className="nowrap">{r.cab_no || '—'}</td>
//                       <td>{r.route_loc || '—'}</td>
//                       <td className="desc">{r.description}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           <div className="chart-grid">
//             {isAdmin && (
//               <div className="card">
//                 <h3>Observations by plant</h3>
//                 <div className="chart">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart data={byPlant} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
//                       <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5b6472' }} axisLine={false} tickLine={false} />
//                       <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5b6472' }} axisLine={false} tickLine={false} />
//                       <Tooltip cursor={{ fill: '#f3f6fb' }} formatter={(v) => [v, 'Observations']} />
//                       <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
//                         {byPlant.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
//                       </Bar>
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             )}

//             <div className={isAdmin ? 'card' : 'card span-2'}>
//               <h3>Most-flagged drivers</h3>
//               <div className="chart">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={topDrivers} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" horizontal={false} />
//                     <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#5b6472' }} axisLine={false} tickLine={false} />
//                     <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#333' }} axisLine={false} tickLine={false} />
//                     <Tooltip cursor={{ fill: '#f3f6fb' }} formatter={(v) => [v, 'Observations']} />
//                     <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#003366" maxBarSize={26} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// function Kpi({ label, value }) {
//   return (
//     <div className="kpi">
//       <div className="kpi-value">{value}</div>
//       <div className="kpi-label">{label}</div>
//     </div>
//   );
// }
