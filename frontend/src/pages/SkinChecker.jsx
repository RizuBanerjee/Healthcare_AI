import { useState, useRef, useCallback } from 'react';
import { ScanLine, Upload, X, AlertCircle, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react';

function getConfidenceColor(conf) {
  if (conf >= 70) return '#10B981';
  if (conf >= 40) return '#F59E0B';
  return '#EF4444';
}

function getConfidenceBadge(conf) {
  if (conf >= 70) return { label: 'High Confidence', cls: 'badge-success' };
  if (conf >= 40) return { label: 'Medium Confidence', cls: 'badge-warning' };
  return { label: 'Low Confidence', cls: 'badge-danger' };
}

export default function SkinChecker() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const predictSkin = async () => {
    if (!image) {
      setError('Please upload an image first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', image);
      const response = await fetch('http://127.0.0.1:5000/predict_skin_image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch {
      setError('Prediction failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const badge = result ? getConfidenceBadge(result.confidence) : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 60px' }}>
      {/* Header */}
      <div className="fade-in-up" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScanLine size={26} color="#10B981" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.03em' }}>
              Skin Disease Checker
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
              Upload a skin lesion image and let AI predict the disease
            </p>
          </div>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card fade-in-up fade-in-up-delay-1" style={{ padding: '28px', marginBottom: 24 }}>
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#2563EB' : '#E2E8F0'}`,
              borderRadius: 16,
              padding: '52px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: dragOver ? 'rgba(37,99,235,0.04)' : 'rgba(248,250,252,0.8)',
              marginBottom: 20,
            }}
          >
            <div style={{ width: 64, height: 64, background: dragOver ? 'rgba(37,99,235,0.1)' : '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', transition: 'all 0.2s ease' }}>
              <Upload size={28} color={dragOver ? '#2563EB' : '#94a3b8'} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6 }}>Drop your image here</div>
            <div style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 16 }}>
              or <span style={{ color: 'var(--primary)', fontWeight: 600 }}>browse to upload</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Supports JPG, PNG, WEBP — max 10MB</div>
          </div>
        ) : (
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 12 }}>Image Preview</div>
            <div style={{ position: 'relative', display: 'inline-block', borderRadius: 14, overflow: 'hidden', border: '2px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <img src={preview} alt="Preview" style={{ display: 'block', maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }} />
              <button
                onClick={clearImage}
                style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--muted-foreground)' }}>
              <ImageIcon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
              {image?.name} ({image ? (image.size / 1024).toFixed(1) : 0} KB)
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 16, fontSize: 14, color: '#dc2626' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={predictSkin}
            disabled={loading || !image}
            style={{
              background: '#10B981', color: 'white', border: 'none', borderRadius: 10,
              padding: '12px 28px', fontWeight: 700, fontSize: 15,
              cursor: (loading || !image) ? 'not-allowed' : 'pointer',
              opacity: (loading || !image) ? 0.65 : 1,
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease',
              fontFamily: 'inherit',
            }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'hc-spin 1s linear infinite' }} /> Analyzing...</>
              : <><ScanLine size={16} /> Predict Skin Disease</>}
          </button>
          {preview && !loading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'transparent', color: 'var(--muted-foreground)', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease', fontFamily: 'inherit',
              }}
            >
              <Upload size={15} />
              Change Image
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card fade-in-up" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Loader2 size={28} color="#10B981" style={{ animation: 'hc-spin 1s linear infinite' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6 }}>Analyzing skin image...</div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Our AI model is processing your image</div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="card fade-in-up" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: '22px 28px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <CheckCircle size={20} />
              <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Skin Prediction Result
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{result.disease_name}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Code: {result.disease_code}</div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)' }}>Confidence Score</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: getConfidenceColor(result.confidence) }}>{result.confidence}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${result.confidence}%`, background: getConfidenceColor(result.confidence) }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ padding: '16px', background: 'var(--muted)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Confidence Level</div>
                <span className={`badge ${badge.cls}`} style={{ fontSize: 13 }}>{badge.label}</span>
              </div>
              <div style={{ padding: '16px', background: 'var(--muted)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Disease Code</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)', fontFamily: 'monospace' }}>{result.disease_code}</div>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 12, color: '#065f46', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              This AI prediction is for informational purposes only. Always consult a dermatologist for proper diagnosis and treatment.
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes hc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
