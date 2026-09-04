import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Minus, Type, Edit2, Check, X, RotateCcw } from 'lucide-react';
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
      title: typeof b.title === 'string' ? b.title : '',
      content: typeof b.content === 'string' ? b.content : ''
    }));
  }

  if (typeof detailValue === 'string' && detailValue.trim().length > 0) {
    return [
      {
        id: `b_init_${Date.now()}`,
        type: 'text',
        title: '',
        content: detailValue
      }
    ];
  }

  // 기본 빈 블록 1개
  return [
    {
      id: `b_init_${Date.now()}`,
      type: 'text',
      title: '',
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
    .map((b) => {
      if (b.type === 'divider') return '────────────────────';
      const parts = [];
      if (b.title && b.title.trim()) parts.push(`[${b.title.trim()}]`);
      if (b.content && b.content.trim()) parts.push(b.content.trim());
      return parts.join('\n');
    })
    .filter((s) => s.length > 0)
    .join('\n\n');
};

/**
 * 상세내용 상시 블록 관리 컴포넌트
 * 텍스트 박스 이름(제목) 편집 및 본문 개별 수정/저장, 구분선 개별 삭제/이동 지원
 */
export const DetailBlocksManager = ({
  blocks = [],
  onChangeAndSave,
  searchQuery = '',
  editingBlockId,
  setEditingBlockId
}) => {
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const titleInputRef = useRef(null);
  const textareaRef = useRef(null);

  // 편집 시작
  const handleStartEdit = (block) => {
    setEditingBlockId(block.id);
    setDraftTitle(block.title || '');
    setDraftContent(block.content || '');
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingBlockId(null);
    setDraftTitle('');
    setDraftContent('');
  };

  // 편집 저장
  const handleSaveBlock = (blockId) => {
    const nextBlocks = blocks.map((b) =>
      b.id === blockId
        ? { ...b, title: draftTitle.trim(), content: draftContent }
        : b
    );
    setEditingBlockId(null);
    setDraftTitle('');
    setDraftContent('');
    if (onChangeAndSave) {
      onChangeAndSave(nextBlocks);
    }
  };

  // 위로 이동
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(index - 1, 0, moved);
    if (onChangeAndSave) {
      onChangeAndSave(next);
    }
  };

  // 아래로 이동
  const handleMoveDown = (index) => {
    if (index >= blocks.length - 1) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(index + 1, 0, moved);
    if (onChangeAndSave) {
      onChangeAndSave(next);
    }
  };

  // 삭제
  const handleDelete = (index) => {
    const targetBlock = blocks[index];
    if (editingBlockId === targetBlock?.id) {
      setEditingBlockId(null);
      setDraftTitle('');
      setDraftContent('');
    }
    const next = blocks.filter((_, i) => i !== index);
    if (next.length === 0) {
      next.push({
        id: `b_${Date.now()}`,
        type: 'text',
        title: '',
        content: ''
      });
    }
    if (onChangeAndSave) {
      onChangeAndSave(next);
    }
  };

  useEffect(() => {
    if (editingBlockId) {
      // 이름이 비어있으면 이름 입력창으로 포커스, 이름이 있으면 본문으로 포커스
      if (!draftTitle && titleInputRef.current) {
        titleInputRef.current.focus();
      } else if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [editingBlockId]);

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
              key={block.id || `divider_${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '8px 0',
                userSelect: 'none'
              }}
            >
              {/* 구분선 실선/대시 */}
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: '#CBD5E1',
                  borderTop: '1px dashed #94A3B8'
                }}
              />

              {/* 구분선 우측 끝 컨트롤: 순서 이동 & 삭제 버튼 */}
              <div
                className="no-print"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  backgroundColor: '#F1F5F9',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#64748B',
                    marginRight: '4px'
                  }}
                >
                  구분선
                </span>
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
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '3px'
                  }}
                >
                  <ArrowUp size={13} />
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
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '3px'
                  }}
                >
                  <ArrowDown size={13} />
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
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '3px'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        }

        const isEditingThisBlock = editingBlockId === block.id;

        return (
          <div
            key={block.id || `text_${idx}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: isEditingThisBlock ? '#FFFFFF' : '#F8FAFC',
              borderRadius: '10px',
              border: isEditingThisBlock ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
              boxShadow: isEditingThisBlock
                ? '0 0 0 3px rgba(37, 99, 235, 0.1)'
                : '0 1px 2px rgba(0,0,0,0.02)',
              overflow: 'hidden',
              transition: 'all 0.15s ease'
            }}
          >
            {/* 카드 상단 헤더 바 (텍스트박스 이름 영역 + 컨트롤) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                backgroundColor: isEditingThisBlock ? '#EFF6FF' : '#F1F5F9',
                borderBottom: isEditingThisBlock ? '1px solid #DBEAFE' : '1px solid #E2E8F0'
              }}
            >
              {/* 좌측: 텍스트 박스 이름 (수정 시 input, 평상시 표시) */}
              {isEditingThisBlock ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <Type size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        e.preventDefault();
                        handleSaveBlock(block.id);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
                    placeholder="텍스트박스 이름 입력... (예: 계약조건, 전달사항)"
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#1E293B',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      border: '1px solid #93C5FD',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      width: '100%',
                      maxWidth: '280px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ) : (
                <div
                  onDoubleClick={() => handleStartEdit(block)}
                  title="더블클릭하여 이름 및 내용 수정"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <Type size={13} color={block.title ? '#2563EB' : '#94A3B8'} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: block.title ? '#1E293B' : '#94A3B8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {block.title ? block.title : '(텍스트박스 이름 없음 - 우측 수정 클릭)'}
                  </span>
                </div>
              )}

              {/* 우측 개별 컨트롤 */}
              <div
                className="no-print"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
              >
                {isEditingThisBlock ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      title="편집 취소 (Esc)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#64748B',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>취소</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveBlock(block.id)}
                      title="저장 (Ctrl+S)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 9px',
                        borderRadius: '5px',
                        border: '1px solid #2563EB',
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={12} />
                      <span>저장</span>
                    </button>
                  </>
                ) : (
                  <>
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
                      <ArrowUp size={13} />
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
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(block)}
                      title="이름 및 본문 수정 (더블클릭 가능)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#2563EB',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginLeft: '2px'
                      }}
                    >
                      <Edit2 size={11} />
                      <span>수정</span>
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
                        borderRadius: '4px',
                        marginLeft: '2px'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 카드 본문: 수정 중일 때는 Textarea, 아닐 때는 읽기 뷰어 */}
            {isEditingThisBlock ? (
              <div style={{ padding: '8px 10px', backgroundColor: '#FFFFFF' }}>
                <textarea
                  ref={textareaRef}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                      e.preventDefault();
                      handleSaveBlock(block.id);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelEdit();
                    }
                  }}
                  placeholder="내용을 입력하세요... (전화번호, 웹 URL 자동 링크 지원 / Ctrl+S 저장)"
                  rows={4}
                  style={{
                    width: '100%',
                    minHeight: '85px',
                    padding: '8px 10px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
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
            ) : (
              <div
                onDoubleClick={() => handleStartEdit(block)}
                title="더블클릭하여 수정 가능"
                style={{
                  padding: '12px 14px',
                  fontSize: '14px',
                  lineHeight: 1.65,
                  color: '#1E293B',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  cursor: 'text'
                }}
              >
                {block.content && block.content.trim() ? (
                  renderWithLinks(block.content, searchQuery)
                ) : (
                  <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '13px' }}>
                    (비어 있는 텍스트 박스입니다. 우측 [수정]을 누르거나 본문을 더블클릭하여 내용을 입력하세요)
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
