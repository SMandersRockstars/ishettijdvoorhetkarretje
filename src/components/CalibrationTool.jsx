import { useState } from 'react';
import config from '../config.json';
import '../styles/calibration-tool.css';

export function CalibrationTool() {
  const zones = config.zones || [];
  const [selectedZone, setSelectedZone] = useState('');
  const [calibrationData, setCalibrationData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fingerprints, setFingerprints] = useState({});

  // Load stored fingerprints on mount
  const loadFingerprints = async () => {
    try {
      const response = await fetch('/api/calibrate/fingerprints');
      const data = await response.json();
      setFingerprints(data);
    } catch (err) {
      console.error('Failed to load fingerprints:', err);
    }
  };

  React.useEffect(() => {
    loadFingerprints();
  }, []);

  // Trigger ESP32 to scan and send readings
  const handleScan = async () => {
    if (!selectedZone) {
      setMessage('❌ Selecteer eerst een zone');
      return;
    }

    setLoading(true);
    setMessage('🔍 Wachten op scan van ESP32...');

    // In practice, this would trigger the ESP32 via a button or HTTP request
    // For now, we'll show a UI for testing
    alert('Druk op de button op de ESP32 om een WiFi scan uit te voeren. Het zal de resultaten naar de server sturen.');
  };

  // Save calibration data when ESP32 POSTs to the server
  const handleZoneDelete = async (zone) => {
    if (!confirm(`Verwijder kalibratiegegevens voor "${zones.find((z) => z.id === zone)?.label}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/calibrate/fingerprints/${zone}`, {
        method: 'DELETE',
        headers: { 'X-Api-Key': 'dev-key-change-in-production' },
      });

      if (response.ok) {
        setMessage(`✅ Kalibratiegegevens voor "${zone}" verwijderd`);
        loadFingerprints();
      } else {
        setMessage('❌ Fout bij verwijderen');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      setMessage('❌ Fout bij verwijderen');
    }
  };

  return (
    <div className="calibration-tool">
      <h2>🔧 WiFi Kalibratietool</h2>

      <div className="calibration-section">
        <h3>1. Selecteer een zone</h3>
        <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="zone-select">
          <option value="">-- Kies een zone --</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.label}
            </option>
          ))}
        </select>

        <h3>2. Start een scan</h3>
        <button onClick={handleScan} disabled={loading || !selectedZone} className="scan-button">
          {loading ? '⏳ Scanning...' : '🔍 Scan WiFi'}
        </button>

        {message && <p className="message">{message}</p>}
      </div>

      <div className="calibration-section">
        <h3>📊 Opgeslagen kalibraties</h3>
        {Object.keys(fingerprints).length === 0 ? (
          <p className="no-data">Nog geen kalibraties opgeslagen</p>
        ) : (
          <ul className="fingerprints-list">
            {zones.map((zone) => (
              <li key={zone.id} className="fingerprint-item">
                <div className="fingerprint-info">
                  <strong>{zone.label}</strong>
                  <code>{Object.keys(fingerprints[zone.id] || {}).length} APs</code>
                </div>
                <button onClick={() => handleZoneDelete(zone.id)} className="delete-button">
                  🗑️ Verwijderen
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="calibration-info">
        <h3>ℹ️ Instructies</h3>
        <ol>
          <li>Selecteer een zone uit de dropdown</li>
          <li>Ga naar die zone in het kantoor met de ESP32</li>
          <li>Druk op de knop op de ESP32 (of hier op "Scan WiFi")</li>
          <li>De ESP32 stuurt WiFi-signaalsterkten naar de server</li>
          <li>Herhaal voor alle zones</li>
        </ol>
      </div>
    </div>
  );
}
