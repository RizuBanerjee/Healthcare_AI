import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SymptomChecker from './pages/SymptomChecker';
import SkinChecker from './pages/SkinChecker';
import HealthReport from './pages/HealthReport';
import History from './pages/History';
import AskAI from "./pages/AskAI";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1, background: 'var(--background)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/symptoms" element={<SymptomChecker />} />
            <Route path="/skin" element={<SkinChecker />} />
            <Route path="/report" element={<HealthReport />} />
            <Route path="/history" element={<History />} />
            <Route path="/ask-ai" element={<AskAI />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
