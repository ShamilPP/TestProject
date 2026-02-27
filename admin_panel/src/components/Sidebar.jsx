import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard,
  MdDevices,
  MdScreenshot,
  MdSettings,
  MdLogout,
} from 'react-icons/md';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/', icon: <MdDashboard />, label: 'Dashboard' },
    { to: '/devices', icon: <MdDevices />, label: 'Devices' },
    { to: '/screenshots', icon: <MdScreenshot />, label: 'Screenshots' },
    { to: '/settings', icon: <MdSettings />, label: 'Settings' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>S</span>
        <span className={styles.brandText}>Shamil System</span>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.userAvatar}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </span>
          <span className={styles.userName}>{user?.name || 'Admin'}</span>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          <MdLogout />
        </button>
      </div>
    </aside>
  );
}
