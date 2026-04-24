import { useCartLocation } from '../contexts/CartLocationContext';
import config from '../config.json';
import '../styles/cart-map.css';

export function CartMap() {
  const { location } = useCartLocation();
  const zones = config.zones || [];

  const SVG_WIDTH = 500;
  const SVG_HEIGHT = 298;

  return (
    <div className="cart-map-container">
      <h2>📍 Karretje Locatie</h2>

      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="cart-map-svg"
      >
        {/* Floor plan image as background */}
        <image href="/kaartje.png" x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} preserveAspectRatio="xMidYMid meet" />

        {/* Zone overlays */}
        {zones.map((zone) => {
          const isActive = zone.id === location.zone;
          const x = (zone.x / 100) * SVG_WIDTH;
          const y = (zone.y / 100) * SVG_HEIGHT;
          const w = (zone.w / 100) * SVG_WIDTH;
          const h = (zone.h / 100) * SVG_HEIGHT;

          return (
            <g key={zone.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={isActive ? 'rgba(76, 175, 80, 0.35)' : 'rgba(0,0,0,0)'}
                stroke={isActive ? '#4caf50' : 'none'}
                strokeWidth={isActive ? 2 : 0}
                rx="4"
              />
              {isActive && (
                <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontSize="28">
                  🛒
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Location info */}
      <div className="cart-location-info">
        {location.zone === 'unknown' ? (
          <p className="location-unknown">Locatie onbekend</p>
        ) : (
          <>
            <p className="location-zone">
              Het karretje is in de <strong>{zones.find((z) => z.id === location.zone)?.label || location.zone}</strong>
            </p>
            {location.updatedAt && (
              <p className="location-updated">
                Laatst bijgewerkt: <time>{new Date(location.updatedAt).toLocaleTimeString('nl-NL')}</time>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
