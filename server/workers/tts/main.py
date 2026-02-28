"""
EL-007 — TTS Worker (Piper binary + Redis queue)
Polls tts:jobs, generates audio, stores result.
"""
import json
import base64
import subprocess
import tempfile
import time
import redis
from config import Config

def get_redis():
    return redis.Redis(
        host=Config.REDIS_HOST,
        port=Config.REDIS_PORT,
        decode_responses=True
    )

def synthesize(text: str, model_path: str) -> bytes:
    """Run Piper TTS and return WAV audio bytes."""
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        output_path = f.name

    cmd = [
        'piper',
        '--model', model_path,
        '--output_file', output_path,
    ]

    proc = subprocess.run(
        cmd,
        input=text.encode('utf-8'),
        capture_output=True,
        timeout=30,
    )

    if proc.returncode != 0:
        raise RuntimeError(f"Piper error: {proc.stderr.decode()}")

    with open(output_path, 'rb') as f:
        audio_data = f.read()

    import os
    os.unlink(output_path)
    return audio_data

def synthesize_streaming(text: str, model_path: str):
    """Split text by sentences and yield audio chunks."""
    import re
    sentences = re.split(r'(?<=[.!?:])\s+', text)
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        audio = synthesize(sentence, model_path)
        yield audio

def process_job(r: redis.Redis, job_data: str):
    """Process a single TTS job."""
    job = json.loads(job_data)
    job_id = job['job_id']
    text = job['text']
    streaming = job.get('streaming', False)

    print(f"[TTS] Processing job {job_id}: {text[:50]}...")

    try:
        model_path = Config.PIPER_MODEL_PATH

        if streaming:
            # Streaming: send chunks as they're generated
            chunks = list(synthesize_streaming(text, model_path))
            # For now, concatenate all chunks
            audio_data = b''.join(chunks)
        else:
            audio_data = synthesize(text, model_path)

        audio_b64 = base64.b64encode(audio_data).decode('utf-8')

        result = {
            'status': 'ok',
            'audio_base64': audio_b64,
            'duration_ms': len(audio_data) / 32,  # rough estimate for 16kHz mono
        }

        r.set(f"elio:result:{job_id}", json.dumps(result), ex=60)
        print(f"[TTS] Job {job_id} completed ({len(audio_data)} bytes)")

    except Exception as e:
        result = {'status': 'error', 'error': str(e)}
        r.set(f"elio:result:{job_id}", json.dumps(result), ex=60)
        print(f"[TTS] Job {job_id} failed: {e}")

def main():
    print(f"[TTS] Worker starting...")
    print(f"[TTS] Model: {Config.PIPER_MODEL_PATH}")
    print(f"[TTS] Redis: {Config.REDIS_HOST}:{Config.REDIS_PORT}")

    r = get_redis()
    r.ping()
    print("[TTS] Connected to Redis, waiting for jobs on tts:jobs...")

    while True:
        try:
            # BRPOP blocks until a job is available (timeout 5s)
            result = r.brpop('tts:jobs', timeout=5)
            if result:
                _, job_data = result
                process_job(r, job_data)
        except KeyboardInterrupt:
            print("[TTS] Shutting down...")
            break
        except redis.ConnectionError:
            print("[TTS] Redis connection lost, reconnecting in 5s...")
            time.sleep(5)
            r = get_redis()
        except Exception as e:
            print(f"[TTS] Error: {e}")
            time.sleep(1)

if __name__ == '__main__':
    main()
