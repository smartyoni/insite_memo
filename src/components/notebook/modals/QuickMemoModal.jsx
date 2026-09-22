import React from 'react';
import { Zap, X } from 'lucide-react';

export default function QuickMemoModal({
  isOpen,
  quickMemoToast,
  quickMemoText,
  setQuickMemoText,
  quickMemoTextareaRef,
  isSavingQuickMemo,
  onClose,
  onSave
}) {
  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              width: '100%',
              maxWidth: '520px',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#FFFBEB',
                borderBottom: '1px solid #FDE68A'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="#D97706" fill="#F59E0B" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#92400E' }}>
                  퀵메모 (빠른 기록)
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  color: '#92400E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="닫기 (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Textarea */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                ref={quickMemoTextareaRef}
                value={quickMemoText}
                onChange={(e) => setQuickMemoText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    onSave();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                  }
                }}
                placeholder="메모할 내용을 자유롭게 입력하세요...&#13;&#10;(Enter 줄바꿈, Ctrl + Enter 로 즉시 저장)"
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  outline: 'none',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#1E293B',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                autoFocus
              />
              <div style={{ fontSize: '11.5px', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>* 오늘 날짜의 퀵메모 노트에 체크리스트로 추가됩니다.</span>
                <span>단축키: <strong>Ctrl + Enter</strong></span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#F8FAFC',
                borderTop: '1px solid #E2E8F0'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                취소 (Esc)
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={!quickMemoText.trim() || isSavingQuickMemo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: quickMemoText.trim() && !isSavingQuickMemo ? '#D97706' : '#FDE68A',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: quickMemoText.trim() && !isSavingQuickMemo ? 'pointer' : 'not-allowed',
                  boxShadow: quickMemoText.trim() ? '0 1px 3px rgba(217, 119, 6, 0.3)' : 'none'
                }}
              >
                <Zap size={14} fill="#FFFFFF" color="#FFFFFF" />
                <span>{isSavingQuickMemo ? '저장 중...' : '저장 (Ctrl+Enter)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Memo Toast Notification */}
      {quickMemoToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1E293B',
            color: '#FEF3C7',
            padding: '10px 20px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
            zIndex: 99999,
            pointerEvents: 'none',
            border: '1px solid #F59E0B',
            whiteSpace: 'nowrap'
          }}
        >
          <Zap size={14} fill="#F59E0B" color="#F59E0B" />
          <span>오늘 날짜 퀵메모에 저장되었습니다.</span>
        </div>
      )}
    </>
  );
}
