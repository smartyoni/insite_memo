import React from 'react';
import { Trash2, X } from 'lucide-react';
import { styles } from '../notebookStyles';

export default function DeleteConfirmModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmBtnRef
}) {
  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.modalDangerIconWrapper}>
              <Trash2 size={18} color="#DC2626" />
            </div>
            <h3 style={styles.modalTitle}>{title || '삭제 확인'}</h3>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn} title="닫기">
            <X size={18} />
          </button>
        </div>

        <div style={styles.modalBody}>
          <p style={styles.modalMessage}>{message}</p>
        </div>

        <div style={styles.modalFooter}>
          <button type="button" onClick={onClose} style={styles.btnModalCancel}>
            취소
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            autoFocus
            onClick={onConfirm}
            style={styles.btnModalDelete}
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
