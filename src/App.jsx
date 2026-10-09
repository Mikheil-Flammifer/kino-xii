import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import RegisterModal from './modals/RegisterModal';
import LoginModal from './modals/LoginModal';
import Home from './pages/Home';
import Sessions from './pages/Sessions';
import MovieDetail from './pages/MovieDetail';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import Footer from './components/Footer';

function App() {
  const { modal } = useAuth()

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/movies/:slug" element={<MovieDetail />} />
        <Route path="/profile" element={<Profile/>}/>
      </Routes>
      <Footer />
      {modal === 'register' && <RegisterModal />}
      {modal === 'login' && <LoginModal />}
    </>
  )
}

export default App