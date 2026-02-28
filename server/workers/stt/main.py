"""
EL-006 — STT Worker (faster-whisper + Redis queue)
Polls stt:jobs, transcribes audio, stores result.
"""
import json
import base64
import tempfile
import time
import os
import redis
from config import Config

# Lazy load model (heavy)
_model = None

def get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        print(f"[STT] Loading model: {Config.MODEL_SIZE} (compute: {Config.COMPUTE_TYPE})")
        _model = WhisperModel(
            Config.MODEL_SIZE,
            device=Config.DEVICE,
            compute_type=Config.COMPUTE_TYPE,
        )
        print("[STT] Model loaded!")
    return _model

def get_redis():
    return redis.Redis(
        host=Config.REDIS_HOST,
        port=Config.REDIS_PORT,
        decode_responses=True
    )

def transcribe(audio_base64: str) -> dict:
    """Transcribe base64 audio to text."""
    audio_bytes = base64.b64decode(audio_base64)

    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        f.write(audio_bytes)
        temp_path = f.name

    try:
        model = get_model()
        start = time.time()

        segments, info = model.transcribe(
            temp_path,
            language='fr',
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        text = ' '.join(seg.text.strip() for seg in segments)
        duration_ms = int((time.time() - start) * 1000)

        return {
            'status': 'ok',
            'text': text,
            'language': info.language,
            'duration_ms': duration_ms,
        }
    finally:
        os.unlink(temp_path)

def process_job(r: redis.Redis, job_data: str):
    """Process a single STT job."""
    job = json.loads(job_data)
    job_id = job['job_id']

    print(f"[STT] Processing job {job_id}...")

    try:
        result = transcribe(job['audio_base64'])
        r.set(f"elio:result:{job_id}", json.dumps(result), ex=60)
        print(f"[STT] Job {job_id}: \"{result['text'][:60]}\" ({result['duration_ms']}ms)")
    except Exception as e:
        result = {'status': 'error', 'error': str(e)}
        r.set(f"elio:result:{job_id}", json.dumps(result), ex=60)
        print(f"[STT] Job {job_id} failed: {e}")

def main():
    print("[STT] Worker starting...")
    print(f"[STT] Model: {Config.MODEL_SIZE}, Device: {Config.DEVICE}")
    print(f"[STT] Redis: {Config.REDIS_HOST}:{Config.REDIS_PORT}")

    r = get_redis()
    r.ping()
    print("[STT] Connected to Redis, waiting for jobs on stt:jobs...")

    # Pre-load model
    get_model()

    while True:
        try:
            result = r.brpop('stt:jobs', timeout=5)
            if result:
                _, job_data = result
                process_job(r, job_data)
        except KeyboardInterrupt:
            print("[STT] Shutting down...")
            break
        except redis.ConnectionError:
            print("[STT] Redis connection lost, reconnecting in 5s...")
            time.sleep(5)
            r = get_redis()
        except Exception as e:
            print(f"[STT] Error: {e}")
            time.sleep(1)

if __name__ == '__main__':
    main()
