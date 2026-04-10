import { createContext, useContext, useEffect, useState } from 'react';

const CartLocationContext = createContext();

export function CartLocationProvider({ children }) {
  const [location, setLocation] = useState({
    zone: 'unknown',
    timestamp: null,
    updatedAt: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/location');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setLocation(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch cart location:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchLocation();

    // Poll every 60 seconds
    const interval = setInterval(fetchLocation, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <CartLocationContext.Provider value={{ location, loading, error }}>
      {children}
    </CartLocationContext.Provider>
  );
}

export function useCartLocation() {
  const context = useContext(CartLocationContext);
  if (!context) {
    throw new Error('useCartLocation must be used within CartLocationProvider');
  }
  return context;
}
