import React from 'react';
import { FolderInput, X } from 'lucide-react';
import { styles } from '../notebookStyles';

export default function CategoryMoveModal({
  movingCategory,
  onClose,
  targetMoveParentId,
  setTargetMoveParentId,
  onConfirm,
  categoryOptions = [],
  isMobile,
  sidebarRight = 280
}) {
  if (!movingCategory) return null;

  return (
    <div
      style={{
        ...styles.modalOverlay,
        display: 'block'
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...styles.modalContent,
          position: 'absolute',
          top: '33.33%',
          left: isMobile ? '50%' : `${sidebarRight || 280}px`,
          transform: isMobile ? 'translate(-50%, -50%)' : 'translateY(-50%)',
          width: isMobile ? '90%' : '380px',
          maxWidth: '400px',
          border: '1px solid #E2E8F0',
          margin: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FolderInput size={18} color="#2563EB" />
            </div>
            <h3 style={styles.modalTitle}>폴더 이동</h3>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn} title="닫기">
            <X size={18} />
          </button>
        </div>

        <div style={styles.modalBody}>
          <p style={{ ...styles.modalMessage, marginBottom: '14px' }}>
            <strong>'{movingCategory.name}'</strong> 폴더의 상위(부모) 폴더를 선택하세요:
          </p>
          <select
            value={targetMoveParentId}
            onChange={(e) => setTargetMoveParentId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '13.5px',
              color: '#1E293B',
              outline: 'none',
              backgroundColor: '#F8FAFC'
            }}
          >
            <option value="">[ 최상위(루트) 폴더 ]</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName || c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.btnModalCancel}>
            취소
          </button>
          <button
            onClick={() => onConfirm(targetMoveParentId)}
            style={{
              padding: '9px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            이동
          </button>
        </div>
      </div>
    </div>
  );
}
