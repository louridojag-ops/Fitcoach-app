import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ClientDashboard } from './pages/client/Dashboard';
import { ClientWorkout } from './pages/client/Workout';
import { ClientNutrition } from './pages/client/Nutrition';
import { ClientMessages } from './pages/client/Messages';
import { CoachDashboard } from './pages/coach/Dashboard';
import { CoachClients } from './pages/coach/Clients';
import { CoachClientDetail } from './pages/coach/ClientDetail';
import { CoachMessages } from './pages/coach/Messages';

function App() {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<MainLayout />}>
          {/* Rutas de Cliente */}
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/workout" element={<ClientWorkout />} />
          <Route path="/client/nutrition" element={<ClientNutrition />} />
          <Route path="/client/messages" element={<ClientMessages />} />
          
          {/* Rutas de Coach */}
          <Route path="/coach/dashboard" element={<CoachDashboard />} />
          <Route path="/coach/clients" element={<CoachClients />} />
          <Route path="/coach/clients/:id" element={<CoachClientDetail />} />
          <Route path="/coach/messages" element={<CoachMessages />} />
        </Route>
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;