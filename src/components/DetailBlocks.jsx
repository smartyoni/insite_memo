import React, { useRef } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Minus, Type } from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';

/**
 * detailValue(문자열)와 detailBlocks(배열)를 받아 정규화된 블록 배열을 반환합니다.
 * 기존 문자열 데이터만 있는 경우 1개의 텍스트 박스로 자동 감싸서 반환합니다.
 */
export const parseDetailBlocks = (detailValue, detailBlocks) => {
  if (Array.isArray(detailBlocks) && detailBlocks.length > 0) {
    return detailBlocks.map((b, idx) => ({
      id: b.id || `b_${Date.now()}_${idx}`,
      type: b.type === 'divider' ? 'divider' : 'text',
      content: typeof b.content === 'string' ? b.content : ''
    }));
  }

  if (typeof detailValue === 'string' && detailValue.trim().length > 0) {
    return [
      {
        id: `b_init_${Date.now()}`,
        type: 'text',
        content: detailValue
      }
    ];
  }

  // 기본 빈 블록 1개
  return [
    {
      id: `b_init_${Date.now()}`,
      type: 'text',
      content: ''
    }
  ];
};

/**
 * 블록 배열을 기존 plain text 문자열로 변환합니다. (검색 및 외부 호환성용)
 */
export const blocksToPlainText = (blocks) => {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map((b) => (b.type === 'divider' ? '────────────────────' : (b.content || '').trim()))
    .filter((s) => s.length > 0)
    .join('\n\n');
};

/**
 * 읽기 모드 뷰어 컴포넌트
 */
export const DetailBlocksViewer = ({
  blocks = [],
  searchQuery = '',
  onDoubleClick,
  emptyPlaceholder
}) => {
  const hasContent = blocks.some(
    (b) => b.type === 'divider' || (b.type === 'text' && b.content && b.content.trim().length > 0)
  );

  if (!hasContent) {
    return (
      <div
        onDoubleClick={onDoubleClick}
        title="더블클릭하여 수정 가능"
        style={{
          flex: 1,
          minHeight: 0,
          padding: '24px 16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          color: '#94A3B8',
          fontSize: '13px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
      >
        {emptyPlaceholder || (
          <span>
            등록된 상세내용이 없습니다. 우측 상단 <strong>[수정]</strong> 버튼을 누르거나 본문을 더블클릭하여 내용을 입력해 보세요.
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onDoubleClick={onDoubleClick}
      title="더블클릭하여 수정 가능"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        paddingRight: '4px'
      }}
    >
      {blocks.map((block, idx) => {
        if (block.type === 'divider') {
          return (
            <div
              key={block.id || `divider_${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '6px 0',
                userSelect: 'none'
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: '#CBD5E1',
                  borderTop: '1px dashed #94A3B8'
                }}
              />
            </div>
          );
        }

        // 텍스트 박스: 연한 회색 배경과 깔끔한 테두리를 가진 카드 형태 (Note Box)
        return (
          <div
            key={block.id || `text_${idx}`}
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '14px 16px',
              fontSize: '14px',
              lineHeight: 1.65,
              color: '#1E293B',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            {block.content && block.content.trim() ? (
              renderWithLinks(block.content, searchQuery)
            ) : (
              <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '13px' }}>
                (빈 텍스트 박스)
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * 편집 모드 에디터 컴포넌트
 */
export const DetailBlocksEditor = ({
  blocks = [],
  onChange,
  onSave
}) => {
  const textareaRefs = useRef({});

  const handleAddText = () => {
    const newBlock = {
      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'text',
      content: ''
    };
    onChange([...blocks, newBlock]);
  };

  const handleAddDivider = () => {
    const newBlock = {
      id: `div_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'divider'
    };
    onChange([...blocks, newBlock]);
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(index - 1, 0, moved);
    onChange(next);
  };

  const handleMoveDown = (index) => {
    if (index >= blocks.length - 1) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(index + 1, 0, moved);
    onChange(next);
  };

  const handleDelete = (index) => {
    const next = blocks.filter((_, i) => i !== index);
    if (next.length === 0) {
      next.push({
        id: `b_${Date.now()}`,
        type: 'text',
        content: ''
      });
    }
    onChange(next);
  };

  const handleContentChange = (id, val) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, content: val } : b));
    onChange(next);
  };

  let textCounter = 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        paddingRight: '4px'
      }}
    >
      {blocks.map((block, idx) => {
        if (block.type === 'divider') {
          return (
            <div
              key={block.id || `div_edit_${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                backgroundColor: '#F1F5F9',
                borderRadius: '8px',
                border: '1px dashed #CBD5E1'
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748B',
                  backgroundColor: '#E2E8F0',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Minus size={12} /> 구분선
              </span>

              <div style={{ flex: 1, height: '1px', backgroundColor: '#CBD5E1' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  title="위로 이동"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    color: idx === 0 ? '#CBD5E1' : '#64748B',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === blocks.length - 1}
                  title="아래로 이동"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: idx === blocks.length - 1 ? 'not-allowed' : 'pointer',
                    color: idx === blocks.length - 1 ? '#CBD5E1' : '#64748B',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  title="구분선 삭제"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#EF4444',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        }

        textCounter += 1;
        const currentTextNumber = textCounter;

        return (
          <div
            key={block.id || `text_edit_${idx}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0'
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Type size={13} color="#2563EB" /> 텍스트 박스 {currentTextNumber}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  title="위로 이동"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    color: idx === 0 ? '#CBD5E1' : '#64748B',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === blocks.length - 1}
                  title="아래로 이동"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: idx === blocks.length - 1 ? 'not-allowed' : 'pointer',
                    color: idx === blocks.length - 1 ? '#CBD5E1' : '#64748B',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  title="텍스트 박스 삭제"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#EF4444',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <textarea
              ref={(el) => {
                if (el) textareaRefs.current[block.id] = el;
              }}
              value={block.content}
              onChange={(e) => handleContentChange(block.id, e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  if (onSave) onSave();
                }
              }}
              placeholder="내용을 입력하세요... (전화번호, 웹 URL 자동 링크 및 Ctrl+S 저장 지원)"
              rows={4}
              style={{
                width: '100%',
                minHeight: '90px',
                padding: '10px 12px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#1E293B',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                backgroundColor: '#FFFFFF'
              }}
            />
          </div>
        );
      })}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 0',
          marginTop: '2px'
        }}
      >
        <button
          type="button"
          onClick={handleAddText}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            color: '#1D4ED8',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={14} /> 텍스트 박스 추가
        </button>
        <button
          type="button"
          onClick={handleAddDivider}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Minus size={14} /> 구분선 추가
        </button>
      </div>
    </div>
  );
};
