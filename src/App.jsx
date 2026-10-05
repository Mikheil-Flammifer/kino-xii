import { useAuth } from './context/AuthContext'
import RegisterModal from './modals/RegisterModal'
import LoginModal from './modals/LoginModal' 
import Home from './pages/Home'

function App() {
  const { modal, openModal } = useAuth()

  return (
    <>
      <Home />

      {modal === 'register' && <RegisterModal />}
      {modal === 'login' && <LoginModal />}
    </>
  )
}

export default App