"""
EL-006 — STT Worker (faster-whisper + Redis queue)
Optimized: beam=3, 4 threads, ffmpeg pipe decode, VAD 300ms
"""
import json
import base64
import time
import subprocess
import tempfile
import os
import numpy as np
import redis
from config import Config

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
            cpu_threads=4,
        )
        print("[STT] Model loaded!")
    return _model

def get_redis():
    return redis.Redis(
        host=Config.REDIS_HOST,
        port=Config.REDIS_PORT,
        decode_responses=True
    )

def decode_audio_fast(audio_bytes: bytes) -> np.ndarray:
    """Convert any audio format to float32 16kHz mono via ffmpeg pipe (no temp files)."""
    proc = subprocess.run(
        ['ffmpeg', '-i', 'pipe:0', '-ar', '16000', '-ac', '1', '-f', 's16le', 'pipe:1'],
        input=audio_bytes, capture_output=True, timeout=10
    )
    if proc.returncode != 0 or len(proc.stdout) == 0:
        # Fallback: save to temp file and let whisper handle it
        return None
    return np.frombuffer(proc.stdout, dtype=np.int16).astype(np.float32) / 32768.0

def transcribe(audio_base64: str) -> dict:
    """Transcribe base64 audio to text."""
    audio_bytes = base64.b64decode(audio_base64)
    
    # Try fast in-memory decode
    audio = decode_audio_fast(audio_bytes)
    
    model = get_model()
    start = time.time()

    if audio is not None:
        # Numpy array path (fastest)
        segments, info = model.transcribe(
            audio,
            language='fr',
            beam_size=3,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=300),
            initial_prompt="Elio est un assistant vocal intelligent. L'utilisateur parle à Elio.",
        )
    else:
        # File fallback
        with tempfile.NamedTemporaryFile(suffix='.m4a', delete=False) as f:
            f.write(audio_bytes)
            temp_path = f.name
        try:
            segments, info = model.transcribe(
                temp_path,
                language='fr',
                beam_size=3,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=300),
                initial_prompt="Elio est un assistant vocal intelligent. L'utilisateur parle à Elio.",
            )
        finally:
            os.unlink(temp_path)

    text = ' '.join(seg.text.strip() for seg in segments)
    duration_ms = int((time.time() - start) * 1000)

    print(f"[STT] Transcribed ({duration_ms}ms, {len(audio_bytes)}B): \"{text[:80]}\"")

    return {
        'status': 'ok',
        'text': text,
        'language': info.language,
        'duration_ms': duration_ms,
    }

def process_job(r: redis.Redis, job_data: str):
    job = json.loads(job_data)
    job_id = job['job_id']
    try:
        result = transcribe(job['audio_base64'])
        r.set(f"elio:result:{job_id}", json.dumps(result), ex=60)
    except Exception as e:
        result = {'status': 'error', 'error': str(e)}
        r.set(f"elio:result:{job_id}", json.dumps(result), ex=60)
        print(f"[STT] Job {job_id} failed: {e}")

def main():
    print("[STT] Worker starting...")
    print(f"[STT] Model: {Config.MODEL_SIZE}, Device: {Config.DEVICE}")
    r = get_redis()
    r.ping()
    print("[STT] Connected to Redis, waiting for jobs...")
    get_model()

    while True:
        try:
            result = r.brpop('stt:jobs', timeout=5)
            if result:
                _, job_data = result
                process_job(r, job_data)
        except KeyboardInterrupt:
            break
        except redis.ConnectionError:
            print("[STT] Redis lost, reconnecting...")
            time.sleep(5)
            r = get_redis()
        except Exception as e:
            print(f"[STT] Error: {e}")
            time.sleep(1)

if __name__ == '__main__':
    main()
