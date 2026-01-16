import { useState } from 'react'
import { Link } from 'react-router-dom'
import { exportarCSV, exportarJSON } from '../services/api'

function Exportar() {
  const [exportando, setExportando] = useState(false)

  const handleExportarCSV = async () => {
    setExportando(true)
    try {
      const blob = await exportarCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registros_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      alert('Erro ao exportar CSV')
    } finally {
      setExportando(false)
    }
  }

  const handleExportarJSON = async () => {
    setExportando(true)
    try {
      const data = await exportarJSON()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registros_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao exportar JSON:', error)
      alert('Erro ao exportar JSON')
    } finally {
      setExportando(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Exportar Dados</h2>
        <Link to="/" className="btn btn-secondary">
          Voltar
        </Link>
      </div>

      <div className="exportar-container">
        <div className="exportar-card">
          <div className="exportar-icone">📊</div>
          <h3>CSV (Excel)</h3>
          <p>Formato ideal para abrir no Excel, Google Sheets ou outros editores de planilha.</p>
          <button
            className="btn btn-primary"
            onClick={handleExportarCSV}
            disabled={exportando}
          >
            {exportando ? 'Exportando...' : 'Baixar CSV'}
          </button>
        </div>

        <div className="exportar-card">
          <div className="exportar-icone">📋</div>
          <h3>JSON</h3>
          <p>Formato estruturado para backup ou integração com outros sistemas.</p>
          <button
            className="btn btn-primary"
            onClick={handleExportarJSON}
            disabled={exportando}
          >
            {exportando ? 'Exportando...' : 'Baixar JSON'}
          </button>
        </div>
      </div>
    </>
  )
}

export default Exportar
