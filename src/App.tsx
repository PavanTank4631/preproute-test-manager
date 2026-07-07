import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TestFormPage from './pages/TestFormPage';
import QuestionsPage from './pages/QuestionsPage';
import PreviewPage from './pages/PreviewPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tests/new" element={<TestFormPage />} />
          <Route path="/tests/:id/edit" element={<TestFormPage />} />
          <Route path="/tests/:id/questions" element={<QuestionsPage />} />
          <Route path="/tests/:id/preview" element={<PreviewPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
