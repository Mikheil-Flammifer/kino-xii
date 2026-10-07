import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext'
import RegisterModal from './modals/RegisterModal'
import LoginModal from './modals/LoginModal'
import Home from './pages/Home'
import Sessions from './pages/Sessions';
import MovieDetail from './pages/MovieDetail';
import Navbar from './components/Navbar'

function App() {
  const { modal } = useAuth()

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/movies/:slug" element={<MovieDetail />} />
        <Route path="/profile" element={<div className="pt-[111px] px-[70px]">Profile</div>} />
      </Routes>
      {modal === 'register' && <RegisterModal />}
      {modal === 'login' && <LoginModal />}
    </>
  )
}

export default App