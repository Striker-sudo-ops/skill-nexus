import hashlib
import jwt
from datetime import datetime, timedelta

SECRET = 'skillbridge_secret_2026'
ALGORITHM = 'HS256'

def hash_password(password: str) -> str:
    salt = 'sbsalt2026'
    h = hashlib.sha256(f'{salt}{password}'.encode()).hexdigest()
    return f'sha256${salt}${h}'

def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    if hashed.startswith('sha256$'):
        parts = hashed.split('$')
        if len(parts) != 3:
            return False
        salt = parts[1]
        h = hashlib.sha256(f'{salt}{plain}'.encode()).hexdigest()
        return h == parts[2]
    # Fallback direct match for legacy seeds
    return plain == hashed

def create_token(user_id: int, role: str) -> str:
    payload = {
        'sub': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
