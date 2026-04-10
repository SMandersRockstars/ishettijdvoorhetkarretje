import { CalibrationTool } from '../components/CalibrationTool';
import '../styles/calibration-page.css';

export function CalibrationPage() {
  return (
    <div className="calibration-page">
      <CalibrationTool />
      <p className="back-note">
        <a href="/">← Terug naar karretje tracker</a>
      </p>
    </div>
  );
}
