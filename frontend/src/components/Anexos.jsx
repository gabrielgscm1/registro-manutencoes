import { useState, useEffect } from 'react'
import { listarAnexos, uploadAnexo, excluirAnexo } from '../services/api'

function Anexos({ registroId }) {
  const [anexos, setAnexos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const carregarAnexos = async () => {
    try {
      const data = await listarAnexos(registroId)
      setAnexos(data)
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (registroId) {
      carregarAnexos()
    }
  }, [registroId])

  const handleUpload = async (e) => {
    const arquivo = e.target.files[0]
    if (!arquivo) return

    setUploading(true)
    try {
      await uploadAnexo(registroId, arquivo)
      await carregarAnexos()
      e.target.value = ''
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload do arquivo')
    } finally {
      setUploading(false)
    }
  }

  const handleExcluir = async (anexoId, nomeOriginal) => {
    if (!window.confirm(`Excluir "${nomeOriginal}"?`)) return

    try {
      await excluirAnexo(anexoId)
      await carregarAnexos()
    } catch (error) {
      console.error('Erro ao excluir anexo:', error)
      alert('Erro ao excluir anexo')
    }
  }

  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getIcone = (tipo) => {
    if (tipo?.startsWith('image/')) return '🖼️'
    if (tipo?.includes('pdf')) return '📄'
    if (tipo?.includes('word') || tipo?.includes('document')) return '📝'
    if (tipo?.includes('excel') || tipo?.includes('spreadsheet')) return '📊'
    return '📎'
  }

  const handleDownload = async (anexoId, nomeOriginal) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/anexos/${anexoId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Erro ao baixar arquivo')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeOriginal
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao baixar:', error)
      alert('Erro ao baixar arquivo')
    }
  }

  if (!registroId) return null

  return (
    <div className="anexos-section">
      <div className="anexos-header">
        <h4>Anexos</h4>
        <label className="btn btn-secondary btn-sm">
          {uploading ? 'Enviando...' : '+ Adicionar'}
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </label>
      </div>

      {loading ? (
        <p className="anexos-loading">Carregando anexos...</p>
      ) : anexos.length === 0 ? (
        <p className="anexos-vazio">Nenhum anexo adicionado.</p>
      ) : (
        <ul className="anexos-lista">
          {anexos.map((anexo) => (
            <li key={anexo.id} className="anexo-item">
              <span className="anexo-icone">{getIcone(anexo.tipo)}</span>
              <div className="anexo-info">
                <span className="anexo-nome">{anexo.nome_original}</span>
                <span className="anexo-tamanho">{formatarTamanho(anexo.tamanho)}</span>
              </div>
              <div className="anexo-acoes">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleDownload(anexo.id, anexo.nome_original)}
                  title="Baixar"
                >
                  ⬇
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleExcluir(anexo.id, anexo.nome_original)}
                  title="Excluir"
                >
                  X
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Anexos
