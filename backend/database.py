"""
Módulo de banco de dados - SQLite com modelo de registros
Reutiliza o mesmo banco de dados da v1
"""

import sqlite3
import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

# Caminho do banco de dados
# Em produção (Render), usa pasta local; em desenvolvimento, usa pasta da v1
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "dados.db"

# Pasta para uploads
UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


def get_connection() -> sqlite3.Connection:
    """Retorna uma conexão com o banco de dados."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Inicializa o banco de dados criando as tabelas necessárias."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            quilometragem INTEGER,
            proxima_troca INTEGER,
            data_proxima_troca DATE,
            filtro_trocado INTEGER DEFAULT 0,
            dados TEXT DEFAULT '{}',
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Migrar tabela existente (adicionar colunas se não existirem)
    try:
        cursor.execute("ALTER TABLE registros ADD COLUMN quilometragem INTEGER")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE registros ADD COLUMN proxima_troca INTEGER")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE registros ADD COLUMN filtro_trocado INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE registros ADD COLUMN data_proxima_troca DATE")
    except sqlite3.OperationalError:
        pass

    # Tabela de anexos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS anexos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            registro_id INTEGER NOT NULL,
            nome_original TEXT NOT NULL,
            nome_arquivo TEXT NOT NULL,
            tipo TEXT,
            tamanho INTEGER,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
        )
    """)

    # Tabela de veículos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS veiculos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            placa TEXT NOT NULL UNIQUE,
            modelo TEXT NOT NULL,
            ano INTEGER,
            cor TEXT,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def criar_registro(
    titulo: str,
    dados: dict,
    quilometragem: Optional[int] = None,
    proxima_troca: Optional[int] = None,
    data_proxima_troca: Optional[str] = None,
    filtro_trocado: bool = False
) -> int:
    """Cria um novo registro e retorna o ID."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO registros
           (titulo, dados, quilometragem, proxima_troca, data_proxima_troca, filtro_trocado)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (titulo, json.dumps(dados, ensure_ascii=False), quilometragem, proxima_troca,
         data_proxima_troca, 1 if filtro_trocado else 0)
    )

    registro_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return registro_id


def listar_registros(busca: Optional[str] = None) -> list[dict]:
    """Retorna todos os registros, opcionalmente filtrados por busca."""
    conn = get_connection()
    cursor = conn.cursor()

    if busca:
        busca_param = f"%{busca}%"
        cursor.execute(
            """SELECT * FROM registros
               WHERE titulo LIKE ? OR dados LIKE ?
               ORDER BY atualizado_em DESC""",
            (busca_param, busca_param)
        )
    else:
        cursor.execute("SELECT * FROM registros ORDER BY atualizado_em DESC")

    rows = cursor.fetchall()
    conn.close()

    registros = []
    for row in rows:
        registros.append({
            "id": row["id"],
            "titulo": row["titulo"],
            "quilometragem": row["quilometragem"],
            "proxima_troca": row["proxima_troca"],
            "data_proxima_troca": row["data_proxima_troca"],
            "filtro_trocado": bool(row["filtro_trocado"]),
            "dados": json.loads(row["dados"]),
            "criado_em": row["criado_em"],
            "atualizado_em": row["atualizado_em"]
        })

    return registros


def obter_registro(registro_id: int) -> Optional[dict]:
    """Retorna um registro pelo ID ou None se não existir."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM registros WHERE id = ?", (registro_id,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return None

    return {
        "id": row["id"],
        "titulo": row["titulo"],
        "quilometragem": row["quilometragem"],
        "proxima_troca": row["proxima_troca"],
        "data_proxima_troca": row["data_proxima_troca"],
        "filtro_trocado": bool(row["filtro_trocado"]),
        "dados": json.loads(row["dados"]),
        "criado_em": row["criado_em"],
        "atualizado_em": row["atualizado_em"]
    }


def atualizar_registro(
    registro_id: int,
    titulo: str,
    dados: dict,
    quilometragem: Optional[int] = None,
    proxima_troca: Optional[int] = None,
    data_proxima_troca: Optional[str] = None,
    filtro_trocado: bool = False
) -> bool:
    """Atualiza um registro existente. Retorna True se atualizado."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE registros
        SET titulo = ?, dados = ?, quilometragem = ?, proxima_troca = ?,
            data_proxima_troca = ?, filtro_trocado = ?, atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (titulo, json.dumps(dados, ensure_ascii=False), quilometragem,
         proxima_troca, data_proxima_troca, 1 if filtro_trocado else 0, registro_id)
    )

    atualizado = cursor.rowcount > 0
    conn.commit()
    conn.close()

    return atualizado


def excluir_registro(registro_id: int) -> bool:
    """Exclui um registro pelo ID. Retorna True se excluído."""
    # Primeiro excluir anexos do disco
    anexos = listar_anexos(registro_id)
    for anexo in anexos:
        arquivo_path = UPLOADS_DIR / anexo["nome_arquivo"]
        if arquivo_path.exists():
            arquivo_path.unlink()

    conn = get_connection()
    cursor = conn.cursor()

    # Excluir anexos do banco
    cursor.execute("DELETE FROM anexos WHERE registro_id = ?", (registro_id,))
    # Excluir registro
    cursor.execute("DELETE FROM registros WHERE id = ?", (registro_id,))

    excluido = cursor.rowcount > 0
    conn.commit()
    conn.close()

    return excluido


# ============ FUNÇÕES DE ANEXOS ============

def salvar_anexo(registro_id: int, nome_original: str, conteudo: bytes, tipo: str) -> dict:
    """Salva um anexo no disco e registra no banco."""
    # Gerar nome único para o arquivo
    extensao = Path(nome_original).suffix
    nome_arquivo = f"{uuid.uuid4().hex}{extensao}"

    # Salvar arquivo no disco
    arquivo_path = UPLOADS_DIR / nome_arquivo
    with open(arquivo_path, "wb") as f:
        f.write(conteudo)

    # Registrar no banco
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO anexos (registro_id, nome_original, nome_arquivo, tipo, tamanho)
           VALUES (?, ?, ?, ?, ?)""",
        (registro_id, nome_original, nome_arquivo, tipo, len(conteudo))
    )

    anexo_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": anexo_id,
        "registro_id": registro_id,
        "nome_original": nome_original,
        "nome_arquivo": nome_arquivo,
        "tipo": tipo,
        "tamanho": len(conteudo)
    }


def listar_anexos(registro_id: int) -> list[dict]:
    """Lista todos os anexos de um registro."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM anexos WHERE registro_id = ? ORDER BY criado_em DESC",
        (registro_id,)
    )

    rows = cursor.fetchall()
    conn.close()

    anexos = []
    for row in rows:
        anexos.append({
            "id": row["id"],
            "registro_id": row["registro_id"],
            "nome_original": row["nome_original"],
            "nome_arquivo": row["nome_arquivo"],
            "tipo": row["tipo"],
            "tamanho": row["tamanho"],
            "criado_em": row["criado_em"]
        })

    return anexos


def obter_anexo(anexo_id: int) -> Optional[dict]:
    """Retorna um anexo pelo ID."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM anexos WHERE id = ?", (anexo_id,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return None

    return {
        "id": row["id"],
        "registro_id": row["registro_id"],
        "nome_original": row["nome_original"],
        "nome_arquivo": row["nome_arquivo"],
        "tipo": row["tipo"],
        "tamanho": row["tamanho"],
        "criado_em": row["criado_em"]
    }


def excluir_anexo(anexo_id: int) -> bool:
    """Exclui um anexo pelo ID."""
    anexo = obter_anexo(anexo_id)
    if not anexo:
        return False

    # Excluir arquivo do disco
    arquivo_path = UPLOADS_DIR / anexo["nome_arquivo"]
    if arquivo_path.exists():
        arquivo_path.unlink()

    # Excluir do banco
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM anexos WHERE id = ?", (anexo_id,))

    excluido = cursor.rowcount > 0
    conn.commit()
    conn.close()

    return excluido


def obter_caminho_anexo(nome_arquivo: str) -> Path:
    """Retorna o caminho completo de um anexo."""
    return UPLOADS_DIR / nome_arquivo


# ============ FUNÇÕES DE HISTÓRICO/TIMELINE ============

def listar_historico() -> list[dict]:
    """Retorna todos os registros ordenados por data de criação (timeline)."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM registros ORDER BY criado_em DESC")

    rows = cursor.fetchall()
    conn.close()

    registros = []
    for row in rows:
        registros.append({
            "id": row["id"],
            "titulo": row["titulo"],
            "quilometragem": row["quilometragem"],
            "proxima_troca": row["proxima_troca"],
            "data_proxima_troca": row["data_proxima_troca"],
            "filtro_trocado": bool(row["filtro_trocado"]),
            "dados": json.loads(row["dados"]),
            "criado_em": row["criado_em"],
            "atualizado_em": row["atualizado_em"]
        })

    return registros


# ============ FUNÇÕES DE VEÍCULOS ============

def criar_veiculo(placa: str, modelo: str, ano: Optional[int] = None, cor: Optional[str] = None) -> int:
    """Cria um novo veículo e retorna o ID."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO veiculos (placa, modelo, ano, cor)
           VALUES (?, ?, ?, ?)""",
        (placa.upper(), modelo, ano, cor)
    )

    veiculo_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return veiculo_id


def listar_veiculos() -> list[dict]:
    """Retorna todos os veículos ordenados por modelo."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM veiculos ORDER BY modelo ASC")

    rows = cursor.fetchall()
    conn.close()

    veiculos = []
    for row in rows:
        veiculos.append({
            "id": row["id"],
            "placa": row["placa"],
            "modelo": row["modelo"],
            "ano": row["ano"],
            "cor": row["cor"],
            "criado_em": row["criado_em"],
            "atualizado_em": row["atualizado_em"]
        })

    return veiculos


def obter_veiculo(veiculo_id: int) -> Optional[dict]:
    """Retorna um veículo pelo ID ou None se não existir."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM veiculos WHERE id = ?", (veiculo_id,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return None

    return {
        "id": row["id"],
        "placa": row["placa"],
        "modelo": row["modelo"],
        "ano": row["ano"],
        "cor": row["cor"],
        "criado_em": row["criado_em"],
        "atualizado_em": row["atualizado_em"]
    }


def atualizar_veiculo(veiculo_id: int, placa: str, modelo: str, ano: Optional[int] = None, cor: Optional[str] = None) -> bool:
    """Atualiza um veículo existente. Retorna True se atualizado."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE veiculos
        SET placa = ?, modelo = ?, ano = ?, cor = ?, atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (placa.upper(), modelo, ano, cor, veiculo_id)
    )

    atualizado = cursor.rowcount > 0
    conn.commit()
    conn.close()

    return atualizado


def excluir_veiculo(veiculo_id: int) -> bool:
    """Exclui um veículo pelo ID. Retorna True se excluído."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM veiculos WHERE id = ?", (veiculo_id,))

    excluido = cursor.rowcount > 0
    conn.commit()
    conn.close()

    return excluido
