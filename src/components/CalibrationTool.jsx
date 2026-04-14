import { useState, useEffect, useRef } from 'react';
import config from '../config.json';
import '../styles/calibration-tool.css';

export function CalibrationTool() {
  const zones = config.zones || [];
  const [fingerprints, setFingerprints] = useState({});
  const [pendingScan, setPendingScan] = useState(null);
  const [selectedZone, setSelectedZone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const pollRef = useRef(null);

  const loadFingerprints = async () => {
    try {
      const res = await fetch('/api/calibrate/fingerprints');
      setFingerprints(await res.json());
    } catch (err) {
      console.error('Failed to load fingerprints:', err);
    }
  };

  const pollPendingScan = async () => {
    try {
      const res = await fetch('/api/calibrate/pending');
      const data = await res.json();
      setPendingScan(data);
    } catch (err) {
      console.error('Failed to poll pending scan:', err);
    }
  };

  useEffect(() => {
    loadFingerprints();
    // Poll for pending ESP32 scan every 2 seconds
    pollRef.current = setInterval(pollPendingScan, 2000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleConfirm = async () => {
    if (!selectedZone) {
      setMessage({ type: 'error', text: 'Selecteer eerst een zone' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/calibrate/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone: selectedZone }),
      });

      if (res.ok) {
        const data = await res.json();
        const zoneLabel = zones.find((z) => z.id === selectedZone)?.label || selectedZone;
        setMessage({ type: 'success', text: `✅ Opgeslagen voor ${zoneLabel} (${data.ap_count} APs)` });
        setPendingScan(null);
        setSelectedZone('');
        loadFingerprints();
      } else {
        setMessage({ type: 'error', text: '❌ Opslaan mislukt' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Verbindingsfout' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zoneId) => {
    const zoneLabel = zones.find((z) => z.id === zoneId)?.label || zoneId;
    if (!confirm(`Verwijder kalibratie voor "${zoneLabel}"?`)) return;

    try {
      await fetch(`/api/calibrate/fingerprints/${zoneId}`, {
        method: 'DELETE',
        headers: { 'X-Api-Key': 'dev-key-change-in-production' },
      });
      loadFingerprints();
      setMessage({ type: 'success', text: `🗑️ Kalibratie voor ${zoneLabel} verwijderd` });
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Verwijderen mislukt' });
    }
  };

  return (
    <div className="calibration-tool">
      <h2>🔧 WiFi Kalibratietool</h2>

      {/* Instructions */}
      <div className="calibration-section">
        <h3>Hoe werkt het?</h3>
        <ol className="instructions">
          <li>Ga naar een zone in het kantoor <strong>met de ESP32</strong></li>
          <li>Druk op de knop op de ESP32 om een WiFi scan te starten</li>
          <li>De scan verschijnt hieronder automatisch</li>
          <li>Selecteer de zone en sla op</li>
          <li>Herhaal voor alle zones</li>
        </ol>
      </div>

      {/* Pending scan from ESP32 */}
      <div className="calibration-section">
        <h3>
          📡 Laatste scan van ESP32
          <span className="polling-indicator">● live</span>
        </h3>

        {pendingScan ? (
          <div className="pending-scan">
            <p className="scan-meta">
              Ontvangen om {new Date(pendingScan.scannedAt).toLocaleTimeString('nl-NL')} —{' '}
              <strong>{pendingScan.readings.length} netwerken gevonden</strong>
            </p>

            <table className="scan-table">
              <thead>
                <tr><th>SSID</th><th>BSSID</th><th>RSSI</th></tr>
              </thead>
              <tbody>
                {pendingScan.readings
                  .sort((a, b) => b.rssi - a.rssi)
                  .slice(0, 8)
                  .map((r) => (
                    <tr key={r.bssid}>
                      <td>{r.ssid || '—'}</td>
                      <td><code>{r.bssid}</code></td>
                      <td className={r.rssi > -60 ? 'rssi-strong' : r.rssi > -75 ? 'rssi-medium' : 'rssi-weak'}>
                        {r.rssi} dBm
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <div className="confirm-row">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="zone-select"
              >
                <option value="">-- Welke zone is dit? --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.label}</option>
                ))}
              </select>
              <button
                onClick={handleConfirm}
                disabled={!selectedZone || saving}
                className="save-button"
              >
                {saving ? 'Opslaan...' : 'Opslaan voor deze zone'}
              </button>
            </div>
          </div>
        ) : (
          <p className="waiting">Wachten op scan van ESP32... Druk op de knop op het apparaat.</p>
        )}

        {message && (
          <p className={`message ${message.type}`}>{message.text}</p>
        )}
      </div>

      {/* Saved fingerprints overview */}
      <div className="calibration-section">
        <h3>📊 Opgeslagen kalibraties</h3>
        <ul className="fingerprints-list">
          {zones.map((zone) => {
            const fp = fingerprints[zone.id];
            const apCount = fp ? Object.keys(fp).length : 0;
            return (
              <li key={zone.id} className={`fingerprint-item ${fp ? 'calibrated' : 'uncalibrated'}`}>
                <div className="fingerprint-info">
                  <strong>{zone.label}</strong>
                  <span className="ap-count">
                    {fp ? `${apCount} APs opgeslagen ✅` : 'Nog niet gekalibreerd'}
                  </span>
                </div>
                {fp && (
                  <button onClick={() => handleDelete(zone.id)} className="delete-button">
                    🗑️
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
