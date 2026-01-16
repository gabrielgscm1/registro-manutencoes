import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listarVeiculos, criarVeiculo, atualizarVeiculo, excluirVeiculo } from '../services/api'

function Veiculos() {
  const [veiculos, setVeiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    placa: '',
    modelo: '',
    ano: '',
    cor: ''
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarVeiculos()
  }, [])

  const carregarVeiculos = async () => {
    try {
      const data = await listarVeiculos()
      setVeiculos(data)
    } catch (error) {
      console.error('Erro ao carregar veículos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para capitalizar primeira letra de cada palavra
  const capitalizar = (texto) => {
    return texto
      .toLowerCase()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let novoValor = value

    // Capitalizar campos de texto (exceto placa que vai em maiúsculas)
    if (name === 'placa') {
      novoValor = value.toUpperCase()
    } else if (name === 'modelo' || name === 'cor') {
      novoValor = capitalizar(value)
    }

    setForm((prev) => ({
      ...prev,
      [name]: novoValor
    }))
  }

  const abrirModal = (veiculo = null) => {
    if (veiculo) {
      setEditando(veiculo.id)
      setForm({
        placa: veiculo.placa,
        modelo: veiculo.modelo,
        ano: veiculo.ano || '',
        cor: veiculo.cor || ''
      })
    } else {
      setEditando(null)
      setForm({
        placa: '',
        modelo: '',
        ano: '',
        cor: ''
      })
    }
    setShowModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setEditando(null)
    setForm({
      placa: '',
      modelo: '',
      ano: '',
      cor: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)

    try {
      const dados = {
        placa: form.placa.toUpperCase(),
        modelo: form.modelo,
        ano: form.ano ? parseInt(form.ano) : null,
        cor: form.cor || null
      }

      if (editando) {
        await atualizarVeiculo(editando, dados)
      } else {
        await criarVeiculo(dados)
      }

      await carregarVeiculos()
      fecharModal()
    } catch (error) {
      console.error('Erro ao salvar veículo:', error)
      if (error.response?.data?.detail) {
        alert(error.response.data.detail)
      } else {
        alert('Erro ao salvar veículo')
      }
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) {
      return
    }

    try {
      await excluirVeiculo(id)
      await carregarVeiculos()
    } catch (error) {
      console.error('Erro ao excluir veículo:', error)
      alert('Erro ao excluir veículo')
    }
  }

  if (loading) {
    return <div className="loading">Carregando veículos...</div>
  }

  return (
    <>
      <div className="page-header">
        <h2>Veículos</h2>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => abrirModal()}>
            Novo Veículo
          </button>
          <Link to="/" className="btn btn-secondary">
            Voltar
          </Link>
        </div>
      </div>

      {veiculos.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum veículo cadastrado ainda.</p>
          <button className="btn btn-primary" onClick={() => abrirModal()}>
            Cadastrar primeiro veículo
          </button>
        </div>
      ) : (
        <div className="veiculos-lista">
          {veiculos.map((veiculo) => (
            <div key={veiculo.id} className="veiculo-card">
              <div className="veiculo-info">
                <h3>{veiculo.modelo}</h3>
                <div className="veiculo-detalhes">
                  <span className="veiculo-placa">{veiculo.placa}</span>
                  {veiculo.ano && <span className="veiculo-ano">{veiculo.ano}</span>}
                  {veiculo.cor && <span className="veiculo-cor">{veiculo.cor}</span>}
                </div>
              </div>
              <div className="veiculo-acoes">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => abrirModal(veiculo)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleExcluir(veiculo.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? 'Editar Veículo' : 'Novo Veículo'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="placa">Placa *</label>
                <input
                  type="text"
                  id="placa"
                  name="placa"
                  placeholder="Ex: ABC-1234"
                  value={form.placa}
                  onChange={handleChange}
                  required
                  maxLength={8}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="modelo">Modelo *</label>
                <input
                  type="text"
                  id="modelo"
                  name="modelo"
                  placeholder="Ex: Gol Sport"
                  value={form.modelo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ano">Ano</label>
                  <input
                    type="number"
                    id="ano"
                    name="ano"
                    placeholder="Ex: 2020"
                    min="1900"
                    max="2100"
                    value={form.ano}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cor">Cor</label>
                  <input
                    type="text"
                    id="cor"
                    name="cor"
                    placeholder="Ex: Prata"
                    value={form.cor}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Veiculos
