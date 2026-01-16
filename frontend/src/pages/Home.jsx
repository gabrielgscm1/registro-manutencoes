import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../services/api'

function Home() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <div className="home-welcome">
        <h2>Bem-vindo ao Registro de Manutenções</h2>
        <p>Gerencie as manutenções dos seus veículos de forma simples e organizada.</p>
      </div>

      <div className="acoes-rapidas">
        <Link to="/veiculos" className="acao-card">
          <div className="acao-icone">&#128663;</div>
          <div className="acao-info">
            <h3>Cadastrar Veículos</h3>
          </div>
        </Link>

        <Link to="/historico" className="acao-card">
          <div className="acao-icone">&#128197;</div>
          <div className="acao-info">
            <h3>Histórico</h3>
          </div>
        </Link>

        <Link to="/criar" className="acao-card">
          <div className="acao-icone">+</div>
          <div className="acao-info">
            <h3>Nova Manutenção</h3>
          </div>
        </Link>

        <button onClick={handleLogout} className="acao-card acao-sair">
          <div className="acao-icone acao-icone-sair">&#128682;</div>
          <div className="acao-info">
            <h3>Sair</h3>
          </div>
        </button>
      </div>
    </>
  )
}

export default Home
