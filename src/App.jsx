import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import RegisterModal from './modals/RegisterModal'
import LoginModal from './modals/LoginModal'

const Placeholder = ({ name }) => <div className="p-32 text-xl font-extrabold">{name}</div>

export default function App() {
  const { modal } = useAuth()
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Placeholder name="Home" />} />
        <Route path="/sessions" element={<Placeholder name="Sessions" />} />
        <Route path="/profile" element={<Placeholder name="Profile" />} />
      </Routes>
      {modal === 'register' && <RegisterModal />}
      {modal === 'login' && <LoginModal />}
    </div>
  )
}