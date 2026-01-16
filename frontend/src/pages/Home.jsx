import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../services/api'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import HistoryIcon from '@mui/icons-material/History'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import LogoutIcon from '@mui/icons-material/Logout'

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
          <div className="acao-icone">
            <DirectionsCarIcon sx={{ fontSize: 32 }} />
          </div>
          <div className="acao-info">
            <h3>Cadastrar Veículos</h3>
          </div>
        </Link>

        <Link to="/historico" className="acao-card">
          <div className="acao-icone">
            <HistoryIcon sx={{ fontSize: 32 }} />
          </div>
          <div className="acao-info">
            <h3>Histórico</h3>
          </div>
        </Link>

        <Link to="/criar" className="acao-card">
          <div className="acao-icone">
            <AddCircleIcon sx={{ fontSize: 32 }} />
          </div>
          <div className="acao-info">
            <h3>Nova Manutenção</h3>
          </div>
        </Link>

        <button onClick={handleLogout} className="acao-card acao-sair">
          <div className="acao-icone acao-icone-sair">
            <LogoutIcon sx={{ fontSize: 32 }} />
          </div>
          <div className="acao-info">
            <h3>Sair</h3>
          </div>
        </button>
      </div>
    </>
  )
}

export default Home
