import React from 'react';
import { FolderPlus, X } from 'lucide-react';

export default function AddGroupModal({
  isOpen,
  groupModalPos,
  newGroupNameInput,
  setNewGroupNameInput,
  onClose,
  onCreateGroup
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'transparent'
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: groupModalPos?.top ?? 100,
          right: groupModalPos?.right ?? 20,
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08)',
          border: '1px solid #CBD5E1',
          padding: '12px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
            <FolderPlus size={15} color="#2563EB" />
            <span>새 그룹 추가</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
          >
            <X size={15} />
          </button>
        </div>
        <div>
          <input
            type="text"
            autoFocus
            value={newGroupNameInput}
            onChange={(e) => setNewGroupNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCreateGroup();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="그룹명을 입력하세요"
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              borderRadius: '5px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onCreateGroup}
            disabled={!newGroupNameInput.trim()}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              cursor: newGroupNameInput.trim() ? 'pointer' : 'not-allowed',
              opacity: newGroupNameInput.trim() ? 1 : 0.6
            }}
          >
            추가
          </button>
        </div>
      </div>
    </>
  );
}
