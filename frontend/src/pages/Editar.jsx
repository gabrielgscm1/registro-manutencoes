import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { obterRegistro, atualizarRegistro } from '../services/api'
import CamposDinamicos from '../components/CamposDinamicos'
import Anexos from '../components/Anexos'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'

function Editar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    quilometragem: '',
    proxima_troca: '',
    data_proxima_troca: '',
    filtro_trocado: false
  })
  const [campos, setCampos] = useState([{ chave: '', valor: '' }])
  const [registro, setRegistro] = useState(null)

  useEffect(() => {
    const carregarRegistro = async () => {
      try {
        const data = await obterRegistro(id)
        setRegistro(data)
        setForm({
          titulo: data.titulo || '',
          quilometragem: data.quilometragem || '',
          proxima_troca: data.proxima_troca || '',
          data_proxima_troca: data.data_proxima_troca || '',
          filtro_trocado: data.filtro_trocado || false
        })

        if (data.dados && Object.keys(data.dados).length > 0) {
          setCampos(
            Object.entries(data.dados).map(([chave, valor]) => ({ chave, valor }))
          )
        }
      } catch (error) {
        console.error('Erro ao carregar registro:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    carregarRegistro()
  }, [id, navigate])

  // Função para capitalizar primeira letra de cada palavra
  const capitalizar = (texto) => {
    return texto
      .toLowerCase()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ')
  }

  // Formatar datetime para DD/MM/AAAA HH:MM
  const formatarDataHora = (dataStr) => {
    if (!dataStr) return ''
    const data = new Date(dataStr)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let novoValor = type === 'checkbox' ? checked : value

    // Capitalizar campo de título
    if (name === 'titulo' && type !== 'checkbox') {
      novoValor = capitalizar(value)
    }

    setForm((prev) => ({
      ...prev,
      [name]: novoValor
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dados = {}
      campos.forEach((campo) => {
        if (campo.chave.trim()) {
          dados[campo.chave.trim()] = campo.valor.trim()
        }
      })

      await atualizarRegistro(id, {
        titulo: form.titulo,
        quilometragem: form.quilometragem ? parseInt(form.quilometragem) : null,
        proxima_troca: form.proxima_troca ? parseInt(form.proxima_troca) : null,
        data_proxima_troca: form.data_proxima_troca || null,
        filtro_trocado: form.filtro_trocado,
        dados
      })

      navigate('/')
    } catch (error) {
      console.error('Erro ao atualizar registro:', error)
      alert('Erro ao atualizar registro')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <>
      <div className="page-header">
        <h2>Editar Registro</h2>
      </div>

      <form className="form-registro" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="titulo">Título *</label>
          <input
            type="text"
            id="titulo"
            name="titulo"
            placeholder="Digite o título do registro"
            value={form.titulo}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>

        <div className="form-section">
          <label>Dados da Manutenção</label>
          <p className="help-text">Informações sobre quilometragem e filtro</p>

          <div className="campos-fixos-grid">
            <div className="form-group">
              <label htmlFor="quilometragem">Quilometragem Atual</label>
              <input
                type="number"
                id="quilometragem"
                name="quilometragem"
                placeholder="Ex: 45000"
                min="0"
                value={form.quilometragem}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="proxima_troca">Próxima Troca (km)</label>
              <input
                type="number"
                id="proxima_troca"
                name="proxima_troca"
                placeholder="Ex: 50000"
                min="0"
                value={form.proxima_troca}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="data_proxima_troca">Próxima Troca (Data)</label>
              <input
                type="date"
                id="data_proxima_troca"
                name="data_proxima_troca"
                value={form.data_proxima_troca}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="filtro_trocado"
                checked={form.filtro_trocado}
                onChange={handleChange}
              />
              <span>Filtro de óleo trocado</span>
            </label>
          </div>
        </div>

        <CamposDinamicos campos={campos} setCampos={setCampos} />

        <Anexos registroId={parseInt(id)} />

        <div className="form-actions">
          <Link to="/" className="btn btn-secondary">
            <CancelIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <SaveIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      {registro && (
        <div className="registro-info">
          <small>Criado em: {formatarDataHora(registro.criado_em)}</small>
          <small>Última atualização: {formatarDataHora(registro.atualizado_em)}</small>
        </div>
      )}
    </>
  )
}

export default Editar
