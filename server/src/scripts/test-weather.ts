import { getWeather } from '../services/actions/weather.js';

async function main() {
  console.log('🌤️ Testing weather API...');
  const result = await getWeather({ city: 'Lyon', days: 2 });
  const data = JSON.parse(result);
  console.log(`City: ${data.current.city} (${data.current.country})`);
  console.log(`Temp: ${data.current.temperature}°C (ressenti ${data.current.apparent_temperature}°C)`);
  console.log(`Conditions: ${data.current.weather_description}`);
  console.log(`Vent: ${data.current.wind_speed} km/h`);
  console.log(`Prévisions: ${data.forecast.length} jours`);
  data.forecast.forEach((d: { date: string; temperature_min: number; temperature_max: number; weather_description: string }) => {
    console.log(`  ${d.date}: ${d.temperature_min}°-${d.temperature_max}°C — ${d.weather_description}`);
  });
}

main().catch(console.error);
