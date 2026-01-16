"""
Módulo de autenticação - JWT para API REST
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurações
APP_PASSWORD = os.getenv("APP_PASSWORD", "admin123")
SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-aqui-mude-em-producao")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Security scheme para Swagger
security = HTTPBearer()


def criar_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria um token JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verificar_token(token: str) -> bool:
    """Verifica se um token JWT é válido."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("authenticated", False)
    except JWTError:
        return False


def verificar_senha(senha: str) -> bool:
    """Verifica se a senha está correta."""
    return senha == APP_PASSWORD


def fazer_login(senha: str) -> Optional[str]:
    """Autentica e retorna o token JWT se a senha estiver correta."""
    if verificar_senha(senha):
        access_token = criar_token(
            data={"authenticated": True},
            expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
        )
        return access_token
    return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency para verificar autenticação nas rotas protegidas."""
    token = credentials.credentials
    if not verificar_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True
