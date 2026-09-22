import React from 'react';
import { FolderInput, X, FileText } from 'lucide-react';
import { styles } from '../notebookStyles';

export default function MoveItemModal({
  movingItem,
  onClose,
  targetMoveItemTab,
  setTargetMoveItemTab,
  targetMoveCategoryGroupId,
  setTargetMoveCategoryGroupId,
  targetMoveItemCategoryId,
  setTargetMoveItemCategoryId,
  targetMoveItemGroupId,
  setTargetMoveItemGroupId,
  onConfirm,
  mainTabs = [],
  targetScopeGroups = [],
  categoryOptions = [],
  targetGroups = [],
  isMobile
}) {
  if (!movingItem) return null;

  return (
    <div
      style={{
        ...styles.modalOverlay,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...styles.modalContent,
          width: isMobile ? '92%' : '410px',
          maxWidth: '430px',
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
            <h3 style={styles.modalTitle}>메모 이동</h3>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn} title="닫기">
            <X size={18} />
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={{
            padding: '9px 12px',
            backgroundColor: '#F8FAFC',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FileText size={15} color="#2563EB" style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#1E293B',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {movingItem.title || '제목 없음'}
            </span>
          </div>

          {/* 1단계: 이동할 탭 선택 */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
              1. 이동할 탭 (필수):
            </label>
            <select
              value={targetMoveItemTab}
              onChange={(e) => {
                const nextTab = e.target.value;
                setTargetMoveItemTab(nextTab);
                setTargetMoveCategoryGroupId('');
                setTargetMoveItemCategoryId('');
                setTargetMoveItemGroupId('');
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                color: '#1E293B',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                fontWeight: 600
              }}
            >
              {mainTabs.map((t) => (
                <option key={t.id} value={t.id}>
                  📌 {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2단계: 카테고리 그룹(대분류) 선택 */}
          {targetScopeGroups.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                2. 카테고리 그룹 (선택사항):
              </label>
              <select
                value={targetMoveCategoryGroupId}
                onChange={(e) => {
                  setTargetMoveCategoryGroupId(e.target.value);
                  setTargetMoveItemCategoryId('');
                  setTargetMoveItemGroupId('');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  outline: 'none',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <option value="">[ 전체 카테고리 ]</option>
                <option value="__ungrouped__">[ 미분류 그룹 ]</option>
                {targetScopeGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    📁 {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3단계: 카테고리 선택 */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
              {targetScopeGroups.length > 0 ? '3. 이동할 카테고리 (필수):' : '2. 이동할 카테고리 (필수):'}
            </label>
            <select
              value={targetMoveItemCategoryId}
              onChange={(e) => {
                setTargetMoveItemCategoryId(e.target.value);
                setTargetMoveItemGroupId('');
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                color: '#1E293B',
                outline: 'none',
                backgroundColor: '#FFFFFF'
              }}
            >
              <option value="">[ 카테고리를 선택하세요 ]</option>
              {targetMoveItemTab === 'explorer' && (
                <option value="quick_memo">⚡ 퀵메모</option>
              )}
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4단계: 메모 소그룹 (선택사항) */}
          {targetGroups.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                {targetScopeGroups.length > 0 ? '4. 메모 소그룹 (선택사항):' : '3. 메모 소그룹 (선택사항):'}
              </label>
              <select
                value={targetMoveItemGroupId || ''}
                onChange={(e) => setTargetMoveItemGroupId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  outline: 'none',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <option value="">미분류 (기본)</option>
                {targetGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    📁 {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.btnModalCancel}>
            취소
          </button>
          <button
            onClick={onConfirm}
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
