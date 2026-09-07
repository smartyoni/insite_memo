import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Type,
  Edit2,
  Check,
  X,
  RotateCcw,
  CheckSquare,
  Folder,
  FolderInput,
  ChevronDown,
  ChevronRight,
  ChevronsUp,
  ChevronsDown,
  Triangle,
  MoreVertical,
  GripVertical,
  Copy
} from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';

/**
 * detailValue(문자열)와 detailBlocks(배열)를 받아 정규화된 블록 배열을 반환합니다.
 * 기존 문자열 데이터만 있는 경우 1개의 텍스트 박스로 자동 감싸서 반환합니다.
 */
export const parseDetailBlocks = (detailValue, detailBlocks) => {
  if (Array.isArray(detailBlocks) && detailBlocks.length > 0) {
    const validBlocks = detailBlocks.filter((b) => b && b.type !== 'divider');
    if (validBlocks.length > 0) {
      return validBlocks.map((b, idx) => {
      if (b.type === 'checklist') {
        const rawItems = Array.isArray(b.items) && b.items.length > 0
          ? b.items
          : [{ id: `item_${Date.now()}_0`, text: '', completed: false }];
        const parsedItems = rawItems.map((it, i) => ({
          id: it.id || `item_${Date.now()}_${i}`,
          text: typeof it.text === 'string' ? it.text : (typeof it === 'string' ? it : ''),
          completed: Boolean(it.completed)
        }));
        const uncompleted = parsedItems.filter((it) => !it.completed);
        const completed = parsedItems.filter((it) => it.completed);
        return {
          id: b.id || `chk_${Date.now()}_${idx}`,
          type: 'checklist',
          title: typeof b.title === 'string' ? b.title : '체크리스트',
          items: [...uncompleted, ...completed]
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
    .filter((b) => b && b.type !== 'divider')
    .map((b) => {
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

const blockMenuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '7px 12px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#334155',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background-color 0.12s ease'
};

const blockMenuItemDangerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '7px 12px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#DC2626',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background-color 0.12s ease'
};

const blockMenuItemCancelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '7px 12px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#64748B',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background-color 0.12s ease'
};

/**
 * 체크리스트 개별 항목 컴포넌트
 * 좌측 체크리스트와 동일하게 조회 모드, 인라인 수정 모드(저장/취소), 3점 메뉴(수정/복사/삭제/취소), 드래그 앤 드롭을 지원합니다.
 */
function DetailChecklistItemRow({
  blockId,
  item,
  itemIdx,
  items,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onCopy,
  onDelete,
  openItemMenuId,
  openItemMenuPos,
  onOpenItemMenu,
  onCloseItemMenu,
  isDragged,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const [draftText, setDraftText] = useState(item.text || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      setDraftText(item.text || '');
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 38)}px`;
        }
      }, 30);
    }
  }, [isEditing, item.text]);

  const adjustHeight = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 38)}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSaveEdit(blockId, item.id, draftText);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit(blockId, item);
    }
  };

  return (
    <div
      key={item.id}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, blockId, item.id)}
      onDragOver={(e) => onDragOver(e, blockId, item.id)}
      onDrop={(e) => onDrop(e, blockId, item.id)}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex',
        flexDirection: isEditing ? 'column' : 'row',
        alignItems: isEditing ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: '6px',
        padding: isEditing ? '8px 10px' : '5px 8px',
        borderRadius: '6px',
        border: isEditing
          ? '1.5px solid #059669'
          : item.completed
            ? '1px solid #E2E8F0'
            : '1px solid #CBD5E1',
        backgroundColor: isEditing ? '#FFFFFF' : item.completed ? '#F8FAFC' : '#FFFFFF',
        boxShadow: isDragOver
          ? '0 -3px 0 0 #059669, 0 4px 12px rgba(5, 150, 105, 0.2)'
          : isEditing
            ? '0 0 0 1px #059669, 0 2px 6px rgba(5, 150, 105, 0.1)'
            : '0 1px 2px rgba(0, 0, 0, 0.02)',
        opacity: isDragged ? 0.4 : 1,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: isEditing ? 'default' : 'pointer'
      }}
    >
      {isEditing ? (
        // [수정 모드 (저장/취소 제공, 줄바꿈 지원)]
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={textareaRef}
            rows={2}
            value={draftText}
            onChange={(e) => {
              setDraftText(e.target.value);
              adjustHeight(e.target);
            }}
            onKeyDown={handleKeyDown}
            placeholder="체크 항목 내용 입력... (Enter 줄바꿈, Ctrl+Enter 저장)"
            style={{
              width: '100%',
              minHeight: '38px',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              outline: 'none',
              fontSize: '13px',
              fontWeight: 500,
              lineHeight: 1.5,
              color: '#0F172A',
              fontFamily: 'inherit',
              resize: 'none',
              backgroundColor: '#FAFAFA'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onCancelEdit(blockId, item)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                backgroundColor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              <X size={13} /> 취소
            </button>
            <button
              type="button"
              onClick={() => onSaveEdit(blockId, item.id, draftText)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: '#059669',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              <Check size={13} /> 저장
            </button>
          </div>
        </div>
      ) : (
        // [조회 모드 (드래그 핸들 + 체크박스 + 텍스트 + 3점 메뉴)]
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
          {/* 좌측: 드래그 핸들 + 체크박스 + 텍스트 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
            <span
              style={{
                cursor: 'grab',
                display: 'inline-flex',
                alignItems: 'center',
                color: '#94A3B8',
                flexShrink: 0
              }}
              title="드래그하여 순서 변경"
            >
              <GripVertical size={15} />
            </span>

            {/* 체크박스 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(blockId, item.id);
              }}
              style={{
                width: '19px',
                height: '19px',
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
              {item.completed && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
            </button>

            {/* 텍스트 (더블클릭 시 수정) */}
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: '13px',
                fontWeight: item.completed ? 400 : 600,
                lineHeight: 1.5,
                color: item.completed ? '#94A3B8' : '#1E293B',
                textDecoration: item.completed ? 'line-through' : 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                userSelect: 'text'
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onStartEdit(item);
              }}
              title="더블클릭하여 내용 수정"
            >
              {renderWithLinks(item.text || '(빈 항목)')}
            </span>

            {/* 완료 배지 */}
            {item.completed && (
              <span style={{
                backgroundColor: '#D1FAE5',
                color: '#059669',
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '4px',
                flexShrink: 0
              }}>
                ✓ 완료
              </span>
            )}
          </div>

          {/* 우측: 3점 메뉴 */}
          <div style={{ position: 'relative', flexShrink: 0 }} className="no-print" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => onOpenItemMenu(e, item.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: openItemMenuId === item.id ? '#E2E8F0' : 'transparent',
                color: openItemMenuId === item.id ? '#059669' : '#64748B',
                cursor: 'pointer'
              }}
              title="메뉴"
            >
              <MoreVertical size={15} />
            </button>

            {openItemMenuId === item.id && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9998,
                    backgroundColor: 'transparent'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseItemMenu();
                  }}
                />
                <div
                  style={{
                    position: 'fixed',
                    top: openItemMenuPos?.top ?? 0,
                    right: openItemMenuPos?.right ?? 0,
                    zIndex: 9999,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #CBD5E1',
                    minWidth: '110px',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onStartEdit(item)}
                    style={blockMenuItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Edit2 size={13} color="#475569" />
                    <span>수정</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopy(blockId, item)}
                    style={blockMenuItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Copy size={13} color="#475569" />
                    <span>복사</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(blockId, item.id)}
                    style={blockMenuItemDangerStyle}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={13} color="#DC2626" />
                    <span>삭제</span>
                  </button>
                  <button
                    type="button"
                    onClick={onCloseItemMenu}
                    style={blockMenuItemCancelStyle}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <X size={13} color="#64748B" />
                    <span>취소</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

let shadowTextarea = null;

const getShadowTextarea = () => {
  if (typeof document === 'undefined') return null;
  if (!shadowTextarea) {
    shadowTextarea = document.createElement('textarea');
    shadowTextarea.setAttribute('tabindex', '-1');
    shadowTextarea.setAttribute('aria-hidden', 'true');
    shadowTextarea.style.position = 'fixed';
    shadowTextarea.style.top = '-9999px';
    shadowTextarea.style.left = '-9999px';
    shadowTextarea.style.height = '0';
    shadowTextarea.style.overflow = 'hidden';
    shadowTextarea.style.visibility = 'hidden';
    shadowTextarea.style.pointerEvents = 'none';
    shadowTextarea.style.zIndex = '-9999';
    document.body.appendChild(shadowTextarea);
  }
  return shadowTextarea;
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
  openDeleteModal,
  onOpenMoveModal
}) => {
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [editingChecklistTitleId, setEditingChecklistTitleId] = useState(null);
  const [draftChecklistTitle, setDraftChecklistTitle] = useState('');
  const [openBlockMenuId, setOpenBlockMenuId] = useState(null);
  const [openBlockMenuPos, setOpenBlockMenuPos] = useState(null);
  const [collapsedBlockIds, setCollapsedBlockIds] = useState({});
  const [editingItemId, setEditingItemId] = useState(null);
  const [openItemMenuId, setOpenItemMenuId] = useState(null);
  const [openItemMenuPos, setOpenItemMenuPos] = useState(null);
  const [draggedItemKey, setDraggedItemKey] = useState(null);
  const [dragOverItemKey, setDragOverItemKey] = useState(null);
  const titleInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (openItemMenuId) {
          setOpenItemMenuId(null);
        } else if (editingItemId) {
          setEditingItemId(null);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [openItemMenuId, editingItemId]);

  const toggleBlockCollapse = (blockId) => {
    setCollapsedBlockIds((prev) => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  const handleOpenBlockMenu = (e, blockId) => {
    e.stopPropagation();
    if (openBlockMenuId === blockId) {
      setOpenBlockMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 160;
      const wouldOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = wouldOverflowBottom ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4;
      const right = Math.max(10, window.innerWidth - rect.right);
      setOpenBlockMenuPos({ top, right });
      setOpenBlockMenuId(blockId);
    }
  };

  // 텍스트에어리어 높이 자동 조절 (auto 리셋으로 인한 스크롤 튕김/하단 밀림 완전 방지)
  const adjustTextareaHeight = (el) => {
    if (!el) return;
    const shadow = getShadowTextarea();
    if (!shadow) {
      el.style.height = `${Math.max(el.scrollHeight, 46)}px`;
      return;
    }

    const clientWidth = el.clientWidth || el.getBoundingClientRect().width;
    if (clientWidth > 0) {
      const computed = window.getComputedStyle(el);
      shadow.style.width = `${clientWidth}px`;
      shadow.style.fontSize = computed.fontSize;
      shadow.style.fontFamily = computed.fontFamily;
      shadow.style.fontWeight = computed.fontWeight;
      shadow.style.lineHeight = computed.lineHeight;
      shadow.style.letterSpacing = computed.letterSpacing;
      shadow.style.whiteSpace = computed.whiteSpace;
      shadow.style.wordBreak = computed.wordBreak;
      shadow.style.wordWrap = computed.wordWrap;
      shadow.style.boxSizing = computed.boxSizing;
      shadow.style.padding = computed.padding || '0';
      shadow.style.border = 'none';

      let val = el.value || '';
      if (val.endsWith('\n')) {
        val += ' ';
      }
      shadow.value = val;

      const targetHeight = Math.max(shadow.scrollHeight, 46);
      const newHeightStr = `${targetHeight}px`;
      if (el.style.height !== newHeightStr) {
        el.style.height = newHeightStr;
      }
    } else {
      el.style.height = `${Math.max(el.scrollHeight, 46)}px`;
    }
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

  // 체크리스트 항목 체크/해제 토글 (완료된 항목은 아래로 자동 이동)
  const handleToggleChecklistItem = (blockId, itemId) => {
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const updated = (b.items || []).map((it) =>
        it.id === itemId ? { ...it, completed: !it.completed } : it
      );
      const uncompleted = updated.filter((it) => !it.completed);
      const completed = updated.filter((it) => it.completed);
      return {
        ...b,
        items: [...uncompleted, ...completed]
      };
    });
    if (onChangeAndSave) onChangeAndSave(next);
  };

  // 체크리스트 개별 항목 3점 메뉴 열기
  const handleOpenItemMenu = (e, itemId) => {
    e.stopPropagation();
    if (openItemMenuId === itemId) {
      setOpenItemMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 150;
      const wouldOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = wouldOverflowBottom ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4;
      const right = Math.max(10, window.innerWidth - rect.right);
      setOpenItemMenuPos({ top, right });
      setOpenItemMenuId(itemId);
    }
  };

  const handleCloseItemMenu = () => {
    setOpenItemMenuId(null);
  };

  // 체크리스트 개별 항목 수정 시작
  const handleStartEditChecklistItem = (item) => {
    setEditingItemId(item.id);
    setOpenItemMenuId(null);
  };

  // 체크리스트 개별 항목 수정 저장
  const handleSaveEditChecklistItem = (blockId, itemId, newText) => {
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        items: (b.items || []).map((it) => (it.id === itemId ? { ...it, text: newText } : it))
      };
    });
    if (onChangeAndSave) onChangeAndSave(next);
    setEditingItemId(null);
  };

  // 체크리스트 개별 항목 수정 취소
  const handleCancelEditChecklistItem = (blockId, item) => {
    // 텍스트가 빈 상태로 방금 추가된 항목인 경우 자동 제거
    if (!item.text || !item.text.trim()) {
      const targetBlock = blocks.find((b) => b.id === blockId);
      if (targetBlock && targetBlock.items && targetBlock.items.length > 1) {
        const next = blocks.map((b) => {
          if (b.id !== blockId) return b;
          return {
            ...b,
            items: (b.items || []).filter((it) => it.id !== item.id)
          };
        });
        if (onChangeAndSave) onChangeAndSave(next);
      }
    }
    setEditingItemId(null);
  };

  // 체크리스트 개별 항목 복사
  const handleCopyChecklistItem = (blockId, item) => {
    setOpenItemMenuId(null);
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: item.text || '',
      completed: false
    };
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const currentItems = [...(b.items || [])];
      const idx = currentItems.findIndex((it) => it.id === item.id);
      if (idx !== -1) {
        currentItems.splice(idx + 1, 0, newItem);
      } else {
        currentItems.push(newItem);
      }
      return { ...b, items: currentItems };
    });
    if (onChangeAndSave) onChangeAndSave(next);
  };

  // 실제 체크리스트 항목 삭제 실행
  const executeDeleteChecklistItem = (blockId, itemId) => {
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const filtered = (b.items || []).filter((it) => it.id !== itemId);
      return {
        ...b,
        items: filtered.length > 0 ? filtered : [{ id: `item_${Date.now()}`, text: '', completed: false }]
      };
    });
    if (onChangeAndSave) onChangeAndSave(next);
    if (editingItemId === itemId) setEditingItemId(null);
  };

  // 체크리스트 항목 삭제 (모달 연동)
  const handleDeleteChecklistItem = (blockId, itemId) => {
    setOpenItemMenuId(null);
    const targetBlock = blocks.find((b) => b.id === blockId);
    const targetItem = targetBlock?.items?.find((it) => it.id === itemId);

    if (!targetItem?.text?.trim()) {
      executeDeleteChecklistItem(blockId, itemId);
      return;
    }

    if (openDeleteModal) {
      const text = targetItem.text.trim();
      const preview = text.length > 30 ? text.slice(0, 30) + '...' : text;
      openDeleteModal(
        '체크 항목 삭제',
        `'${preview}' 항목을 정말 삭제하시겠습니까?`,
        () => executeDeleteChecklistItem(blockId, itemId)
      );
    } else {
      executeDeleteChecklistItem(blockId, itemId);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleItemDragStart = (e, blockId, itemId) => {
    e.stopPropagation();
    setDraggedItemKey({ blockId, itemId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragOver = (e, blockId, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItemKey?.blockId === blockId && draggedItemKey?.itemId !== itemId) {
      setDragOverItemKey({ blockId, itemId });
    }
  };

  const handleItemDrop = (e, blockId, targetItemId) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !draggedItemKey ||
      draggedItemKey.blockId !== blockId ||
      draggedItemKey.itemId === targetItemId
    ) {
      setDraggedItemKey(null);
      setDragOverItemKey(null);
      return;
    }

    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const items = [...(b.items || [])];
      const fromIdx = items.findIndex((it) => it.id === draggedItemKey.itemId);
      const toIdx = items.findIndex((it) => it.id === targetItemId);
      if (fromIdx === -1 || toIdx === -1) return b;

      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      return { ...b, items };
    });

    if (onChangeAndSave) onChangeAndSave(next);
    setDraggedItemKey(null);
    setDragOverItemKey(null);
  };

  const handleItemDragEnd = () => {
    setDraggedItemKey(null);
    setDragOverItemKey(null);
  };

  // 체크리스트 항목 추가 (하단 [+ 항목 추가] 버튼 클릭 시, 미완료 목록의 끝에 추가)
  const handleAddChecklistItem = (blockId) => {
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: '',
      completed: false
    };
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const currentItems = b.items || [];
      const uncompleted = currentItems.filter((it) => !it.completed);
      const completed = currentItems.filter((it) => it.completed);
      return {
        ...b,
        items: [...uncompleted, newItem, ...completed]
      };
    });
    if (onChangeAndSave) onChangeAndSave(next);
    setEditingItemId(newItem.id);
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

  // 가장 위로 이동
  const handleMoveToTop = (index) => {
    if (index <= 0) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    if (onChangeAndSave) {
      onChangeAndSave(next);
    }
  };

  // 가장 아래로 이동
  const handleMoveToBottom = (index) => {
    if (index >= blocks.length - 1) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.push(moved);
    if (onChangeAndSave) {
      onChangeAndSave(next);
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
      if (targetBlock.type === 'checklist') {
        const titleText = targetBlock.title && targetBlock.title.trim();
        const name = titleText ? `'${titleText}' 체크` : '체크 블록';
        openDeleteModal(
          '체크 블록 삭제',
          `${name}을(를) 정말 삭제하시겠습니까?`,
          () => executeDelete(index)
        );
      } else {
        const titleText = targetBlock.title && targetBlock.title.trim();
        const contentText = targetBlock.content && targetBlock.content.trim();
        let message = '';

        if (titleText) {
          message = `'${titleText}' 텍스트를 정말 삭제하시겠습니까?`;
        } else if (contentText) {
          const preview = contentText.length > 30 ? contentText.slice(0, 30) + '...' : contentText;
          message = `'${preview}' 텍스트를 정말 삭제하시겠습니까?`;
        } else {
          message = '비어 있는 텍스트를 삭제하시겠습니까?';
        }

        openDeleteModal(
          '텍스트 삭제',
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

  const activeMenuBlockIdx = blocks.findIndex((b) => b.id === openBlockMenuId);
  const activeMenuBlock = activeMenuBlockIdx !== -1 ? blocks[activeMenuBlockIdx] : null;

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
        if (block.type === 'checklist') {
          const isEditingTitle = editingChecklistTitleId === block.id;
          const items = Array.isArray(block.items) && block.items.length > 0
            ? block.items
            : [{ id: `item_${Date.now()}_0`, text: '', completed: false }];
          const isFirstBlock = idx === 0;
          const isLastBlock = idx === blocks.length - 1;
          const isCollapsed = Boolean(collapsedBlockIds[block.id]);

          return (
            <div
              key={block.id || `checklist_${idx}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #72A884',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {/* 체크리스트 그룹 헤더 바 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  backgroundColor: '#A8D5B8',
                  borderBottom: isCollapsed ? 'none' : '1px solid #6B9E7D',
                  cursor: isEditingTitle ? 'default' : 'pointer',
                  userSelect: 'none',
                  position: 'sticky',
                  top: 0,
                  zIndex: 5,
                  flexShrink: 0
                }}
                onClick={() => {
                  if (!isEditingTitle) {
                    toggleBlockCollapse(block.id);
                  }
                }}
              >
                {/* 좌측: 토글 화살표 + 폴더 아이콘 + 그룹명 */}
                {isEditingTitle ? (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, marginRight: '8px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Folder size={14} color="#065F46" style={{ flexShrink: 0 }} />
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
                        color: '#052E16',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #065F46',
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
                        backgroundColor: '#065F46',
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
                      gap: '6px',
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    <span
                      style={{ display: 'flex', alignItems: 'center', color: '#065F46' }}
                      title={isCollapsed ? '펼치기' : '접기'}
                    >
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </span>
                    <Folder size={14} color="#065F46" style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#052E16',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingChecklistTitleId(block.id);
                        setDraftChecklistTitle(block.title || '');
                      }}
                      title="더블클릭하여 이름 수정"
                    >
                      {block.title && block.title.trim() ? block.title : '체크리스트'}
                    </span>
                    {isCollapsed && (
                      <span style={{ fontSize: '11px', color: '#065F46', fontWeight: 600 }}>
                        (접힘)
                      </span>
                    )}
                  </div>
                )}

                {/* 우측: 위치이동 화살표 2단 세트 & 3점 메뉴 */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 위치이동 버튼 세트 (좌: 가장 위/아래, 우: 한칸 위/아래) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="no-print">
                    {/* 가장 위 / 가장 아래 이동 (좌측) */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '26px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToTop(idx);
                        }}
                        disabled={isFirstBlock}
                        onMouseEnter={(e) => { if (!isFirstBlock) e.currentTarget.style.color = '#2563EB'; }}
                        onMouseLeave={(e) => { if (!isFirstBlock) e.currentTarget.style.color = '#64748B'; }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '13px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstBlock ? '#CBD5E1' : '#64748B',
                          cursor: isFirstBlock ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="가장 위로 이동"
                      >
                        <ChevronsUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToBottom(idx);
                        }}
                        disabled={isLastBlock}
                        onMouseEnter={(e) => { if (!isLastBlock) e.currentTarget.style.color = '#065F46'; }}
                        onMouseLeave={(e) => { if (!isLastBlock) e.currentTarget.style.color = '#64748B'; }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '13px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastBlock ? '#CBD5E1' : '#64748B',
                          cursor: isLastBlock ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="가장 아래로 이동"
                      >
                        <ChevronsDown size={13} />
                      </button>
                    </div>

                    {/* 한 칸 위 / 아래로 이동 (우측) */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '26px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(idx);
                        }}
                        disabled={isFirstBlock}
                        onMouseEnter={(e) => { if (!isFirstBlock) e.currentTarget.style.color = '#065F46'; }}
                        onMouseLeave={(e) => { if (!isFirstBlock) e.currentTarget.style.color = '#64748B'; }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '13px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstBlock ? '#CBD5E1' : '#64748B',
                          cursor: isFirstBlock ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="위로 이동"
                      >
                        <Triangle size={9} fill="currentColor" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(idx);
                        }}
                        disabled={isLastBlock}
                        onMouseEnter={(e) => { if (!isLastBlock) e.currentTarget.style.color = '#065F46'; }}
                        onMouseLeave={(e) => { if (!isLastBlock) e.currentTarget.style.color = '#64748B'; }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '13px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastBlock ? '#CBD5E1' : '#64748B',
                          cursor: isLastBlock ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="아래로 이동"
                      >
                        <Triangle size={9} fill="currentColor" style={{ transform: 'rotate(180deg)' }} />
                      </button>
                    </div>
                  </div>

                  {/* 3점 메뉴 (가장 우측) */}
                  <div style={{ position: 'relative', flexShrink: 0 }} className="no-print" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenBlockMenu(e, block.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: openBlockMenuId === block.id ? '#99D0AA' : 'transparent',
                        color: openBlockMenuId === block.id ? '#052E16' : '#64748B',
                        cursor: 'pointer'
                      }}
                      title="메뉴"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 체크리스트 본문 */}
              {!isCollapsed && (
                <div
                  style={{
                    padding: '4px 6px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  {items.map((item, itemIdx) => (
                    <DetailChecklistItemRow
                      key={item.id || `item_${itemIdx}`}
                      blockId={block.id}
                      item={item}
                      itemIdx={itemIdx}
                      items={items}
                      isEditing={editingItemId === item.id}
                      onStartEdit={handleStartEditChecklistItem}
                      onSaveEdit={handleSaveEditChecklistItem}
                      onCancelEdit={handleCancelEditChecklistItem}
                      onToggle={handleToggleChecklistItem}
                      onCopy={handleCopyChecklistItem}
                      onDelete={handleDeleteChecklistItem}
                      openItemMenuId={openItemMenuId}
                      openItemMenuPos={openItemMenuPos}
                      onOpenItemMenu={handleOpenItemMenu}
                      onCloseItemMenu={handleCloseItemMenu}
                      isDragged={draggedItemKey?.blockId === block.id && draggedItemKey?.itemId === item.id}
                      isDragOver={dragOverItemKey?.blockId === block.id && dragOverItemKey?.itemId === item.id}
                      onDragStart={handleItemDragStart}
                      onDragOver={handleItemDragOver}
                      onDrop={handleItemDrop}
                      onDragEnd={handleItemDragEnd}
                    />
                  ))}

                  {/* 새 체크 항목 추가 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleAddChecklistItem(block.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 10px',
                      marginTop: '2px',
                      borderRadius: '6px',
                      border: '1px dashed #A7F3D0',
                      backgroundColor: '#F0FDF4',
                      color: '#065F46',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#DCFCE7';
                      e.currentTarget.style.borderColor = '#6EE7B7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#F0FDF4';
                      e.currentTarget.style.borderColor = '#A7F3D0';
                    }}
                    title="새 체크 항목 추가"
                  >
                    <Plus size={14} />
                    <span>체크 항목 추가</span>
                  </button>
                </div>
              )}
          </div>
        );
        }

        const isEditingThisBlock = editingBlockId === block.id;
        const isFirstBlock = idx === 0;
        const isLastBlock = idx === blocks.length - 1;
        const isCollapsed = Boolean(collapsedBlockIds[block.id]);

        return (
          <div
            key={block.id || `text_${idx}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: isEditingThisBlock ? '#FFFFFF' : '#F8FAFC',
              borderRadius: '8px',
              border: isEditingThisBlock ? '1.5px solid #3B82F6' : '1px solid #CBD5E1',
              boxShadow: isEditingThisBlock
                ? '0 0 0 2px rgba(59, 130, 246, 0.15)'
                : '0 1px 3px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              flexShrink: 0,
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            {/* 카드 상단 헤더 바 (체크 그룹헤더와 동일한 구조/기능): Sticky 상시 고정 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: isEditingThisBlock ? '#EFF6FF' : '#EEF2F6',
                borderBottom: isCollapsed && !isEditingThisBlock ? 'none' : (isEditingThisBlock ? '1px solid #DBEAFE' : '1px solid #CBD5E1'),
                cursor: isEditingThisBlock ? 'default' : 'pointer',
                userSelect: 'none',
                position: 'sticky',
                top: 0,
                zIndex: 5,
                flexShrink: 0
              }}
              onClick={() => {
                if (!isEditingThisBlock) {
                  toggleBlockCollapse(block.id);
                }
              }}
            >
              {/* 좌측: 토글 화살표 + 아이콘 + 텍스트 이름 */}
              {isEditingThisBlock ? (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, marginRight: '8px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Type size={14} color="#2563EB" style={{ flexShrink: 0 }} />
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
                    placeholder="텍스트 이름 입력... (예: 계약조건, 전달사항)"
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#1E293B',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #2563EB',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      minWidth: 0
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveBlock(block.id)}
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
                    onClick={handleCancelEdit}
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
                    gap: '6px',
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <span
                    style={{ display: 'flex', alignItems: 'center', color: '#64748B' }}
                    title={isCollapsed ? '펼치기' : '접기'}
                  >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </span>
                  <Type size={14} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: block.title && block.title.trim() ? '#1E293B' : '#94A3B8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setCollapsedBlockIds((prev) => ({ ...prev, [block.id]: false }));
                      handleStartEdit(block);
                    }}
                    title="더블클릭하여 이름 및 내용 수정"
                  >
                    {block.title && block.title.trim() ? block.title : '텍스트'}
                  </span>
                  {isCollapsed && (
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                      (접힘)
                    </span>
                  )}
                </div>
              )}

              {/* 우측: 위치이동 화살표 2단 세트 & 3점 메뉴 (수정 중이 아닐 때) */}
              {!isEditingThisBlock && (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 위치이동 버튼 세트 (좌: 가장 위/아래, 우: 한칸 위/아래) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="no-print">
                    {/* 가장 위 / 가장 아래 이동 (좌측) */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '26px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToTop(idx);
                        }}
                        disabled={isFirstBlock}
                        onMouseEnter={(e) => { if (!isFirstBlock) e.currentTarget.style.color = '#2563EB'; }}
                        onMouseLeave={(e) => { if (!isFirstBlock) e.currentTarget.style.color = '#64748B'; }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '13px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstBlock ? '#CBD5E1' : '#64748B',
                          cursor: isFirstBlock ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="가장 위로 이동"
                      >
                        <ChevronsUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToBottom(idx);
                        }}
                        disabled={isLastBlock}
                        onMouseEnter={(e) => { if (!isLastBlock) e.currentTarget.style.color = '#2563EB'; }}
                        onMouseLeave={(e) => { if (!isLastBlock) e.currentTarget.style.color = '#64748B'; }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '13px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastBlock ? '#CBD5E1' : '#64748B',
                          cursor: isLastBlock ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="가장 아래로 이동"
                      >
                        <ChevronsDown size={13} />
                      </button>
                    </div>

                    {/* 한 칸 위 / 아래로 이동 (우측) */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '26px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(idx);
                        }}
                        disabled={isFirstBlock}
                        onMouseEnter={(e) => { if (!isFirstBlock) e.currentTarget.style.color = '#2563EB'; }}
                        onMouseLeave={(e) => { if (!isFirstBlock) e.currentTarget.style.color = '#64748B'; }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '13px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstBlock ? '#CBD5E1' : '#64748B',
                          cursor: isFirstBlock ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="위로 이동"
                      >
                        <Triangle size={9} fill="currentColor" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(idx);
                        }}
                        disabled={isLastBlock}
                        onMouseEnter={(e) => { if (!isLastBlock) e.currentTarget.style.color = '#2563EB'; }}
                        onMouseLeave={(e) => { if (!isLastBlock) e.currentTarget.style.color = '#64748B'; }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '13px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastBlock ? '#CBD5E1' : '#64748B',
                          cursor: isLastBlock ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="아래로 이동"
                      >
                        <Triangle size={9} fill="currentColor" style={{ transform: 'rotate(180deg)' }} />
                      </button>
                    </div>
                  </div>

                  {/* 3점 메뉴 (추가 버튼 없음: 수정, 삭제, 취소) */}
                  <div style={{ position: 'relative', flexShrink: 0 }} className="no-print" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenBlockMenu(e, block.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: openBlockMenuId === block.id ? '#E2E8F0' : 'transparent',
                        color: openBlockMenuId === block.id ? '#2563EB' : '#64748B',
                        cursor: 'pointer'
                      }}
                      title="메뉴"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 카드 본문: 접혀있지 않거나 편집 중일 때만 렌더링 */}
            {(!isCollapsed || isEditingThisBlock) && (
              isEditingThisBlock ? (
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
                      display: 'block',
                      overflow: 'hidden'
                    }}
                  />
                </div>
              ) : (
                <div
                  onDoubleClick={() => {
                    setCollapsedBlockIds((prev) => ({ ...prev, [block.id]: false }));
                    handleStartEdit(block);
                  }}
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
                      (비어 있는 텍스트입니다. 메뉴의 [수정]을 누르거나 본문을 더블클릭하여 내용을 입력하세요)
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        );
      })}

      {/* 블록 3점 메뉴 (Stacking Context 및 z-index 잘림 방지를 위해 document.body에 Portal 렌더링) */}
      {openBlockMenuId && openBlockMenuPos && activeMenuBlock && typeof document !== 'undefined' && createPortal(
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99998,
              backgroundColor: 'transparent'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpenBlockMenuId(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #CBD5E1',
              padding: '4px',
              zIndex: 99999,
              minWidth: '115px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              whiteSpace: 'nowrap',
              top: openBlockMenuPos.top,
              right: openBlockMenuPos.right
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeMenuBlock.type === 'checklist' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpenBlockMenuId(null);
                    handleAddChecklistItem(activeMenuBlock.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#334155',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Plus size={14} color="#065F46" />
                  <span>추가</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenBlockMenuId(null);
                    setEditingChecklistTitleId(activeMenuBlock.id);
                    setDraftChecklistTitle(activeMenuBlock.title || '');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#334155',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Edit2 size={14} color="#475569" />
                  <span>수정</span>
                </button>
                {onOpenMoveModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenBlockMenuId(null);
                      onOpenMoveModal(activeMenuBlock);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '7px 12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#2563EB',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FolderInput size={14} color="#2563EB" />
                    <span>소속 이동</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpenBlockMenuId(null);
                    handleDelete(activeMenuBlockIdx);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#DC2626',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={14} color="#DC2626" />
                  <span>삭제</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenBlockMenuId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#64748B',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X size={14} color="#64748B" />
                  <span>취소</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpenBlockMenuId(null);
                    setCollapsedBlockIds((prev) => ({ ...prev, [activeMenuBlock.id]: false }));
                    handleStartEdit(activeMenuBlock);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#334155',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Edit2 size={14} color="#475569" />
                  <span>수정</span>
                </button>
                {onOpenMoveModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenBlockMenuId(null);
                      onOpenMoveModal(activeMenuBlock);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '7px 12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#2563EB',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FolderInput size={14} color="#2563EB" />
                    <span>소속 이동</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpenBlockMenuId(null);
                    handleDelete(activeMenuBlockIdx);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#DC2626',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={14} color="#DC2626" />
                  <span>삭제</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenBlockMenuId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#64748B',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X size={14} color="#64748B" />
                  <span>취소</span>
                </button>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
