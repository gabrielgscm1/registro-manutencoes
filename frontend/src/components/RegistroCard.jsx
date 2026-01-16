import { Link } from 'react-router-dom'

function RegistroCard({ registro, onExcluir, hoje }) {
  const formatarKm = (km) => {
    return km?.toLocaleString('pt-BR') || ''
  }

  // Formatar data YYYY-MM-DD para DD/MM/AAAA
  const formatarData = (dataStr) => {
    if (!dataStr) return ''
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
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

  const getClasseData = () => {
    if (!registro.data_proxima_troca) return ''
    if (registro.data_proxima_troca < hoje) return 'troca-vencida'

    const dataProxima = new Date(registro.data_proxima_troca)
    const dataHoje = new Date(hoje)
    const diffDias = Math.ceil((dataProxima - dataHoje) / (1000 * 60 * 60 * 24))

    if (diffDias <= 30) return 'troca-proxima'
    return ''
  }

  const handleExcluir = () => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      onExcluir(registro.id)
    }
  }

  const temCamposFixos = registro.quilometragem || registro.proxima_troca ||
                          registro.data_proxima_troca

  const temDados = registro.dados && Object.keys(registro.dados).length > 0

  return (
    <div className="registro-card">
      <div className="registro-header">
        <h3>{registro.titulo}</h3>
        <span className="registro-data">{formatarDataHora(registro.atualizado_em)}</span>
      </div>

      {temCamposFixos && (
        <div className="registro-campos-fixos">
          {registro.quilometragem && (
            <span className="campo-fixo">
              <strong>KM:</strong> {formatarKm(registro.quilometragem)}
            </span>
          )}
          {registro.proxima_troca && (
            <span className="campo-fixo">
              <strong>Próxima troca:</strong> {formatarKm(registro.proxima_troca)} km
            </span>
          )}
          {registro.data_proxima_troca && (
            <span className={`campo-fixo ${getClasseData()}`}>
              <strong>Trocar até:</strong> {formatarData(registro.data_proxima_troca)}
              {registro.data_proxima_troca < hoje && ' (VENCIDO)'}
            </span>
          )}
        </div>
      )}

      {temDados && (
        <div className="registro-dados">
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
      )}

      <div className="registro-acoes">
        <Link to={`/editar/${registro.id}`} className="btn btn-secondary btn-sm">
          Editar
        </Link>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={handleExcluir}
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

export default RegistroCard
