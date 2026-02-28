import os

class Config:
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
    PIPER_MODEL_PATH = os.getenv(
        'PIPER_MODEL_PATH',
        os.path.expanduser('~/models/piper-voices/fr/fr_FR-siwis-medium.onnx')
    )
    SAMPLE_RATE = 22050
