import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { criarRegistro, obterDataPadrao, listarVeiculos } from '../services/api'

function Criar() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [veiculos, setVeiculos] = useState([])
  const [form, setForm] = useState({
    veiculo_id: '',
    quilometragem: '',
    proxima_troca: '',
    data_proxima_troca: '',
    filtro_trocado: false,
    oleo: '',
    viscosidade: ''
  })

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [dataPadrao, listaVeiculos] = await Promise.all([
          obterDataPadrao(),
          listarVeiculos()
        ])
        setForm((prev) => ({ ...prev, data_proxima_troca: dataPadrao.data }))
        setVeiculos(listaVeiculos)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }
    carregarDados()
  }, [])

  // Função para capitalizar primeira letra de cada palavra
  const capitalizar = (texto) => {
    return texto
      .toLowerCase()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let novoValor = type === 'checkbox' ? checked : value

    // Capitalizar campos de texto
    if (type !== 'checkbox' && (name === 'oleo')) {
      novoValor = capitalizar(value)
    } else if (name === 'viscosidade') {
      novoValor = value.toUpperCase()
    }

    setForm((prev) => ({
      ...prev,
      [name]: novoValor
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dados = {}
      if (form.oleo.trim()) {
        dados['Óleo'] = form.oleo.trim()
      }
      if (form.viscosidade.trim()) {
        dados['Viscosidade'] = form.viscosidade.trim()
      }

      // Buscar nome do veículo selecionado
      const veiculoSelecionado = veiculos.find(v => v.id === parseInt(form.veiculo_id))
      const tituloVeiculo = veiculoSelecionado
        ? `${veiculoSelecionado.modelo} - ${veiculoSelecionado.placa}`
        : ''

      await criarRegistro({
        titulo: tituloVeiculo,
        quilometragem: form.quilometragem ? parseInt(form.quilometragem) : null,
        proxima_troca: form.proxima_troca ? parseInt(form.proxima_troca) : null,
        data_proxima_troca: form.data_proxima_troca || null,
        filtro_trocado: form.filtro_trocado,
        dados
      })

      navigate('/')
    } catch (error) {
      console.error('Erro ao criar registro:', error)
      alert('Erro ao criar registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Novo Registro</h2>
      </div>

      <form className="form-registro" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="veiculo_id">Veículo *</label>
          {veiculos.length === 0 ? (
            <div className="veiculo-aviso">
              <p>Nenhum veículo cadastrado.</p>
              <Link to="/veiculos" className="btn btn-primary btn-sm">
                Cadastrar Veículo
              </Link>
            </div>
          ) : (
            <select
              id="veiculo_id"
              name="veiculo_id"
              value={form.veiculo_id}
              onChange={handleChange}
              required
              autoFocus
            >
              <option value="">Selecione um veículo</option>
              {veiculos.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.modelo} - {veiculo.placa} {veiculo.ano ? `(${veiculo.ano})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-section">

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
              <small className="help-text">Padrão: 6 meses a partir de hoje</small>
            </div>
            <div className="form-group">
              <label htmlFor="oleo">Óleo</label>
              <input
                type="text"
                id="oleo"
                name="oleo"
                placeholder="Ex: Castrol GTX"
                value={form.oleo}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="viscosidade">Viscosidade</label>
              <input
                type="text"
                id="viscosidade"
                name="viscosidade"
                placeholder="Ex: 5W30"
                value={form.viscosidade}
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

        <div className="form-actions">
          <Link to="/" className="btn btn-secondary">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Registro'}
          </button>
        </div>
      </form>
    </>
  )
}

export default Criar
