import styles from './StatCard.module.css';

export default function StatCard({ icon, label, value, color = '#58a6ff' }) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrap} style={{ color }}>
        {icon}
      </div>
      <div className={styles.info}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
