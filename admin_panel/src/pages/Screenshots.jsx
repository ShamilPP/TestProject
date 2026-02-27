import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScreenshots, getDevices } from '../services/api';
import { getSocket } from '../services/socket';
import styles from './Screenshots.module.css';

export default function Screenshots() {
  const [screenshots, setScreenshots] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchScreenshots = async () => {
    try {
      const params = { page, limit: 12 };
      if (selectedDevice) params.deviceId = selectedDevice;

      const { data } = await getScreenshots(params);
      setScreenshots(data.screenshots);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDevices().then(({ data }) => setDevices(data.devices)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchScreenshots();

    const socket = getSocket();
    if (socket) {
      socket.on('screenshot_ready', fetchScreenshots);
      return () => socket.off('screenshot_ready', fetchScreenshots);
    }
  }, [page, selectedDevice]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Screenshots</h1>
        <select
          className={styles.filter}
          value={selectedDevice}
          onChange={(e) => {
            setSelectedDevice(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Devices</option>
          {devices.map((d) => (
            <option key={d._id} value={d._id}>
              {d.deviceName}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : screenshots.length === 0 ? (
        <p className={styles.empty}>No screenshots found.</p>
      ) : (
        <>
          <div className={styles.grid}>
            {screenshots.map((ss) => (
              <div
                key={ss._id}
                className={styles.card}
                onClick={() => navigate(`/screenshots/${ss._id}`)}
              >
                <img src={ss.imageUrl} alt="Screenshot" className={styles.cardImg} />
                <div className={styles.cardInfo}>
                  <span className={styles.cardDevice}>
                    {ss.deviceId?.deviceName || 'Unknown'}
                  </span>
                  <span className={styles.cardTime}>
                    {new Date(ss.createdAt).toLocaleString()}
                  </span>
                  <span className={styles.cardText}>
                    {ss.extractedText
                      ? ss.extractedText.substring(0, 100)
                      : 'No text extracted'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
