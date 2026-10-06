import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Sessions from './pages/Sessions';
// ...your other imports (Navbar, modals, useAuth)

export default function App() {
  // ...your existing modal logic

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/profile" element={<div className="pt-[111px] px-[70px]">Profile</div>} />
      </Routes>
      {/* ...your modals */}
    </>
  );
}