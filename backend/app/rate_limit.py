import os

from slowapi import Limiter
from slowapi.util import get_remote_address

RATE_LIMIT_AGENT = os.getenv("RATE_LIMIT_AGENT", "10/minute")
RATE_LIMIT_ANALYSIS = os.getenv("RATE_LIMIT_ANALYSIS", "20/minute")
RATE_LIMIT_CONFIDENCE = os.getenv("RATE_LIMIT_CONFIDENCE", "30/minute")

limiter = Limiter(key_func=get_remote_address)
