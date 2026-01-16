import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { isAuthenticated, verificarAuth } from './services/api'
import Login from './pages/Login'
import Home from './pages/Home'
import Criar from './pages/Criar'
import Editar from './pages/Editar'
import Detalhes from './pages/Detalhes'
import Historico from './pages/Historico'
import Veiculos from './pages/Veiculos'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const valid = await verificarAuth()
        setAuthenticated(valid)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return authenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Home />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/criar"
        element={
          <PrivateRoute>
            <Layout>
              <Criar />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/editar/:id"
        element={
          <PrivateRoute>
            <Layout>
              <Editar />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/detalhes/:id"
        element={
          <PrivateRoute>
            <Layout>
              <Detalhes />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/historico"
        element={
          <PrivateRoute>
            <Layout>
              <Historico />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/veiculos"
        element={
          <PrivateRoute>
            <Layout>
              <Veiculos />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
