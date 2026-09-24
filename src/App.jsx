import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Projeto from './pages/Projeto.jsx'
import Componentes from './pages/Componentes.jsx'
import QuemSomos from './pages/QuemSomos.jsx'
import Referencias from './pages/Referencias.jsx'
import Jogo from './pages/Jogo.jsx'
import Monitor from './pages/Monitor.jsx'
import Relatorio from './pages/Relatorio.jsx'
import Auth from './pages/Auth.jsx'
import Perfil from './pages/Perfil.jsx'
import Recursos from './pages/Recursos.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projeto" element={<Projeto />} />
      <Route path="/componentes" element={<Componentes />} />
      <Route path="/quem-somos" element={<QuemSomos />} />
      <Route path="/referencias" element={<Referencias />} />
      <Route path="/jogo" element={<Jogo />} />
      <Route path="/camera" element={<Monitor title="Câmera" />} />
      <Route path="/monitoramento" element={<Monitor title="Monitoramento" />} />
      <Route path="/relatorio" element={<Relatorio />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/cadastro" element={<Auth mode="cadastro" />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/recursos" element={<Recursos />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
