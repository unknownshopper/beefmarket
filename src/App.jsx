import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Productos from './pages/Productos'
import Eventos from './pages/Eventos'
import Inventario from './pages/Inventario'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/productos" element={<Productos />} />
      <Route path="/eventos" element={<Eventos />} />
      <Route path="/inventario" element={<Inventario />} />
    </Routes>
  )
}
