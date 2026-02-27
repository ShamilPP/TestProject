import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [tab, setTab] = useState('image');
  const imgRef = useRef(null);
  const [overlaySize, setOverlaySize] = useState(null);

  useEffect(() => {
    getScreenshot(id)
      .then(({ data }) => setScreenshot(data.screenshot))
      .catch(() => navigate('/screenshots'));
  }, [id]);

  // Recalculate overlay size when image renders or window resizes
  const updateOverlaySize = useCallback(() => {
    if (imgRef.current) {
      setOverlaySize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateOverlaySize);
    return () => window.removeEventListener('resize', updateOverlaySize);
  }, [updateOverlaySize]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this screenshot?')) return;
    setDeleting(true);
    try {
      await deleteScreenshot(id);
      navigate('/screenshots');
    } catch {
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
  const hasBlocks = screenshot.ocrBlocks && screenshot.ocrBlocks.length > 0;

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
              {copied ? <><MdCheck /> Copied!</> : <><MdContentCopy /> Copy All Text</>}
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
          Screenshot {hasBlocks && <span className={styles.tabBadge}>text selectable</span>}
        </button>
        <button
          className={`${styles.tab} ${tab === 'text' ? styles.activeTab : ''}`}
          onClick={() => setTab('text')}
        >
          Extracted Text {hasText && `(${screenshot.extractedText.length} chars)`}
        </button>
      </div>

      {/* Image tab — with transparent selectable text overlay */}
      {tab === 'image' ? (
        <div className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            <img
              ref={imgRef}
              src={screenshot.imageUrl}
              alt="Screenshot"
              className={styles.image}
              onLoad={updateOverlaySize}
            />
            {hasBlocks && overlaySize && (
              <div
                className={styles.textOverlay}
                style={{ width: overlaySize.w, height: overlaySize.h }}
              >
                {screenshot.ocrBlocks.map((block, i) => (
                  <span
                    key={i}
                    className={styles.textSpan}
                    style={{
                      left: `${block.x * 100}%`,
                      top: `${block.y * 100}%`,
                      width: `${block.w * 100}%`,
                      height: `${block.h * 100}%`,
                      fontSize: `${block.h * overlaySize.h * 0.9}px`,
                    }}
                  >
                    {block.text}
                  </span>
                ))}
              </div>
            )}
          </div>
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
