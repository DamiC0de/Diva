/**
 * End-to-end pipeline test: Weather tool via Claude
 */
import 'dotenv/config';
import { LLMService } from '../services/llm.js';
import { ActionRunner } from '../services/actions/index.js';

const logger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.log('[WARN]', ...args),
  error: (...args: unknown[]) => console.log('[ERROR]', ...args),
  debug: () => {},
} as never;

async function main() {
  const llm = new LLMService(logger);
  const runner = new ActionRunner(logger);

  console.log('\n🧪 Test pipeline: "Quel temps fait-il à Lyon ?"\n');

  // Step 1: Claude
  console.log('1️⃣  Calling Claude...');
  const start = Date.now();
  const result = await llm.chat({
    userId: 'test-user',
    message: 'Quel temps fait-il à Lyon ?',
    history: [],
  });
  const llmMs = Date.now() - start;

  console.log(`   Response (${llmMs}ms): ${result.text?.slice(0, 150) || '[tool call]'}`);

  // Step 2: Execute tool calls if any
  if (result.toolCalls?.length) {
    for (const tc of result.toolCalls) {
      console.log(`\n2️⃣  Tool call: ${tc.name}(${JSON.stringify(tc.input)})`);
      const toolStart = Date.now();
      const toolResult = await runner.execute('test-user', tc.name, tc.input as Record<string, unknown>);
      const toolMs = Date.now() - toolStart;
      console.log(`   Result (${toolMs}ms): ${toolResult.result.slice(0, 200)}`);
    }
  }

  console.log('\n✅ Pipeline test complete!\n');
}

main().catch(console.error);
