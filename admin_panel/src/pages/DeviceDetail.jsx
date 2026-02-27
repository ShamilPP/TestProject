import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDevice, getScreenshots, requestScreenshot } from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import { MdArrowBack, MdScreenshot } from 'react-icons/md';
import styles from './DeviceDetail.module.css';

export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [requesting, setRequesting] = useState(false);

  const fetchData = async () => {
    try {
      const [devRes, ssRes] = await Promise.all([
        getDevice(id),
        getScreenshots({ deviceId: id, limit: 20 }),
      ]);
      setDevice(devRes.data.device);
      setScreenshots(ssRes.data.screenshots);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = getSocket();
    if (socket) {
      const handleNew = (data) => {
        if (data.screenshot?.deviceId?._id === id || data.screenshot?.deviceId === id) {
          fetchData();
        }
      };
      socket.on('screenshot_ready', handleNew);
      socket.on('device:status_changed', fetchData);
      return () => {
        socket.off('screenshot_ready', handleNew);
        socket.off('device:status_changed', fetchData);
      };
    }
  }, [id]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await requestScreenshot(id);
    } catch (err) {
      alert('Failed to request screenshot');
    } finally {
      setTimeout(() => setRequesting(false), 2000);
    }
  };

  if (!device) {
    return <div className={styles.page}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/devices')}>
        <MdArrowBack /> Back to Devices
      </button>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{device.deviceName}</h1>
          <p className={styles.model}>{device.model}</p>
        </div>
        <div className={styles.headerActions}>
          <StatusBadge status={device.status} />
          <button
            className={styles.screenshotBtn}
            disabled={device.status !== 'online' || requesting}
            onClick={handleRequest}
          >
            <MdScreenshot />
            {requesting ? 'Requesting...' : 'Request Screenshot'}
          </button>
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>User</span>
          <span className={styles.infoValue}>{device.userId?.name || '-'}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Last Active</span>
          <span className={styles.infoValue}>
            {device.lastActive ? new Date(device.lastActive).toLocaleString() : 'Never'}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Registered</span>
          <span className={styles.infoValue}>
            {new Date(device.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Screenshot History</h2>
      {screenshots.length === 0 ? (
        <p className={styles.empty}>No screenshots taken from this device yet.</p>
      ) : (
        <div className={styles.grid}>
          {screenshots.map((ss) => (
            <div
              key={ss._id}
              className={styles.card}
              onClick={() => navigate(`/screenshots/${ss._id}`)}
            >
              <img src={ss.imageUrl} alt="Screenshot" className={styles.cardImg} />
              <div className={styles.cardInfo}>
                <span className={styles.cardTime}>
                  {new Date(ss.createdAt).toLocaleString()}
                </span>
                <span className={styles.cardText}>
                  {ss.extractedText ? ss.extractedText.substring(0, 80) + '...' : 'No text'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
