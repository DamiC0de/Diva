"""
TTS Worker — Persistent Piper process (model stays loaded in RAM)
"""
import json
import base64
import subprocess
import struct
import io
import time
import redis
from config import Config


class PiperProcess:
    """Keeps Piper running with --json-input for fast synthesis."""
    
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.proc = None
        self._start()
    
    def _start(self):
        self.proc = subprocess.Popen(
            ['piper', '--model', self.model_path, '--json-input', '--output-raw'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        print(f"[TTS] Piper process started (PID {self.proc.pid})")
    
    def synthesize(self, text: str) -> bytes:
        """Send text via JSON, read raw audio back."""
        if self.proc is None or self.proc.poll() is not None:
            print("[TTS] Piper process died, restarting...")
            self._start()
        
        # Send JSON line
        payload = json.dumps({"text": text}) + "\n"
        self.proc.stdin.write(payload.encode('utf-8'))
        self.proc.stdin.flush()
        
        # Read raw PCM audio (16-bit, 22050Hz mono for medium model)
        # We need to read until silence/end. Piper outputs raw PCM.
        # Strategy: read chunks until we get a pause in output
        import select
        audio_chunks = []
        deadline = time.time() + 15  # max 15s
        
        while time.time() < deadline:
            # Wait for data with timeout
            ready, _, _ = select.select([self.proc.stdout], [], [], 0.3)
            if ready:
                chunk = self.proc.stdout.read1(65536) if hasattr(self.proc.stdout, 'read1') else self.proc.stdout.read(65536)
                if chunk:
                    audio_chunks.append(chunk)
                else:
                    break
            else:
                # No data for 300ms — likely done
                if audio_chunks:
                    break
        
        raw_audio = b''.join(audio_chunks)
        
        # Wrap in WAV header (22050Hz, 16-bit, mono)
        wav = self._make_wav(raw_audio, 22050, 1, 16)
        return wav
    
    def _make_wav(self, raw: bytes, rate: int, channels: int, bits: int) -> bytes:
        """Create WAV from raw PCM."""
        buf = io.BytesIO()
        data_size = len(raw)
        byte_rate = rate * channels * (bits // 8)
        block_align = channels * (bits // 8)
        
        buf.write(b'RIFF')
        buf.write(struct.pack('<I', 36 + data_size))
        buf.write(b'WAVE')
        buf.write(b'fmt ')
        buf.write(struct.pack('<IHHIIHH', 16, 1, channels, rate, byte_rate, block_align, bits))
        buf.write(b'data')
        buf.write(struct.pack('<I', data_size))
        buf.write(raw)
        return buf.getvalue()
    
    def close(self):
        if self.proc:
            self.proc.terminate()


def get_redis():
    return redis.Redis(host=Config.REDIS_HOST, port=Config.REDIS_PORT, decode_responses=True)


def main():
    print(f"[TTS] Worker starting (persistent mode)...")
    print(f"[TTS] Model: {Config.PIPER_MODEL_PATH}")

    r = get_redis()
    r.ping()
    print("[TTS] Connected to Redis")

    piper = PiperProcess(Config.PIPER_MODEL_PATH)
    
    # Warm up
    print("[TTS] Warming up Piper...")
    warmup = piper.synthesize("Bonjour.")
    print(f"[TTS] Warmup done ({len(warmup)} bytes). Waiting for jobs...")

    while True:
        try:
            result = r.brpop('tts:jobs', timeout=5)
            if not result:
                continue
            
            _, job_data = result
            job = json.loads(job_data)
            job_id = job['job_id']
            text = job['text']
            
            print(f"[TTS] Processing job {job_id}: {text[:50]}...")
            t0 = time.time()
            
            audio_data = piper.synthesize(text)
            elapsed = int((time.time() - t0) * 1000)
            
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            r.set(f"elio:result:{job_id}", json.dumps({
                'status': 'ok',
                'audio_base64': audio_b64,
                'duration_ms': len(audio_data) / 32,
            }), ex=60)
            
            print(f"[TTS] Job {job_id} done in {elapsed}ms ({len(audio_data)} bytes)")

        except KeyboardInterrupt:
            piper.close()
            break
        except redis.ConnectionError:
            print("[TTS] Redis lost, reconnecting...")
            time.sleep(5)
            r = get_redis()
        except Exception as e:
            print(f"[TTS] Error: {e}")
            time.sleep(1)


if __name__ == '__main__':
    main()
