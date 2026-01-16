"""
Sistema de Armazenamento de Informações v2
API FastAPI REST para frontend React
"""

import io
import os
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from typing import Optional


def formatar_data_br(data_str: str) -> str:
    """Formata data YYYY-MM-DD para DD/MM/AAAA."""
    if not data_str:
        return '-'
    try:
        if 'T' in data_str:
            dt = datetime.fromisoformat(data_str.replace('Z', '+00:00'))
            return dt.strftime('%d/%m/%Y')
        else:
            dt = datetime.strptime(data_str[:10], '%Y-%m-%d')
            return dt.strftime('%d/%m/%Y')
    except:
        return data_str


def formatar_data_hora_br(data_str: str) -> str:
    """Formata datetime para DD/MM/AAAA HH:MM."""
    if not data_str:
        return '-'
    try:
        if 'T' in data_str:
            dt = datetime.fromisoformat(data_str.replace('Z', '+00:00'))
            return dt.strftime('%d/%m/%Y %H:%M')
        else:
            dt = datetime.strptime(data_str[:16], '%Y-%m-%d %H:%M')
            return dt.strftime('%d/%m/%Y %H:%M')
    except:
        return data_str

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

import database
from auth import fazer_login, get_current_user

# Inicialização
app = FastAPI(
    title="Sistema de Armazenamento de Informações v2",
    description="API REST para controle de manutenções de veículos",
    version="2.0.0"
)

# Configurar CORS para permitir o frontend React
# Origens permitidas: localhost para dev + URLs do Render para produção
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://manutencoes-frontend.onrender.com",
]

# Adicionar origem do frontend em produção se configurada
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    cors_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar banco de dados ao iniciar
database.init_db()


# ============ SCHEMAS ============

class LoginRequest(BaseModel):
    senha: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CampoAdicional(BaseModel):
    chave: str
    valor: str


class RegistroCreate(BaseModel):
    titulo: str
    quilometragem: Optional[int] = None
    proxima_troca: Optional[int] = None
    data_proxima_troca: Optional[str] = None
    filtro_trocado: bool = False
    dados: dict = {}


class RegistroUpdate(BaseModel):
    titulo: str
    quilometragem: Optional[int] = None
    proxima_troca: Optional[int] = None
    data_proxima_troca: Optional[str] = None
    filtro_trocado: bool = False
    dados: dict = {}


class RegistroResponse(BaseModel):
    id: int
    titulo: str
    quilometragem: Optional[int]
    proxima_troca: Optional[int]
    data_proxima_troca: Optional[str]
    filtro_trocado: bool
    dados: dict
    criado_em: str
    atualizado_em: str


class VeiculoCreate(BaseModel):
    placa: str
    modelo: str
    ano: Optional[int] = None
    cor: Optional[str] = None


class VeiculoUpdate(BaseModel):
    placa: str
    modelo: str
    ano: Optional[int] = None
    cor: Optional[str] = None


class VeiculoResponse(BaseModel):
    id: int
    placa: str
    modelo: str
    ano: Optional[int]
    cor: Optional[str]
    criado_em: str
    atualizado_em: str


# ============ ROTAS DE AUTENTICAÇÃO ============

@app.post("/api/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Autentica o usuário e retorna o token JWT."""
    token = fazer_login(request.senha)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha incorreta"
        )
    return LoginResponse(access_token=token)


@app.get("/api/verificar-auth")
async def verificar_auth(authenticated: bool = Depends(get_current_user)):
    """Verifica se o token é válido."""
    return {"authenticated": True}


# ============ ROTAS DE REGISTROS ============

@app.get("/api/registros", response_model=list[RegistroResponse])
async def listar_registros(
    busca: Optional[str] = None,
    authenticated: bool = Depends(get_current_user)
):
    """Lista todos os registros, opcionalmente filtrados por busca."""
    registros = database.listar_registros(busca=busca)
    return registros


@app.get("/api/registros/{registro_id}", response_model=RegistroResponse)
async def obter_registro(
    registro_id: int,
    authenticated: bool = Depends(get_current_user)
):
    """Retorna um registro pelo ID."""
    registro = database.obter_registro(registro_id)
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado"
        )
    return registro


@app.post("/api/registros", response_model=RegistroResponse, status_code=status.HTTP_201_CREATED)
async def criar_registro(
    registro: RegistroCreate,
    authenticated: bool = Depends(get_current_user)
):
    """Cria um novo registro."""
    registro_id = database.criar_registro(
        titulo=registro.titulo,
        dados=registro.dados,
        quilometragem=registro.quilometragem,
        proxima_troca=registro.proxima_troca,
        data_proxima_troca=registro.data_proxima_troca,
        filtro_trocado=registro.filtro_trocado
    )
    return database.obter_registro(registro_id)


@app.put("/api/registros/{registro_id}", response_model=RegistroResponse)
async def atualizar_registro(
    registro_id: int,
    registro: RegistroUpdate,
    authenticated: bool = Depends(get_current_user)
):
    """Atualiza um registro existente."""
    existente = database.obter_registro(registro_id)
    if not existente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado"
        )

    database.atualizar_registro(
        registro_id=registro_id,
        titulo=registro.titulo,
        dados=registro.dados,
        quilometragem=registro.quilometragem,
        proxima_troca=registro.proxima_troca,
        data_proxima_troca=registro.data_proxima_troca,
        filtro_trocado=registro.filtro_trocado
    )
    return database.obter_registro(registro_id)


@app.delete("/api/registros/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
async def excluir_registro(
    registro_id: int,
    authenticated: bool = Depends(get_current_user)
):
    """Exclui um registro."""
    existente = database.obter_registro(registro_id)
    if not existente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado"
        )
    database.excluir_registro(registro_id)
    return None


@app.get("/api/data-padrao-proxima-troca")
async def data_padrao_proxima_troca(authenticated: bool = Depends(get_current_user)):
    """Retorna a data padrão para próxima troca (hoje + 6 meses)."""
    data_padrao = (date.today() + relativedelta(months=6)).isoformat()
    return {"data": data_padrao, "hoje": date.today().isoformat()}


# ============ ROTAS DE HISTÓRICO ============

@app.get("/api/historico")
async def listar_historico(authenticated: bool = Depends(get_current_user)):
    """Retorna todos os registros em formato de timeline (ordenados por data de criação)."""
    registros = database.listar_historico()
    return registros


# ============ ROTAS DE ANEXOS ============

@app.post("/api/registros/{registro_id}/anexos")
async def upload_anexo(
    registro_id: int,
    arquivo: UploadFile = File(...),
    authenticated: bool = Depends(get_current_user)
):
    """Faz upload de um anexo para um registro."""
    registro = database.obter_registro(registro_id)
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado"
        )

    conteudo = await arquivo.read()
    anexo = database.salvar_anexo(
        registro_id=registro_id,
        nome_original=arquivo.filename,
        conteudo=conteudo,
        tipo=arquivo.content_type
    )
    return anexo


@app.get("/api/registros/{registro_id}/anexos")
async def listar_anexos(
    registro_id: int,
    authenticated: bool = Depends(get_current_user)
):
    """Lista todos os anexos de um registro."""
    registro = database.obter_registro(registro_id)
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado"
        )

    anexos = database.listar_anexos(registro_id)
    return anexos


@app.get("/api/anexos/{anexo_id}")
async def obter_anexo(
    anexo_id: int,
    authenticated: bool = Depends(get_current_user)
):
    """Retorna os dados de um anexo."""
    anexo = database.obter_anexo(anexo_id)
    if not anexo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado"
        )
    return anexo


@app.get("/api/anexos/{anexo_id}/download")
async def download_anexo(
    anexo_id: int,
    authenticated: bool = Depends(get_current_user)
):
    """Faz download de um anexo."""
    anexo = database.obter_anexo(anexo_id)
    if not anexo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado"
        )

    caminho = database.obter_caminho_anexo(anexo["nome_arquivo"])
    if not caminho.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo não encontrado no disco"
        )

    return FileResponse(
        path=caminho,
        filename=anexo["nome_original"],
        media_type=anexo["tipo"]
    )


@app.delete("/api/anexos/{anexo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def excluir_anexo(
    anexo_id: int,
    authenticated: bool = Depends(get_current_user)
):
    """Exclui um anexo."""
    anexo = database.obter_anexo(anexo_id)
    if not anexo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado"
        )

    database.excluir_anexo(anexo_id)
    return None


# ============ ROTAS DE VEÍCULOS ============

@app.get("/api/veiculos", response_model=list[VeiculoResponse])
async def listar_veiculos(authenticated: bool = Depends(get_current_user)):
    """Lista todos os veículos cadastrados."""
    veiculos = database.listar_veiculos()
    return veiculos


@app.get("/api/veiculos/{veiculo_id}", response_model=VeiculoResponse)
async def obter_veiculo(
    veiculo_id: int,
    authenticated: bool = Depends(get_current_user)
):
    """Retorna um veículo pelo ID."""
    veiculo = database.obter_veiculo(veiculo_id)
    if not veiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Veículo não encontrado"
        )
    return veiculo


@app.post("/api/veiculos", response_model=VeiculoResponse, status_code=status.HTTP_201_CREATED)
async def criar_veiculo(
    veiculo: VeiculoCreate,
    authenticated: bool = Depends(get_current_user)
):
    """Cria um novo veículo."""
    try:
        veiculo_id = database.criar_veiculo(
            placa=veiculo.placa,
            modelo=veiculo.modelo,
            ano=veiculo.ano,
            cor=veiculo.cor
        )
        return database.obter_veiculo(veiculo_id)
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um veículo com esta placa"
            )
        raise


@app.put("/api/veiculos/{veiculo_id}", response_model=VeiculoResponse)
async def atualizar_veiculo(
    veiculo_id: int,
    veiculo: VeiculoUpdate,
    authenticated: bool = Depends(get_current_user)
):
    """Atualiza um veículo existente."""
    existente = database.obter_veiculo(veiculo_id)
    if not existente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Veículo não encontrado"
        )

    try:
        database.atualizar_veiculo(
            veiculo_id=veiculo_id,
            placa=veiculo.placa,
            modelo=veiculo.modelo,
            ano=veiculo.ano,
            cor=veiculo.cor
        )
        return database.obter_veiculo(veiculo_id)
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um veículo com esta placa"
            )
        raise


@app.delete("/api/veiculos/{veiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def excluir_veiculo(
    veiculo_id: int,
    authenticated: bool = Depends(get_current_user)
):
    """Exclui um veículo."""
    existente = database.obter_veiculo(veiculo_id)
    if not existente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Veículo não encontrado"
        )
    database.excluir_veiculo(veiculo_id)
    return None


# ============ ROTAS DE EXPORTAÇÃO ============

@app.get("/api/registros/{registro_id}/pdf")
async def exportar_pdf_registro(
    registro_id: int,
    authenticated: bool = Depends(get_current_user)
):
    """Exporta um registro específico em formato PDF."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

    registro = database.obter_registro(registro_id)
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado"
        )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)

    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle(
        'TituloRelatorio',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=20,
        alignment=1
    )
    subtitulo_style = ParagraphStyle(
        'Subtitulo',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=10
    )

    elements = []

    # Título
    elements.append(Paragraph(registro['titulo'], titulo_style))
    elements.append(Paragraph(f"Gerado em: {date.today().strftime('%d/%m/%Y')}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Dados principais
    data = []
    if registro['quilometragem']:
        km = f"{registro['quilometragem']:,}".replace(',', '.')
        data.append(['Quilometragem', f"{km} km"])
    if registro['proxima_troca']:
        proxima = f"{registro['proxima_troca']:,}".replace(',', '.')
        data.append(['Próxima Troca', f"{proxima} km"])
    if registro['data_proxima_troca']:
        data.append(['Data Próxima Troca', formatar_data_br(registro['data_proxima_troca'])])
    data.append(['Filtro Trocado', 'Sim' if registro['filtro_trocado'] else 'Não'])
    data.append(['Criado em', formatar_data_hora_br(registro['criado_em'])])

    if data:
        table = Table(data, colWidths=[6*cm, 10*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#ecf0f1')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(table)

    # Campos adicionais
    if registro['dados'] and len(registro['dados']) > 0:
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Informações Adicionais", subtitulo_style))
        dados_extras = [[k, v] for k, v in registro['dados'].items()]
        if dados_extras:
            table_extras = Table(dados_extras, colWidths=[6*cm, 10*cm])
            table_extras.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#34495e')),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
                ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#ecf0f1')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(table_extras)

    doc.build(elements)
    buffer.seek(0)

    nome_arquivo = f"registro_{registro_id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={nome_arquivo}"}
    )


@app.get("/api/exportar/pdf")
async def exportar_pdf(authenticated: bool = Depends(get_current_user)):
    """Exporta todos os registros em formato PDF."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

    registros = database.listar_historico()

    # Criar PDF em memória
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)

    # Estilos
    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle(
        'TituloRelatorio',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=20,
        alignment=1  # Centralizado
    )

    elements = []

    # Título do relatório
    elements.append(Paragraph("Relatório de Manutenções", titulo_style))
    elements.append(Paragraph(f"Gerado em: {date.today().strftime('%d/%m/%Y')}", styles['Normal']))
    elements.append(Spacer(1, 20))

    if registros:
        # Cabeçalho da tabela
        data = [['Título', 'KM', 'Próx. Troca', 'Filtro', 'Data']]

        # Dados
        for r in registros:
            km = f"{r['quilometragem']:,}".replace(',', '.') if r['quilometragem'] else '-'
            proxima = f"{r['proxima_troca']:,}".replace(',', '.') if r['proxima_troca'] else '-'
            filtro = 'Sim' if r['filtro_trocado'] else 'Não'
            data_criacao = formatar_data_br(r['criado_em'])

            data.append([
                r['titulo'][:30] + '...' if len(r['titulo']) > 30 else r['titulo'],
                km,
                proxima,
                filtro,
                data_criacao
            ])

        # Criar tabela
        table = Table(data, colWidths=[7*cm, 2.5*cm, 2.5*cm, 1.5*cm, 2.5*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#ecf0f1')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#ecf0f1')])
        ]))

        elements.append(table)
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"Total de registros: {len(registros)}", styles['Normal']))
    else:
        elements.append(Paragraph("Nenhum registro encontrado.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=registros.pdf"}
    )


# ============ EXECUÇÃO ============

if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 50)
    print("Sistema de Armazenamento de Informações v2")
    print("=" * 50)
    print("\nAPI: http://localhost:8000")
    print("Docs: http://localhost:8000/docs")
    print("Senha padrão: admin123 (altere no arquivo .env)")
    print("\nPressione Ctrl+C para encerrar\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
