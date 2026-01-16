import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = async (senha) => {
  const response = await api.post('/login', { senha })
  const { access_token } = response.data
  localStorage.setItem('token', access_token)
  return access_token
}

export const logout = () => {
  localStorage.removeItem('token')
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

export const verificarAuth = async () => {
  try {
    await api.get('/verificar-auth')
    return true
  } catch {
    return false
  }
}

// Registros
export const listarRegistros = async (busca = '') => {
  const params = busca ? { busca } : {}
  const response = await api.get('/registros', { params })
  return response.data
}

export const obterRegistro = async (id) => {
  const response = await api.get(`/registros/${id}`)
  return response.data
}

export const criarRegistro = async (registro) => {
  const response = await api.post('/registros', registro)
  return response.data
}

export const atualizarRegistro = async (id, registro) => {
  const response = await api.put(`/registros/${id}`, registro)
  return response.data
}

export const excluirRegistro = async (id) => {
  await api.delete(`/registros/${id}`)
}

export const obterDataPadrao = async () => {
  const response = await api.get('/data-padrao-proxima-troca')
  return response.data
}

// Histórico
export const listarHistorico = async () => {
  const response = await api.get('/historico')
  return response.data
}

// Anexos
export const listarAnexos = async (registroId) => {
  const response = await api.get(`/registros/${registroId}/anexos`)
  return response.data
}

export const uploadAnexo = async (registroId, arquivo) => {
  const formData = new FormData()
  formData.append('arquivo', arquivo)

  const response = await api.post(`/registros/${registroId}/anexos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const excluirAnexo = async (anexoId) => {
  await api.delete(`/anexos/${anexoId}`)
}

export const getUrlDownloadAnexo = (anexoId) => {
  const token = localStorage.getItem('token')
  return `${API_URL}/anexos/${anexoId}/download?token=${token}`
}

// Veículos
export const listarVeiculos = async () => {
  const response = await api.get('/veiculos')
  return response.data
}

export const obterVeiculo = async (id) => {
  const response = await api.get(`/veiculos/${id}`)
  return response.data
}

export const criarVeiculo = async (veiculo) => {
  const response = await api.post('/veiculos', veiculo)
  return response.data
}

export const atualizarVeiculo = async (id, veiculo) => {
  const response = await api.put(`/veiculos/${id}`, veiculo)
  return response.data
}

export const excluirVeiculo = async (id) => {
  await api.delete(`/veiculos/${id}`)
}

// Exportação
export const exportarPDF = async () => {
  const response = await api.get('/exportar/pdf', { responseType: 'blob' })
  return response.data
}

export const exportarPDFRegistro = async (registroId) => {
  const response = await api.get(`/registros/${registroId}/pdf`, { responseType: 'blob' })
  return response.data
}

export default api
