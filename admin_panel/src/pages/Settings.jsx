import { useAuth } from '../context/AuthContext';
import styles from './Settings.module.css';

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Name</span>
            <span className={styles.value}>{user?.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{user?.email}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Role</span>
            <span className={styles.value}>{user?.role}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Actions</h2>
        <button className={styles.logoutBtn} onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
