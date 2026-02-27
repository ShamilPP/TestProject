import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
  const isOnline = status === 'online';

  return (
    <span className={`${styles.badge} ${isOnline ? styles.online : styles.offline}`}>
      <span className={styles.dot} />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}
