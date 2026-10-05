import { useAuth } from './context/AuthContext'
import RegisterModal from './modals/RegisterModal'
import LoginModal from './modals/LoginModal'
import Home from './pages/Home'
import Navbar from './components/common/Navbar'

function App() {
  const { modal } = useAuth()

  return (
    <>
      <Navbar />

      <Home />

      {modal === 'register' && <RegisterModal />}
      {modal === 'login' && <LoginModal />}
    </>
  )
}

export default App