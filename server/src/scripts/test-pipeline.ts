/**
 * End-to-end pipeline test: Claude SDK mode + Weather
 */
import 'dotenv/config';
import { LLMService } from '../services/llm.js';
import { ActionRunner } from '../services/actions/index.js';

const logger = {
  info: (o: unknown) => console.log('[INFO]', typeof o === 'object' ? JSON.stringify(o) : o),
  warn: (o: unknown) => console.log('[WARN]', typeof o === 'object' ? JSON.stringify(o) : o),
  error: (o: unknown) => console.log('[ERROR]', typeof o === 'object' ? JSON.stringify(o) : o),
  debug: () => {},
} as never;

async function main() {
  const llm = new LLMService(logger);
  const runner = new ActionRunner(logger);

  console.log('\n🧪 Test pipeline E2E (mode SDK)\n');

  // Simple test first
  console.log('1️⃣  Simple question to Claude...');
  const start = Date.now();
  const result = await llm.chat({
    userId: 'test-user',
    message: 'Dis-moi bonjour en une phrase courte.',
    history: [],
  });
  console.log(`   ✅ Response (${Date.now() - start}ms): "${result.text}"`);

  // Weather test
  console.log('\n2️⃣  Weather via direct API call...');
  const weatherResult = await runner.execute('test-user', 'get_weather', { city: 'Paris' });
  const weather = JSON.parse(weatherResult.result);
  console.log(`   ✅ Paris: ${weather.current.temperature}°C, ${weather.current.weather_description}`);

  console.log('\n🎉 Pipeline test complete!\n');
}

main().catch(console.error);
