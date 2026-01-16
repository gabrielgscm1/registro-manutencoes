# Sistema de Armazenamento de Informações v2

Sistema web para controle de manutenções de veículos (troca de óleo) - Versão com React.

## Tecnologias

- **Backend**: Python 3.11+ com FastAPI (API REST)
- **Frontend**: React 18 + Vite
- **Banco de dados**: SQLite (compartilhado com v1)
- **Autenticação**: JWT (JSON Web Token)

## Estrutura

```
armazenamento_informacoes_v2/
├── backend/
│   ├── main.py           # API FastAPI (rotas REST)
│   ├── database.py       # SQLite e funções CRUD
│   ├── auth.py           # Autenticação JWT
│   ├── requirements.txt  # Dependências Python
│   └── .env.example      # Exemplo de configuração
└── frontend/
    ├── src/
    │   ├── components/   # Componentes React reutilizáveis
    │   ├── pages/        # Páginas da aplicação
    │   ├── services/     # Serviços de API
    │   ├── App.jsx       # Componente principal
    │   └── main.jsx      # Entry point
    ├── package.json      # Dependências Node.js
    └── vite.config.js    # Configuração do Vite
```

## Instalação

### Backend

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env
```

### Frontend

```bash
cd frontend
npm install
```

## Execução

### Opção 1: Desenvolvimento (dois terminais)

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Opção 2: Produção

```bash
# Build do frontend
cd frontend
npm run build

# Servir com o backend (necessita configurar static files)
cd ../backend
python main.py
```

## Acessos

- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

## Senha Padrão

`admin123` (altere no arquivo `backend/.env`)

## API Endpoints

| Método | Rota                          | Descrição                    |
|--------|-------------------------------|------------------------------|
| POST   | `/api/login`                  | Autenticar e obter token     |
| GET    | `/api/verificar-auth`         | Verificar token válido       |
| GET    | `/api/registros`              | Listar registros             |
| GET    | `/api/registros/{id}`         | Obter registro por ID        |
| POST   | `/api/registros`              | Criar registro               |
| PUT    | `/api/registros/{id}`         | Atualizar registro           |
| DELETE | `/api/registros/{id}`         | Excluir registro             |
| GET    | `/api/data-padrao-proxima-troca` | Obter data padrão (6 meses) |

## Diferenças da v1

| Aspecto        | v1 (Jinja2)                | v2 (React)                  |
|----------------|----------------------------|-----------------------------|
| Frontend       | Templates Jinja2           | SPA React                   |
| Autenticação   | Cookie com sessão          | JWT Bearer Token            |
| Arquitetura    | Monolítico                 | Backend/Frontend separados  |
| API            | Rotas HTML                 | REST JSON                   |
| Navegação      | Recarrega página           | Client-side routing         |
