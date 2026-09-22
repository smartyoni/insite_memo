import React from 'react';
import { X } from 'lucide-react';

export default function QuickTabEditModal({
  editingTab,
  editingTabInput,
  setEditingTabInput,
  onClose,
  onUpdateTabLabel
}) {
  if (!editingTab) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '320px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>탭 이름 변경</span>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#64748B' }}
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateTabLabel(editingTab.id, editingTabInput);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <input
            type="text"
            autoFocus
            value={editingTabInput}
            onChange={(e) => setEditingTabInput(e.target.value)}
            placeholder="탭 이름을 입력하세요"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
