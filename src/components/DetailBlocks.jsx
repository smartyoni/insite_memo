import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Minus, Type, Edit2, Check, X, RotateCcw, CheckSquare } from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';

/**
 * detailValue(문자열)와 detailBlocks(배열)를 받아 정규화된 블록 배열을 반환합니다.
 * 기존 문자열 데이터만 있는 경우 1개의 텍스트 박스로 자동 감싸서 반환합니다.
 */
export const parseDetailBlocks = (detailValue, detailBlocks) => {
  if (Array.isArray(detailBlocks) && detailBlocks.length > 0) {
    return detailBlocks.map((b, idx) => {
      if (b.type === 'divider') {
        return {
          id: b.id || `b_${Date.now()}_${idx}`,
          type: 'divider'
        };
      }
      if (b.type === 'checklist') {
        const rawItems = Array.isArray(b.items) && b.items.length > 0
          ? b.items
          : [{ id: `item_${Date.now()}_0`, text: '', completed: false }];
        return {
          id: b.id || `chk_${Date.now()}_${idx}`,
          type: 'checklist',
          title: typeof b.title === 'string' ? b.title : '체크리스트',
          items: rawItems.map((it, i) => ({
            id: it.id || `item_${Date.now()}_${i}`,
            text: typeof it.text === 'string' ? it.text : (typeof it === 'string' ? it : ''),
            completed: Boolean(it.completed)
          }))
        };
      }
      return {
        id: b.id || `b_${Date.now()}_${idx}`,
        type: 'text',
        title: typeof b.title === 'string' ? b.title : '',
        content: typeof b.content === 'string' ? b.content : ''
      };
    });
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
      if (b.type === 'checklist') {
        const parts = [];
        if (b.title && b.title.trim()) parts.push(`[${b.title.trim()}]`);
        (b.items || []).forEach((it) => {
          const mark = it.completed ? '[v]' : '[ ]';
          if (it.text && it.text.trim()) parts.push(`${mark} ${it.text.trim()}`);
        });
        return parts.join('\n');
      }
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
 * 긴 내용 시 헤더 고정(Sticky Header), 본문 스크롤(maxHeight & overflowY) 지원
 */
export const DetailBlocksManager = ({
  blocks = [],
  onChangeAndSave,
  searchQuery = '',
  editingBlockId,
  setEditingBlockId,
  openDeleteModal
}) => {
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [editingChecklistTitleId, setEditingChecklistTitleId] = useState(null);
  const [draftChecklistTitle, setDraftChecklistTitle] = useState('');
  const titleInputRef = useRef(null);
  const textareaRef = useRef(null);

  // 텍스트에어리어 높이 자동 조절
  const adjustTextareaHeight = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 46)}px`;
  };

  // 체크리스트 항목 텍스트 변경
  const handleUpdateChecklistItemText = (blockId, itemId, newText) => {
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        items: (b.items || []).map((it) => (it.id === itemId ? { ...it, text: newText } : it))
      };
    });
    if (onChangeAndSave) onChangeAndSave(next);
  };

  // 체크리스트 항목 체크/해제 토글
  const handleToggleChecklistItem = (blockId, itemId) => {
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        items: (b.items || []).map((it) => (it.id === itemId ? { ...it, completed: !it.completed } : it))
      };
    });
    if (onChangeAndSave) onChangeAndSave(next);
  };

  // 체크리스트 항목 추가 (빈 항목 생성)
  const handleAddChecklistItem = (blockId, afterItemId = null) => {
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: '',
      completed: false
    };
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const items = [...(b.items || [])];
      if (afterItemId) {
        const idx = items.findIndex((it) => it.id === afterItemId);
        if (idx !== -1) {
          items.splice(idx + 1, 0, newItem);
        } else {
          items.push(newItem);
        }
      } else {
        items.push(newItem);
      }
      return { ...b, items };
    });
    if (onChangeAndSave) onChangeAndSave(next);
    setTimeout(() => {
      const el = document.getElementById(`chk_input_${newItem.id}`);
      if (el) el.focus();
    }, 50);
  };

  // 체크리스트 항목 삭제
  const handleDeleteChecklistItem = (blockId, itemId) => {
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const filtered = (b.items || []).filter((it) => it.id !== itemId);
      return {
        ...b,
        items: filtered.length > 0 ? filtered : [{ id: `item_${Date.now()}`, text: '', completed: false }]
      };
    });
    if (onChangeAndSave) onChangeAndSave(next);
  };

  // 체크리스트 블록 제목 저장
  const handleSaveChecklistTitle = (blockId, newTitle) => {
    const next = blocks.map((b) => (b.id === blockId ? { ...b, title: newTitle.trim() } : b));
    setEditingChecklistTitleId(null);
    if (onChangeAndSave) onChangeAndSave(next);
  };

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

  // 실제 블록 삭제 실행
  const executeDelete = (index) => {
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

  // 삭제 (확인 모달 연동)
  const handleDelete = (index) => {
    const targetBlock = blocks[index];
    if (!targetBlock) return;

    if (openDeleteModal) {
      if (targetBlock.type === 'divider') {
        openDeleteModal(
          '구분선 삭제',
          '구분선을 정말 삭제하시겠습니까?',
          () => executeDelete(index)
        );
      } else if (targetBlock.type === 'checklist') {
        const titleText = targetBlock.title && targetBlock.title.trim();
        const name = titleText ? `'${titleText}' 체크리스트` : '체크리스트 블록';
        openDeleteModal(
          '체크리스트 삭제',
          `${name}을(를) 정말 삭제하시겠습니까?`,
          () => executeDelete(index)
        );
      } else {
        const titleText = targetBlock.title && targetBlock.title.trim();
        const contentText = targetBlock.content && targetBlock.content.trim();
        let message = '';

        if (titleText) {
          message = `'${titleText}' 텍스트박스를 정말 삭제하시겠습니까?`;
        } else if (contentText) {
          const preview = contentText.length > 30 ? contentText.slice(0, 30) + '...' : contentText;
          message = `'${preview}' 텍스트박스를 정말 삭제하시겠습니까?`;
        } else {
          message = '비어 있는 텍스트박스를 삭제하시겠습니까?';
        }

        openDeleteModal(
          '텍스트박스 삭제',
          message,
          () => executeDelete(index)
        );
      }
    } else {
      executeDelete(index);
    }
  };

  useEffect(() => {
    if (editingBlockId) {
      if (textareaRef.current) {
        adjustTextareaHeight(textareaRef.current);
      }
      if (!draftTitle && titleInputRef.current) {
        titleInputRef.current.focus();
      } else if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }
  }, [editingBlockId]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
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
                margin: '6px 0',
                userSelect: 'none',
                flexShrink: 0
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

        if (block.type === 'checklist') {
          const isEditingTitle = editingChecklistTitleId === block.id;
          const items = Array.isArray(block.items) && block.items.length > 0
            ? block.items
            : [{ id: `item_${Date.now()}_0`, text: '', completed: false }];

          return (
            <div
              key={block.id || `checklist_${idx}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {/* 체크리스트 헤더 바 (Sticky 상시 고정) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#EFF6FF',
                  borderBottom: '1px solid #DBEAFE',
                  position: 'sticky',
                  top: 0,
                  zIndex: 5,
                  flexShrink: 0
                }}
              >
                {/* 좌측: 체크박스 아이콘 & 제목 (인라인 수정 지원) */}
                {isEditingTitle ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, marginRight: '8px' }}>
                    <CheckSquare size={16} color="#D97706" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      value={draftChecklistTitle}
                      onChange={(e) => setDraftChecklistTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveChecklistTitle(block.id, draftChecklistTitle);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditingChecklistTitleId(null);
                        }
                      }}
                      placeholder="체크리스트 이름 입력..."
                      autoFocus
                      style={{
                        flex: 1,
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#1E293B',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #2563EB',
                        outline: 'none',
                        backgroundColor: '#FFFFFF'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveChecklistTitle(block.id, draftChecklistTitle)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingChecklistTitleId(null)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#64748B',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      minWidth: 0,
                      cursor: 'pointer'
                    }}
                    onDoubleClick={() => {
                      setEditingChecklistTitleId(block.id);
                      setDraftChecklistTitle(block.title || '');
                    }}
                    title="더블클릭하여 이름 수정"
                  >
                    <CheckSquare size={16} color="#D97706" style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#1E293B',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {block.title && block.title.trim() ? block.title : '체크리스트'}
                    </span>
                    <button
                      type="button"
                      className="no-print"
                      onClick={() => {
                        setEditingChecklistTitleId(block.id);
                        setDraftChecklistTitle(block.title || '');
                      }}
                      title="이름 수정"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}

                {/* 우측: [+ 항목 추가], [위로], [아래로], [삭제] 컨트롤 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} className="no-print">
                  <button
                    type="button"
                    onClick={() => handleAddChecklistItem(block.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #BFDBFE',
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="새 체크리스트 항목 추가"
                  >
                    <Plus size={12} />
                    <span>항목 추가</span>
                  </button>

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
                    onClick={() => handleDelete(idx)}
                    title="체크리스트 블록 삭제"
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
                </div>
              </div>

              {/* 체크리스트 본문 (내부 테두리 박스 및 항목 목록) */}
              <div style={{ padding: '10px 12px' }}>
                <div
                  style={{
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '8px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  {items.map((item, itemIdx) => (
                    <div
                      key={item.id || `item_${itemIdx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: item.completed ? '#F8FAFC' : '#FFFFFF',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      {/* 사각형 녹색 체크박스 */}
                      <button
                        type="button"
                        onClick={() => handleToggleChecklistItem(block.id, item.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          backgroundColor: item.completed ? '#059669' : '#FFFFFF',
                          border: item.completed ? '1px solid #059669' : '1.5px solid #CBD5E1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}
                        title={item.completed ? '완료 해제' : '완료 체크'}
                      >
                        {item.completed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </button>

                      {/* 인라인 텍스트 입력 */}
                      <input
                        id={`chk_input_${item.id}`}
                        type="text"
                        value={item.text || ''}
                        onChange={(e) => handleUpdateChecklistItemText(block.id, item.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChecklistItem(block.id, item.id);
                          } else if (e.key === 'Backspace' && !item.text && items.length > 1) {
                            e.preventDefault();
                            handleDeleteChecklistItem(block.id, item.id);
                            const prevItem = items[itemIdx - 1];
                            if (prevItem) {
                              setTimeout(() => {
                                const el = document.getElementById(`chk_input_${prevItem.id}`);
                                if (el) el.focus();
                              }, 50);
                            }
                          }
                        }}
                        placeholder="체크 항목 입력... (Enter 다음 항목 추가)"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          border: 'none',
                          outline: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: item.completed ? '#94A3B8' : '#1E293B',
                          textDecoration: item.completed ? 'line-through' : 'none',
                          backgroundColor: 'transparent'
                        }}
                      />

                      {/* 우측 완료 뱃지 (첨부 이미지 디자인) */}
                      {item.completed && (
                        <span
                          style={{
                            backgroundColor: '#D1FAE5',
                            color: '#059669',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            flexShrink: 0,
                            userSelect: 'none'
                          }}
                        >
                          ✓ 완료
                        </span>
                      )}

                      {/* 항목 삭제 버튼 */}
                      <button
                        type="button"
                        className="no-print"
                        onClick={() => handleDeleteChecklistItem(block.id, item.id)}
                        title="항목 삭제"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                          borderRadius: '3px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
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
              border: isEditingThisBlock ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
              boxShadow: isEditingThisBlock
                ? '0 0 0 2px rgba(59, 130, 246, 0.15)'
                : '0 1px 2px rgba(0,0,0,0.02)',
              overflow: 'hidden',
              flexShrink: 0,
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            {/* 카드 상단 헤더 바 (텍스트박스 이름 영역 + 컨트롤): Sticky로 상시 고정 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 12px',
                backgroundColor: isEditingThisBlock ? '#EFF6FF' : '#F1F5F9',
                borderBottom: isEditingThisBlock ? '1px solid #DBEAFE' : '1px solid #E2E8F0',
                position: 'sticky',
                top: 0,
                zIndex: 5,
                flexShrink: 0
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

            {/* 카드 본문: 내용이 많을 경우 브라우저 하단까지 시원하게 표시 후 내부 스크롤 지원 */}
            {isEditingThisBlock ? (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#FFFFFF',
                  maxHeight: 'max(300px, calc(100vh - 230px))',
                  overflowY: 'auto'
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={draftContent}
                  onChange={(e) => {
                    setDraftContent(e.target.value);
                    adjustTextareaHeight(e.target);
                  }}
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
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '46px',
                    padding: '0',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontSize: '14px',
                    lineHeight: 1.65,
                    color: '#1E293B',
                    fontFamily: 'inherit',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxSizing: 'border-box',
                    backgroundColor: 'transparent',
                    display: 'block'
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
                  cursor: 'text',
                  maxHeight: 'max(300px, calc(100vh - 230px))',
                  overflowY: 'auto'
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
