import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { obterRegistro } from '../services/api'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'

function Detalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [registro, setRegistro] = useState(null)

  useEffect(() => {
    const carregarRegistro = async () => {
      try {
        const data = await obterRegistro(id)
        setRegistro(data)
      } catch (error) {
        console.error('Erro ao carregar registro:', error)
        navigate('/historico')
      } finally {
        setLoading(false)
      }
    }
    carregarRegistro()
  }, [id, navigate])

  const formatarKm = (km) => {
    return km?.toLocaleString('pt-BR') || ''
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return ''
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

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

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  if (!registro) {
    return <div className="loading">Registro não encontrado</div>
  }

  const temCamposFixos = registro.quilometragem || registro.proxima_troca ||
                          registro.data_proxima_troca || registro.filtro_trocado !== undefined

  const temDados = registro.dados && Object.keys(registro.dados).length > 0

  return (
    <>
      <div className="page-header">
        <h2>Detalhes do Registro</h2>
        <Link to="/historico" className="btn btn-secondary">
          <ArrowBackIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
          Voltar
        </Link>
      </div>

      <div className="detalhes-container">
        <div className="detalhes-card">
          <div className="detalhes-titulo">
            <h3>{registro.titulo}</h3>
          </div>

          {temCamposFixos && (
            <div className="detalhes-section">
              <h4>Dados da Manutenção</h4>
              <div className="detalhes-grid">
                {registro.quilometragem && (
                  <div className="detalhes-item">
                    <span className="detalhes-label">Quilometragem Atual:</span>
                    <span className="detalhes-valor">{formatarKm(registro.quilometragem)} km</span>
                  </div>
                )}
                {registro.proxima_troca && (
                  <div className="detalhes-item">
                    <span className="detalhes-label">Próxima Troca:</span>
                    <span className="detalhes-valor">{formatarKm(registro.proxima_troca)} km</span>
                  </div>
                )}
                {registro.data_proxima_troca && (
                  <div className="detalhes-item">
                    <span className="detalhes-label">Data Próxima Troca:</span>
                    <span className="detalhes-valor">{formatarData(registro.data_proxima_troca)}</span>
                  </div>
                )}
                <div className="detalhes-item">
                  <span className="detalhes-label">Filtro de Óleo:</span>
                  <span className="detalhes-valor">
                    {registro.filtro_trocado ? 'Trocado' : 'Não trocado'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {temDados && (
            <div className="detalhes-section">
              <h4>Informações Adicionais</h4>
              <div className="detalhes-dados">
                <table>
                  <tbody>
                    {Object.entries(registro.dados).map(([chave, valor]) => (
                      <tr key={chave}>
                        <td className="chave">{chave}:</td>
                        <td className="valor">{valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="detalhes-section detalhes-meta">
            <div className="detalhes-item">
              <span className="detalhes-label">Criado em:</span>
              <span className="detalhes-valor">{formatarDataHora(registro.criado_em)}</span>
            </div>
            <div className="detalhes-item">
              <span className="detalhes-label">Última atualização:</span>
              <span className="detalhes-valor">{formatarDataHora(registro.atualizado_em)}</span>
            </div>
          </div>
        </div>

        <div className="detalhes-actions">
          <Link to={`/editar/${registro.id}`} className="btn btn-primary">
            <EditIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
            Editar Registro
          </Link>
          <Link to="/historico" className="btn btn-secondary">
            <ArrowBackIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
            Voltar ao Histórico
          </Link>
        </div>
      </div>
    </>
  )
}

export default Detalhes
