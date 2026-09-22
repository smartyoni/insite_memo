import React from 'react';
import { Printer, X } from 'lucide-react';
import { styles } from '../notebookStyles';

export default function TemplatePrintModal({
  isOpen,
  onClose,
  templates,
  activeItem,
  selectedPrintFieldIds,
  setSelectedPrintFieldIds,
  onConfirmPrint
}) {
  if (!isOpen) return null;

  const activeTpl = templates.find(t => t.id === activeItem?.templateId);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modalContent, maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
            <Printer size={18} color="#2563EB" />
            <span>인쇄 항목 선택</span>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
          출력할 템플릿 항목을 선택해 주세요:
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => {
              const allObj = {};
              activeTpl?.fields?.forEach(f => { allObj[f.id] = true; });
              setSelectedPrintFieldIds(allObj);
            }}
            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
          >
            전체 선택
          </button>
          <button
            type="button"
            onClick={() => {
              const noneObj = {};
              activeTpl?.fields?.forEach(f => { noneObj[f.id] = false; });
              setSelectedPrintFieldIds(noneObj);
            }}
            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
          >
            전체 해제
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
          {activeTpl && activeTpl.fields && activeTpl.fields.map(field => (
            <label key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedPrintFieldIds[field.id] !== false}
                onChange={(e) => setSelectedPrintFieldIds({ ...selectedPrintFieldIds, [field.id]: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                {field.label}
                <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 400 }}>
                  ({field.type === 'phone' ? '전화번호' : field.type === 'datetime' ? '일시' : field.type === 'checklist' ? '체크리스트' : '텍스트'})
                </span>
              </span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={styles.btnSecondary}>
            취소
          </button>
          <button onClick={onConfirmPrint} style={styles.btnPrimary}>
            <Printer size={14} />
            <span>선택 항목 인쇄</span>
          </button>
        </div>
      </div>
    </div>
  );
}
