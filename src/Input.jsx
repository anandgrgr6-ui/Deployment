import { useState, useEffect } from 'react';
import { createObservation } from './api.js';

const PLANTS = ['Mysore', 'Pondicherry', 'Varanavasi', 'Pantnagar'];
const PLANT_CODE = { Mysore: 'P2', Pondicherry: 'P3', Varanavasi: 'P4', Pantnagar: 'P5' };

// Table Mapping for Plant options
const ROUTE_MAP = {
  Varanavasi: [
    { route: 'Velachery - Varanavasi', cab: 'TN 87 H 0245', driver: '' },
    { route: 'Guindy - Varanavasi', cab: 'TN 87 H 0285', driver: '' },
    { route: 'SPR - Varanavasi', cab: 'TN 87 B 8838', driver: '' },
    { route: 'Kanchipuram - Varanavasi', cab: 'TN 12 AK 1012', driver: '' },
    { route: 'Alandur - Varanavasi', cab: 'TN 87 H 0243', driver: '' },
    { route: 'Chengalpattu - Varanavasi', cab: 'TN 12 AK 1012', driver: '' },
  ],
  Pondicherry: [
    { route: 'NR palayam/Thookanampakkam - Pallineliyanur', cab: 'TN23BU0240', driver: 'Jagan' },
    { route: 'Palur - Pallineliyanur', cab: 'TN74BF1274', driver: 'Vignesh' },
    { route: 'Panruti - Pallineliyanur', cab: 'TN31BC3766', driver: 'Ajeeth' },
    { route: 'Gingee - Pallineliyanur', cab: 'TN21AW7639', driver: 'Vetrivel' },
    { route: 'Paiyur - Pallineliyanur', cab: 'TN09W3916', driver: 'Balaji' },
    { route: 'Siruvanthadu - Pallineliyanur', cab: 'TN21BZ2998', driver: 'Durai' },
    { route: 'Vazhudavoor/Chettipet - Pallineliyanur', cab: 'TN31AC6048', driver: 'Soundar' },
    { route: 'Kuchipalayam/Arasoor - Pallineliyanur', cab: 'TN32D5011', driver: 'Dharani' },
    { route: 'Sornavoor/Manamedu - Pallineliyanur', cab: 'TN31AE2536', driver: 'Subash' },
    { route: 'Nettapakkam/Sembadapettai - Pallineliyanur', cab: 'TN31CL9594', driver: 'Karthi' },
    { route: 'Enathirimangalam - Pallineliyanur', cab: 'TN50U4981', driver: 'Thulasithasan' },
    { route: 'Nellikuppam - Pallineliyanur', cab: 'TN31AC0118', driver: 'Sasikumar' },
    { route: 'Palapattu - Pallineliyanur', cab: 'TN21AR1633', driver: 'Vetrivel' },
    { route: 'Pillur/Kandampakkam/Kandalavadi - Pallineliyanur', cab: 'TN32AA4631', driver: 'Jagadeesh' },
    { route: 'Rampakkam - Pallineliyanur', cab: 'PY05Z9392', driver: 'Mani' },
    { route: 'Kavarapattu - Pallineliyanur', cab: 'TN20CZ4344', driver: 'Manivel' },
  ],
  Pantnagar: [
    { route: 'Singh Colony - Pantanagar', cab: 'UK04CA6082', driver: 'Jasvindar' }
  ],
  Mysore: [
    { route: 'Hootagahalli - Plant', cab: 'KA09C2075', driver: '' },
    { route: 'Belavadi - Plant', cab: 'KA09C9193', driver: '' },
    { route: 'Coorgagali - Plant', cab: 'KA05MB7550', driver: '' }
  ]
};

const EMPTY = {
  plantName: '',
  empName: '',
  empNo: '',
  routeLoc: '',
  cabNo: '',
  behaviorType: '',
  driverName: '',
  description: '',
};

export default function Input() {
  const [form, setForm] = useState({ ...EMPTY });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lockedPlant, setLockedPlant] = useState('');

  // Check URL query parameters on initial render (e.g., ?plant=Varanavasi)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPlant = params.get('plant');

    // Case-insensitive check against valid PLANTS
    if (urlPlant) {
      const matchedPlant = PLANTS.find(
        (p) => p.toLowerCase() === urlPlant.toLowerCase()
      );
      if (matchedPlant) {
        setLockedPlant(matchedPlant);
        setForm((f) => ({ ...f, plantName: matchedPlant }));
      }
    }
  }, []);

  // Available options mapped to the currently selected plant
  const currentOptions = ROUTE_MAP[form.plantName] || [];

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Handle route change: Auto-fill cab and driver if available
  function handleRouteChange(val) {
    setForm((f) => {
      const match = currentOptions.find((o) => o.route === val);
      if (match) {
        return { ...f, routeLoc: val, cabNo: match.cab, driverName: match.driver || f.driverName };
      }
      return { ...f, routeLoc: val };
    });
  }

  // Handle cab change: Auto-fill route and driver if available
  function handleCabChange(val) {
    setForm((f) => {
      const match = currentOptions.find((o) => o.cab === val);
      if (match) {
        return { ...f, cabNo: val, routeLoc: match.route, driverName: match.driver || f.driverName };
      }
      return { ...f, cabNo: val };
    });
  }

  async function submit() {
    if (busy) return;
    setStatus(null);

    if (!form.plantName) return setStatus({ type: 'error', text: 'Please select a plant.' });
    if (!form.empName.trim()) return setStatus({ type: 'error', text: 'Employee name is required.' });
    if (!form.behaviorType) return setStatus({ type: 'error', text: 'Driver behavior selection is required.' });

    setBusy(true);
    try {
      const res = await createObservation(form);
      const emailNote =
        res.emailStatus && res.emailStatus.startsWith('sent')
          ? ' Notification email sent.'
          : ' (Email not sent — check SMTP settings.)';
      setStatus({ type: 'success', text: `Observation recorded for ${form.plantName}.${emailNote}` });
      // Reset form, but retain locked plant if URL parameter was present
      setForm({ ...EMPTY, plantName: lockedPlant || '' });
    } catch (e) {
      setStatus({ type: 'error', text: e.message });
    }
    setBusy(false);
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>New Observation</h1>
        <p>
          {lockedPlant 
            ? `Logging driver-behaviour observation for ${lockedPlant}. HR & Safety are notified automatically.`
            : 'Log a driver-behaviour observation. HR & Safety for the selected plant are notified automatically.'}
        </p>
      </div>

      <div className="form-card">
        <div className="field">
          <label>Plant Location {lockedPlant && ' (Locked by URL)'}</label>
          <select 
            value={form.plantName} 
            onChange={(e) => setForm({ ...EMPTY, plantName: e.target.value })}
            disabled={Boolean(lockedPlant)}
            style={lockedPlant ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
          >
            <option value="" disabled>-- Select plant --</option>
            {PLANTS.map((p) => (
              <option key={p} value={p}>{PLANT_CODE[p]} · {p}</option>
            ))}
          </select>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Employee Name</label>
            <input value={form.empName} onChange={(e) => set('empName', e.target.value)} placeholder="Full name" />
          </div>
          <div className="field">
            <label>Employee Number</label>
            <input value={form.empNo} onChange={(e) => set('empNo', e.target.value)} placeholder="Employee ID" />
          </div>
        </div>

        <datalist id="route-options">
          {currentOptions.map(o => <option key={o.route} value={o.route} />)}
        </datalist>
        <datalist id="cab-options">
          {currentOptions.map(o => <option key={o.cab} value={o.cab} />)}
        </datalist>

        <div className="grid-2">
          <div className="field">
            <label>Route &amp; Location</label>
            <input
              list="route-options"
              value={form.routeLoc}
              onChange={(e) => handleRouteChange(e.target.value)}
              placeholder="Select or type route"
            />
          </div>
          <div className="field">
            <label>Cab Number</label>
            <input
              list="cab-options"
              value={form.cabNo}
              onChange={(e) => handleCabChange(e.target.value)}
              placeholder="Select or type cab number"
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Driver Name</label>
            <input value={form.driverName} onChange={(e) => set('driverName', e.target.value)} placeholder="Driver's name (Optional)" />
          </div>
          <div className="field">
            <label>Driver Behavior</label>
            <select
              value={form.behaviorType}
              onChange={(e) => set('behaviorType', e.target.value)}
              required
            >
              <option value="" disabled>Select behavior...</option>
              <option value="Over speed">Over speed</option>
              <option value="Drunk and drive">Drunk and drive</option>
              <option value="Using mobile phone">Using mobile phone</option>
              <option value="Not wearing seat belt">Not wearing seat belt</option>
              <option value="Over jerking">Over jerking</option>
              <option value="Sleepy">Sleepy</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Description of Observation</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe the behaviour observed…"
          />
        </div>

        {status && <div className={`banner ${status.type}`}>{status.text}</div>}

        <button className="primary" onClick={submit} disabled={busy}>
          {busy ? 'Submitting…' : 'Submit observation'}
        </button>
      </div>
    </div>
  );
}
