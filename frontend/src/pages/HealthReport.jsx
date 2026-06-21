import { useState, useEffect } from 'react';
import Select from 'react-select';
import { FileText, Download, AlertCircle, CheckCircle, Loader2, Stethoscope, ScanLine, Brain } from 'lucide-react';
import { jsPDF } from 'jspdf';

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
  multiValue: (base) => ({ ...base, background: 'rgba(37,99,235,0.1)', borderRadius: 6 }),
  multiValueLabel: (base) => ({ ...base, color: '#2563EB', fontWeight: 600, fontSize: 13, padding: '2px 6px' }),
  multiValueRemove: (base) => ({ ...base, color: '#2563EB', '&:hover': { background: 'rgba(37,99,235,0.2)', color: '#1d4ed8' } }),
  option: (base, state) => ({
    ...base, fontSize: 14,
    background: state.isSelected ? '#2563EB' : state.isFocused ? 'rgba(37,99,235,0.07)' : 'white',
    color: state.isSelected ? 'white' : '#0F172A',
    borderRadius: 6, margin: '1px 4px', width: 'calc(100% - 8px)', cursor: 'pointer',
  }),
  menu: (base) => ({ ...base, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden' }),
  placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: 14 }),
};

function getRiskColor(risk) {
  const r = risk?.toLowerCase();
  if (r === 'high') return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
  if (r === 'medium' || r === 'moderate') return { bg: '#fef9c3', text: '#ca8a04', border: '#fef08a' };
  return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' };
}

function getConfidenceColor(conf) {
  if (conf >= 70) return '#10B981';
  if (conf >= 40) return '#F59E0B';
  return '#EF4444';
}

export default function HealthReport() {
  const [symptoms, setSymptoms] = useState([]);
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
        setError('Failed to load symptoms. Please ensure the backend is running.');
        setOptionsLoading(false);
      });
  }, []);

  const generateReport = async () => {
    if (symptoms.length === 0) {
      setError('Please select at least one symptom.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        symptoms: symptoms.map(s => s.value),
        skin_data: {
          age: '65', gender: 'MALE', itch: '1', grew: '1',
          hurt: '0', changed: '1', bleed: '0', elevation: '1',
          diameter_1: '12', diameter_2: '8', fitspatrick: '2',
          skin_cancer_history: '1', cancer_history: '0',
          smoke: '0', drink: '0', region: 'HEAD_NECK'
        }
      };
      const response = await fetch('http://127.0.0.1:5000/health_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setResult(data);
    } catch {
      setError('Report generation failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  //  PROFESSIONAL PDF GENERATOR
  // ─────────────────────────────────────────────────────────────
  const downloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210;
    const PH = 297;
    const M  = 18;
    const CW = PW - M * 2;
    const SAFE_BOTTOM = PH - 22;

    const now = new Date();
    const reportId = 'HAI-' + now.getTime().toString().slice(-8).toUpperCase();
    const dateStr  = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let y = 0;
    let pageNum = 1;

    // ── FOOTER ──────────────────────────────────────────────────
    const drawFooter = () => {
      doc.setFillColor(37, 99, 235);
      doc.rect(0, PH - 14, PW, 14, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('Healthcare AI Platform  |  Confidential AI-Generated Report  |  For informational use only', M, PH - 5.5);
      doc.text(`Page ${pageNum}`, PW - M, PH - 5.5, { align: 'right' });
    };

    // ── NEW PAGE ─────────────────────────────────────────────────
    const newPage = () => {
      drawFooter();
      doc.addPage();
      pageNum++;
      y = 20;
    };

    // ── SPACE CHECK ──────────────────────────────────────────────
    const need = (h) => { if (y + h > SAFE_BOTTOM) newPage(); };

    // ── SECTION HEADER ───────────────────────────────────────────
    const sectionHeader = (label) => {
      need(14);
      doc.setFillColor(239, 246, 255);
      doc.rect(M, y, CW, 10, 'F');
      doc.setFillColor(37, 99, 235);
      doc.rect(M, y, 3.5, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(label, M + 8, y + 6.5);
      y += 14;
    };

    // ── LABEL / VALUE ROW ────────────────────────────────────────
    const row = (label, value, vColor) => {
      need(7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label, M + 5, y);
      doc.setFont('helvetica', 'bold');
      if (vColor) {
        doc.setTextColor(vColor[0], vColor[1], vColor[2]);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(String(value), M + 70, y);
      y += 6.5;
    };

    // ── CONFIDENCE BAR ───────────────────────────────────────────
    const confBar = (pct) => {
      need(12);
      const barW = 100;
      const color = pct >= 70 ? [16, 185, 129] : pct >= 40 ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(M + 5, y, barW, 4, 2, 2, 'F');
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(M + 5, y, Math.max(3, (pct / 100) * barW), 4, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(`${pct}%`, M + barW + 10, y + 3.2);
      y += 9;
    };

    // ── RISK BADGE ───────────────────────────────────────────────
    const riskBadge = (risk) => {
      need(10);
      const r = (risk || '').toLowerCase();
      const isHigh = r === 'high';
      const isMed  = r === 'medium' || r === 'moderate';
      const bgR = isHigh ? [254, 226, 226] : isMed ? [254, 243, 199] : [220, 252, 231];
      const txR = isHigh ? [185, 28, 28]   : isMed ? [180, 83, 9]    : [22, 163, 74];
      const label = isHigh ? 'HIGH RISK' : isMed ? 'MODERATE RISK' : 'LOW RISK';
      const bw = isMed ? 36 : 28;
      doc.setFillColor(bgR[0], bgR[1], bgR[2]);
      doc.roundedRect(M + 5, y - 1, bw, 7, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(txR[0], txR[1], txR[2]);
      doc.text(label, M + 5 + bw / 2, y + 3.5, { align: 'center' });
      y += 10;
    };

    // ════════════════════════════════════════════════════════════
    //  HEADER
    // ════════════════════════════════════════════════════════════
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, PW, 46, 'F');

    // Decorative circles (slightly lighter blue)
    doc.setFillColor(59, 115, 230);
    doc.circle(PW - 22, 8, 28, 'F');
    doc.setFillColor(48, 105, 220);
    doc.circle(PW - 6, 44, 18, 'F');

    // Platform name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('Healthcare AI Platform', M, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(186, 212, 253);
    doc.text('AI Generated Diagnostic Health Report', M, 26);

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.15);
    doc.line(M, 30, PW - M, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(186, 212, 253);
    doc.text(`Report ID : ${reportId}`, M, 37);
    doc.text(`Date       : ${dateStr}`, M, 42);
    doc.text(`Time       : ${timeStr}`, PW - M, 37, { align: 'right' });
    doc.text(`Status    : Complete`, PW - M, 42, { align: 'right' });

    // Disclaimer strip
    doc.setFillColor(219, 234, 254);
    doc.rect(0, 46, PW, 9, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(37, 99, 235);
    doc.text(
      'This is an AI-generated report for informational purposes only. It is NOT a substitute for professional medical advice.',
      PW / 2, 51.5, { align: 'center' }
    );

    y = 62;

    // ════════════════════════════════════════════════════════════
    //  SECTION 1 — PATIENT SUMMARY
    // ════════════════════════════════════════════════════════════
    sectionHeader('01  |  PATIENT SUMMARY');

    const symptomLabel = symptoms.length > 0
      ? symptoms.map(s => s.label || s.value).join(', ')
      : 'No symptoms recorded';
    const symptomLines = doc.splitTextToSize(symptomLabel, CW - 75);

    need(symptomLines.length * 5 + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Symptoms Selected', M + 5, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(symptomLines, M + 70, y);
    y += symptomLines.length * 5 + 1;

    row('Total Symptoms', `${symptoms.length} symptom${symptoms.length !== 1 ? 's' : ''}`);
    row('Generated At', `${dateStr}  ·  ${timeStr}`);
    row('Report Status', 'Complete', [22, 163, 74]);

    y += 6;

    // ════════════════════════════════════════════════════════════
    //  SECTION 2 — SYMPTOM ANALYSIS
    // ════════════════════════════════════════════════════════════
    need(60);
    sectionHeader('02  |  SYMPTOM ANALYSIS');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(result.symptom_prediction.disease, M + 5, y);
    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Prediction Confidence', M + 5, y);
    y += 5;
    confBar(result.symptom_prediction.confidence);

    riskBadge(result.symptom_prediction.risk_level);

    row('Risk Level', result.symptom_prediction.risk_level);
    row('Recommended Doctor', result.symptom_prediction.recommended_doctor);
    row('Analysis Type', 'Symptom-Based AI Prediction');

    y += 6;

    // ════════════════════════════════════════════════════════════
    //  SECTION 3 — SKIN ANALYSIS
    // ════════════════════════════════════════════════════════════
    need(55);
    sectionHeader('03  |  SKIN ANALYSIS');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(16, 185, 129);
    doc.text(result.skin_prediction.disease_name, M + 5, y);
    y += 9;

    // Disease code badge
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(M + 5, y - 2, 24, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text(result.skin_prediction.disease_code, M + 5 + 12, y + 2.8, { align: 'center' });
    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Prediction Confidence', M + 5, y);
    y += 5;
    confBar(result.skin_prediction.confidence);

    row('Disease Code', result.skin_prediction.disease_code);
    row('Analysis Type', 'Image-Based AI Prediction');

    y += 6;

    // ════════════════════════════════════════════════════════════
    //  SECTION 4 — AI EXPLANATION
    // ════════════════════════════════════════════════════════════
    const explanationText = result.explanation ||
      'Consult a licensed healthcare professional for detailed diagnostic guidance.';
    const expLines = doc.splitTextToSize(explanationText, CW - 14);

    need(expLines.length * 5 + 20);
    sectionHeader('04  |  AI EXPLANATION');

    doc.setFillColor(245, 243, 255);
    doc.setDrawColor(196, 181, 253);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, expLines.length * 5 + 10, 3, 3, 'FD');

    doc.setFillColor(139, 92, 246);
    doc.rect(M, y, 3, expLines.length * 5 + 10, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(67, 56, 202);
    doc.text(expLines, M + 8, y + 7);
    y += expLines.length * 5 + 16;

    // ════════════════════════════════════════════════════════════
    //  SECTION 5 — RECOMMENDATIONS
    // ════════════════════════════════════════════════════════════
    need(55);
    sectionHeader('05  |  RECOMMENDATIONS');

    const recommendations = [
      'Consult the recommended specialist promptly based on the findings above.',
      'Do not self-medicate. Use only prescribed medications from a certified doctor.',
      'Maintain a balanced diet, stay hydrated, and get adequate rest.',
      'Track and log any changes in symptoms and report them to your doctor.',
      'Schedule routine follow-up health check-ups for ongoing monitoring.',
      'Avoid known allergens or triggers that may worsen your condition.',
    ];

    recommendations.forEach(rec => {
      need(8);
      doc.setFillColor(37, 99, 235);
      doc.circle(M + 7, y - 1.2, 1, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(rec, M + 12, y);
      y += 7;
    });

    y += 6;

    // ════════════════════════════════════════════════════════════
    //  SECTION 6 — DISCLAIMER
    // ════════════════════════════════════════════════════════════
    const discText =
      'This report has been generated by an Artificial Intelligence system and is intended solely for ' +
      'informational and educational purposes. It does not constitute, and must not be treated as, a ' +
      'substitute for professional medical advice, clinical diagnosis, or treatment. Always seek the ' +
      'guidance of a qualified and licensed healthcare professional regarding any medical conditions ' +
      'or before making any health-related decisions.';
    const discLines = doc.splitTextToSize(discText, CW - 14);

    need(discLines.length * 5 + 22);
    sectionHeader('06  |  MEDICAL DISCLAIMER');

    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, discLines.length * 5 + 10, 3, 3, 'FD');

    doc.setFillColor(239, 68, 68);
    doc.rect(M, y, 3, discLines.length * 5 + 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text('IMPORTANT:', M + 8, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(127, 29, 29);
    doc.text(discLines, M + 8, y + 12);
    y += discLines.length * 5 + 16;

    // ════════════════════════════════════════════════════════════
    //  FOOTER — last page
    // ════════════════════════════════════════════════════════════
    drawFooter();

    doc.save(`Healthcare_AI_Report_${reportId}.pdf`);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 60px' }}>
      {/* Header */}
      <div className="fade-in-up" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={26} color="#F59E0B" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.03em' }}>
              AI Health Report
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
              Generate a comprehensive AI-powered health analysis report
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="card fade-in-up fade-in-up-delay-1" style={{ padding: '28px', marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 10 }}>
            Select Symptoms for Analysis
          </label>
          <Select
            isMulti
            options={symptomOptions}
            value={symptoms}
            onChange={setSymptoms}
            placeholder={optionsLoading ? 'Loading symptoms...' : 'Search and select symptoms...'}
            isLoading={optionsLoading}
            styles={selectStyles}
            closeMenuOnSelect={false}
          />
          {symptoms.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500 }}>
              {symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#1e40af', display: 'flex', gap: 10, alignItems: 'center' }}>
          <ScanLine size={15} style={{ flexShrink: 0 }} />
          Skin analysis uses default parameters. Upload a skin image in the Skin AI page for image-based predictions.
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 16, fontSize: 14, color: '#dc2626' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          onClick={generateReport}
          disabled={loading || symptoms.length === 0}
          style={{
            background: '#F59E0B', color: 'white', border: 'none', borderRadius: 10,
            padding: '12px 28px', fontWeight: 700, fontSize: 15,
            cursor: (loading || symptoms.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (loading || symptoms.length === 0) ? 0.65 : 1,
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease',
            fontFamily: 'inherit',
          }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: 'hc-spin 1s linear infinite' }} /> Generating Report...</>
            : <><FileText size={16} /> Generate Report</>}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card fade-in-up" style={{ padding: 36, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'rgba(245,158,11,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Loader2 size={28} color="#F59E0B" style={{ animation: 'hc-spin 1s linear infinite' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6 }}>Generating your health report...</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>AI is analyzing symptoms and skin data</div>
        </div>
      )}

      {/* Report */}
      {result && !loading && (
        <div className="fade-in-up">
          <div style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #d97706 100%)', borderRadius: '16px 16px 0 0', padding: '24px 28px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <CheckCircle size={20} />
                  <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Health Report Generated
                  </span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>AI Comprehensive Analysis</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <button
                onClick={downloadPDF}
                style={{
                  background: 'rgba(255,255,255,0.2)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)',
                  borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 16px 16px', background: 'white', overflow: 'hidden' }}>
            {/* Symptom Section */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={18} color="#2563EB" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>Symptom Prediction</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', marginBottom: 16, letterSpacing: '-0.02em' }}>
                {result.symptom_prediction.disease}
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)' }}>Confidence</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: getConfidenceColor(result.symptom_prediction.confidence) }}>
                    {result.symptom_prediction.confidence}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${result.symptom_prediction.confidence}%`, background: getConfidenceColor(result.symptom_prediction.confidence) }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(() => {
                  const risk = getRiskColor(result.symptom_prediction.risk_level);
                  return (
                    <div style={{ padding: '14px', background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: risk.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Risk Level</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: risk.text }}>{result.symptom_prediction.risk_level}</div>
                    </div>
                  );
                })()}
                <div style={{ padding: '14px', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Recommended Doctor
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{result.symptom_prediction.recommended_doctor}</div>
                </div>
              </div>
            </div>

            {/* Skin Section */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScanLine size={18} color="#10B981" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>Skin Prediction</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', marginBottom: 16, letterSpacing: '-0.02em' }}>
                {result.skin_prediction.disease_name}
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)' }}>Confidence</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: getConfidenceColor(result.skin_prediction.confidence) }}>
                    {result.skin_prediction.confidence}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${result.skin_prediction.confidence}%`, background: getConfidenceColor(result.skin_prediction.confidence) }} />
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disease Code</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>{result.skin_prediction.disease_code}</span>
              </div>
            </div>

            {/* AI Explanation */}
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={18} color="#8B5CF6" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>AI Explanation</div>
              </div>
              <div style={{ padding: '20px', background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 12, fontSize: 14, color: 'var(--foreground)', lineHeight: 1.7 }}>
                {result.explanation}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes hc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
