import { useState, useEffect } from 'react';

const DEN_BOSCH_LAT = 51.698;
const DEN_BOSCH_LON = 5.304;
const HOT_THRESHOLD = 23;

export function useWeather() {
  const [temperature, setTemperature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEN_BOSCH_LAT}&longitude=${DEN_BOSCH_LON}&current=temperature_2m&timezone=Europe%2FAmsterdam`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTemperature(data.current.temperature_2m);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return {
    temperature,
    isHot: temperature !== null && temperature > HOT_THRESHOLD,
    loading,
    error,
  };
}
