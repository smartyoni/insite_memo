import React from 'react';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Edit2,
  FileText,
  Folder,
  FolderPlus,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  Type
} from 'lucide-react';
import { styles } from './notebookStyles';
import { autoFormatPhoneNumber } from './notebookConstants';
import { DetailBlocksManager } from '../DetailBlocks';
import { renderWithLinks } from '../../utils/linkify';

export default function NotebookDetailPane(props) {
  const {
    isMobile,
    mobileSubTab,
    setMobileSubTab,
    activeItem,
    activeTpl,
    isItemInTrash,
    handleTouchStart,
    handleTouchEnd,
    handleRestoreItem,
    handlePermanentDeleteItem,
    openDeleteModal,
    isEditMode,
    handleEnterEditMode,
    handleCancelDetailEdit,
    handleSaveDetail,
    printTarget,
    handleOpenDetailPrint,
    calendarReturnContext,
    handleReturnToCalendar,
    showSavedToast,
    titleInputRef,
    draftTitle,
    setDraftTitle,
    draftCategoryId,
    setDraftCategoryId,
    categories,
    items,
    currentScope,
    getHierarchicalCategoryOptions,
    draftTemplateId,
    setDraftTemplateId,
    templates,
    templates2,
    handleApplyTemplate2ToItem,
    setShowTemplate2Modal,
    draftTemplateValues,
    setDraftTemplateValues,
    setDraftBody,
    checklistGroups,
    getSortedChecklistItems,
    currentChecklists,
    collapsedSections,
    toggleSectionCollapse,
    handleExpandAllSections,
    handleCollapseAllSections,
    editingBlockId,
    setEditingBlockId,
    handleAddNewChecklistBlock,
    handleAddNewTextBlock,
    handleOpenAddGroupModal,
    openGroupMenuId,
    setOpenGroupMenuId,
    openGroupMenuPos,
    handleOpenGroupMenu,
    handleMoveGroup,
    editingCheckId,
    setEditingCheckId,
    editingCheckText,
    setEditingCheckText,
    setEditingCheckTag,
    openChecklistMenuId,
    setOpenChecklistMenuId,
    openChecklistMenuPos,
    handleOpenChecklistMenu,
    handleDeleteChecklist,
    handleSaveEditChecklist,
    handleAddChecklistToGroup,
    handleAddNextChecklistInGroup,
    newChecklistText,
    setNewChecklistText,
    handleAddChecklist,
    draggedNoteChecklistId,
    setDraggedNoteChecklistId,
    dragOverNoteChecklistId,
    setDragOverNoteChecklistId,
    handleNoteChecklistDrop,
    checkItemTouchTimerRef,
    handleToggleInlineChecklistInReadMode,
    selectedChecklistId,
    setSelectedChecklistId,
    checklistDetailBlocks,
    setChecklistDetailBlocks,
    handleSaveChecklistDetail,
    getCheckItemDetailBlocks,
    handleOpenMoveBlockModal,
    handleCopyBlockToClipboard,
    handleCopyBlockAsPlainText,
    handleCopyItemToClipboard,
    detailClipboard,
    handlePasteBlockFromClipboard,
    handlePasteItemFromClipboard,
    handleClearDetailClipboard,
    detailCollapsedBlockIds,
    updateDetailCollapsedBlockIds,
    handleExpandAllDetailBlocks,
    handleCollapseAllDetailBlocks,
    handleOpenCreateEventFromBlock,
    isPrintFieldSelected,
    renderMobileFooter,
    navigateBack,
    selectedCategoryId,
    searchQuery
  } = props;

  if (!activeItem) return null;

  return (
    <>
              <div
                style={{
                  ...styles.pane3Body,
                  ...(isMobile ? { padding: '4px 2px 2px 2px' } : {})
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Trash Notice Banner */}
                {isItemInTrash && (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trash2 size={18} color="#DC2626" />
                      <span style={{ fontSize: '13px', color: '#991B1B', fontWeight: 600 }}>
                        휴지통에 보관된 메모입니다.
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleRestoreItem(activeItem)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#16A34A',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="원래 카테고리로 복원"
                      >
                        <RotateCcw size={13} />
                        <span>복원</span>
                      </button>
                      <button
                        onClick={() => {
                          openDeleteModal(
                            '영구 삭제',
                            `'${activeItem.title || '제목 없음'}' 메모를 영구 삭제하시겠습니까? 복구할 수 없습니다.`,
                            () => handlePermanentDeleteItem(activeItem.id)
                          );
                        }}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="영구 삭제"
                      >
                        <Trash2 size={13} />
                        <span>영구 삭제</span>
                      </button>
                    </div>
                  </div>
                )}

                {isEditMode ? (
                  <div style={styles.splitEditContainer}>
                    {/* Split Edit Textarea Fields (Desktop: 2 Cards side-by-side, Mobile: 1 Full Card by SubTab) */}
                    <div style={styles.splitEditFields}>
                      {(!isMobile || mobileSubTab === 'main') && (
                        <div
                          style={{
                            ...styles.editPaneMainCard,
                            ...(isMobile ? { padding: '8px 2px', borderRadius: '4px' } : {})
                          }}
                          className={printTarget === 'checklist' ? 'print-area' : 'no-print'}
                        >
                          {/* Top Control Bar: Category Selector + Template Selector + Cancel/Save Buttons */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: isMobile ? '4px' : '8px',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #F1F5F9',
                            flexWrap: 'nowrap',
                            paddingLeft: isMobile ? '4px' : '0',
                            paddingRight: isMobile ? '4px' : '0',
                            width: '100%',
                            minWidth: 0
                          }}>
                            {/* Left Controls: Category & Template Selectors */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '6px', flex: 1, minWidth: 0 }}>
                              <select
                                value={draftCategoryId}
                                onChange={(e) => setDraftCategoryId(e.target.value)}
                                style={{
                                  ...styles.headerCategorySelect,
                                  flex: 1,
                                  minWidth: 0,
                                  maxWidth: isMobile ? '135px' : '220px',
                                  height: isMobile ? '28px' : '32px'
                                }}
                                title="카테고리 선택"
                              >
                                {getHierarchicalCategoryOptions(currentScope).map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.displayName || cat.name}
                                  </option>
                                ))}
                              </select>

                              {(() => {
                                const tplCats = categories.filter(c => c.scope === 'template2' && c.id !== 'template2_trash');
                                const tplCatIds = new Set(tplCats.map(c => c.id));
                                const tplItems = items.filter(it => tplCatIds.has(it.categoryId));

                                return (
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (!val) return;
                                      const targetTpl = tplItems.find(it => it.id === val) || templates2.find(t => t.id === val);
                                      if (targetTpl) {
                                        handleApplyTemplate2ToItem(targetTpl, 'replace');
                                      }
                                    }}
                                    style={{
                                      ...styles.headerCategorySelect,
                                      flex: 1,
                                      minWidth: 0,
                                      maxWidth: isMobile ? '135px' : '220px',
                                      height: isMobile ? '28px' : '32px',
                                      fontWeight: 600,
                                      color: '#7C3AED',
                                      backgroundColor: '#FAF5FF',
                                      borderColor: '#C4B5FD'
                                    }}
                                    title="템플릿 서식 적용 (기존 내용 대체)"
                                  >
                                    <option value="">📋 템플릿 선택...</option>
                                    {tplCats.map((cat) => {
                                      const cItems = tplItems.filter(it => it.categoryId === cat.id);
                                      if (cItems.length === 0) return null;
                                      return (
                                        <optgroup key={cat.id} label={cat.name}>
                                          {cItems.map((tpl) => (
                                            <option key={tpl.id} value={tpl.id}>
                                              {tpl.title || '제목 없는 템플릿'}
                                            </option>
                                          ))}
                                        </optgroup>
                                      );
                                    })}
                                    {templates2.length > 0 && (
                                      <optgroup label="템플릿 프리셋">
                                        {templates2.map((tpl) => (
                                          <option key={tpl.id} value={tpl.id}>
                                            {tpl.title || '제목 없는 프리셋'}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>
                                );
                              })()}
                              <button
                                type="button"
                                onClick={() => setShowTemplate2Modal(true)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: isMobile ? '4px 8px' : '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #C4B5FD',
                                  backgroundColor: '#F5F3FF',
                                  color: '#7C3AED',
                                  fontSize: isMobile ? '11px' : '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  height: isMobile ? '28px' : '32px'
                                }}
                                title="상세화면 구조 템플릿 적용"
                              >
                                📑 템플릿
                              </button>
                            </div>

                            {/* Right Controls: Cancel & Save Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '6px', flexShrink: 0 }}>
                              <button
                                onClick={handleCancelDetailEdit}
                                style={{
                                  ...styles.btnSecondary,
                                  padding: isMobile ? '4px 8px' : '6px 12px',
                                  fontSize: isMobile ? '12px' : '13px',
                                  height: isMobile ? '28px' : '32px'
                                }}
                              >
                                <RotateCcw size={isMobile ? 12 : 13} />
                                취소
                              </button>
                              <button
                                onClick={handleSaveDetail}
                                style={{
                                  ...styles.btnPrimary,
                                  padding: isMobile ? '4px 10px' : '6px 14px',
                                  fontSize: isMobile ? '12px' : '13px',
                                  height: isMobile ? '28px' : '32px'
                                }}
                              >
                                <Save size={isMobile ? 12 : 13} />
                                저장
                              </button>
                            </div>
                          </div>

                          {/* Standalone Full-Width Title Input Box */}
                          <input
                            ref={titleInputRef}
                            type="text"
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            style={{ ...styles.editTitleInput, width: '100%', marginBottom: '10px' }}
                          />




                          {/* Input Form for new checklist item or section */}
                          <div style={{
                            ...styles.checklistInputContainer,
                            ...(isMobile ? { paddingLeft: '2px', paddingRight: '2px' } : {})
                          }} className="no-print">
                            <div style={styles.checklistInputGroup}>
                              <textarea
                                rows={2}
                                value={newChecklistText}
                                onChange={(e) => setNewChecklistText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleAddChecklist();
                                  }
                                }}
                                placeholder="새 체크리스트 항목 입력... (Ctrl+Enter 항목 추가)"
                                style={styles.checklistTextarea}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: 'stretch', flexShrink: 0 }}>
                                <button
                                  onClick={handleAddChecklist}
                                  style={{
                                    ...styles.checklistAddBtn,
                                    opacity: newChecklistText.trim() ? 1 : 0.6,
                                    cursor: newChecklistText.trim() ? 'pointer' : 'not-allowed',
                                    flex: 1,
                                    height: 'auto',
                                    padding: '5px 12px'
                                  }}
                                  disabled={!newChecklistText.trim()}
                                  title="체크리스트 추가 (Ctrl+Enter)"
                                >
                                  <Plus size={14} />
                                  <span>항목 추가</span>
                                </button>
                                
                              </div>
                            </div>
                          </div>

                          {/* Checklist Items List (Grouped with Section Headers & Accordion) */}
                          <div style={{
                            ...styles.checklistListContainer,
                            ...(isMobile ? { padding: '2px 0 6px 0' } : {})
                          }}>
                            {currentChecklists.length === 0 ? (
                              <div style={styles.checklistEmptyText}>
                                등록된 체크리스트 항목이 없습니다. 위 입력창에서 항목 또는 그룹을 추가해보세요!
                              </div>
                            ) : (
                                checklistGroups.map((group, groupIdx) => {
                                const isSecEditing = group.section && editingCheckId === group.section.id;
                                const isSecDragged = group.section && draggedNoteChecklistId === group.section.id;
                                const isSecDragOver = group.section && dragOverNoteChecklistId === group.section.id;
                                const isSecCollapsed = group.section && Boolean(collapsedSections[group.section.id]);
                                const isFirstGroup = groupIdx === 0;
                                const isLastGroup = groupIdx === checklistGroups.length - 1;

                                return (
                                  <div
                                    key={group.section ? group.section.id : `group_edit_${groupIdx}`}
                                    style={group.section ? {
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0px',
                                      padding: '0px',
                                      backgroundColor: '#FFFFFF',
                                      borderRadius: 0,
                                      border: '1.5px solid #64748B',
                                      borderLeft: 'none',
                                      borderRight: 'none',
                                      boxShadow: 'none',
                                      marginTop: groupIdx === 0 ? '0' : (isMobile ? '2px' : '3px'),
                                      marginLeft: 0,
                                      marginRight: 0,
                                      overflow: 'hidden'
                                    } : {
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0px',
                                      padding: '0px',
                                      backgroundColor: '#FFFFFF',
                                      borderRadius: 0,
                                      border: '1px solid #CBD5E1',
                                      borderLeft: 'none',
                                      borderRight: 'none',
                                      boxShadow: 'none',
                                      marginTop: groupIdx === 0 ? '0' : (isMobile ? '2px' : '3px'),
                                      marginLeft: 0,
                                      marginRight: 0,
                                      overflow: 'hidden'
                                    }}
                                  >
                                    {/* 그룹 헤더 바 (섹션 구분이 있는 경우) */}
                                    {group.section && (
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: isMobile ? '4px' : '6px',
                                          height: isMobile ? '22px' : '24px',
                                          padding: isMobile ? '1px 0 1px 6px' : '1px 0 1px 8px',
                                          boxSizing: 'border-box',
                                          marginTop: '0',
                                          marginBottom: '0',
                                          backgroundColor: '#B3C8DD',
                                          border: 'none',
                                          borderBottom: isSecCollapsed ? 'none' : '1px solid #7B95AC',
                                          borderRadius: '0',
                                          boxShadow: 'none',
                                          cursor: isSecEditing ? 'default' : 'pointer',
                                          userSelect: 'none'
                                        }}
                                        onClick={() => {
                                          if (!isSecEditing) {
                                            toggleSectionCollapse(group.section.id);
                                            if (group.sortedItems && group.sortedItems.length > 0) {
                                              setSelectedChecklistId(group.sortedItems[0].id);
                                              if (isMobile) setMobileSubTab('sub');
                                            } else {
                                              handleAddChecklistToGroup(group.section.id);
                                            }
                                          }
                                        }}
                                      >
                                        {isSecEditing ? (
                                          <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Folder size={13} color="#2563EB" />
                                            <input
                                              type="text"
                                              value={editingCheckText}
                                              onChange={(e) => setEditingCheckText(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  handleSaveEditChecklist(group.section.id);
                                                } else if (e.key === 'Escape') {
                                                  e.preventDefault();
                                                  setEditingCheckId(null);
                                                }
                                              }}
                                              style={{
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                color: '#0F172A',
                                                padding: '1px 4px',
                                                borderRadius: '4px',
                                                border: '1px solid #2563EB',
                                                outline: 'none',
                                                flex: 1
                                              }}
                                              autoFocus
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleSaveEditChecklist(group.section.id)}
                                              style={{ ...styles.btnPrimary, padding: '1px 6px', fontSize: '10px' }}
                                            >
                                              저장
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setEditingCheckId(null)}
                                              style={{ ...styles.btnSecondary, padding: '1px 6px', fontSize: '10px' }}
                                            >
                                              취소
                                            </button>
                                          </div>
                                        ) : (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                            <span
                                              style={{ display: 'flex', alignItems: 'center', color: '#1E3A8A' }}
                                              title={isSecCollapsed ? '펼치기' : '접기'}
                                            >
                                              {isSecCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                            </span>
                                            <Folder size={13} color="#1E3A8A" style={{ flexShrink: 0 }} />
                                            <span
                                              onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                setEditingCheckId(group.section.id);
                                                setEditingCheckText(group.section.text);
                                              }}
                                              title="더블클릭하여 그룹 이름 수정"
                                              style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text' }}
                                            >
                                              {group.section.text}
                                            </span>
                                            {isSecCollapsed && (
                                              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                                                (접힘)
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {!isSecEditing && (
                                          <div
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              backgroundColor: '#FFFFFF',
                                              border: '1px solid #CBD5E1',
                                              borderRadius: '4px',
                                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                              height: isMobile ? '18px' : '20px',
                                              flexShrink: 0
                                            }}
                                            className="no-print"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {/* 1. 체크항목 추가 버튼 (가장위 가장아래 기호의 좌측) */}
                                            {!isItemInTrash && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleAddChecklistToGroup(group.section.id);
                                                }}
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  width: isMobile ? '20px' : '22px',
                                                  height: '100%',
                                                  border: 'none',
                                                  borderRight: '1px solid #E2E8F0',
                                                  backgroundColor: 'transparent',
                                                  color: '#2563EB',
                                                  cursor: 'pointer',
                                                  padding: 0,
                                                  transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                                                  e.currentTarget.style.color = '#1D4ED8';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor = 'transparent';
                                                  e.currentTarget.style.color = '#2563EB';
                                                }}
                                                title="이 그룹에 체크 항목 추가"
                                              >
                                                <Plus size={isMobile ? 12 : 13} strokeWidth={2.5} />
                                              </button>
                                            )}

                                            {/* 2. Group 3-dot Menu (가장 우측) */}
                                            <div style={{ position: 'relative', height: '100%' }}>
                                              <button
                                                type="button"
                                                onClick={(e) => handleOpenGroupMenu(e, group.section.id)}
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  width: isMobile ? '20px' : '22px',
                                                  height: '100%',
                                                  border: 'none',
                                                  backgroundColor: openGroupMenuId === group.section.id ? '#E2E8F0' : 'transparent',
                                                  color: openGroupMenuId === group.section.id ? '#2563EB' : '#1E293B',
                                                  cursor: 'pointer',
                                                  padding: 0,
                                                  transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (openGroupMenuId !== group.section.id) e.currentTarget.style.backgroundColor = '#F1F5F9';
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (openGroupMenuId !== group.section.id) e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                                title="그룹 메뉴"
                                              >
                                                <MoreVertical size={isMobile ? 12 : 13} strokeWidth={2.5} />
                                              </button>

                                              {openGroupMenuId === group.section.id && (
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
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenGroupMenuId(null);
                                                    }}
                                                  />
                                                  <div
                                                    style={{
                                                      ...styles.checklistDropdownMenu,
                                                      top: openGroupMenuPos?.top ?? 0,
                                                      right: openGroupMenuPos?.right ?? 0,
                                                      minWidth: '150px',
                                                      padding: '5px'
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <button
                                                      type="button"
                                                      disabled={isFirstGroup}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenGroupMenuId(null);
                                                        handleMoveGroup(group.section.id, 'top');
                                                      }}
                                                      style={{
                                                        ...styles.checklistDropdownItem,
                                                        opacity: isFirstGroup ? 0.4 : 1,
                                                        cursor: isFirstGroup ? 'not-allowed' : 'pointer'
                                                      }}
                                                      onMouseEnter={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                                      onMouseLeave={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >
                                                      <ChevronsUp size={15} color={isFirstGroup ? '#94A3B8' : '#2563EB'} strokeWidth={2.2} />
                                                      <span>맨 위로 이동</span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={isFirstGroup}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenGroupMenuId(null);
                                                        handleMoveGroup(group.section.id, 'up');
                                                      }}
                                                      style={{
                                                        ...styles.checklistDropdownItem,
                                                        opacity: isFirstGroup ? 0.4 : 1,
                                                        cursor: isFirstGroup ? 'not-allowed' : 'pointer'
                                                      }}
                                                      onMouseEnter={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                                      onMouseLeave={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >
                                                      <ChevronUp size={15} color={isFirstGroup ? '#94A3B8' : '#2563EB'} strokeWidth={2.2} />
                                                      <span>위로 이동</span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={isLastGroup}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenGroupMenuId(null);
                                                        handleMoveGroup(group.section.id, 'down');
                                                      }}
                                                      style={{
                                                        ...styles.checklistDropdownItem,
                                                        opacity: isLastGroup ? 0.4 : 1,
                                                        cursor: isLastGroup ? 'not-allowed' : 'pointer'
                                                      }}
                                                      onMouseEnter={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                                      onMouseLeave={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >
                                                      <ChevronDown size={15} color={isLastGroup ? '#94A3B8' : '#2563EB'} strokeWidth={2.2} />
                                                      <span>아래로 이동</span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={isLastGroup}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenGroupMenuId(null);
                                                        handleMoveGroup(group.section.id, 'bottom');
                                                      }}
                                                      style={{
                                                        ...styles.checklistDropdownItem,
                                                        opacity: isLastGroup ? 0.4 : 1,
                                                        cursor: isLastGroup ? 'not-allowed' : 'pointer'
                                                      }}
                                                      onMouseEnter={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                                      onMouseLeave={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >
                                                      <ChevronsDown size={15} color={isLastGroup ? '#94A3B8' : '#2563EB'} strokeWidth={2.2} />
                                                      <span>맨 아래로 이동</span>
                                                    </button>

                                                    <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }} />

                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setOpenGroupMenuId(null);
                                                        handleAddChecklistToGroup(group.section.id);
                                                      }}
                                                      style={styles.checklistDropdownItem}
                                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                      <Plus size={14} color="#2563EB" />
                                                      <span>항목 추가</span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setOpenGroupMenuId(null);
                                                        setEditingCheckId(group.section.id);
                                                        setEditingCheckText(group.section.text);
                                                      }}
                                                      style={styles.checklistDropdownItem}
                                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                      <Edit2 size={14} color="#475569" />
                                                      <span>수정</span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setOpenGroupMenuId(null);
                                                        openDeleteModal(
                                                          '그룹 삭제',
                                                          `'${group.section.text}' 그룹 구분을 삭제하시겠습니까?\n(하위 체크리스트 항목들은 삭제되지 않고 유지됩니다.)`,
                                                          () => handleDeleteChecklist(group.section.id)
                                                        );
                                                      }}
                                                      style={{ ...styles.checklistDropdownItem, color: '#DC2626' }}
                                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                      <Trash2 size={14} color="#DC2626" />
                                                      <span>삭제</span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setOpenGroupMenuId(null)}
                                                      style={styles.checklistDropdownItem}
                                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                      <X size={14} color="#64748B" />
                                                      <span>취소</span>
                                                    </button>
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* 하위 항목들 */}
                                    {!isSecCollapsed && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                        {group.sortedItems.map((checkItem, itemIdx) => {
                                          const isEditing = editingCheckId === checkItem.id;
                                          const isSelected = selectedChecklistId === checkItem.id;
                                          const isDragged = draggedNoteChecklistId === checkItem.id;
                                          const isDragOver = dragOverNoteChecklistId === checkItem.id;
                                          const canDrag = !isEditing && checkItem.id !== '__main__';

                                          return (
                                            <div
                                              key={checkItem.id}
                                              draggable={canDrag}
                                              onContextMenu={(e) => {
                                                if (isEditing) return;
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const subBlocks = getCheckItemDetailBlocks(checkItem);
                                                handleOpenCreateEventFromBlock({
                                                  title: checkItem.text || '',
                                                  blocks: subBlocks,
                                                  sourceMemo: {
                                                    itemId: activeItem.id,
                                                    categoryId: activeItem.categoryId || selectedCategoryId,
                                                    checklistId: checkItem.id
                                                  },
                                                });
                                              }}
                                              onTouchStart={() => {
                                                if (isEditing) return;
                                                checkItemTouchTimerRef.current = setTimeout(() => {
                                                  const subBlocks = getCheckItemDetailBlocks(checkItem);
                                                  handleOpenCreateEventFromBlock({
                                                    title: checkItem.text || '',
                                                    blocks: subBlocks,
                                                    sourceMemo: {
                                                      itemId: activeItem.id,
                                                      categoryId: activeItem.categoryId || selectedCategoryId,
                                                      checklistId: checkItem.id
                                                    }
                                                  });
                                                }, 500);
                                              }}
                                              onTouchEnd={() => {
                                                if (checkItemTouchTimerRef.current) {
                                                  clearTimeout(checkItemTouchTimerRef.current);
                                                  checkItemTouchTimerRef.current = null;
                                                }
                                              }}
                                              onTouchMove={() => {
                                                if (checkItemTouchTimerRef.current) {
                                                  clearTimeout(checkItemTouchTimerRef.current);
                                                  checkItemTouchTimerRef.current = null;
                                                }
                                              }}
                                              title="더블클릭: 수정 / 우클릭 및 길게 누름: 일정 만들기"
                                              onDragStart={(e) => {
                                                if (!canDrag) return;
                                                setDraggedNoteChecklistId(checkItem.id);
                                                e.dataTransfer.effectAllowed = 'move';
                                                e.dataTransfer.setData('text/plain', checkItem.id);
                                              }}
                                              onDragOver={(e) => {
                                                if (!canDrag) return;
                                                e.preventDefault();
                                                e.dataTransfer.dropEffect = 'move';
                                                if (dragOverNoteChecklistId !== checkItem.id) {
                                                  setDragOverNoteChecklistId(checkItem.id);
                                                }
                                              }}
                                              onDrop={(e) => {
                                                if (!canDrag) return;
                                                handleNoteChecklistDrop(e, checkItem.id);
                                              }}
                                              onDragEnd={() => {
                                                setDraggedNoteChecklistId(null);
                                                setDragOverNoteChecklistId(null);
                                              }}
                                              onClick={() => {
                                                if (!isEditing) {
                                                  setSelectedChecklistId(checkItem.id);
                                                  if (isMobile) setMobileSubTab('sub');
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.nativeEvent && e.nativeEvent.isComposing) return;
                                                if (e.key === 'Enter' && e.shiftKey) {
                                                  if (group.section) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleAddNextChecklistInGroup(group.section.id, checkItem.id, isEditing ? editingCheckText : (checkItem.text || ''));
                                                  }
                                                }
                                              }}
                                              style={group.section ? {
                                                ...styles.checklistItemRow,
                                                padding: isMobile ? '5px 8px' : '6px 12px',
                                                borderRadius: '0',
                                                backgroundColor: isDragOver ? '#DBEAFE' : isSelected ? '#EFF6FF' : isEditing ? '#F8FAFC' : '#FFFFFF',
                                                border: 'none',
                                                borderBottom: itemIdx < group.sortedItems.length - 1 ? '1px solid #E2E8F0' : 'none',
                                                boxShadow: isSelected ? 'inset 3px 0 0 #2563EB' : 'none',
                                                opacity: isDragged ? 0.4 : 1,
                                                cursor: 'pointer'
                                              } : {
                                                ...styles.checklistItemRow,
                                                padding: isMobile ? '5px 8px' : '6px 12px',
                                                borderRadius: '0',
                                                backgroundColor: isDragOver ? '#DBEAFE' : isSelected ? '#EFF6FF' : isEditing ? '#F8FAFC' : '#FFFFFF',
                                                border: 'none',
                                                borderBottom: itemIdx < group.sortedItems.length - 1 ? '1px solid #E2E8F0' : 'none',
                                                boxShadow: isSelected ? 'inset 3px 0 0 #2563EB' : 'none',
                                                opacity: isDragged ? 0.4 : 1,
                                                cursor: 'pointer'
                                              }}
                                            >
                                              {isEditing ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                                  <textarea
                                                    rows={2}
                                                    value={editingCheckText}
                                                    onChange={(e) => setEditingCheckText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                      if (e.nativeEvent && e.nativeEvent.isComposing) return;
                                                      if (e.key === 'Enter' && e.shiftKey) {
                                                        if (group.section) {
                                                          e.preventDefault();
                                                          e.stopPropagation();
                                                          handleAddNextChecklistInGroup(group.section.id, checkItem.id, editingCheckText);
                                                        }
                                                      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                        e.preventDefault();
                                                        handleSaveEditChecklist(checkItem.id);
                                                      } else if (e.key === 'Escape') {
                                                        e.preventDefault();
                                                        if (!checkItem.text && !editingCheckText.trim()) {
                                                          handleDeleteChecklist(checkItem.id);
                                                        }
                                                        setEditingCheckId(null);
                                                      }
                                                    }}
                                                    style={styles.checklistEditTextarea}
                                                    autoFocus
                                                  />
                                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        if (!checkItem.text && !editingCheckText.trim()) {
                                                          handleDeleteChecklist(checkItem.id);
                                                        }
                                                        setEditingCheckId(null);
                                                      }}
                                                      style={styles.btnSmallCancel}
                                                    >
                                                      <X size={13} /> 취소
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleSaveEditChecklist(checkItem.id)}
                                                      style={styles.btnSmallSave}
                                                    >
                                                      <Check size={13} /> 저장
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div
                                                  onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleOpenCreateEventFromBlock({
                                                      title: checkItem.text || '',
                                                      blocks: checkItem.detailBlocks || [],
                                                      sourceMemo: {
                                                        itemId: activeItem.id,
                                                        categoryId: activeItem.categoryId || selectedCategoryId,
                                                        checklistId: checkItem.id
                                                      },
                                                    });
                                                  }}
                                                  onTouchStart={() => {
                                                    checkItemTouchTimerRef.current = setTimeout(() => {
                                                      handleOpenCreateEventFromBlock({
                                                        title: checkItem.text || '',
                                                        blocks: checkItem.detailBlocks || [],
                                                        sourceMemo: {
                                                          itemId: activeItem.id,
                                                          categoryId: activeItem.categoryId || selectedCategoryId,
                                                          checklistId: checkItem.id
                                                        },
                                                      });
                                                    }, 500);
                                                  }}
                                                  onTouchEnd={() => {
                                                    if (checkItemTouchTimerRef.current) {
                                                      clearTimeout(checkItemTouchTimerRef.current);
                                                      checkItemTouchTimerRef.current = null;
                                                    }
                                                  }}
                                                  onTouchMove={() => {
                                                    if (checkItemTouchTimerRef.current) {
                                                      clearTimeout(checkItemTouchTimerRef.current);
                                                      checkItemTouchTimerRef.current = null;
                                                    }
                                                  }}
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    width: '100%',
                                                    gap: isMobile ? '4px' : '8px',
                                                    minHeight: isMobile ? '22px' : '26px',
                                                    cursor: 'pointer'
                                                  }}
                                                  title="우클릭 또는 길게 눌러 일정 만들기"
                                                >
                                                  <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0, gap: '6px' }}>
                                                    <span
                                                      style={{
                                                        width: '7px',
                                                        height: '7px',
                                                        borderRadius: '50%',
                                                        backgroundColor: isSelected ? '#1D4ED8' : '#0F172A',
                                                        marginTop: isMobile ? '5px' : '5.5px',
                                                        flexShrink: 0
                                                      }}
                                                      aria-hidden="true"
                                                    />
                                                    <span
                                                      onDoubleClick={(e) => {
                                                        if (checkItem.id !== '__main__') {
                                                          e.stopPropagation();
                                                          setSelectedChecklistId(checkItem.id);
                                                          setEditingCheckId(checkItem.id);
                                                          setEditingCheckText(checkItem.text);
                                                          setEditingCheckTag(checkItem.tag || '');
                                                        }
                                                      }}
                                                      title={checkItem.id !== '__main__' ? "더블클릭하여 내용 수정" : undefined}
                                                      style={{
                                                        ...styles.checkitemText,
                                                        flex: 1,
                                                        minWidth: 0,
                                                        textDecoration: 'none',
                                                        color: isSelected ? '#1E40AF' : '#1E293B',
                                                        fontWeight: isSelected ? 700 : 500,
                                                        fontSize: isMobile ? '13px' : '14px',
                                                        cursor: 'pointer'
                                                      }}
                                                    >
                                                      {renderWithLinks(checkItem.text)}
                                                    </span>
                                                  </div>

                                                  <div style={{ position: 'relative', flexShrink: 0, marginRight: isMobile ? '-2px' : '-2px' }} className="no-print" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                      type="button"
                                                      onClick={(e) => handleOpenChecklistMenu(e, checkItem.id)}
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: isMobile ? '20px' : '22px',
                                                        height: isMobile ? '20px' : '22px',
                                                        borderRadius: '4px',
                                                        border: 'none',
                                                        backgroundColor: openChecklistMenuId === checkItem.id ? '#E2E8F0' : 'transparent',
                                                        color: openChecklistMenuId === checkItem.id ? '#2563EB' : '#64748B',
                                                        cursor: 'pointer'
                                                      }}
                                                      title="메뉴"
                                                    >
                                                      <MoreVertical size={isMobile ? 14 : 15} />
                                                    </button>

                                                    {openChecklistMenuId === checkItem.id && (
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
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenChecklistMenuId(null);
                                                          }}
                                                        />
                                                        <div
                                                          style={{
                                                            ...styles.checklistDropdownMenu,
                                                            top: openChecklistMenuPos?.top ?? 0,
                                                            right: openChecklistMenuPos?.right ?? 0
                                                          }}
                                                          onClick={(e) => e.stopPropagation()}
                                                        >
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setOpenChecklistMenuId(null);
                                                              const subBlocks = getCheckItemDetailBlocks(checkItem);
                                                              handleOpenCreateEventFromBlock({
                                                                title: checkItem.text || '',
                                                                blocks: subBlocks,
                                                                sourceMemo: {
                                                                  itemId: activeItem.id,
                                                                  categoryId: activeItem.categoryId || selectedCategoryId,
                                                                  checklistId: checkItem.id
                                                                },
                                                              });
                                                            }}
                                                            style={styles.checklistDropdownItem}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                          >
                                                            <CalendarIcon size={14} color="#2563EB" />
                                                            <span style={{ color: "#2563EB", fontWeight: 600 }}>일정 만들기</span>
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setOpenChecklistMenuId(null);
                                                              setEditingCheckId(checkItem.id);
                                                              setEditingCheckText(checkItem.text);
                                                              setEditingCheckTag(checkItem.tag || '');
                                                            }}
                                                            style={styles.checklistDropdownItem}
                                                          >
                                                            <Edit2 size={14} color="#475569" />
                                                            <span>수정</span>
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setOpenChecklistMenuId(null);
                                                              const preview = checkItem.text.length > 35 ? checkItem.text.slice(0, 35) + '...' : checkItem.text;
                                                              openDeleteModal(
                                                                '체크리스트 항목 삭제',
                                                                `'${preview}' 항목을 정말 삭제하시겠습니까?`,
                                                                () => handleDeleteChecklist(checkItem.id)
                                                              );
                                                            }}
                                                            style={{ ...styles.checklistDropdownItem, color: '#DC2626' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                          >
                                                            <Trash2 size={14} color="#DC2626" />
                                                            <span>삭제</span>
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() => setOpenChecklistMenuId(null)}
                                                            style={styles.checklistDropdownItem}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                          >
                                                            <X size={14} color="#64748B" />
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
                                        })}

                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Right Card for Edit Mode: Main Body, Template Form, or Checklist Detail */}
                      {(!isMobile || mobileSubTab === 'sub') && (
                        <div
                          style={{
                            ...styles.editPaneSubCard,
                            ...(isMobile ? { padding: '8px 2px', borderRadius: '4px' } : {})
                          }}
                          className={printTarget === 'detail' ? 'print-area' : 'no-print'}
                        >
                          {selectedChecklistId === '__main__' ? (
                            draftTemplateId === null ? (
                              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  paddingBottom: '8px',
                                  marginBottom: '6px',
                                  borderBottom: '1px solid #E2E8F0',
                                  flexWrap: 'wrap',
                                  gap: '6px'
                                }} className="no-print">
                                  <button
                                    type="button"
                                    onClick={handleAddNewTextBlock}
                                    style={{
                                      ...styles.btnSecondary,
                                      color: '#1D4ED8',
                                      backgroundColor: '#EFF6FF',
                                      borderColor: '#BFDBFE',
                                      fontWeight: 600
                                    }}
                                    title="새 텍스트 추가"
                                  >
                                    <Plus size={13} />
                                    <span>텍스트</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleAddNewChecklistBlock}
                                    style={{
                                      ...styles.btnSecondary,
                                      color: '#D97706',
                                      backgroundColor: '#FEF3C7',
                                      borderColor: '#FDE68A',
                                      fontWeight: 600
                                    }}
                                    title="새 체크 추가"
                                  >
                                    <CheckSquare size={13} />
                                    <span>체크</span>
                                  </button>
                                  {detailClipboard && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                      {detailClipboard.type === 'block' ? (
                                        <button
                                          type="button"
                                          onClick={handlePasteBlockFromClipboard}
                                          style={{
                                            ...styles.btnSecondary,
                                            color: '#047857',
                                            backgroundColor: '#ECFDF5',
                                            borderColor: '#A7F3D0',
                                            fontWeight: 600
                                          }}
                                          title={`복사한 블록('${detailClipboard.title}') 붙여넣기`}
                                        >
                                          <Copy size={13} />
                                          <span>블록 붙여넣기</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handlePasteItemFromClipboard()}
                                          style={{
                                            ...styles.btnSecondary,
                                            color: '#047857',
                                            backgroundColor: '#ECFDF5',
                                            borderColor: '#A7F3D0',
                                            fontWeight: 600
                                          }}
                                          title={`복사한 항목('${detailClipboard.title}') 붙여넣기`}
                                        >
                                          <Copy size={13} />
                                          <span>항목 붙여넣기</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={handleClearDetailClipboard}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '24px',
                                          height: isMobile ? '28px' : '30px',
                                          border: '1px solid #CBD5E1',
                                          borderRadius: '6px',
                                          backgroundColor: '#FFFFFF',
                                          color: '#64748B',
                                          cursor: 'pointer',
                                          padding: 0
                                        }}
                                        title="복사한 내용 지우기"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <DetailBlocksManager
                                  blocks={checklistDetailBlocks}
                                  onChangeAndSave={(newBlocks) => {
                                    setChecklistDetailBlocks(newBlocks);
                                    setDraftBody(blocksToPlainText(newBlocks));
                                  }}
                                  searchQuery={searchQuery}
                                  editingBlockId={editingBlockId}
                                  setEditingBlockId={setEditingBlockId}
                                  openDeleteModal={openDeleteModal}
                                  onOpenMoveModal={handleOpenMoveBlockModal}
                                  onCopyBlock={handleCopyBlockToClipboard}
                                  onCopyBlockAsText={handleCopyBlockAsPlainText}
                                  onCopyItem={handleCopyItemToClipboard}
                                  detailClipboard={detailClipboard}
                                  onPasteItemToChecklist={handlePasteItemFromClipboard}
                                  collapsedBlockIds={detailCollapsedBlockIds}
                                  setCollapsedBlockIds={updateDetailCollapsedBlockIds}
                                  isMobile={isMobile}
                                  onCreateEvent={handleOpenCreateEventFromBlock}
                                />
                              </div>
                            ) : (
                              (() => {
                                const activeTpl = templates.find(t => t.id === draftTemplateId);
                                if (!activeTpl || !activeTpl.fields || activeTpl.fields.length === 0) {
                                  return (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                                      선택된 템플릿에 필드가 없습니다. 상단 [템플릿 관리]에서 구성 요소를 추가해 주세요.
                                    </div>
                                  );
                                }

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                                    <div style={{ padding: '8px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>📋 <strong>{activeTpl.title}</strong> 템플릿 서식 편집 중</span>
                                      <button
                                        onClick={() => setDraftTemplateId(null)}
                                        style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
                                      >
                                        기본 서식으로 변경
                                      </button>
                                    </div>

                                    {groupFieldsList(activeTpl.fields).map((grp, gIdx) => {
                                      const renderedFields = grp.fields.map((field) => {
                                        const fieldVal = draftTemplateValues[field.id];

                                        if (field.type === 'phone') {
                                          return (
                                            <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                                              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px', flexShrink: 0 }}>
                                                <Phone size={14} color="#10B981" />
                                                {field.label}
                                              </label>
                                              <input
                                                type="tel"
                                                value={fieldVal || ''}
                                                onChange={(e) => setDraftTemplateValues({ ...draftTemplateValues, [field.id]: autoFormatPhoneNumber(e.target.value) })}
                                                placeholder={field.placeholder || '010-0000-0000'}
                                                style={{ flex: 1, minWidth: '140px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                                              />
                                              {fieldVal && (
                                                <a
                                                  href={`sms:${fieldVal.replace(/[^0-9]/g, '')}`}
                                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}
                                                >
                                                  <MessageSquare size={12} />
                                                  SMS 전송
                                                </a>
                                              )}
                                            </div>
                                          );
                                        }

                                        if (field.type === 'datetime') {
                                          return (
                                            <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                                              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px', flexShrink: 0 }}>
                                                <CalendarIcon size={14} color="#8B5CF6" />
                                                {field.label}
                                              </label>
                                              <input
                                                type="datetime-local"
                                                value={fieldVal || ''}
                                                onChange={(e) => setDraftTemplateValues({ ...draftTemplateValues, [field.id]: e.target.value })}
                                                style={{ flex: 1, minWidth: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box', color: '#0F172A', fontFamily: 'inherit' }}
                                              />
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {field.type === 'text' && <Type size={14} color="#2563EB" />}
                                                {field.type === 'checklist' && <CheckSquare size={14} color="#F59E0B" />}
                                                {field.label}
                                              </label>
                                            </div>

                                            {field.type === 'text' && (() => {
                                              const defaultTextVal = field.placeholder ? field.placeholder.replace(/\//g, '\n') : '';
                                              const currentTextVal = fieldVal !== undefined ? fieldVal : defaultTextVal;
                                              const lineCount = currentTextVal.split('\n').length;
                                              return (
                                                <textarea
                                                  value={currentTextVal}
                                                  onChange={(e) => setDraftTemplateValues({ ...draftTemplateValues, [field.id]: e.target.value })}
                                                  placeholder="내용을 입력하세요"
                                                  rows={Math.max(3, lineCount)}
                                                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                                                />
                                              );
                                            })()}

                                            {field.type === 'checklist' && (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                                {getSortedChecklistItems(fieldVal, field.defaultItems).map((chkItem) => (
                                                  <div key={chkItem.originalIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: chkItem.completed ? '#F8FAFC' : '#FFFFFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                                    <input
                                                      type="checkbox"
                                                      checked={Boolean(chkItem.completed)}
                                                      onChange={(e) => {
                                                        const currentArr = Array.isArray(fieldVal)
                                                          ? [...fieldVal]
                                                          : (field.defaultItems || []).map(t => (typeof t === 'object' ? { ...t } : { text: t, completed: false }));
                                                        currentArr[chkItem.originalIndex] = {
                                                          ...(typeof currentArr[chkItem.originalIndex] === 'object' ? currentArr[chkItem.originalIndex] : { text: currentArr[chkItem.originalIndex] }),
                                                          completed: e.target.checked
                                                        };
                                                        setDraftTemplateValues({ ...draftTemplateValues, [field.id]: currentArr });
                                                      }}
                                                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10B981' }}
                                                    />
                                                    <textarea
                                                      rows={Math.max(1, (chkItem.text || '').split('\n').length)}
                                                      value={chkItem.text || ''}
                                                      onChange={(e) => {
                                                        const currentArr = Array.isArray(fieldVal)
                                                          ? [...fieldVal]
                                                          : (field.defaultItems || []).map(t => (typeof t === 'object' ? { ...t } : { text: t, completed: false }));
                                                        currentArr[chkItem.originalIndex] = {
                                                          ...(typeof currentArr[chkItem.originalIndex] === 'object' ? currentArr[chkItem.originalIndex] : { text: currentArr[chkItem.originalIndex] }),
                                                          text: e.target.value
                                                        };
                                                        setDraftTemplateValues({ ...draftTemplateValues, [field.id]: currentArr });
                                                      }}
                                                      placeholder="체크 항목 내용 입력..."
                                                      style={{
                                                        flex: 1,
                                                        border: 'none',
                                                        outline: 'none',
                                                        backgroundColor: 'transparent',
                                                        fontSize: '13px',
                                                        color: chkItem.completed ? '#94A3B8' : '#1E293B',
                                                        textDecoration: chkItem.completed ? 'line-through' : 'none',
                                                        fontFamily: 'inherit',
                                                        resize: 'none'
                                                      }}
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      });

                                      if (grp.title) {
                                        return (
                                          <div key={`edit_grp_${gIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px', border: '1px dashed #CBD5E1', padding: '10px', borderRadius: '10px', backgroundColor: '#FAFAFA' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                                              🏷️ {grp.title}
                                            </div>
                                            {renderedFields}
                                          </div>
                                        );
                                      }

                                      return <React.Fragment key={`edit_ungrp_${gIdx}`}>{renderedFields}</React.Fragment>;
                                    })}
                                  </div>
                                );
                              })()
                            )
                          ) : (
                            // Checklist item detail in edit mode
                            (() => {
                              const selectedCheckItem = currentChecklists.find(c => c.id === selectedChecklistId) || currentChecklists[0];
                              if (!selectedCheckItem) {
                                return (
                                  <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                                    좌측에서 체크리스트 항목을 선택해주세요.
                                  </div>
                                );
                              }
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingBottom: '8px',
                                    marginBottom: '6px',
                                    borderBottom: '1px solid #E2E8F0',
                                    flexWrap: 'wrap',
                                    gap: '6px',
                                    paddingLeft: isMobile ? '4px' : '0',
                                    paddingRight: isMobile ? '4px' : '0'
                                  }}>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                                      📄 {selectedCheckItem.text} 상세내용
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-print">
                                      {/* 텍스트박스 및 체크리스트 그룹 전체 펼치기 / 전체 접기 컴팩트 버튼 */}
                                      {checklistDetailBlocks && checklistDetailBlocks.length > 0 && (
                                        <div
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            backgroundColor: '#F8FAFC',
                                            borderRadius: '6px',
                                            border: '1px solid #CBD5E1',
                                            padding: '1px 2px',
                                            gap: '1px',
                                            height: isMobile ? '28px' : '30px'
                                          }}
                                          className="no-print"
                                          title="텍스트 박스 및 체크리스트 그룹 전체 펼치기 / 전체 접기"
                                        >
                                          <button
                                            type="button"
                                            onClick={handleExpandAllDetailBlocks}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: isMobile ? '22px' : '24px',
                                              height: '100%',
                                              borderRadius: '4px',
                                              border: 'none',
                                              backgroundColor: 'transparent',
                                              color: '#475569',
                                              cursor: 'pointer',
                                              padding: 0,
                                              transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = '#FFFFFF';
                                              e.currentTarget.style.color = '#2563EB';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                              e.currentTarget.style.color = '#475569';
                                            }}
                                            title="모든 블록 펼치기 (︾)"
                                          >
                                            <ChevronsDown size={14} />
                                          </button>
                                          <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />
                                          <button
                                            type="button"
                                            onClick={handleCollapseAllDetailBlocks}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: isMobile ? '22px' : '24px',
                                              height: '100%',
                                              borderRadius: '4px',
                                              border: 'none',
                                              backgroundColor: 'transparent',
                                              color: '#475569',
                                              cursor: 'pointer',
                                              padding: 0,
                                              transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = '#FFFFFF';
                                              e.currentTarget.style.color = '#2563EB';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                              e.currentTarget.style.color = '#475569';
                                            }}
                                            title="모든 블록 접기 (︽)"
                                          >
                                            <ChevronsUp size={14} />
                                          </button>
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        onClick={handleAddNewTextBlock}
                                        style={{
                                          ...styles.btnSecondary,
                                          color: '#1D4ED8',
                                          backgroundColor: '#EFF6FF',
                                          borderColor: '#BFDBFE',
                                          fontWeight: 600
                                        }}
                                        title="새 텍스트 추가"
                                      >
                                        <Plus size={13} />
                                        <span>텍스트</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleAddNewChecklistBlock}
                                        style={{
                                          ...styles.btnSecondary,
                                          color: '#D97706',
                                          backgroundColor: '#FEF3C7',
                                          borderColor: '#FDE68A',
                                          fontWeight: 600
                                        }}
                                        title="새 체크 추가"
                                      >
                                        <CheckSquare size={13} />
                                        <span>체크</span>
                                      </button>
                                      {detailClipboard && (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                          {detailClipboard.type === 'block' ? (
                                            <button
                                              type="button"
                                              onClick={handlePasteBlockFromClipboard}
                                              style={{
                                                ...styles.btnSecondary,
                                                color: '#047857',
                                                backgroundColor: '#ECFDF5',
                                                borderColor: '#A7F3D0',
                                                fontWeight: 600
                                              }}
                                              title={`복사한 블록('${detailClipboard.title}') 붙여넣기`}
                                            >
                                              <Copy size={13} />
                                              <span>블록 붙여넣기</span>
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handlePasteItemFromClipboard()}
                                              style={{
                                                ...styles.btnSecondary,
                                                color: '#047857',
                                                backgroundColor: '#ECFDF5',
                                                borderColor: '#A7F3D0',
                                                fontWeight: 600
                                              }}
                                              title={`복사한 항목('${detailClipboard.title}') 붙여넣기`}
                                            >
                                              <Copy size={13} />
                                              <span>항목 붙여넣기</span>
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={handleClearDetailClipboard}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: '24px',
                                              height: isMobile ? '28px' : '30px',
                                              border: '1px solid #CBD5E1',
                                              borderRadius: '6px',
                                              backgroundColor: '#FFFFFF',
                                              color: '#64748B',
                                              cursor: 'pointer',
                                              padding: 0
                                            }}
                                            title="복사한 내용 지우기"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {/* Detail Content: Always interactive DetailBlocksManager */}
                                  <DetailBlocksManager
                                    blocks={checklistDetailBlocks}
                                    onChangeAndSave={(newBlocks) => handleSaveChecklistDetail(selectedCheckItem.id, newBlocks)}
                                    searchQuery={searchQuery}
                                    editingBlockId={editingBlockId}
                                    setEditingBlockId={setEditingBlockId}
                                    openDeleteModal={openDeleteModal}
                                    onOpenMoveModal={handleOpenMoveBlockModal}
                                    onCopyBlock={handleCopyBlockToClipboard}
                                    onCopyBlockAsText={handleCopyBlockAsPlainText}
                                    onCopyItem={handleCopyItemToClipboard}
                                    detailClipboard={detailClipboard}
                                    onPasteItemToChecklist={handlePasteItemFromClipboard}
                                    collapsedBlockIds={detailCollapsedBlockIds}
                                    setCollapsedBlockIds={updateDetailCollapsedBlockIds}
                                    isMobile={isMobile}
                                    onCreateEvent={handleOpenCreateEventFromBlock}
                                  />
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={styles.splitReadContainer}>
                    {/* Left Card: Standalone Checklist Master Card */}
                    {(!isMobile || mobileSubTab === 'main') && (
                      <div
                        style={{
                          ...styles.leftPaneCard,
                          ...(isMobile ? { padding: '8px 2px', borderRadius: '4px' } : {})
                        }}
                        className={printTarget === 'checklist' ? 'print-area' : 'no-print'}
                      >
                        {/* Title Header Line with Right-aligned Controls */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '10px',
                          paddingBottom: '10px',
                          borderBottom: '1px solid #F1F5F9',
                          paddingLeft: '10px',
                          paddingRight: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            {isMobile && (
                              <button
                                onClick={navigateBack}
                                style={styles.mobileBackBtn}
                                title="목록으로 이동"
                              >
                                <ArrowLeft size={16} />
                                <span>목록</span>
                              </button>
                            )}
                            {calendarReturnContext && (
                              <button
                                type="button"
                                onClick={handleReturnToCalendar}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: isMobile ? '3px 8px' : '4px 10px',
                                  backgroundColor: '#EFF6FF',
                                  border: '1.5px solid #3B82F6',
                                  borderRadius: '6px',
                                  color: '#1D4ED8',
                                  fontSize: isMobile ? '11px' : '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)',
                                  flexShrink: 0
                                }}
                                title="이전에 보던 캘린더 화면으로 복귀"
                              >
                                <CalendarIcon size={isMobile ? 12 : 14} color="#2563EB" />
                                <span>캘린더</span>
                              </button>
                            )}
                            <h1 style={{ ...styles.readTitle, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {highlightText(activeItem.title, searchQuery)}
                            </h1>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} className="no-print">
                            {showSavedToast && (
                              <span style={styles.toastBadge}>
                                ✓ 저장됨
                              </span>
                            )}

                            {!isItemInTrash && (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                  overflow: 'hidden',
                                  height: isMobile ? '28px' : '30px'
                                }}
                                className="no-print"
                              >
                                {/* 그룹 펼치기 */}
                                <button
                                  type="button"
                                  onClick={handleExpandAllSections}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: isMobile ? '24px' : '28px',
                                    height: '100%',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    padding: 0,
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                                    e.currentTarget.style.color = '#2563EB';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#475569';
                                  }}
                                  title="그룹 모두 펼치기 (︾)"
                                >
                                  <ChevronsDown size={14} />
                                </button>

                                <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />

                                {/* 그룹 접기 */}
                                <button
                                  type="button"
                                  onClick={handleCollapseAllSections}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: isMobile ? '24px' : '28px',
                                    height: '100%',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    padding: 0,
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                                    e.currentTarget.style.color = '#2563EB';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#475569';
                                  }}
                                  title="그룹 모두 접기 (︽)"
                                >
                                  <ChevronsUp size={14} />
                                </button>

                                <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />

                                {/* 새 그룹 추가 */}
                                <button
                                  type="button"
                                  onClick={handleOpenAddGroupModal}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    padding: isMobile ? '0 8px' : '0 10px',
                                    height: '100%',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#1D4ED8',
                                    fontSize: isMobile ? '11px' : '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#EFF6FF';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="새 그룹 추가"
                                >
                                  <FolderPlus size={13} color="#2563EB" />
                                  <span>그룹</span>
                                </button>

                                <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />

                                {/* 템플릿 적용 */}
                                <button
                                  type="button"
                                  onClick={() => setShowTemplate2Modal(true)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    padding: isMobile ? '0 8px' : '0 10px',
                                    height: '100%',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#7C3AED',
                                    fontSize: isMobile ? '11px' : '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F5F3FF';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="상세화면 구조 템플릿 적용"
                                >
                                  <span>📑 템플릿</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>



                        {/* Input Form for new multiline checklist item or section */}
                        {!isItemInTrash && (
                          <div style={{
                            ...styles.checklistInputContainer,
                            paddingLeft: '10px',
                            paddingRight: '10px'
                          }} className="no-print">
                            <div style={styles.checklistInputGroup}>
                              <textarea
                                rows={2}
                                value={newChecklistText}
                                onChange={(e) => setNewChecklistText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleAddChecklist();
                                  }
                                }}
                                placeholder="새 체크리스트 항목 입력... (Ctrl+Enter 항목 추가)"
                                style={styles.checklistTextarea}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: 'stretch', flexShrink: 0 }}>
                                <button
                                  onClick={handleAddChecklist}
                                  style={{
                                    ...styles.checklistAddBtn,
                                    opacity: newChecklistText.trim() ? 1 : 0.6,
                                    cursor: newChecklistText.trim() ? 'pointer' : 'not-allowed',
                                    flex: 1,
                                    height: 'auto',
                                    padding: '5px 12px'
                                  }}
                                  disabled={!newChecklistText.trim()}
                                  title="체크리스트 추가 (Ctrl+Enter)"
                                >
                                  <Plus size={14} />
                                  <span>항목 추가</span>
                                </button>
                                
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Checklist Items List (Grouped with Section Headers & Accordion) */}
                        <div style={{
                          ...styles.checklistListContainer,
                          padding: '0'
                        }}>
                          {currentChecklists.length === 0 ? (
                            <div style={styles.checklistEmptyText}>
                              등록된 체크리스트 항목이 없습니다. 위 입력창에서 항목 또는 그룹을 추가해보세요!
                            </div>
                          ) : (
                            checklistGroups.map((group, groupIdx) => {
                              const isSecEditing = group.section && editingCheckId === group.section.id;
                              const isSecDragged = group.section && draggedNoteChecklistId === group.section.id;
                              const isSecDragOver = group.section && dragOverNoteChecklistId === group.section.id;
                              const isSecCollapsed = group.section && Boolean(collapsedSections[group.section.id]);
                              const isFirstGroup = groupIdx === 0;
                              const isLastGroup = groupIdx === checklistGroups.length - 1;

                              return (
                                <div
                                  key={group.section ? group.section.id : `group_${groupIdx}`}
                                  style={group.section ? {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0px',
                                    padding: '0px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 0,
                                    border: '1.5px solid #64748B',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    boxShadow: 'none',
                                    marginTop: groupIdx === 0 ? '0' : (isMobile ? '2px' : '3px'),
                                    marginLeft: 0,
                                    marginRight: 0,
                                    overflow: 'hidden'
                                  } : {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0px',
                                    padding: '0px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 0,
                                    border: '1px solid #CBD5E1',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    boxShadow: 'none',
                                    marginTop: groupIdx === 0 ? '0' : (isMobile ? '2px' : '3px'),
                                    marginLeft: 0,
                                    marginRight: 0,
                                    overflow: 'hidden'
                                  }}
                                >
                                  {/* 그룹 헤더 바 (섹션 구분이 있는 경우) */}
                                  {group.section && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: isMobile ? '4px' : '6px',
                                        height: isMobile ? '22px' : '24px',
                                        padding: isMobile ? '1px 0 1px 6px' : '1px 0 1px 8px',
                                        boxSizing: 'border-box',
                                        marginTop: '0',
                                        marginBottom: '0',
                                        backgroundColor: '#B3C8DD',
                                        border: 'none',
                                        borderBottom: isSecCollapsed ? 'none' : '1px solid #7B95AC',
                                        borderRadius: '0',
                                        boxShadow: 'none',
                                        cursor: isSecEditing ? 'default' : 'pointer',
                                        userSelect: 'none'
                                      }}
                                      onClick={() => {
                                        if (!isSecEditing) {
                                          toggleSectionCollapse(group.section.id);
                                          if (group.sortedItems && group.sortedItems.length > 0) {
                                            setSelectedChecklistId(group.sortedItems[0].id);
                                            if (isMobile) setMobileSubTab('sub');
                                          } else {
                                            handleAddChecklistToGroup(group.section.id);
                                          }
                                        }
                                      }}
                                    >
                                      {/* 좌측: 토글 화살표 + 폴더 아이콘 + 그룹명 */}
                                      {isSecEditing ? (
                                        <div
                                          style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Folder size={13} color="#2563EB" />
                                          <input
                                            type="text"
                                            value={editingCheckText}
                                            onChange={(e) => setEditingCheckText(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSaveEditChecklist(group.section.id);
                                              } else if (e.key === 'Escape') {
                                                e.preventDefault();
                                                setEditingCheckId(null);
                                              }
                                            }}
                                            style={{
                                              fontSize: '12px',
                                              fontWeight: 700,
                                              color: '#1E293B',
                                              padding: '1px 4px',
                                              borderRadius: '4px',
                                              border: '1px solid #2563EB',
                                              outline: 'none',
                                              flex: 1
                                            }}
                                            autoFocus
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleSaveEditChecklist(group.section.id)}
                                            style={{ ...styles.btnPrimary, padding: '1px 6px', fontSize: '10px' }}
                                          >
                                            저장
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingCheckId(null)}
                                            style={{ ...styles.btnSecondary, padding: '1px 6px', fontSize: '10px' }}
                                          >
                                            취소
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                          <span
                                            style={{ display: 'flex', alignItems: 'center', color: '#1E3A8A' }}
                                            title={isSecCollapsed ? '펼치기' : '접기'}
                                          >
                                            {isSecCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                          </span>
                                          <Folder size={13} color="#1E3A8A" style={{ flexShrink: 0 }} />
                                          <span
                                             onDoubleClick={(e) => {
                                               e.stopPropagation();
                                               setEditingCheckId(group.section.id);
                                               setEditingCheckText(group.section.text);
                                             }}
                                             title="더블클릭하여 그룹 이름 수정"
                                             style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text' }}
                                           >
                                             {group.section.text}
                                           </span>
                                          {isSecCollapsed && (
                                            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                                              (접힘)
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* 우측: 완료 배지 & 수정/삭제 & 드래그 핸들 */}
                                        {!isSecEditing && (
                                          <div
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              backgroundColor: '#FFFFFF',
                                              border: '1px solid #CBD5E1',
                                              borderRight: 'none',
                                              borderRadius: '4px 0 0 4px',
                                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                              height: isMobile ? '18px' : '20px',
                                              flexShrink: 0
                                            }}
                                            className="no-print"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {/* 1. 체크항목 추가 버튼 (가장위 가장아래 기호의 좌측) */}
                                            {!isItemInTrash && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleAddChecklistToGroup(group.section.id);
                                                }}
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  width: isMobile ? '20px' : '22px',
                                                  height: '100%',
                                                  border: 'none',
                                                  borderRight: '1px solid #E2E8F0',
                                                  backgroundColor: 'transparent',
                                                  color: '#2563EB',
                                                  cursor: 'pointer',
                                                  padding: 0,
                                                  transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                                                  e.currentTarget.style.color = '#1D4ED8';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor = 'transparent';
                                                  e.currentTarget.style.color = '#2563EB';
                                                }}
                                                title="이 그룹에 체크 항목 추가"
                                              >
                                                <Plus size={isMobile ? 12 : 13} strokeWidth={2.5} />
                                              </button>
                                            )}

                                            {/* 2. Group 3-dot Menu (가장 우측) */}
                                            <div style={{ position: 'relative', height: '100%' }}>
                                              <button
                                                type="button"
                                                onClick={(e) => handleOpenGroupMenu(e, group.section.id)}
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  width: isMobile ? '20px' : '22px',
                                                  height: '100%',
                                                  border: 'none',
                                                  backgroundColor: openGroupMenuId === group.section.id ? '#E2E8F0' : 'transparent',
                                                  color: openGroupMenuId === group.section.id ? '#2563EB' : '#1E293B',
                                                  cursor: 'pointer',
                                                  padding: 0,
                                                  transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (openGroupMenuId !== group.section.id) e.currentTarget.style.backgroundColor = '#F1F5F9';
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (openGroupMenuId !== group.section.id) e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                                title="그룹 메뉴"
                                              >
                                                <MoreVertical size={isMobile ? 12 : 13} strokeWidth={2.5} />
                                              </button>
                                            {openGroupMenuId === group.section.id && (
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
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenGroupMenuId(null);
                                                  }}
                                                />
                                                <div
                                                  style={{
                                                    ...styles.checklistDropdownMenu,
                                                    top: openGroupMenuPos?.top ?? 0,
                                                    right: openGroupMenuPos?.right ?? 0,
                                                    minWidth: '150px',
                                                    padding: '5px'
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <button
                                                    type="button"
                                                    disabled={isFirstGroup}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenGroupMenuId(null);
                                                      handleMoveGroup(group.section.id, 'top');
                                                    }}
                                                    style={{
                                                      ...styles.checklistDropdownItem,
                                                      opacity: isFirstGroup ? 0.4 : 1,
                                                      cursor: isFirstGroup ? 'not-allowed' : 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                                    onMouseLeave={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                  >
                                                    <ChevronsUp size={15} color={isFirstGroup ? '#94A3B8' : '#2563EB'} strokeWidth={2.2} />
                                                    <span>맨 위로 이동</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    disabled={isFirstGroup}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenGroupMenuId(null);
                                                      handleMoveGroup(group.section.id, 'up');
                                                    }}
                                                    style={{
                                                      ...styles.checklistDropdownItem,
                                                      opacity: isFirstGroup ? 0.4 : 1,
                                                      cursor: isFirstGroup ? 'not-allowed' : 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                                    onMouseLeave={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                  >
                                                    <ChevronUp size={15} color={isFirstGroup ? '#94A3B8' : '#2563EB'} strokeWidth={2.2} />
                                                    <span>위로 이동</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    disabled={isLastGroup}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenGroupMenuId(null);
                                                      handleMoveGroup(group.section.id, 'down');
                                                    }}
                                                    style={{
                                                      ...styles.checklistDropdownItem,
                                                      opacity: isLastGroup ? 0.4 : 1,
                                                      cursor: isLastGroup ? 'not-allowed' : 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                                    onMouseLeave={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                  >
                                                    <ChevronDown size={15} color={isLastGroup ? '#94A3B8' : '#2563EB'} strokeWidth={2.2} />
                                                    <span>아래로 이동</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    disabled={isLastGroup}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenGroupMenuId(null);
                                                      handleMoveGroup(group.section.id, 'bottom');
                                                    }}
                                                    style={{
                                                      ...styles.checklistDropdownItem,
                                                      opacity: isLastGroup ? 0.4 : 1,
                                                      cursor: isLastGroup ? 'not-allowed' : 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                                    onMouseLeave={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                  >
                                                    <ChevronsDown size={15} color={isLastGroup ? '#94A3B8' : '#2563EB'} strokeWidth={2.2} />
                                                    <span>맨 아래로 이동</span>
                                                  </button>

                                                  <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }} />

                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setOpenGroupMenuId(null);
                                                      handleAddChecklistToGroup(group.section.id);
                                                    }}
                                                    style={styles.checklistDropdownItem}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                  >
                                                    <Plus size={14} color="#2563EB" />
                                                    <span>항목 추가</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setOpenGroupMenuId(null);
                                                      setEditingCheckId(group.section.id);
                                                      setEditingCheckText(group.section.text);
                                                    }}
                                                    style={styles.checklistDropdownItem}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                  >
                                                    <Edit2 size={14} color="#475569" />
                                                    <span>수정</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setOpenGroupMenuId(null);
                                                      openDeleteModal(
                                                        '그룹 삭제',
                                                        `'${group.section.text}' 그룹 구분을 삭제하시겠습니까?\n(하위 체크리스트 항목들은 삭제되지 않고 유지됩니다.)`,
                                                        () => handleDeleteChecklist(group.section.id)
                                                      );
                                                    }}
                                                    style={{ ...styles.checklistDropdownItem, color: '#DC2626' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                  >
                                                    <Trash2 size={14} color="#DC2626" />
                                                    <span>삭제</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setOpenGroupMenuId(null)}
                                                    style={styles.checklistDropdownItem}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                  >
                                                    <X size={14} color="#64748B" />
                                                    <span>취소</span>
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 그룹 하위 체크리스트 항목들 (접혀있지 않을 때만 렌더링) */}
                                  {!isSecCollapsed && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                      {group.sortedItems.map((checkItem, itemIdx) => {
                                        const isEditing = editingCheckId === checkItem.id;
                                        const isSelected = selectedChecklistId === checkItem.id;
                                        const isDragged = draggedNoteChecklistId === checkItem.id;
                                        const isDragOver = dragOverNoteChecklistId === checkItem.id;
                                        const canDrag = !isEditing && checkItem.id !== '__main__';

                                        return (
                                          <div
                                            key={checkItem.id}
                                            draggable={canDrag}
                                            onContextMenu={(e) => {
                                              if (isEditing) return;
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const subBlocks = getCheckItemDetailBlocks(checkItem);
                                              handleOpenCreateEventFromBlock({
                                                title: checkItem.text || '',
                                                blocks: subBlocks,
                                                sourceMemo: {
                                                  itemId: activeItem.id,
                                                  categoryId: activeItem.categoryId || selectedCategoryId,
                                                  checklistId: checkItem.id
                                                },
                                              });
                                            }}
                                            onTouchStart={() => {
                                              if (isEditing) return;
                                              checkItemTouchTimerRef.current = setTimeout(() => {
                                                const subBlocks = getCheckItemDetailBlocks(checkItem);
                                                handleOpenCreateEventFromBlock({
                                                  title: checkItem.text || '',
                                                  blocks: subBlocks,
                                                  sourceMemo: {
                                                    itemId: activeItem.id,
                                                    categoryId: activeItem.categoryId || selectedCategoryId,
                                                    checklistId: checkItem.id
                                                  },
                                                });
                                              }, 500);
                                            }}
                                            onTouchEnd={() => {
                                              if (checkItemTouchTimerRef.current) {
                                                clearTimeout(checkItemTouchTimerRef.current);
                                                checkItemTouchTimerRef.current = null;
                                              }
                                            }}
                                            onTouchMove={() => {
                                              if (checkItemTouchTimerRef.current) {
                                                clearTimeout(checkItemTouchTimerRef.current);
                                                checkItemTouchTimerRef.current = null;
                                              }
                                            }}
                                            title="더블클릭: 수정 / 우클릭 및 길게 누름: 일정 만들기"
                                            onDragStart={(e) => {
                                              if (!canDrag) return;
                                              setDraggedNoteChecklistId(checkItem.id);
                                              e.dataTransfer.effectAllowed = 'move';
                                              e.dataTransfer.setData('text/plain', checkItem.id);
                                            }}
                                            onDragOver={(e) => {
                                              if (!canDrag) return;
                                              e.preventDefault();
                                              e.dataTransfer.dropEffect = 'move';
                                              if (dragOverNoteChecklistId !== checkItem.id) {
                                                setDragOverNoteChecklistId(checkItem.id);
                                              }
                                            }}
                                            onDrop={(e) => {
                                              if (!canDrag) return;
                                              handleNoteChecklistDrop(e, checkItem.id);
                                            }}
                                            onDragEnd={() => {
                                              setDraggedNoteChecklistId(null);
                                              setDragOverNoteChecklistId(null);
                                            }}
                                            onClick={() => {
                                              if (!isEditing) {
                                                setSelectedChecklistId(checkItem.id);
                                                if (isMobile) setMobileSubTab('sub');
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.nativeEvent && e.nativeEvent.isComposing) return;
                                              if (e.key === 'Enter' && e.shiftKey) {
                                                if (group.section) {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleAddNextChecklistInGroup(group.section.id, checkItem.id, isEditing ? editingCheckText : (checkItem.text || ''));
                                                }
                                              }
                                            }}
                                            style={group.section ? {
                                              ...styles.checklistItemRow,
                                              padding: isMobile ? '5px 8px' : '6px 12px',
                                              borderRadius: '0',
                                              backgroundColor: isDragOver ? '#DBEAFE' : isSelected ? '#EFF6FF' : isEditing ? '#F8FAFC' : '#FFFFFF',
                                              border: 'none',
                                              borderBottom: itemIdx < group.sortedItems.length - 1 ? '1px solid #E2E8F0' : 'none',
                                              boxShadow: isSelected ? 'inset 3px 0 0 #2563EB' : 'none',
                                              opacity: isDragged ? 0.4 : 1,
                                              cursor: 'pointer'
                                            } : {
                                              ...styles.checklistItemRow,
                                              padding: isMobile ? '5px 8px' : '6px 12px',
                                              borderRadius: 0,
                                              backgroundColor: isDragOver ? '#DBEAFE' : isSelected ? '#EFF6FF' : isEditing ? '#F8FAFC' : '#FFFFFF',
                                              border: 'none',
                                              borderBottom: itemIdx < group.sortedItems.length - 1 ? '1px solid #E2E8F0' : 'none',
                                              boxShadow: isSelected ? 'inset 3px 0 0 #2563EB' : 'none',
                                              opacity: isDragged ? 0.4 : 1,
                                              cursor: 'pointer'
                                            }}
                                          >
                                            {isEditing ? (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                                <textarea
                                                  rows={2}
                                                  value={editingCheckText}
                                                  onChange={(e) => setEditingCheckText(e.target.value)}
                                                  onKeyDown={(e) => {
                                                    if (e.nativeEvent && e.nativeEvent.isComposing) return;
                                                    if (e.key === 'Enter' && e.shiftKey) {
                                                      if (group.section) {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleAddNextChecklistInGroup(group.section.id, checkItem.id, editingCheckText);
                                                      }
                                                    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                      e.preventDefault();
                                                      handleSaveEditChecklist(checkItem.id);
                                                    } else if (e.key === 'Escape') {
                                                      e.preventDefault();
                                                      if (!checkItem.text && !editingCheckText.trim()) {
                                                        handleDeleteChecklist(checkItem.id);
                                                      }
                                                      setEditingCheckId(null);
                                                    }
                                                  }}
                                                  style={styles.checklistEditTextarea}
                                                  autoFocus
                                                />
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                                                  <button
                                                    type="button"
onClick={() => {
                                                      if (!checkItem.text && !editingCheckText.trim()) {
                                                        handleDeleteChecklist(checkItem.id);
                                                      }
                                                      setEditingCheckId(null);
                                                    }}
                                                    style={styles.btnSmallCancel}
                                                  >
                                                    <X size={13} /> 취소
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleSaveEditChecklist(checkItem.id)}
                                                    style={styles.btnSmallSave}
                                                  >
                                                    <Check size={13} /> 저장
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                width: '100%',
                                                gap: isMobile ? '4px' : '8px',
                                                minHeight: isMobile ? '22px' : '26px'
                                              }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0, gap: '6px' }}>
                                                  <span
                                                    style={{
                                                      width: '7px',
                                                      height: '7px',
                                                      borderRadius: '50%',
                                                      backgroundColor: isSelected ? '#1D4ED8' : '#0F172A',
                                                      marginTop: isMobile ? '5px' : '5.5px',
                                                      flexShrink: 0
                                                    }}
                                                    aria-hidden="true"
                                                  />
                                                  <span
                                                    onDoubleClick={(e) => {
                                                      if (checkItem.id !== '__main__') {
                                                        e.stopPropagation();
                                                        setSelectedChecklistId(checkItem.id);
                                                        setEditingCheckId(checkItem.id);
                                                        setEditingCheckText(checkItem.text);
                                                        setEditingCheckTag(checkItem.tag || '');
                                                      }
                                                    }}
                                                    title={checkItem.id !== '__main__' ? "더블클릭하여 내용 수정" : undefined}
                                                    style={{
                                                      ...styles.checkitemText,
                                                      flex: 1,
                                                      minWidth: 0,
                                                      textDecoration: 'none',
                                                      color: isSelected ? '#1E40AF' : '#1E293B',
                                                      fontWeight: isSelected ? 700 : 500,
                                                      fontSize: isMobile ? '13px' : '14px',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    {renderWithLinks(checkItem.text)}
                                                  </span>
                                                </div>
                                                {/* Right End: 3-dot Menu */}
                                                <div style={{ position: 'relative', flexShrink: 0, marginRight: isMobile ? '-2px' : '-2px' }} className="no-print" onClick={(e) => e.stopPropagation()}>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => handleOpenChecklistMenu(e, checkItem.id)}
                                                    style={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      width: isMobile ? '20px' : '22px',
                                                      height: isMobile ? '20px' : '22px',
                                                      borderRadius: '4px',
                                                      border: 'none',
                                                      backgroundColor: openChecklistMenuId === checkItem.id ? '#E2E8F0' : 'transparent',
                                                      color: openChecklistMenuId === checkItem.id ? '#2563EB' : '#64748B',
                                                      cursor: 'pointer'
                                                    }}
                                                    title="메뉴"
                                                  >
                                                    <MoreVertical size={isMobile ? 14 : 15} />
                                                  </button>

                                                  {openChecklistMenuId === checkItem.id && (
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
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setOpenChecklistMenuId(null);
                                                        }}
                                                      />
                                                      <div
                                                        style={{
                                                          ...styles.checklistDropdownMenu,
                                                          top: openChecklistMenuPos?.top ?? 0,
                                                          right: openChecklistMenuPos?.right ?? 0
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setOpenChecklistMenuId(null);
                                                            setEditingCheckId(checkItem.id);
                                                            setEditingCheckText(checkItem.text);
                                                            setEditingCheckTag(checkItem.tag || '');
                                                          }}
                                                          style={styles.checklistDropdownItem}
                                                        >
                                                          <Edit2 size={14} color="#475569" />
                                                          <span>수정</span>
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setOpenChecklistMenuId(null);
                                                            const preview = checkItem.text.length > 35 ? checkItem.text.slice(0, 35) + '...' : checkItem.text;
                                                            openDeleteModal(
                                                              '체크리스트 항목 삭제',
                                                              `'${preview}' 항목을 정말 삭제하시겠습니까?`,
                                                              () => handleDeleteChecklist(checkItem.id)
                                                            );
                                                          }}
                                                          style={{ ...styles.checklistDropdownItem, color: '#DC2626' }}
                                                        >
                                                          <Trash2 size={14} color="#DC2626" />
                                                          <span>삭제</span>
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => setOpenChecklistMenuId(null)}
                                                          style={styles.checklistDropdownItem}
                                                        >
                                                          <X size={14} color="#64748B" />
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
                                      })}


                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Right Card: Detail for Selected Checklist or Parent Item */}
                    {(!isMobile || mobileSubTab === 'sub') && (
                      <div
                        style={{
                          ...styles.rightPaneCard,
                          ...(isMobile ? { padding: '8px 2px', borderRadius: '4px' } : {})
                        }}
                        className={printTarget === 'detail' ? 'print-area' : 'no-print'}
                      >
                        {selectedChecklistId === '__main__' && activeItem.templateId && templates.find(t => t.id === activeItem.templateId) ? (
                          // Case 1: Template Applied
                          <>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingBottom: '10px',
                              marginBottom: '12px',
                              borderBottom: '1px solid #E2E8F0'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} color="#2563EB" />
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
                                  📋 [템플릿] {templates.find(t => t.id === activeItem.templateId).title}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-print">
                                <button
                                  onClick={handleOpenDetailPrint}
                                  style={styles.btnSecondary}
                                  title="상세내용 인쇄"
                                >
                                  <Printer size={13} color="#334155" />
                                  <span>인쇄</span>
                                </button>
                                {!isItemInTrash && (
                                  <button
                                    onClick={handleEnterEditMode}
                                    style={styles.btnPrimary}
                                  >
                                    <Edit2 size={13} />
                                    수정
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={styles.readBody}>
                              {(() => {
                                const activeTpl = templates.find(t => t.id === activeItem.templateId);
                                const values = activeItem.templateValues || {};
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ padding: '6px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1E40AF', fontWeight: 600 }}>
                                      📋 <strong>{activeTpl.title}</strong> 템플릿 적용됨
                                    </div>
                                    {groupFieldsList(activeTpl.fields).map((grp, gIdx) => {
                                      const renderedFields = grp.fields.map((field) => {
                                        const val = values[field.id];
                                        const defaultTextVal = field.placeholder ? field.placeholder.replace(/\//g, '\n') : '';
                                        const currentVal = val !== undefined ? val : defaultTextVal;

                                        if (field.type === 'phone') {
                                          return (
                                            <div key={field.id} className={isPrintFieldSelected(field.id) ? "" : "no-print"} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                  <Phone size={14} color="#10B981" />
                                                  {field.label}
                                                </span>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                  {currentVal || '(전화번호 없음)'}
                                                </span>
                                              </div>
                                              {currentVal && (
                                                <a
                                                  href={`sms:${currentVal.replace(/[^0-9]/g, '')}`}
                                                  style={{ color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, whiteSpace: 'nowrap' }}
                                                >
                                                  <MessageSquare size={12} /> SMS 전송
                                                </a>
                                              )}
                                            </div>
                                          );
                                        }


                                          if (field.type === 'datetime') {
                                            const formattedDt = currentVal ? currentVal.replace('T', ' ') : '';
                                            return (
                                              <div key={field.id} className={isPrintFieldSelected(field.id) ? "" : "no-print"} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                    <CalendarIcon size={14} color="#8B5CF6" />
                                                    {field.label}
                                                  </span>
                                                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {formattedDt || '(날짜/시간 미선택)'}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          }

                                          return (
                                            <div key={field.id} className={isPrintFieldSelected(field.id) ? "" : "no-print"} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  {field.type === 'text' && <Type size={14} color="#2563EB" />}
                                                  {field.type === 'checklist' && <CheckSquare size={14} color="#F59E0B" />}
                                                  {field.label}
                                                </span>
                                              </div>

                                              {field.type === 'text' && (
                                                <div style={{ padding: '10px 12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#0F172A', minHeight: '38px' }}>
                                                  {renderWithLinks(currentVal || '(내용 없음)', searchQuery)}
                                                </div>
                                              )}

                                              {field.type === 'checklist' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                                                  {getSortedChecklistItems(currentVal, field.defaultItems).map((chk) => (
                                                    <div
                                                      key={chk.originalIndex}
                                                      onClick={() => handleToggleInlineChecklistInReadMode(field.id, chk.originalIndex, !chk.completed)}
                                                      style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        backgroundColor: chk.completed ? '#F8FAFC' : '#FFFFFF',
                                                        border: '1px solid #E2E8F0',
                                                        transition: 'all 0.15s ease'
                                                      }}
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={Boolean(chk.completed)}
                                                        onChange={(e) => {
                                                          e.stopPropagation();
                                                          handleToggleInlineChecklistInReadMode(field.id, chk.originalIndex, e.target.checked);
                                                        }}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10B981' }}
                                                      />
                                                      <span
                                                        style={{
                                                          fontSize: '13px',
                                                          textDecoration: chk.completed ? 'line-through' : 'none',
                                                          color: chk.completed ? '#94A3B8' : '#1E293B',
                                                          fontWeight: chk.completed ? 400 : 500,
                                                          whiteSpace: 'pre-wrap',
                                                          lineHeight: 1.5,
                                                          flex: 1
                                                        }}
                                                      >
                                                        {highlightText(chk.text, searchQuery)}
                                                      </span>
                                                      {chk.completed && (
                                                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, backgroundColor: '#D1FAE5', padding: '1px 6px', borderRadius: '4px' }}>
                                                          ✓ 완료
                                                        </span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        });

                                        if (grp.title) {
                                          return (
                                            <div key={`read_grp_${gIdx}`} style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #BFDBFE', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #DBEAFE', paddingBottom: '6px' }}>
                                                <Folder size={15} color="#2563EB" /> {grp.title}
                                              </div>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {renderedFields}
                                              </div>
                                            </div>
                                          );
                                        }

                                        return <React.Fragment key={`read_ungrp_${gIdx}`}>{renderedFields}</React.Fragment>;
                                      })}
                                    </div>
                                  );
                                })()}
                            </div>
                          </>
                        ) : (
                          // Case 2: Individual Checklist Item Selected
                          (() => {
                            const selectedCheckItem = currentChecklists.find(c => c.id === selectedChecklistId) || currentChecklists[0];
                            if (!selectedCheckItem) {
                              return (
                                <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94A3B8' }}>
                                  좌측에서 체크리스트 항목을 선택하거나 추가해 주세요.
                                </div>
                              );
                            }

                            return (
                              <>
                                {/* Header: Selected Checklist Item Title & Status */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingBottom: '8px',
                                  marginBottom: '6px',
                                  borderBottom: '1px solid #E2E8F0',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                  position: 'sticky',
                                  top: 0,
                                  backgroundColor: '#F8FAFC',
                                  zIndex: 10,
                                  flexShrink: 0,
                                  paddingLeft: '10px',
                                  paddingRight: '10px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                    <span style={{
                                      fontSize: '15px',
                                      fontWeight: 700,
                                      color: '#1E293B',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      📄 {selectedCheckItem.text}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-print">
                                    {showSavedToast && (
                                      <span style={styles.toastBadge}>
                                        ✓ 저장됨
                                      </span>
                                    )}

                                    {/* 텍스트박스 및 체크리스트 그룹 전체 펼치기 / 전체 접기 컴팩트 버튼 */}
                                    {checklistDetailBlocks && checklistDetailBlocks.length > 0 && (
                                      <div
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          backgroundColor: '#F8FAFC',
                                          borderRadius: '6px',
                                          border: '1px solid #CBD5E1',
                                          padding: '1px 2px',
                                          gap: '1px',
                                          height: isMobile ? '28px' : '30px'
                                        }}
                                        className="no-print"
                                        title="텍스트 박스 및 체크리스트 그룹 전체 펼치기 / 전체 접기"
                                      >
                                        <button
                                          type="button"
                                          onClick={handleExpandAllDetailBlocks}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: isMobile ? '22px' : '24px',
                                            height: '100%',
                                            borderRadius: '4px',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            color: '#475569',
                                            cursor: 'pointer',
                                            padding: 0,
                                            transition: 'all 0.15s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                                            e.currentTarget.style.color = '#2563EB';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = '#475569';
                                          }}
                                          title="모든 블록 펼치기 (︾)"
                                        >
                                          <ChevronsDown size={14} />
                                        </button>
                                        <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />
                                        <button
                                          type="button"
                                          onClick={handleCollapseAllDetailBlocks}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: isMobile ? '22px' : '24px',
                                            height: '100%',
                                            borderRadius: '4px',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            color: '#475569',
                                            cursor: 'pointer',
                                            padding: 0,
                                            transition: 'all 0.15s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                                            e.currentTarget.style.color = '#2563EB';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = '#475569';
                                          }}
                                          title="모든 블록 접기 (︽)"
                                        >
                                          <ChevronsUp size={14} />
                                        </button>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={handleAddNewTextBlock}
                                      style={{
                                        ...styles.btnSecondary,
                                        color: '#1D4ED8',
                                        backgroundColor: '#EFF6FF',
                                        borderColor: '#BFDBFE',
                                        fontWeight: 600
                                      }}
                                      title="새 텍스트 추가"
                                    >
                                      <Plus size={13} />
                                      <span>텍스트</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={handleAddNewChecklistBlock}
                                      style={{
                                        ...styles.btnSecondary,
                                        color: '#D97706',
                                        backgroundColor: '#FEF3C7',
                                        borderColor: '#FDE68A',
                                        fontWeight: 600
                                      }}
                                        title="새 체크 추가"
                                      >
                                        <CheckSquare size={13} />
                                        <span>체크</span>
                                      </button>
                                      {detailClipboard && (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                          {detailClipboard.type === 'block' ? (
                                            <button
                                              type="button"
                                              onClick={handlePasteBlockFromClipboard}
                                              style={{
                                                ...styles.btnSecondary,
                                                color: '#047857',
                                                backgroundColor: '#ECFDF5',
                                                borderColor: '#A7F3D0',
                                                fontWeight: 600
                                              }}
                                              title={`복사한 블록('${detailClipboard.title}') 붙여넣기`}
                                            >
                                              <Copy size={13} />
                                              <span>블록 붙여넣기</span>
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handlePasteItemFromClipboard()}
                                              style={{
                                                ...styles.btnSecondary,
                                                color: '#047857',
                                                backgroundColor: '#ECFDF5',
                                                borderColor: '#A7F3D0',
                                                fontWeight: 600
                                              }}
                                              title={`복사한 항목('${detailClipboard.title}') 붙여넣기`}
                                            >
                                              <Copy size={13} />
                                              <span>항목 붙여넣기</span>
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={handleClearDetailClipboard}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: '24px',
                                              height: isMobile ? '28px' : '30px',
                                              border: '1px solid #CBD5E1',
                                              borderRadius: '6px',
                                              backgroundColor: '#FFFFFF',
                                              color: '#64748B',
                                              cursor: 'pointer',
                                              padding: 0
                                            }}
                                            title="복사한 내용 지우기"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Detail Content: Always interactive DetailBlocksManager */}
                                  <DetailBlocksManager
                                    blocks={checklistDetailBlocks}
                                    onChangeAndSave={(newBlocks) => handleSaveChecklistDetail(selectedCheckItem.id, newBlocks)}
                                    searchQuery={searchQuery}
                                    editingBlockId={editingBlockId}
                                    setEditingBlockId={setEditingBlockId}
                                    openDeleteModal={openDeleteModal}
                                    onOpenMoveModal={handleOpenMoveBlockModal}
                                    onCopyBlock={handleCopyBlockToClipboard}
                                    onCopyBlockAsText={handleCopyBlockAsPlainText}
                                    onCopyItem={handleCopyItemToClipboard}
                                    detailClipboard={detailClipboard}
                                    onPasteItemToChecklist={handlePasteItemFromClipboard}
                                    collapsedBlockIds={detailCollapsedBlockIds}
                                    setCollapsedBlockIds={updateDetailCollapsedBlockIds}
                                    isMobile={isMobile}
                                    onCreateEvent={handleOpenCreateEventFromBlock}
                                  />
                              </>
                            );
                          })()
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Footer for Pane 3 Detail */}
              {isMobile && renderMobileFooter(
                <div style={{
                  ...styles.mobileTabBar,
                  borderBottom: 'none',
                  borderTop: '1px solid #CBD5E1'
                }}>
                  <button
                    onClick={() => setMobileSubTab('main')}
                    style={{
                      ...styles.mobileTabBtn,
                      backgroundColor: mobileSubTab === 'main' ? '#2563EB' : '#FFFFFF',
                      color: mobileSubTab === 'main' ? '#FFFFFF' : '#475569',
                      borderColor: mobileSubTab === 'main' ? '#2563EB' : '#CBD5E1'
                    }}
                  >
                    ☑️ 체크리스트
                  </button>
                  <button
                    onClick={() => setMobileSubTab('sub')}
                    style={{
                      ...styles.mobileTabBtn,
                      backgroundColor: mobileSubTab === 'sub' ? '#2563EB' : '#FFFFFF',
                      color: mobileSubTab === 'sub' ? '#FFFFFF' : '#475569',
                      borderColor: mobileSubTab === 'sub' ? '#2563EB' : '#CBD5E1'
                    }}
                  >
                    📝 항목 상세내용
                  </button>
                </div>
              )}
    </>
  );
}
