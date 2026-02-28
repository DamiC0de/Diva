import os

class Config:
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
    MODEL_SIZE = os.getenv('WHISPER_MODEL', 'small')
    DEVICE = os.getenv('WHISPER_DEVICE', 'cpu')
    COMPUTE_TYPE = os.getenv('WHISPER_COMPUTE', 'int8')
