import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { DarkModeProvider } from "./context/DarkModeContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Projects } from "./components/Projects";
import { Tasks } from "./components/Tasks";
import { OverviewNew } from "./components/OverviewNew";
import { DailySummary } from "./components/DailySummary";
import { Institutions } from "./components/Institutions";
import { Chat } from "./components/Chat";
import { Reports } from "./components/Reports";
import { UsersPage } from "./components/UsersPage";
import { Login } from "./components/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";
import { Overview } from "./components/Overview";

function App() {
  return (
    <AppProvider>
      <DarkModeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route
                        path="/"
                        element={<Navigate to="/overview" replace />}
                      />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/overview" element={<OverviewNew />} />
                      <Route path="/task-overview" element={<Overview />} />
                      <Route path="/summary" element={<DailySummary />} />
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
      </DarkModeProvider>
    </AppProvider>
  );
}

export default App;
