import { useCartLocation } from '../contexts/CartLocationContext';
import config from '../config.json';
import '../styles/cart-map.css';

export function CartMap() {
  const { location } = useCartLocation();
  const zones = config.zones || [];

  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 300;

  return (
    <div className="cart-map-container">
      <h2>📍 Karretje Locatie</h2>

      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="cart-map-svg"
      >
        {/* Background */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#f9f9f9" stroke="#ccc" strokeWidth="2" />

        {/* Zones */}
        {zones.map((zone) => {
          const isActive = zone.id === location.zone;
          const x = (zone.x / 100) * SVG_WIDTH;
          const y = (zone.y / 100) * SVG_HEIGHT;
          const w = (zone.w / 100) * SVG_WIDTH;
          const h = (zone.h / 100) * SVG_HEIGHT;

          return (
            <g key={zone.id}>
              {/* Zone rectangle */}
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={isActive ? '#e8f5e9' : '#fafafa'}
                stroke={isActive ? '#4caf50' : '#ddd'}
                strokeWidth={isActive ? 3 : 1}
                rx="4"
              />

              {/* Zone label */}
              <text
                x={x + w / 2}
                y={y + h / 2 - 8}
                textAnchor="middle"
                className="zone-label"
                fill={isActive ? '#2e7d32' : '#666'}
              >
                {zone.label}
              </text>

              {/* Cart icon if this is the active zone */}
              {isActive && (
                <text x={x + w / 2} y={y + h / 2 + 20} textAnchor="middle" fontSize="32">
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
