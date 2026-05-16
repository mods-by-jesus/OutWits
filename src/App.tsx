import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';
import { Results } from './pages/Results';
import { ToastContainer } from './components/Toast';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:code" element={<Lobby />} />
          <Route path="/game/:code" element={<Game />} />
          <Route path="/results/:code" element={<Results />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
