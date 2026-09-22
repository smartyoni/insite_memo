import React from 'react';
import { FolderInput, X } from 'lucide-react';
import { styles } from '../notebookStyles';

export default function MoveBlockModal({
  isOpen,
  modalState,
  onClose,
  onSelectTarget,
  onExecute,
  rawChecklists = [],
  checklistGroups = [],
  isMobile
}) {
  if (!isOpen) return null;

  const candidates = rawChecklists.filter((c) => !c.isSection && c.id !== modalState.sourceCheckId);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          ...styles.modalContent,
          maxWidth: '440px',
          width: isMobile ? '92%' : '420px'
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
            <h3 style={styles.modalTitle}>블록 소속 이동</h3>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn} title="닫기">
            <X size={18} />
          </button>
        </div>

        <div style={styles.modalBody}>
          {/* 이동 대상 블록 미리보기 카드 */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
              {modalState.block?.type === 'checklist' ? (
                <span style={{ color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                  ☑️ 체크리스트 블록
                </span>
              ) : (
                <span style={{ color: '#1D4ED8', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>
                  📝 텍스트 블록
                </span>
              )}
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#1E293B',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {modalState.block?.title || (
                modalState.block?.type === 'checklist'
                  ? (modalState.block?.items?.[0]?.text || '체크리스트')
                  : (modalState.block?.content?.split('\n')[0] || '(내용 없음)')
              )}
            </div>
          </div>

          <p style={{ ...styles.modalMessage, marginBottom: '8px', fontWeight: 600, color: '#334155' }}>
            이동할 대상 체크리스트를 선택하세요:
          </p>

          {candidates.length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              이동할 수 있는 다른 체크리스트가 없습니다. 먼저 좌측에서 새 체크리스트를 추가해 주세요.
            </div>
          ) : (
            <select
              value={modalState.targetCheckId || ''}
              onChange={(e) => onSelectTarget(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #2563EB',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                cursor: 'pointer'
              }}
            >
              {/* 기본 내용 (현재 소속이 아닐 때) */}
              {modalState.sourceCheckId !== '__main__' && (
                <option value="__main__">📝 [기본 내용]</option>
              )}

              {/* 체크리스트 그룹별 항목들 */}
              {checklistGroups.map((grp, gIdx) => {
                const validItems = grp.items.filter((it) => it.id !== '__main__' && !it.isSection && it.id !== modalState.sourceCheckId);
                if (validItems.length === 0) return null;

                if (grp.section && grp.section.text) {
                  return (
                    <optgroup key={`opt_grp_${gIdx}`} label={`📁 ${grp.section.text}`}>
                      {validItems.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.completed ? '✓ ' : '□ '} {c.text}
                        </option>
                      ))}
                    </optgroup>
                  );
                }

                return (
                  <optgroup key={`opt_ungrp_${gIdx}`} label="일반 체크리스트">
                    {validItems.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.completed ? '✓ ' : '□ '} {c.text}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          )}
        </div>

        <div style={styles.modalFooter}>
          <button type="button" onClick={onClose} style={styles.btnModalCancel}>
            취소
          </button>
          <button
            type="button"
            onClick={onExecute}
            disabled={!modalState.targetCheckId || candidates.length === 0}
            style={{
              ...styles.btnPrimary,
              padding: '7px 16px',
              backgroundColor: (!modalState.targetCheckId || candidates.length === 0) ? '#94A3B8' : '#2563EB',
              cursor: (!modalState.targetCheckId || candidates.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            이동하기
          </button>
        </div>
      </div>
    </div>
  );
}
