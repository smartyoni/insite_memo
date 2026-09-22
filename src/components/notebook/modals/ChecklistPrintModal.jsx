import React from 'react';
import { Printer, X, Folder } from 'lucide-react';
import { styles } from '../notebookStyles';

export default function ChecklistPrintModal({
  isOpen,
  onClose,
  currentChecklists,
  selectedPrintChecklistIds,
  setSelectedPrintChecklistIds,
  onConfirmPrint
}) {
  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modalContent, maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
            <Printer size={18} color="#2563EB" />
            <span>체크리스트 인쇄 항목 선택</span>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
          출력할 체크리스트 항목을 선택해 주세요:
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              const allObj = {};
              currentChecklists.filter(c => !c.isSection).forEach(c => { allObj[c.id] = true; });
              setSelectedPrintChecklistIds(allObj);
            }}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
          >
            전체 선택
          </button>
          <button
            type="button"
            onClick={() => {
              const noneObj = {};
              currentChecklists.filter(c => !c.isSection).forEach(c => { noneObj[c.id] = false; });
              setSelectedPrintChecklistIds(noneObj);
            }}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
          >
            전체 해제
          </button>
          <button
            type="button"
            onClick={() => {
              const uncompObj = {};
              currentChecklists.filter(c => !c.isSection).forEach(c => { uncompObj[c.id] = !c.completed; });
              setSelectedPrintChecklistIds(uncompObj);
            }}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', color: '#1E40AF', cursor: 'pointer', fontWeight: 600 }}
          >
            미완료만 선택
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
          {currentChecklists.map((checkItem) => (
            checkItem.isSection ? (
              <div
                key={checkItem.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  marginTop: '4px',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#1E293B'
                }}
              >
                <Folder size={13} color="#2563EB" />
                <span>{checkItem.text}</span>
              </div>
            ) : (
              <label key={checkItem.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: checkItem.completed ? '#F8FAFC' : '#FFFFFF', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedPrintChecklistIds[checkItem.id] !== false}
                  onChange={(e) => setSelectedPrintChecklistIds({ ...selectedPrintChecklistIds, [checkItem.id]: e.target.checked })}
                  style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '13px', color: checkItem.completed ? '#10B981' : '#CBD5E1', fontWeight: 700 }}>
                    {checkItem.completed ? '☑' : '☐'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: checkItem.completed ? '#64748B' : '#1E293B', textDecoration: checkItem.completed ? 'line-through' : 'none' }}>
                    {checkItem.text}
                  </span>
                </div>
              </label>
            )
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
