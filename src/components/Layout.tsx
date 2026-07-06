import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo" onClick={() => navigate('/dashboard')}>
            <span className="logo-icon">P</span>
            <span className="logo-text">Preproute</span>
          </div>
        </div>
        <div className="topbar-right">
          <span className="user-greeting">Hi, {user?.name?.split(' ')[0] || 'Admin'}</span>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
