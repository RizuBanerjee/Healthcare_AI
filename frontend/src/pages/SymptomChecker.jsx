import { useState, useEffect } from 'react';
import Select from 'react-select';
import { Stethoscope, AlertCircle, CheckCircle, User, Loader2 } from 'lucide-react';

function getRiskBadge(risk) {
  const r = risk?.toLowerCase();
  if (r === 'high') return { label: 'High Risk', cls: 'badge-danger' };
  if (r === 'medium' || r === 'moderate') return { label: 'Moderate Risk', cls: 'badge-warning' };
  return { label: 'Low Risk', cls: 'badge-success' };
}

function getConfidenceColor(conf) {
  if (conf >= 70) return '#10B981';
  if (conf >= 40) return '#F59E0B';
  return '#EF4444';
}

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? '#2563EB' : '#E2E8F0',
    borderRadius: 10,
    boxShadow: state.isFocused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
    padding: '4px 6px',
    fontSize: 14,
    minHeight: 46,
    '&:hover': { borderColor: '#2563EB' },
    transition: 'all 0.15s ease',
  }),
  multiValue: (base) => ({ ...base, background: 'rgba(37,99,235,0.1)', borderRadius: 6, padding: '1px 2px' }),
  multiValueLabel: (base) => ({ ...base, color: '#2563EB', fontWeight: 600, fontSize: 13, padding: '2px 6px' }),
  multiValueRemove: (base) => ({ ...base, color: '#2563EB', '&:hover': { background: 'rgba(37,99,235,0.2)', color: '#1d4ed8' }, borderRadius: '0 4px 4px 0' }),
  option: (base, state) => ({
    ...base, fontSize: 14,
    background: state.isSelected ? '#2563EB' : state.isFocused ? 'rgba(37,99,235,0.07)' : 'white',
    color: state.isSelected ? 'white' : '#0F172A',
    borderRadius: 6, margin: '1px 4px', width: 'calc(100% - 8px)', cursor: 'pointer',
  }),
  menu: (base) => ({ ...base, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden' }),
  placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: 14 }),
};

export default function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomOptions, setSymptomOptions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/symptoms')
      .then(r => r.json())
      .then(data => {
        setSymptomOptions(data.map(item => ({
          value: item,
          label: item.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        })));
        setOptionsLoading(false);
      })
      .catch(() => {
        setError('Failed to load symptoms list. Please ensure the backend is running.');
        setOptionsLoading(false);
      });
  }, []);

  const predictDisease = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const symptoms = selectedSymptoms.map(s => s.value);
      const response = await fetch('http://127.0.0.1:5000/predict_symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(symptoms),
      });
      const data = await response.json();
      setResult(data);
    } catch {
      setError('Prediction failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const badge = result ? getRiskBadge(result.risk_level) : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 60px' }}>
      {/* Header */}
      <div className="fade-in-up" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={26} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.03em' }}>
              Symptom Checker
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
              Select your symptoms and get an AI-powered disease prediction
            </p>
          </div>
        </div>
      </div>

      {/* Input Card */}
      <div className="card fade-in-up fade-in-up-delay-1" style={{ padding: '28px', marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 10 }}>
            Select Symptoms
          </label>
          <Select
            isMulti
            options={symptomOptions}
            value={selectedSymptoms}
            onChange={setSelectedSymptoms}
            placeholder={optionsLoading ? 'Loading symptoms...' : 'Search and select symptoms...'}
            isLoading={optionsLoading}
            styles={selectStyles}
            closeMenuOnSelect={false}
            noOptionsMessage={() => 'No symptoms found'}
          />
          {selectedSymptoms.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500 }}>
              {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 16, fontSize: 14, color: '#dc2626' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          onClick={predictDisease}
          disabled={loading || selectedSymptoms.length === 0}
          className="btn-primary"
          style={{
            padding: '12px 28px', fontSize: 15, fontWeight: 700,
            opacity: (loading || selectedSymptoms.length === 0) ? 0.65 : 1,
            cursor: (loading || selectedSymptoms.length === 0) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <><Loader2 size={16} style={{ animation: 'hc-spin 1s linear infinite' }} /> Analyzing...</>
          ) : (
            <><Stethoscope size={16} /> Predict Disease</>
          )}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="card fade-in-up" style={{ padding: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[100, 70, 85, 60].map((w, i) => (
              <div key={i} style={{ height: 18, width: `${w}%`, background: '#f1f5f9', borderRadius: 6, animation: 'pulse-soft 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && !loading && (
        <div className="card fade-in-up" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)', padding: '22px 28px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <CheckCircle size={20} />
              <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Prediction Result
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{result.disease}</div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)' }}>Confidence Score</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: getConfidenceColor(result.confidence) }}>
                  {result.confidence}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${result.confidence}%`, background: getConfidenceColor(result.confidence) }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ padding: '16px', background: 'var(--muted)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Risk Level
                </div>
                <span className={`badge ${badge.cls}`} style={{ fontSize: 13 }}>{badge.label}</span>
              </div>
              <div style={{ padding: '16px', background: 'var(--muted)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={12} />
                    Recommended Doctor
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{result.recommended_doctor}</div>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, fontSize: 12, color: '#92400e', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              This prediction is AI-generated and should not replace professional medical advice. Please consult with a qualified healthcare provider.
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes hc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
