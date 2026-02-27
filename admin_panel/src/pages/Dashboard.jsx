import { useState, useEffect } from 'react';
import { MdDevices, MdWifi, MdWifiOff, MdScreenshot } from 'react-icons/md';
import { getDevices, getScreenshots } from '../services/api';
import { getSocket } from '../services/socket';
import StatCard from '../components/StatCard';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    online: 0,
    offline: 0,
    totalScreenshots: 0,
  });
  const [recentScreenshots, setRecentScreenshots] = useState([]);

  const fetchData = async () => {
    try {
      const [devRes, ssRes] = await Promise.all([
        getDevices(),
        getScreenshots({ limit: 5 }),
      ]);

      const devices = devRes.data.devices;
      setStats({
        totalDevices: devices.length,
        online: devices.filter((d) => d.status === 'online').length,
        offline: devices.filter((d) => d.status === 'offline').length,
        totalScreenshots: ssRes.data.total,
      });
      setRecentScreenshots(ssRes.data.screenshots);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = getSocket();
    if (socket) {
      socket.on('device:status_changed', fetchData);
      socket.on('screenshot_ready', fetchData);
      return () => {
        socket.off('device:status_changed', fetchData);
        socket.off('screenshot_ready', fetchData);
      };
    }
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.statsGrid}>
        <StatCard
          icon={<MdDevices />}
          label="Total Devices"
          value={stats.totalDevices}
        />
        <StatCard
          icon={<MdWifi />}
          label="Online"
          value={stats.online}
          color="#3fb950"
        />
        <StatCard
          icon={<MdWifiOff />}
          label="Offline"
          value={stats.offline}
          color="#f85149"
        />
        <StatCard
          icon={<MdScreenshot />}
          label="Screenshots"
          value={stats.totalScreenshots}
          color="#d29922"
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Screenshots</h2>
        {recentScreenshots.length === 0 ? (
          <p className={styles.empty}>No screenshots yet</p>
        ) : (
          <div className={styles.recentList}>
            {recentScreenshots.map((ss) => (
              <div key={ss._id} className={styles.recentItem}>
                <img
                  src={ss.imageUrl}
                  alt="Screenshot"
                  className={styles.thumb}
                />
                <div className={styles.recentInfo}>
                  <span className={styles.recentDevice}>
                    {ss.deviceId?.deviceName || 'Unknown Device'}
                  </span>
                  <span className={styles.recentTime}>
                    {new Date(ss.createdAt).toLocaleString()}
                  </span>
                  <span className={styles.recentText}>
                    {ss.extractedText
                      ? ss.extractedText.substring(0, 100) + '...'
                      : 'No text extracted'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
