import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { Institutions } from './components/Institutions';
import { Chat } from './components/Chat';
import { Reports } from './components/Reports';
import { UsersPage } from './components/UsersPage';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/institutions" element={<Institutions />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/users" element={<UsersPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
