import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listarHistorico, exportarPDF, exportarPDFRegistro } from '../services/api'

function Historico() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [exportandoId, setExportandoId] = useState(null)

  useEffect(() => {
    const carregarHistorico = async () => {
      try {
        const data = await listarHistorico()
        setRegistros(data)
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
      } finally {
        setLoading(false)
      }
    }
    carregarHistorico()
  }, [])

  const formatarData = (dataStr) => {
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

  const handleExportarPDF = async () => {
    setExportando(true)
    try {
      const blob = await exportarPDF()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registros_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao exportar PDF')
    } finally {
      setExportando(false)
    }
  }

  const handleExportarPDFRegistro = async (id, titulo) => {
    setExportandoId(id)
    try {
      const blob = await exportarPDFRegistro(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao exportar PDF')
    } finally {
      setExportandoId(null)
    }
  }

  const agruparPorMes = (registros) => {
    const grupos = {}
    registros.forEach(registro => {
      const data = new Date(registro.criado_em)
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

      if (!grupos[chave]) {
        grupos[chave] = { label, registros: [] }
      }
      grupos[chave].registros.push(registro)
    })
    return Object.values(grupos)
  }

  if (loading) {
    return <div className="loading">Carregando histórico...</div>
  }

  const gruposPorMes = agruparPorMes(registros)

  return (
    <>
      <div className="page-header">
        <h2>Histórico de Manutenções</h2>
        <div className="page-header-actions">
          <button
            className="btn btn-pdf"
            onClick={handleExportarPDF}
            disabled={exportando || registros.length === 0}
          >
            {exportando ? 'Exportando...' : 'Exportar PDF'}
          </button>
          <Link to="/" className="btn btn-secondary">
            Voltar
          </Link>
        </div>
      </div>

      {registros.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma manutenção registrada ainda.</p>
          <Link to="/criar" className="btn btn-primary">
            Criar primeiro registro
          </Link>
        </div>
      ) : (
        <div className="timeline">
          {gruposPorMes.map((grupo, index) => (
            <div key={index} className="timeline-grupo">
              <div className="timeline-mes">{grupo.label}</div>
              {grupo.registros.map((registro) => (
                <div key={registro.id} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h3>{registro.titulo}</h3>
                      <span className="timeline-data">{formatarData(registro.criado_em)}</span>
                    </div>

                    <div className="timeline-actions">
                      <button
                        className="btn btn-pdf btn-sm"
                        onClick={() => handleExportarPDFRegistro(registro.id, registro.titulo)}
                        disabled={exportandoId === registro.id}
                      >
                        {exportandoId === registro.id ? 'Exportando...' : 'PDF'}
                      </button>
                      <Link to={`/detalhes/${registro.id}`} className="btn btn-secondary btn-sm">
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default Historico
