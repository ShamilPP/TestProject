import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDevices, requestScreenshot } from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import { MdScreenshot, MdRefresh } from 'react-icons/md';
import styles from './Devices.module.css';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const navigate = useNavigate();

  const fetchDevices = async () => {
    try {
      const { data } = await getDevices();
      setDevices(data.devices);
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();

    const socket = getSocket();
    if (socket) {
      const handleStatusChange = (data) => {
        setDevices((prev) =>
          prev.map((d) =>
            d._id === data.deviceId
              ? { ...d, status: data.status, lastActive: data.lastActive }
              : d
          )
        );
      };
      socket.on('device:status_changed', handleStatusChange);
      return () => socket.off('device:status_changed', handleStatusChange);
    }
  }, []);

  const handleRequestScreenshot = async (deviceId) => {
    setRequesting(deviceId);
    try {
      await requestScreenshot(deviceId);
    } catch (err) {
      console.error('Screenshot request failed:', err);
      alert('Failed to request screenshot');
    } finally {
      setTimeout(() => setRequesting(null), 2000);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading devices...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Devices</h1>
        <button className={styles.refreshBtn} onClick={fetchDevices}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {devices.length === 0 ? (
        <div className={styles.empty}>
          <p>No devices registered yet.</p>
          <p>Install the Android client app on a device to get started.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Device</span>
            <span>Model</span>
            <span>Status</span>
            <span>Last Active</span>
            <span>Actions</span>
          </div>
          {devices.map((device) => (
            <div
              key={device._id}
              className={styles.tableRow}
              onClick={() => navigate(`/devices/${device._id}`)}
            >
              <span className={styles.deviceName}>{device.deviceName}</span>
              <span className={styles.model}>{device.model || '-'}</span>
              <span>
                <StatusBadge status={device.status} />
              </span>
              <span className={styles.time}>{formatTime(device.lastActive)}</span>
              <span>
                <button
                  className={styles.screenshotBtn}
                  disabled={device.status !== 'online' || requesting === device._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestScreenshot(device._id);
                  }}
                >
                  <MdScreenshot />
                  {requesting === device._id ? 'Requesting...' : 'Screenshot'}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
