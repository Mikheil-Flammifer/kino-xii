import { useAuth } from './context/AuthContext'
import RegisterModal from './modals/RegisterModal'
import LoginModal from './modals/LoginModal'  // uncomment when we build it

function App() {
  const { modal, openModal } = useAuth()

  return (
    <>
      {/* TEMPORARY: test buttons, replaced by the Navbar later */}
      <div className="flex gap-4 p-8">
        <button
          onClick={() => openModal('login')}
          className="rounded-full bg-white px-[22px] py-[13px] text-sm font-extrabold text-bg"
        >
          Log in
        </button>
        <button
          onClick={() => openModal('register')}
          className="rounded-full bg-accent px-[22px] py-[13px] text-sm font-extrabold text-white"
        >
          Sign up
        </button>
      </div>

      {modal === 'register' && <RegisterModal />}
      {modal === 'login' && <LoginModal />}
    </>
  )
}

export default App