import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  Plus,
  Trash2,
  GripVertical,
  Save,
  CheckSquare,
  Layout,
  Type
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { styles } from './notebookStyles';
import { autoFormatPhoneNumber } from './notebookConstants';

function TemplateCanvas({
  isMobile,
  selectedTemplateIdInTab,
  setSelectedTemplateIdInTab,
  templates = [],
  handleDeleteTemplateInTab,
  db,
  setShowSavedToast
}) {
  const [tplDraftTitle, setTplDraftTitle] = useState('');
  const [tplDraftFields, setTplDraftFields] = useState([]);
  const [tplDraftChecklists, setTplDraftChecklists] = useState([]);
  const [selectedTplFieldIds, setSelectedTplFieldIds] = useState([]);
  const [isSavingTpl, setIsSavingTpl] = useState(false);
  const [showTplBulkChecklistInput, setShowTplBulkChecklistInput] = useState(false);
  const [tplBulkChecklistText, setTplBulkChecklistText] = useState('');
  const [draggedFieldItem, setDraggedFieldItem] = useState(null);
  const [dragOverFieldItem, setDragOverFieldItem] = useState(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null);
  const [draggedChecklistIndex, setDraggedChecklistIndex] = useState(null);
  const [dragOverChecklistIndex, setDragOverChecklistIndex] = useState(null);
  const toastTimerRef = useRef(null);

  // Sync draft state when selectedTemplateIdInTab changes
  useEffect(() => {
    if (selectedTemplateIdInTab === 'NEW') {
      setTplDraftTitle('');
      setTplDraftFields([
        { id: `field_${Date.now()}_1`, type: 'text', label: '항목 1', placeholder: '내용을 입력하세요' }
      ]);
      setTplDraftChecklists([]);
    } else if (selectedTemplateIdInTab) {
      const tpl = templates.find(t => t.id === selectedTemplateIdInTab);
      if (tpl) {
        setTplDraftTitle(tpl.title || '');
        setTplDraftFields(tpl.fields ? JSON.parse(JSON.stringify(tpl.fields)) : []);
        setTplDraftChecklists(tpl.checklists ? JSON.parse(JSON.stringify(tpl.checklists)) : []);
      }
    }
  }, [selectedTemplateIdInTab]);

  const handleAddTplFieldInCanvas = (type, targetGroupTitle = '') => {
    const newId = `field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let defaultLabel = '새 항목';
    let defaultPlaceholder = '';
    let extraProps = {};

    if (type === 'text') {
      defaultLabel = '텍스트 항목';
      defaultPlaceholder = '내용을 입력하세요';
    } else if (type === 'phone') {
      defaultLabel = '전화번호';
      defaultPlaceholder = '010-0000-0000';
    } else if (type === 'datetime') {
      defaultLabel = '날짜 및 시간';
      defaultPlaceholder = '';
    } else if (type === 'checklist') {
      defaultLabel = '체크리스트';
      extraProps = { defaultItems: ['항목 1', '항목 2'] };
    }

    setTplDraftFields((prev) => [
      ...prev,
      { id: newId, type, label: defaultLabel, placeholder: defaultPlaceholder, groupTitle: targetGroupTitle, ...extraProps }
    ]);
  };

  const handleRemoveTplFieldInCanvas = (index) => {
    setTplDraftFields((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleMoveTplFieldInCanvas = (index, direction) => {
    setTplDraftFields((prev) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      const target = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = target;
      return updated;
    });
  };

  // Block Move Handlers (Whole Groups & Standalone Items)
  const handleMoveBlockInCanvas = (blockIdx, direction) => {
    const blocks = getCanvasBlocks(tplDraftFields);
    const newIdx = blockIdx + direction;
    if (newIdx < 0 || newIdx >= blocks.length) return;

    const [moved] = blocks.splice(blockIdx, 1);
    blocks.splice(newIdx, 0, moved);

    const flattened = [];
    blocks.forEach((blk) => {
      blk.fields.forEach((f) => {
        const { originalIdx, ...rest } = f;
        flattened.push(rest);
      });
    });
    setTplDraftFields(flattened);
  };

  const handleMoveFieldWithinGroup = (groupTitle, fromIdxInGroup, direction) => {
    const toIdxInGroup = fromIdxInGroup + direction;
    setTplDraftFields((prev) => {
      const groupIndices = [];
      prev.forEach((f, idx) => {
        if ((f.groupTitle || '') === (groupTitle || '')) {
          groupIndices.push(idx);
        }
      });

      if (toIdxInGroup < 0 || toIdxInGroup >= groupIndices.length) return prev;

      const actualFrom = groupIndices[fromIdxInGroup];
      const actualTo = groupIndices[toIdxInGroup];

      const updated = [...prev];
      const [moved] = updated.splice(actualFrom, 1);
      updated.splice(actualTo, 0, moved);
      return updated;
    });
  };

  // HTML5 Drag and Drop Handlers for Canvas Blocks (Groups & Standalone)
  const handleBlockDragStart = (e, blockIdx) => {
    e.stopPropagation();
    setDraggedBlockIndex(blockIdx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `block_${blockIdx}`);
  };

  const handleBlockDragOver = (e, blockIdx) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedBlockIndex !== null && dragOverBlockIndex !== blockIdx) {
      setDragOverBlockIndex(blockIdx);
    }
  };

  const handleBlockDrop = (e, targetBlockIdx) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedBlockIndex === null || draggedBlockIndex === targetBlockIdx) {
      setDraggedBlockIndex(null);
      setDragOverBlockIndex(null);
      return;
    }

    const blocks = getCanvasBlocks(tplDraftFields);
    const [movedBlock] = blocks.splice(draggedBlockIndex, 1);
    blocks.splice(targetBlockIdx, 0, movedBlock);

    const flattened = [];
    blocks.forEach((blk) => {
      blk.fields.forEach((f) => {
        const { originalIdx, ...rest } = f;
        flattened.push(rest);
      });
    });

    setTplDraftFields(flattened);
    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  // HTML5 Drag and Drop Handlers for Intra-Group Field Reordering
  const handleIntraGroupDragStart = (e, groupTitle, indexInGroup) => {
    e.stopPropagation();
    setDraggedFieldItem({ groupTitle, indexInGroup });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `item_${groupTitle}_${indexInGroup}`);
  };

  const handleIntraGroupDragOver = (e, groupTitle, indexInGroup) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFieldItem && draggedFieldItem.groupTitle === groupTitle) {
      e.dataTransfer.dropEffect = 'move';
      if (
        !dragOverFieldItem ||
        dragOverFieldItem.groupTitle !== groupTitle ||
        dragOverFieldItem.indexInGroup !== indexInGroup
      ) {
        setDragOverFieldItem({ groupTitle, indexInGroup });
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleIntraGroupDrop = (e, groupTitle, targetIndexInGroup) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedFieldItem || draggedFieldItem.groupTitle !== groupTitle) {
      setDraggedFieldItem(null);
      setDragOverFieldItem(null);
      return;
    }

    const fromIdxInGroup = draggedFieldItem.indexInGroup;
    if (fromIdxInGroup === targetIndexInGroup) {
      setDraggedFieldItem(null);
      setDragOverFieldItem(null);
      return;
    }

    setTplDraftFields((prev) => {
      const groupIndices = [];
      prev.forEach((f, idx) => {
        if ((f.groupTitle || '') === (groupTitle || '')) {
          groupIndices.push(idx);
        }
      });

      const actualFrom = groupIndices[fromIdxInGroup];
      const actualTo = groupIndices[targetIndexInGroup];

      if (actualFrom === undefined || actualTo === undefined) return prev;

      const updated = [...prev];
      const [movedItem] = updated.splice(actualFrom, 1);
      updated.splice(actualTo, 0, movedItem);
      return updated;
    });

    setDraggedFieldItem(null);
    setDragOverFieldItem(null);
  };

  // HTML5 Drag and Drop Handlers for Template Checklists
  const handleChecklistDragStart = (e, index) => {
    setDraggedChecklistIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleChecklistDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverChecklistIndex !== index) {
      setDragOverChecklistIndex(index);
    }
  };

  const handleChecklistDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedChecklistIndex === null || draggedChecklistIndex === targetIndex) {
      setDraggedChecklistIndex(null);
      setDragOverChecklistIndex(null);
      return;
    }

    setTplDraftChecklists((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedChecklistIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      return updated;
    });

    setDraggedChecklistIndex(null);
    setDragOverChecklistIndex(null);
  };

  // Field Grouping Handlers
  const handleToggleSelectField = (fieldId) => {
    setSelectedTplFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleGroupSelectedFields = () => {
    if (selectedTplFieldIds.length === 0) {
      alert('그룹화할 요소를 먼저 1개 이상 선택해 주세요.');
      return;
    }
    const name = prompt('그룹 이름을 입력해 주세요 (예: 기본 정보, 계약 상세):', '신규 그룹');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();

    setTplDraftFields((prev) =>
      prev.map((f) => (selectedTplFieldIds.includes(f.id) ? { ...f, groupTitle: trimmed } : f))
    );
    setSelectedTplFieldIds([]);
  };

  const handleUngroupSelectedFields = () => {
    if (selectedTplFieldIds.length === 0) return;
    setTplDraftFields((prev) =>
      prev.map((f) => (selectedTplFieldIds.includes(f.id) ? { ...f, groupTitle: '' } : f))
    );
    setSelectedTplFieldIds([]);
  };

  // Template Checklist Handlers
  const handleAddTplChecklistInCanvas = () => {
    setTplDraftChecklists((prev) => [
      ...prev,
      { id: `tplchk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, text: '' }
    ]);
  };

  const handleRemoveTplChecklistInCanvas = (index) => {
    setTplDraftChecklists((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleMoveTplChecklistInCanvas = (index, direction) => {
    setTplDraftChecklists((prev) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      const target = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = target;
      return updated;
    });
  };

  const handleUpdateTplChecklistInCanvas = (index, key, value) => {
    setTplDraftChecklists((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleSaveTemplateFromCanvas = async () => {
    if (!tplDraftTitle.trim()) {
      alert('템플릿 이름을 입력해 주세요.');
      return;
    }
    if (tplDraftFields.length === 0 && tplDraftChecklists.length === 0) {
      alert('상세내용 요소 또는 체크리스트 항목을 최소 1개 이상 등록해 주세요.');
      return;
    }

    setIsSavingTpl(true);
    try {
      const docId = (selectedTemplateIdInTab && selectedTemplateIdInTab !== 'NEW')
        ? selectedTemplateIdInTab
        : `tpl_${Date.now()}`;

      const cleanFields = tplDraftFields.map((f) => ({
        id: f.id || `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: f.type || 'text',
        label: f.label || '항목',
        placeholder: f.placeholder || '',
        defaultItems: Array.isArray(f.defaultItems) ? f.defaultItems : [],
        groupTitle: f.groupTitle || ''
      }));

      const cleanChecklists = tplDraftChecklists.map((c) => ({
        id: c.id || `tplchk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: c.text || ''
      }));

      const tplData = {
        id: docId,
        title: tplDraftTitle.trim(),
        fields: cleanFields,
        checklists: cleanChecklists,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'templates', docId), tplData);
      setSelectedTemplateIdInTab(docId);
      setShowSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowSavedToast(false), 1800);
    } catch (err) {
      console.error('템플릿 저장 오류:', err);
      alert('템플릿 저장에 실패했습니다.');
    } finally {
      setIsSavingTpl(false);
    }
  };


    return (
                <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#FFFFFF', overflowY: 'auto' }}>
                  {/* Canvas Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #F1F5F9', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
                      <Layout size={24} color="#2563EB" />
                      <input
                        type="text"
                        value={tplDraftTitle}
                        onChange={(e) => setTplDraftTitle(e.target.value)}
                        placeholder="템플릿 이름 (예: 고객 미팅 양식, 주간 업무 보고)"
                        style={{ fontSize: '20px', fontWeight: 700, border: 'none', borderBottom: '2px solid #3B82F6', outline: 'none', padding: '4px 8px', flex: 1, color: '#0F172A' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedTemplateIdInTab && selectedTemplateIdInTab !== 'NEW' && (
                        <button
                          onClick={() => handleDeleteTemplateInTab(selectedTemplateIdInTab)}
                          style={{ ...styles.btnSecondary, color: '#EF4444', borderColor: '#FCA5A5' }}
                        >
                          <Trash2 size={15} /> 템플릿 삭제
                        </button>
                      )}
                      <button
                        onClick={handleSaveTemplateFromCanvas}
                        disabled={isSavingTpl}
                        style={styles.btnPrimary}
                      >
                        <Save size={16} />
                        {isSavingTpl ? '저장 중...' : '템플릿 저장'}
                      </button>
                    </div>
                  </div>

                  {/* Canvas Main 2-Pane Split Area (Left: Detailed Content Editor / Right: Checklist Pre-set Editor) */}
                  <div style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden', minHeight: 0, flexDirection: isMobile ? 'column' : 'row' }}>
                    {/* Left Pane: Detailed Content Editor */}
                    <div style={{ flex: 1, minWidth: isMobile ? '100%' : '0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Type size={16} color="#2563EB" /> 1. 상세내용 구성 ({tplDraftFields.length})
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleAddTplFieldInCanvas('text')} style={{ ...styles.toolBtn, borderColor: '#1E293B', color: '#1E293B', padding: '4px 8px', fontSize: '11px' }}>
                            📝 텍스트
                          </button>
                          <button onClick={() => handleAddTplFieldInCanvas('phone')} style={{ ...styles.toolBtn, borderColor: '#EC4899', color: '#EC4899', padding: '4px 8px', fontSize: '11px' }}>
                            📞 전화번호
                          </button>
                          <button onClick={() => handleAddTplFieldInCanvas('datetime')} style={{ ...styles.toolBtn, borderColor: '#10B981', color: '#10B981', padding: '4px 8px', fontSize: '11px' }}>
                            📅 날짜/시간
                          </button>
                          <button onClick={() => handleAddTplFieldInCanvas('checklist')} style={{ ...styles.toolBtn, borderColor: '#8B5CF6', color: '#8B5CF6', padding: '4px 8px', fontSize: '11px' }}>
                            ☑️ 인라인 체크
                          </button>
                        </div>
                      </div>

                      {/* Selection & Grouping Action Bar */}
                      {selectedTplFieldIds.length > 0 && (() => {
                        const existingGroupTitles = Array.from(new Set(tplDraftFields.map(f => f.groupTitle).filter(Boolean)));
                        return (
                          <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #60A5FA', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckSquare size={14} color="#2563EB" /> {selectedTplFieldIds.length}개 요소 선택됨
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                onClick={handleGroupSelectedFields}
                                style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Folder size={13} /> 새 그룹 생성
                              </button>

                              {existingGroupTitles.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    const gTitle = e.target.value;
                                    if (!gTitle) return;
                                    setTplDraftFields((prev) =>
                                      prev.map((f) => (selectedTplFieldIds.includes(f.id) ? { ...f, groupTitle: gTitle } : f))
                                    );
                                    setSelectedTplFieldIds([]);
                                  }}
                                  value=""
                                  style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#1E40AF', border: '1px solid #93C5FD', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  <option value="" disabled>📂 기존 그룹으로 이동...</option>
                                  {existingGroupTitles.map(gt => (
                                    <option key={gt} value={gt}>{gt} 그룹으로 편입</option>
                                  ))}
                                </select>
                              )}

                              <button
                                onClick={handleUngroupSelectedFields}
                                style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                그룹 해제
                              </button>
                              <button
                                onClick={() => setSelectedTplFieldIds([])}
                                style={{ padding: '4px 6px', borderRadius: '6px', backgroundColor: 'transparent', color: '#64748B', border: 'none', fontSize: '11px', cursor: 'pointer' }}
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {tplDraftFields.length === 0 ? (
                        <div style={{ padding: '36px 16px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '2px dashed #CBD5E1' }}>
                          <p style={{ fontSize: '14px', color: '#334155', fontWeight: 700, margin: 0 }}>
                            배치된 상세내용 요소가 없습니다.
                          </p>
                          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                            상단 버튼을 눌러 텍스트, 전화번호, 날짜/시간 박스를 추가해보세요.
                          </p>
                        </div>
                      ) : (
                        getCanvasBlocks(tplDraftFields).map((block, blockIdx) => {
                          const isBlockDragged = draggedBlockIndex === blockIdx;
                          const isBlockDragOver = dragOverBlockIndex === blockIdx;

                          if (block.type === 'group') {
                            return (
                              <div
                                key={`block_group_${block.groupTitle}_${blockIdx}`}
                                draggable={true}
                                onDragStart={(e) => handleBlockDragStart(e, blockIdx)}
                                onDragOver={(e) => handleBlockDragOver(e, blockIdx)}
                                onDrop={(e) => handleBlockDrop(e, blockIdx)}
                                onDragEnd={() => {
                                  setDraggedBlockIndex(null);
                                  setDragOverBlockIndex(null);
                                }}
                                style={{
                                  backgroundColor: '#F1F5F9',
                                  border: `2px solid ${isBlockDragOver ? '#2563EB' : '#BFDBFE'}`,
                                  borderRadius: '14px',
                                  padding: '14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  opacity: isBlockDragged ? 0.4 : 1,
                                  boxShadow: isBlockDragOver ? '0 4px 14px rgba(37,99,235,0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {/* Group Header: Drag handle, Group Title, Add inner elements, Group release */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1.5px solid #DBEAFE', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }} title="그룹 전체 드래그하여 순서 변경">
                                      <GripVertical size={18} color="#2563EB" />
                                    </span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                      <Folder size={15} color="#2563EB" />
                                      그룹: <strong>{block.groupTitle}</strong> ({block.fields.length}개 항목)
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', marginRight: '2px' }}>+ 요소 추가:</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTplFieldInCanvas('text', block.groupTitle)}
                                        style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: '#F8FAFC', color: '#1E293B', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        title="이 그룹에 텍스트 요소 추가"
                                      >
                                        📝 텍스트
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTplFieldInCanvas('phone', block.groupTitle)}
                                        style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: '#FDF2F8', color: '#DB2777', border: '1px solid #F472B6', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        title="이 그룹에 전화번호 요소 추가"
                                      >
                                        📞 전화번호
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTplFieldInCanvas('datetime', block.groupTitle)}
                                        style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: '#F0FDF4', color: '#059669', border: '1px solid #34D399', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        title="이 그룹에 날짜/시간 요소 추가"
                                      >
                                        📅 일시
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTplFieldInCanvas('checklist', block.groupTitle)}
                                        style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #A78BFA', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        title="이 그룹에 체크리스트 요소 추가"
                                      >
                                        ☑️ 체크
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => {
                                        setTplDraftFields((prev) =>
                                          prev.map((f) => ((f.groupTitle || '') === block.groupTitle ? { ...f, groupTitle: '' } : f))
                                        );
                                      }}
                                      style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                      title="그룹 해제"
                                    >
                                      그룹 해제
                                    </button>
                                  </div>
                                </div>

                                {/* Group Inner Fields List (Intra-Group Drag & Drop) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {block.fields.map((field, indexInGroup) => {
                                    const originalIdx = field.originalIdx;
                                    const borderColor = field.type === 'phone' ? '#EC4899' : field.type === 'datetime' ? '#10B981' : field.type === 'checklist' ? '#8B5CF6' : '#1E293B';
                                    const bgColor = field.type === 'phone' ? '#FDF2F8' : field.type === 'datetime' ? '#F0FDF4' : field.type === 'checklist' ? '#F5F3FF' : '#FFFFFF';

                                    const isFieldDragged = draggedFieldItem && draggedFieldItem.groupTitle === block.groupTitle && draggedFieldItem.indexInGroup === indexInGroup;
                                    const isFieldDragOver = dragOverFieldItem && dragOverFieldItem.groupTitle === block.groupTitle && dragOverFieldItem.indexInGroup === indexInGroup;

                                    return (
                                      <div
                                        key={field.id}
                                        draggable={true}
                                        onDragStart={(e) => handleIntraGroupDragStart(e, block.groupTitle, indexInGroup)}
                                        onDragOver={(e) => handleIntraGroupDragOver(e, block.groupTitle, indexInGroup)}
                                        onDrop={(e) => handleIntraGroupDrop(e, block.groupTitle, indexInGroup)}
                                        onDragEnd={() => {
                                          setDraggedFieldItem(null);
                                          setDragOverFieldItem(null);
                                        }}
                                        style={{
                                          backgroundColor: bgColor,
                                          border: `1.5px solid ${isFieldDragOver ? '#2563EB' : borderColor}`,
                                          borderRadius: '10px',
                                          padding: '12px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '8px',
                                          opacity: isFieldDragged ? 0.4 : 1,
                                          boxShadow: isFieldDragOver ? '0 3px 10px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px', borderBottom: '1px dashed #E2E8F0', paddingBottom: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }} title="그룹 내에서 순서 변경">
                                              <GripVertical size={15} color="#475569" />
                                            </span>
                                            <input
                                              type="checkbox"
                                              checked={selectedTplFieldIds.includes(field.id)}
                                              onChange={() => handleToggleSelectField(field.id)}
                                              style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#2563EB' }}
                                            />
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: borderColor }}>
                                              #{indexInGroup + 1} {field.type === 'text' ? '📝 텍스트' : field.type === 'phone' ? '📞 전화번호' : field.type === 'datetime' ? '📅 날짜/시간' : '☑️ 체크리스트'}
                                            </span>
                                          </div>
                                          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>🔒 그룹 내 이동</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                                          <div style={{ flex: 1, minWidth: '130px' }}>
                                            <input
                                              type="text"
                                              value={field.label}
                                              onChange={(e) => {
                                                const updated = [...tplDraftFields];
                                                updated[originalIdx].label = e.target.value;
                                                setTplDraftFields(updated);
                                              }}
                                              placeholder="라벨명 입력"
                                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                            />
                                          </div>

                                          {field.type !== 'checklist' && (
                                            <div style={{ flex: 1.2, minWidth: '130px' }}>
                                              <input
                                                type="text"
                                                value={field.placeholder || ''}
                                                onChange={(e) => {
                                                  const updated = [...tplDraftFields];
                                                  const val = field.type === 'phone' ? autoFormatPhoneNumber(e.target.value) : e.target.value;
                                                  updated[originalIdx].placeholder = val;
                                                  setTplDraftFields(updated);
                                                }}
                                                placeholder="초기내용 입력"
                                                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                              />
                                            </div>
                                          )}

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', paddingBottom: '2px', marginLeft: 'auto' }}>
                                            <button onClick={() => handleRemoveTplFieldInCanvas(originalIdx)} style={{ ...styles.iconBtn, padding: '5px' }} title="요소 삭제">
                                              <Trash2 size={14} color="#EF4444" />
                                            </button>
                                          </div>
                                        </div>

                                        {field.type === 'checklist' && (
                                          <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: `1px dashed ${borderColor}` }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: borderColor, marginBottom: '6px' }}>
                                              기본 체크리스트 항목
                                              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 400 }}>
                                                ({(field.defaultItems || []).length}개)
                                              </span>
                                            </label>
                                            <div>
                                              {(field.defaultItems || []).map((subItemText, subIdx) => (
                                                <div key={subIdx} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                                  <input
                                                    type="text"
                                                    value={typeof subItemText === 'object' ? subItemText.text : subItemText}
                                                    onChange={(e) => {
                                                      const updated = [...tplDraftFields];
                                                      if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                                      updated[originalIdx].defaultItems[subIdx] = e.target.value;
                                                      setTplDraftFields(updated);
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        const updated = [...tplDraftFields];
                                                        if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                                        updated[originalIdx].defaultItems.splice(subIdx + 1, 0, '');
                                                        setTplDraftFields(updated);
                                                      }
                                                    }}
                                                    placeholder={`항목 ${subIdx + 1}`}
                                                    style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '12px', backgroundColor: '#FFFFFF' }}
                                                  />
                                                  <button
                                                    onClick={() => {
                                                      const updated = [...tplDraftFields];
                                                      if (updated[originalIdx].defaultItems) {
                                                        updated[originalIdx].defaultItems.splice(subIdx, 1);
                                                      }
                                                      setTplDraftFields(updated);
                                                    }}
                                                    style={styles.iconBtn}
                                                    title="삭제"
                                                  >
                                                    <Trash2 size={13} color="#EF4444" />
                                                  </button>
                                                </div>
                                              ))}
                                              <button
                                                onClick={() => {
                                                  const updated = [...tplDraftFields];
                                                  if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                                  updated[originalIdx].defaultItems.push('');
                                                  setTplDraftFields(updated);
                                                }}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, backgroundColor: '#FFFFFF', fontSize: '11px', cursor: 'pointer', marginTop: '2px', color: borderColor, fontWeight: 600 }}
                                              >
                                                <Plus size={13} /> 항목 추가
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          // Standalone Single Field Block
                          const field = block.fields[0];
                          const originalIdx = field.originalIdx;
                          const borderColor = field.type === 'phone' ? '#EC4899' : field.type === 'datetime' ? '#10B981' : field.type === 'checklist' ? '#8B5CF6' : '#1E293B';
                          const bgColor = field.type === 'phone' ? '#FDF2F8' : field.type === 'datetime' ? '#F0FDF4' : field.type === 'checklist' ? '#F5F3FF' : '#FFFFFF';

                          return (
                            <div
                              key={field.id}
                              draggable={true}
                              onDragStart={(e) => handleBlockDragStart(e, blockIdx)}
                              onDragOver={(e) => handleBlockDragOver(e, blockIdx)}
                              onDrop={(e) => handleBlockDrop(e, blockIdx)}
                              onDragEnd={() => {
                                setDraggedBlockIndex(null);
                                setDragOverBlockIndex(null);
                              }}
                              style={{
                                backgroundColor: bgColor,
                                border: `1.5px solid ${isBlockDragOver ? '#2563EB' : borderColor}`,
                                borderRadius: '12px',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                opacity: isBlockDragged ? 0.4 : 1,
                                boxShadow: isBlockDragOver ? '0 4px 12px rgba(37,99,235,0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px', borderBottom: '1px dashed #E2E8F0', paddingBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }} title="드래그하여 순서 변경">
                                    <GripVertical size={16} color="#64748B" />
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={selectedTplFieldIds.includes(field.id)}
                                    onChange={() => handleToggleSelectField(field.id)}
                                    style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#2563EB' }}
                                  />
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: borderColor }}>
                                    #{originalIdx + 1} {field.type === 'text' ? '📝 텍스트' : field.type === 'phone' ? '📞 전화번호' : field.type === 'datetime' ? '📅 날짜/시간' : '☑️ 체크리스트'}
                                  </span>
                                </div>
                                <span style={{ fontSize: '10px', color: '#94A3B8' }}>체크 후 그룹화</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '140px' }}>
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => {
                                      const updated = [...tplDraftFields];
                                      updated[originalIdx].label = e.target.value;
                                      setTplDraftFields(updated);
                                    }}
                                    placeholder="라벨명 입력"
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                  />
                                </div>

                                {field.type !== 'checklist' && (
                                  <div style={{ flex: 1.2, minWidth: '140px' }}>
                                    <input
                                      type="text"
                                      value={field.placeholder || ''}
                                      onChange={(e) => {
                                        const updated = [...tplDraftFields];
                                        const val = field.type === 'phone' ? autoFormatPhoneNumber(e.target.value) : e.target.value;
                                        updated[originalIdx].placeholder = val;
                                        setTplDraftFields(updated);
                                      }}
                                      placeholder="초기내용 입력"
                                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                    />
                                  </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', paddingBottom: '2px', marginLeft: 'auto' }}>
                                  <button onClick={() => handleRemoveTplFieldInCanvas(originalIdx)} style={{ ...styles.iconBtn, padding: '5px' }} title="요소 삭제">
                                    <Trash2 size={15} color="#EF4444" />
                                  </button>
                                </div>
                              </div>

                              {field.type === 'checklist' && (
                                <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: `1px dashed ${borderColor}` }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: borderColor, marginBottom: '6px' }}>
                                    기본 체크리스트 항목
                                    <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 400 }}>
                                      ({(field.defaultItems || []).length}개)
                                    </span>
                                  </label>
                                  <div>
                                    {(field.defaultItems || []).map((subItemText, subIdx) => (
                                      <div key={subIdx} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                        <input
                                          type="text"
                                          value={typeof subItemText === 'object' ? subItemText.text : subItemText}
                                          onChange={(e) => {
                                            const updated = [...tplDraftFields];
                                            if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                            updated[originalIdx].defaultItems[subIdx] = e.target.value;
                                            setTplDraftFields(updated);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              const updated = [...tplDraftFields];
                                              if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                              updated[originalIdx].defaultItems.splice(subIdx + 1, 0, '');
                                              setTplDraftFields(updated);
                                            }
                                          }}
                                          placeholder={`항목 ${subIdx + 1}`}
                                          style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '12px', backgroundColor: '#FFFFFF' }}
                                        />
                                        <button
                                          onClick={() => {
                                            const updated = [...tplDraftFields];
                                            if (updated[originalIdx].defaultItems) {
                                              updated[originalIdx].defaultItems.splice(subIdx, 1);
                                            }
                                            setTplDraftFields(updated);
                                          }}
                                          style={styles.iconBtn}
                                          title="삭제"
                                        >
                                          <Trash2 size={13} color="#EF4444" />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const updated = [...tplDraftFields];
                                        if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                        updated[originalIdx].defaultItems.push('');
                                        setTplDraftFields(updated);
                                      }}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, backgroundColor: '#FFFFFF', fontSize: '11px', cursor: 'pointer', marginTop: '2px', color: borderColor, fontWeight: 600 }}
                                    >
                                      <Plus size={13} /> 항목 추가
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Right Pane: Checklist Pre-set Editor */}
                    <div style={{ flex: 1, minWidth: isMobile ? '100%' : '0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#F5F3FF', borderRadius: '16px', border: '1px solid #DDD6FE', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #DDD6FE' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#4C1D95', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckSquare size={16} color="#8B5CF6" /> 2. 체크리스트 미리 설정 ({tplDraftChecklists.length})
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setShowTplBulkChecklistInput(!showTplBulkChecklistInput)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: '1px solid #8B5CF6', backgroundColor: showTplBulkChecklistInput ? '#8B5CF6' : '#FFFFFF', color: showTplBulkChecklistInput ? '#FFFFFF' : '#7C3AED', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            title="여러 항목을 줄바꿈하여 한 번에 추가"
                          >
                            📝 줄바꿈 일괄 추가
                          </button>
                          <button
                            onClick={handleAddTplChecklistInCanvas}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #8B5CF6', backgroundColor: '#FFFFFF', color: '#7C3AED', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                          >
                            <Plus size={14} /> 체크 항목 추가
                          </button>
                        </div>
                      </div>

                      {showTplBulkChecklistInput && (
                        <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #8B5CF6', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 8px rgba(124,58,237,0.15)' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#6D28D9' }}>📝 줄바꿈으로 일괄 추가</label>
                          <textarea
                            rows={4}
                            value={tplBulkChecklistText}
                            onChange={(e) => setTplBulkChecklistText(e.target.value)}
                            placeholder={`추가할 체크 항목들을 줄바꿈(Enter)으로 입력해 주세요.\n예:\n1. 현장 점검\n2. 서류 검토\n3. 최종 승인`}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #C4B5FD', fontSize: '12px', lineHeight: '1.4', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setShowTplBulkChecklistInput(false);
                                setTplBulkChecklistText('');
                              }}
                              style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', fontSize: '11px', cursor: 'pointer' }}
                            >
                              취소
                            </button>
                            <button
                              onClick={() => {
                                if (!tplBulkChecklistText.trim()) return;
                                const lines = tplBulkChecklistText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                                if (lines.length > 0) {
                                  const newItems = lines.map((text, i) => ({
                                    id: `tplchk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                                    text
                                  }));
                                  setTplDraftChecklists(prev => [...prev, ...newItems]);
                                }
                                setTplBulkChecklistText('');
                                setShowTplBulkChecklistInput(false);
                              }}
                              style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#7C3AED', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {tplBulkChecklistText.trim() ? `${tplBulkChecklistText.split(/\r?\n/).filter(Boolean).length}개 항목 일괄 추가` : '추가'}
                            </button>
                          </div>
                        </div>
                      )}

                      {tplDraftChecklists.length === 0 ? (
                        <div style={{ padding: '36px 16px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '2px dashed #C4B5FD' }}>
                          <p style={{ fontSize: '14px', color: '#5B21B6', fontWeight: 700, margin: 0 }}>
                            등록된 사전 체크리스트 항목이 없습니다.
                          </p>
                          <p style={{ fontSize: '12px', color: '#7C3AED', marginTop: '6px' }}>
                            상단 <strong>[+ 체크 항목 추가]</strong> 버튼을 눌러 메모 적용 시 자동으로 채워질 체크 항목을 미리 설정해두세요.
                          </p>
                        </div>
                      ) : (
                        tplDraftChecklists.map((checkItem, idx) => {
                          const isDragged = draggedChecklistIndex === idx;
                          const isDragOver = dragOverChecklistIndex === idx;

                          return (
                            <div
                              key={checkItem.id || idx}
                              draggable={true}
                              onDragStart={(e) => handleChecklistDragStart(e, idx)}
                              onDragOver={(e) => handleChecklistDragOver(e, idx)}
                              onDrop={(e) => handleChecklistDrop(e, idx)}
                              onDragEnd={() => {
                                setDraggedChecklistIndex(null);
                                setDragOverChecklistIndex(null);
                              }}
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: `1.5px solid ${isDragOver ? '#7C3AED' : '#8B5CF6'}`,
                                borderRadius: '12px',
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                boxShadow: isDragOver ? '0 4px 12px rgba(124,58,237,0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                                opacity: isDragged ? 0.4 : 1,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }} title="드래그하여 순서 변경">
                                  <GripVertical size={16} color="#8B5CF6" />
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', minWidth: '20px' }}>
                                  #{idx + 1}
                                </span>
                              <textarea
                                rows={Math.max(1, (checkItem.text || '').split('\n').length)}
                                value={checkItem.text || ''}
                                onChange={(e) => handleUpdateTplChecklistInCanvas(idx, 'text', e.target.value)}
                                placeholder="체크리스트 사전 항목 내용... (Enter 키로 줄바꿈 가능)"
                                style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #C4B5FD', fontSize: '13px', lineHeight: 1.4, whiteSpace: 'pre-wrap', backgroundColor: '#FFFFFF', fontFamily: 'inherit', resize: 'vertical' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <button onClick={() => handleRemoveTplChecklistInCanvas(idx)} style={{ ...styles.iconBtn, padding: '5px' }} title="삭제">
                                  <Trash2 size={15} color="#EF4444" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                      )}
                    </div>
                  </div>
                </div>
  );
}

export default React.memo(TemplateCanvas);

