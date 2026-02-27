import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScreenshot, deleteScreenshot } from '../services/api';
import { MdArrowBack, MdDelete, MdDownload, MdContentCopy, MdCheck } from 'react-icons/md';
import styles from './ScreenshotDetail.module.css';

export default function ScreenshotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [screenshot, setScreenshot] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('image'); // 'image' or 'text'

  useEffect(() => {
    getScreenshot(id)
      .then(({ data }) => setScreenshot(data.screenshot))
      .catch(() => navigate('/screenshots'));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this screenshot?')) return;
    setDeleting(true);
    try {
      await deleteScreenshot(id);
      navigate('/screenshots');
    } catch (err) {
      alert('Failed to delete screenshot');
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!screenshot) return;
    const link = document.createElement('a');
    link.href = screenshot.imageUrl;
    link.download = `screenshot_${id}.png`;
    link.target = '_blank';
    link.click();
  };

  const handleCopy = async () => {
    if (!screenshot?.extractedText) return;
    try {
      await navigator.clipboard.writeText(screenshot.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = screenshot.extractedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!screenshot) {
    return <div className={styles.page}><p>Loading...</p></div>;
  }

  const hasText = screenshot.extractedText && screenshot.extractedText.trim().length > 0;

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <MdArrowBack /> Back
      </button>

      <div className={styles.topBar}>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <strong>{screenshot.deviceId?.deviceName || 'Unknown'}</strong>
            <span className={styles.metaSep}>·</span>
            {screenshot.deviceId?.model || ''}
          </span>
          <span className={styles.metaTime}>
            {new Date(screenshot.createdAt).toLocaleString()}
          </span>
        </div>
        <div className={styles.actions}>
          {hasText && (
            <button
              className={`${styles.actionBtn} ${copied ? styles.copiedBtn : ''}`}
              onClick={handleCopy}
            >
              {copied ? <><MdCheck /> Copied!</> : <><MdContentCopy /> Copy Text</>}
            </button>
          )}
          <button className={styles.actionBtn} onClick={handleDownload}>
            <MdDownload /> Download
          </button>
          <button
            className={`${styles.actionBtn} ${styles.dangerBtn}`}
            onClick={handleDelete}
            disabled={deleting}
          >
            <MdDelete /> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'image' ? styles.activeTab : ''}`}
          onClick={() => setTab('image')}
        >
          Screenshot
        </button>
        <button
          className={`${styles.tab} ${tab === 'text' ? styles.activeTab : ''}`}
          onClick={() => setTab('text')}
        >
          Extracted Text {hasText && `(${screenshot.extractedText.length} chars)`}
        </button>
      </div>

      {/* Content */}
      {tab === 'image' ? (
        <div className={styles.imageSection}>
          <img src={screenshot.imageUrl} alt="Screenshot" className={styles.image} />
        </div>
      ) : (
        <div className={styles.textSection}>
          {hasText ? (
            <pre className={styles.textContent}>{screenshot.extractedText}</pre>
          ) : (
            <p className={styles.noText}>No text was extracted from this screenshot.</p>
          )}
        </div>
      )}
    </div>
  );
}
