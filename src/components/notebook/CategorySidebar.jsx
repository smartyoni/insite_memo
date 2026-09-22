import React from 'react';
import {
  Folder,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  MoreVertical,
  Layout,
  Zap,
  X,
  ChevronsDown,
  ChevronsUp,
  Search
} from 'lucide-react';
import { styles } from './notebookStyles';
import {
  ALL_FIXED_CATEGORY_IDS,
  FIXED_TRASH_IDS,
  QUICK_MEMO_CATEGORY
} from './notebookConstants';

function CategorySidebar(props) {
  const {
    sidebarRef,
    isMobile,
    mobileView,
    setMobileView,
    activeMainTab,
    currentUser,
    renderMainModeBar,
    renderUserBar,
    renderMobileFooter,
    templates,
    handleCreateNewTemplateInTab,
    handleSelectTemplateInTab,
    handleDeleteTemplateInTab,
    selectedTemplateIdInTab,
    handleExpandAllCategories,
    handleCollapseAllCategories,
    handleAddCategory,
    isAddingCategory,
    setIsAddingCategory,
    newCategoryName,
    setNewCategoryName,
    handleAddCategoryGroup,
    isAddingCategoryGroup,
    setIsAddingCategoryGroup,
    newCategoryGroupName,
    setNewCategoryGroupName,
    displayedCategoryGrouped,
    currentScopeCategoryGroups,
    categories,
    filteredCategories,
    items,
    selectedCategoryId,
    navigateToItems,
    draggedCategoryId,
    setDraggedCategoryId,
    dragOverCategoryId,
    setDragOverCategoryId,
    draggedItemId,
    setDraggedItemId,
    dragOverCategoryGroupId,
    setDragOverCategoryGroupId,
    openCategoryGroupMenuId,
    setOpenCategoryGroupMenuId,
    openCategoryGroupMenuPos,
    handleOpenCategoryGroupMenu,
    handleMoveCategoryGroup,
    handleDeleteCategoryGroup,
    handleStartAddCategoryToGroup,
    addingCategoryGroupId,
    setAddingCategoryGroupId,
    editingCategoryGroupId,
    setEditingCategoryGroupId,
    editingCategoryGroupName,
    setEditingCategoryGroupName,
    handleUpdateCategoryGroupName,
    openCatMenuId,
    setOpenCatMenuId,
    openCatMenuPos,
    handleOpenCatMenu,
    editingCategoryId,
    setEditingCategoryId,
    editingCategoryName,
    setEditingCategoryName,
    handleUpdateCategoryName,
    openDeleteCategoryModal,
    handleDropCategoryOnCategory,
    handleDropCategoryOnGroup,
    handleCategoryContextMenu,
    collapsedCategoryGroups,
    toggleCategoryGroupCollapse,
    currentFixedTrashCategory,
    searchQuery,
    setSearchQuery
  } = props;

  const searchLower = (searchQuery || '').trim().toLowerCase();

  if (isMobile && mobileView !== 'categories') return null;

  return (
    <div
      ref={sidebarRef}
      style={{
        ...styles.pane1,
        width: isMobile ? '100%' : '280px',
        minWidth: isMobile ? '100%' : '280px'
      }}
    >
          {/* Main Mode Tab Switcher & Header for Desktop */}
          {!isMobile && renderMainModeBar()}

          {/* Mobile Top Header: Login Management Bar + Category Add Bar */}
          {isMobile && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#E2ECF7',
              borderBottom: '1px solid #D4E3F3',
              flexShrink: 0
            }}>
              {currentUser && (
                <div style={{ padding: '8px 10px 4px 10px' }}>
                  {renderUserBar()}
                </div>
              )}
              {activeMainTab === 'template' ? (
                <div style={{
                  ...styles.pane1Header,
                  backgroundColor: 'transparent',
                  borderBottom: 'none',
                  height: '44px',
                  padding: '0 12px 0 16px',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ ...styles.pane1Title, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layout size={16} color="#2563EB" />
                    템플릿1 목록 ({templates.length})
                  </span>
                  <button
                    onClick={handleCreateNewTemplateInTab}
                    style={styles.iconBtnDark}
                    title="새 템플릿1 만들기"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : activeMainTab !== 'calendar' ? (
                <div style={{
                  ...styles.pane1Header,
                  backgroundColor: 'transparent',
                  borderBottom: 'none',
                  height: '44px',
                  padding: '0 12px 0 16px'
                }}>
                  <span style={styles.pane1Title}>카테고리</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* 모바일 카테고리 전체 펼치기 / 전체 접기 버튼 */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        padding: '1px 2px',
                        gap: '1px',
                        height: '28px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                      title="카테고리 전체 펼치기 / 전체 접기"
                    >
                      <button
                        type="button"
                        onClick={handleExpandAllCategories}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '100%',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#475569',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="모든 카테고리 펼치기 (︾)"
                      >
                        <ChevronsDown size={14} />
                      </button>
                      <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />
                      <button
                        type="button"
                        onClick={handleCollapseAllCategories}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '100%',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#475569',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="모든 카테고리 접기 (︽)"
                      >
                        <ChevronsUp size={14} />
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        overflow: 'hidden',
                        height: '28px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategoryGroup((prev) => !prev);
                          setNewCategoryGroupName('');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 8px',
                          height: '100%',
                          border: 'none',
                          borderRight: '1px solid #E2E8F0',
                          backgroundColor: isAddingCategoryGroup ? '#DCFCE7' : 'transparent',
                          color: isAddingCategoryGroup ? '#059669' : '#334155',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="새 카테고리 그룹 추가"
                      >
                        그룹
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(true);
                          setAddingCategoryGroupId(null);
                          setAddingParentId(null);
                          setNewCategoryName('');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 9px',
                          height: '100%',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#059669',
                          fontSize: '15px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="최상위 카테고리 추가"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeMainTab === 'template' ? (
            <>
              {!isMobile && (
                <div style={{ ...styles.pane1Header, justifyContent: 'space-between' }}>
                  <span style={{ ...styles.pane1Title, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layout size={16} color="#2563EB" />
                    템플릿1 목록 ({templates.length})
                  </span>
                  <button
                    onClick={handleCreateNewTemplateInTab}
                    style={styles.iconBtnDark}
                    title="새 템플릿1 만들기"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}

              <div style={{ ...styles.paneContent, padding: '10px' }}>
                {templates.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#7C95B1', fontSize: '13px' }}>
                    등록된 템플릿1이 없습니다.<br />위 <strong>[+]</strong> 버튼을 눌러 새 템플릿을 만들어보세요.
                  </div>
                ) : (
                  templates.map((tpl) => {
                    const isSelected = selectedTemplateIdInTab === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          handleSelectTemplateInTab(tpl);
                          if (isMobile) setMobileView('detail');
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: `1px solid ${isSelected ? '#3B82F6' : 'transparent'}`,
                          backgroundColor: isSelected ? '#D8E6F5' : 'rgba(255, 255, 255, 0.05)',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? '#1E3A5F' : '#2B5278', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📋 {tpl.title || '제목 없는 템플릿'}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplateInTab(tpl.id);
                          }}
                          style={styles.actionBtnDark}
                          title="템플릿 삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {isMobile && renderMobileFooter(null, false)}
            </>
          ) : activeMainTab !== 'calendar' ? (
            <>
              {!isMobile && (
                <div style={styles.pane1Header}>
                  <span style={styles.pane1Title}>
                    카테고리 ({filteredCategories.length})
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {/* 카테고리 전체 펼치기 / 전체 접기 컴팩트 버튼 */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        padding: '1px 2px',
                        gap: '1px',
                        height: '27px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                      className="no-print"
                      title="카테고리 전체 펼치기 / 전체 접기"
                    >
                      <button
                        type="button"
                        onClick={handleExpandAllCategories}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '22px',
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
                          e.currentTarget.style.backgroundColor = '#F1F5F9';
                          e.currentTarget.style.color = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#475569';
                        }}
                        title="모든 카테고리 펼치기 (︾)"
                      >
                        <ChevronsDown size={13} />
                      </button>
                      <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />
                      <button
                        type="button"
                        onClick={handleCollapseAllCategories}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '22px',
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
                          e.currentTarget.style.backgroundColor = '#F1F5F9';
                          e.currentTarget.style.color = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#475569';
                        }}
                        title="모든 카테고리 접기 (︽)"
                      >
                        <ChevronsUp size={13} />
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        overflow: 'hidden',
                        height: '27px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategoryGroup((prev) => !prev);
                          setNewCategoryGroupName('');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 8px',
                          height: '100%',
                          border: 'none',
                          borderRight: '1px solid #E2E8F0',
                          backgroundColor: isAddingCategoryGroup ? '#DCFCE7' : 'transparent',
                          color: isAddingCategoryGroup ? '#059669' : '#334155',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="새 카테고리 그룹 추가"
                      >
                        그룹
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(true);
                          setAddingCategoryGroupId(null);
                          setNewCategoryName('');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 9px',
                          height: '100%',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#059669',
                          fontSize: '15px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="카테고리 추가"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Inline input for creating new category group */}
              {isAddingCategoryGroup && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#F0FDF4',
                  borderBottom: '1px solid #86EFAC',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FolderPlus size={16} color="#059669" style={{ flexShrink: 0 }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="새 카테고리 그룹명 입력..."
                    value={newCategoryGroupName}
                    onChange={(e) => setNewCategoryGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.nativeEvent.isComposing) return;
                        handleAddCategoryGroup();
                      }
                      if (e.key === 'Escape') {
                        setIsAddingCategoryGroup(false);
                        setNewCategoryGroupName('');
                      }
                    }}
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #10B981',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategoryGroup}
                    style={{ ...styles.btnPrimary, backgroundColor: '#059669', padding: '4px 8px', fontSize: '11px' }}
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategoryGroup(false);
                      setNewCategoryGroupName('');
                    }}
                    style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: '11px' }}
                  >
                    취소
                  </button>
                </div>
              )}

              <div style={{ ...styles.paneContent, padding: 0 }}>
                {/* Fixed Quick-memo Category (Only in explorer/note tab) */}
                {activeMainTab === 'explorer' && (() => {
                  const isSelected = QUICK_MEMO_CATEGORY.id === selectedCategoryId;
                  const isDropTarget = dragOverCategoryId === QUICK_MEMO_CATEGORY.id;
                  const count = items.filter((item) => {
                    if (item.isDeleted || FIXED_TRASH_IDS.includes(item.categoryId)) return false;
                    return item.categoryId === QUICK_MEMO_CATEGORY.id;
                  }).length;

                  return (
                    <div
                      key={QUICK_MEMO_CATEGORY.id}
                      onDragOver={(e) => {
                        if (draggedItemId) {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverCategoryId(QUICK_MEMO_CATEGORY.id);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation();
                        if (dragOverCategoryId === QUICK_MEMO_CATEGORY.id) {
                          setDragOverCategoryId(null);
                        }
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverCategoryId(null);
                        if (draggedItemId) {
                          const itemId = draggedItemId;
                          setDraggedItemId(null);
                          try {
                            await updateDoc(doc(db, 'items', itemId), {
                              categoryId: QUICK_MEMO_CATEGORY.id,
                              updatedAt: serverTimestamp()
                            });
                          } catch (err) {
                            console.error('Error moving item to quick memo:', err);
                          }
                        }
                      }}
                      onClick={() => navigateToItems(QUICK_MEMO_CATEGORY.id)}
                      onContextMenu={(e) => handleCategoryContextMenu(e, QUICK_MEMO_CATEGORY)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        marginBottom: '2px',
                        backgroundColor: isDropTarget ? '#FEF08A' : isSelected ? '#FEF3C7' : '#FFFFFF',
                        borderBottom: '1px solid #E2E8F0',
                        boxShadow: isSelected ? 'inset 3px 0 0 #D97706' : 'none',
                        color: isSelected ? '#92400E' : '#1E293B',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <Zap size={15} color={isSelected ? '#D97706' : '#F59E0B'} fill={isSelected ? '#F59E0B' : 'transparent'} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {QUICK_MEMO_CATEGORY.name}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        color: isSelected ? '#D97706' : '#94A3B8',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        ({count})
                      </span>
                    </div>
                  );
                })()}

                {/* Inline input for creating category at root/unassigned */}
                {isAddingCategory && addingCategoryGroupId === null && (
                  <div style={{
                    padding: '8px 10px',
                    margin: '4px 6px 6px 6px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '6px',
                    border: '1.5px solid #10B981',
                    boxShadow: '0 2px 5px rgba(16,185,129,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <input
                      autoFocus
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (e.nativeEvent.isComposing) return;
                          handleAddCategory();
                        }
                        if (e.key === 'Escape') {
                          setIsAddingCategory(false);
                          setNewCategoryName('');
                        }
                      }}
                      placeholder="새 카테고리명 입력..."
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: '#1E293B',
                        backgroundColor: 'transparent'
                      }}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleAddCategory}
                      style={{ ...styles.btnPrimary, backgroundColor: '#059669', padding: '4px 8px', fontSize: '11px', flexShrink: 0 }}
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }}
                      style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: '11px', flexShrink: 0 }}
                    >
                      취소
                    </button>
                  </div>
                )}

                {/* Categories Grouped Rendering */}
                {filteredCategories.length === 0 && currentScopeCategoryGroups.length === 0 && !isAddingCategory ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                    등록된 카테고리가 없습니다.
                  </div>
                ) : (
                  displayedCategoryGrouped.map((groupObj, groupIdx) => {
                    const { group, categories: grpCats } = groupObj;
                    const isSecCollapsed = group ? Boolean(collapsedCategoryGroups[group.id]) : false;
                    const isSecEditing = group ? editingCategoryGroupId === group.id : false;
                    const isFirstGroup = groupIdx === 0;
                    const isLastGroup = groupIdx === displayedCategoryGrouped.length - 1;
                    const isGroupDragOver = group && dragOverCategoryGroupId === group.id;

                    return (
                      <div
                        key={group ? group.id : 'default_cat_grp'}
                        onDragOver={(e) => {
                          if (!draggedCategoryId) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (group && dragOverCategoryGroupId !== group.id) {
                            setDragOverCategoryGroupId(group.id);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            if (group && dragOverCategoryGroupId === group.id) {
                              setDragOverCategoryGroupId(null);
                            }
                          }
                        }}
                        onDrop={(e) => {
                          if (!draggedCategoryId) return;
                          handleDropCategoryOnGroup(e, group?.id);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          marginBottom: group ? '2px' : '0',
                          borderRadius: 0,
                          overflow: 'hidden',
                          border: group
                            ? isGroupDragOver
                              ? '2px dashed #059669'
                              : '1px solid #CBD5E1'
                            : 'none',
                          borderLeft: isGroupDragOver ? undefined : 'none',
                          borderRight: isGroupDragOver ? undefined : 'none',
                          backgroundColor: '#FFFFFF',
                          boxShadow: 'none'
                        }}
                      >
                        {/* 녹색 그룹 헤더 바 */}
                        {group && (
                          <div
                            onDragOver={(e) => {
                              if (!draggedCategoryId) return;
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverCategoryGroupId !== group.id) {
                                setDragOverCategoryGroupId(group.id);
                              }
                            }}
                            onDrop={(e) => {
                              if (!draggedCategoryId) return;
                              e.preventDefault();
                              e.stopPropagation();
                              handleDropCategoryOnGroup(e, group.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: isMobile ? '4px' : '6px',
                              height: isMobile ? '22px' : '24px',
                              padding: isMobile ? '1px 0 1px 6px' : '1px 0 1px 8px',
                              boxSizing: 'border-box',
                              backgroundColor: isGroupDragOver ? '#DCFCE7' : '#BBF7D0',
                              border: 'none',
                              borderBottom: isSecCollapsed ? 'none' : '1px solid #86EFAC',
                              borderRadius: '0',
                              boxShadow: 'none',
                              cursor: isSecEditing ? 'default' : 'pointer',
                              userSelect: 'none'
                            }}
                            onClick={() => {
                              if (!isSecEditing) {
                                toggleCategoryGroupCollapse(group.id);
                              }
                            }}
                          >
                            {/* 좌측: 토글 화살표 + 그룹명 */}
                            {isSecEditing ? (
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editingCategoryGroupName}
                                  onChange={(e) => setEditingCategoryGroupName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleUpdateCategoryGroupName(group.id);
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      setEditingCategoryGroupId(null);
                                    }
                                  }}
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#064E3B',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #059669',
                                    outline: 'none',
                                    flex: 1
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCategoryGroupName(group.id)}
                                  style={{ ...styles.btnPrimary, backgroundColor: '#059669', padding: '2px 8px', fontSize: '11px' }}
                                >
                                  저장
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategoryGroupId(null)}
                                  style={{ ...styles.btnSecondary, padding: '2px 8px', fontSize: '11px' }}
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                <span
                                  style={{ display: 'flex', alignItems: 'center', color: '#047857' }}
                                  title={isSecCollapsed ? '펼치기' : '접기'}
                                >
                                  {isSecCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </span>
                                <span
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (group.isUnassigned) return;
                                    setEditingCategoryGroupId(group.id);
                                    setEditingCategoryGroupName(group.name);
                                  }}
                                  title={group.isUnassigned ? undefined : "더블클릭하여 그룹 이름 수정"}
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#064E3B',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: group.isUnassigned ? 'default' : 'text'
                                  }}
                                >
                                  {group.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    color: '#047857',
                                    opacity: 0.85,
                                    fontWeight: 600,
                                    backgroundColor: '#A7F3D0',
                                    padding: '0 4px',
                                    borderRadius: '8px',
                                    lineHeight: 1.2
                                  }}
                                  title={`하위 카테고리 ${grpCats.length}개`}
                                >
                                  {grpCats.length}
                                </span>
                              </div>
                            )}

                            {/* 우측 버튼 탭 (미분류가 아닐 때: + 버튼과 3점 메뉴만 노출) */}
                            {!isSecEditing && !group.isUnassigned && (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #A7F3D0',
                                  borderRight: 'none',
                                  borderTopRightRadius: 0,
                                  borderBottomRightRadius: 0,
                                  borderTopLeftRadius: '4px',
                                  borderBottomLeftRadius: '4px',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                  height: isMobile ? '18px' : '20px',
                                  flexShrink: 0
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* 1. 카테고리 추가 (+) 버튼 */}
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartAddCategoryToGroup(group.id);
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
                                    color: '#059669',
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                  title="이 그룹에 카테고리 추가"
                                >
                                  <Plus size={isMobile ? 12 : 13} strokeWidth={2.5} />
                                </button>

                                {/* 2. 3점 더보기 (⋮) 메뉴 버튼 */}
                                <div style={{ position: 'relative', height: '100%' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenCategoryGroupMenu(e, group.id)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: isMobile ? '20px' : '22px',
                                      height: '100%',
                                      border: 'none',
                                      backgroundColor: openCategoryGroupMenuId === group.id ? '#DCFCE7' : 'transparent',
                                      color: openCategoryGroupMenuId === group.id ? '#059669' : '#047857',
                                      cursor: 'pointer',
                                      padding: 0,
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (openCategoryGroupMenuId !== group.id) e.currentTarget.style.backgroundColor = '#F0FDF4';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (openCategoryGroupMenuId !== group.id) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    title="그룹 메뉴"
                                  >
                                    <MoreVertical size={isMobile ? 12 : 13} strokeWidth={2.5} />
                                  </button>

                                  {/* 3점 드롭다운 팝업 메뉴 */}
                                  {openCategoryGroupMenuId === group.id && (
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
                                          setOpenCategoryGroupMenuId(null);
                                        }}
                                      />
                                      <div
                                        style={{
                                          ...styles.checklistDropdownMenu,
                                          top: openCategoryGroupMenuPos?.top ?? 0,
                                          right: openCategoryGroupMenuPos?.right ?? 0,
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
                                            setOpenCategoryGroupMenuId(null);
                                            handleMoveCategoryGroup(group.id, 'top');
                                          }}
                                          style={{
                                            ...styles.checklistDropdownItem,
                                            opacity: isFirstGroup ? 0.4 : 1,
                                            cursor: isFirstGroup ? 'not-allowed' : 'pointer'
                                          }}
                                          onMouseEnter={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                          onMouseLeave={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                          <ChevronsUp size={15} color={isFirstGroup ? '#94A3B8' : '#047857'} strokeWidth={2.2} />
                                          <span>맨 위로 이동</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isFirstGroup}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenCategoryGroupMenuId(null);
                                            handleMoveCategoryGroup(group.id, 'up');
                                          }}
                                          style={{
                                            ...styles.checklistDropdownItem,
                                            opacity: isFirstGroup ? 0.4 : 1,
                                            cursor: isFirstGroup ? 'not-allowed' : 'pointer'
                                          }}
                                          onMouseEnter={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                          onMouseLeave={(e) => { if (!isFirstGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                          <ChevronUp size={15} color={isFirstGroup ? '#94A3B8' : '#047857'} strokeWidth={2.2} />
                                          <span>위로 이동</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isLastGroup}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenCategoryGroupMenuId(null);
                                            handleMoveCategoryGroup(group.id, 'down');
                                          }}
                                          style={{
                                            ...styles.checklistDropdownItem,
                                            opacity: isLastGroup ? 0.4 : 1,
                                            cursor: isLastGroup ? 'not-allowed' : 'pointer'
                                          }}
                                          onMouseEnter={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                          onMouseLeave={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                          <ChevronDown size={15} color={isLastGroup ? '#94A3B8' : '#047857'} strokeWidth={2.2} />
                                          <span>아래로 이동</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isLastGroup}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenCategoryGroupMenuId(null);
                                            handleMoveCategoryGroup(group.id, 'bottom');
                                          }}
                                          style={{
                                            ...styles.checklistDropdownItem,
                                            opacity: isLastGroup ? 0.4 : 1,
                                            cursor: isLastGroup ? 'not-allowed' : 'pointer'
                                          }}
                                          onMouseEnter={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                          onMouseLeave={(e) => { if (!isLastGroup) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                          <ChevronsDown size={15} color={isLastGroup ? '#94A3B8' : '#047857'} strokeWidth={2.2} />
                                          <span>맨 아래로 이동</span>
                                        </button>

                                        <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }} />

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenCategoryGroupMenuId(null);
                                            setEditingCategoryGroupId(group.id);
                                            setEditingCategoryGroupName(group.name);
                                          }}
                                          style={styles.checklistDropdownItem}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          <Edit2 size={14} color="#475569" />
                                          <span>그룹 이름 변경</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenCategoryGroupMenuId(null);
                                            handleDeleteCategoryGroup(group.id);
                                          }}
                                          style={{ ...styles.checklistDropdownItem, color: '#DC2626' }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          <Trash2 size={14} color="#DC2626" />
                                          <span>그룹 삭제</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 그룹 소속 카테고리 렌더링 */}
                        {!isSecCollapsed && (
                          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
                            {/* 그룹 내 인라인 카테고리 추가창 */}
                            {isAddingCategory && addingCategoryGroupId === (group ? group.id : null) && (
                              <div style={{
                                padding: '6px 8px',
                                margin: '4px 6px 6px 6px',
                                backgroundColor: '#F0FDF4',
                                borderRadius: '4px',
                                border: '1.5px solid #10B981',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <input
                                  autoFocus
                                  type="text"
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (e.nativeEvent.isComposing) return;
                                      handleAddCategory();
                                    }
                                    if (e.key === 'Escape') {
                                      setIsAddingCategory(false);
                                      setNewCategoryName('');
                                      setAddingCategoryGroupId(null);
                                    }
                                  }}
                                  placeholder="새 카테고리명 입력..."
                                  style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#1E293B',
                                    backgroundColor: 'transparent'
                                  }}
                                />
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={handleAddCategory}
                                  style={{
                                    ...styles.btnPrimary,
                                    backgroundColor: '#059669',
                                    padding: '3px 8px',
                                    fontSize: '11px',
                                    flexShrink: 0
                                  }}
                                >
                                  추가
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setIsAddingCategory(false);
                                    setNewCategoryName('');
                                    setAddingCategoryGroupId(null);
                                  }}
                                  style={{
                                    ...styles.btnSecondary,
                                    padding: '3px 8px',
                                    fontSize: '11px',
                                    flexShrink: 0
                                  }}
                                >
                                  취소
                                </button>
                              </div>
                            )}

                            {grpCats.length === 0 && (!isAddingCategory || addingCategoryGroupId !== (group ? group.id : null)) ? (
                              <div style={{
                                padding: '10px 12px',
                                fontSize: '11.5px',
                                color: '#94A3B8',
                                backgroundColor: '#F8FAFC',
                                textAlign: 'center'
                              }}>
                                카테고리를 드래그하거나 [+] 버튼으로 추가하세요.
                              </div>
                            ) : (
                              grpCats.map((cat, catIdx) => {
                                const isSelected = cat.id === selectedCategoryId;
                                const isEditing = cat.id === editingCategoryId;
                                const isDropTarget = dragOverCategoryId === cat.id;
                                const isDragged = draggedCategoryId === cat.id;
                                const count = items.filter((item) => item.categoryId === cat.id && !item.isDeleted && !FIXED_TRASH_IDS.includes(item.categoryId)).length;

                                return (
                                  <div
                                    key={cat.id}
                                    draggable={!isEditing}
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      e.dataTransfer.setData('text/plain', cat.id);
                                      e.dataTransfer.effectAllowed = 'move';
                                      setDraggedCategoryId(cat.id);
                                    }}
                                    onDragOver={(e) => {
                                      if (draggedCategoryId && draggedCategoryId !== cat.id) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.dataTransfer.dropEffect = 'move';
                                        if (dragOverCategoryId !== cat.id) {
                                          setDragOverCategoryId(cat.id);
                                        }
                                        if (group && dragOverCategoryGroupId !== group.id) {
                                          setDragOverCategoryGroupId(group.id);
                                        }
                                        return;
                                      }
                                      if (draggedItemId) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.dataTransfer.dropEffect = 'move';
                                        if (dragOverCategoryId !== cat.id) {
                                          setDragOverCategoryId(cat.id);
                                        }
                                        if (group && dragOverCategoryGroupId !== group.id) {
                                          setDragOverCategoryGroupId(group.id);
                                        }
                                      }
                                    }}
                                    onDragLeave={(e) => {
                                      e.stopPropagation();
                                      if (!e.currentTarget.contains(e.relatedTarget)) {
                                        if (dragOverCategoryId === cat.id) {
                                          setDragOverCategoryId(null);
                                        }
                                      }
                                    }}
                                    onDrop={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const isCatDrag = Boolean(draggedCategoryId);
                                      const isItemDrag = Boolean(draggedItemId);
                                      setDragOverCategoryId(null);
                                      if (isCatDrag) {
                                        handleDropCategoryOnCategory(e, cat, group?.id);
                                      } else if (isItemDrag) {
                                        const itemId = draggedItemId || e.dataTransfer.getData('text/plain');
                                        setDraggedItemId(null);
                                        try {
                                          await updateDoc(doc(db, 'items', itemId), {
                                            categoryId: cat.id,
                                            updatedAt: serverTimestamp()
                                          });
                                        } catch (err) {
                                          console.error('Error moving item to category:', err);
                                        }
                                      }
                                    }}
                                    onDragEnd={() => {
                                      setDraggedCategoryId(null);
                                      setDragOverCategoryId(null);
                                      setDragOverCategoryGroupId(null);
                                    }}
                                    onClick={() => {
                                      if (!isEditing) {
                                        navigateToItems(cat.id);
                                      }
                                    }}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      if (ALL_FIXED_CATEGORY_IDS.includes(cat.id)) return;
                                      setEditingCategoryId(cat.id);
                                      setEditingCategoryName(cat.name);
                                    }}
                                    onContextMenu={(e) => handleCategoryContextMenu(e, cat)}
                                    style={{
                                      padding: isMobile ? '7px 8px' : '8px 10px',
                                      backgroundColor: isDropTarget
                                        ? '#DCFCE7'
                                        : isSelected
                                        ? '#ECFDF5'
                                        : '#FFFFFF',
                                      borderBottom: catIdx < grpCats.length - 1 ? '1px solid #F1F5F9' : 'none',
                                      boxShadow: isSelected ? 'inset 3px 0 0 #059669' : 'none',
                                      color: isSelected ? '#065F46' : '#1E293B',
                                      fontWeight: isSelected ? 700 : 500,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '8px',
                                      userSelect: 'none',
                                      opacity: isDragged ? 0.4 : 1,
                                      transition: 'background-color 0.15s ease'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}>
                                      <Folder size={15} color={isSelected ? '#059669' : '#64748B'} style={{ flexShrink: 0 }} />
                                      {isEditing ? (
                                        <input
                                          autoFocus
                                          type="text"
                                          value={editingCategoryName}
                                          onChange={(e) => setEditingCategoryName(e.target.value)}
                                          onFocus={(e) => e.target.select()}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdateCategoryName(cat.id);
                                            if (e.key === 'Escape') setEditingCategoryId(null);
                                          }}
                                          onBlur={() => handleUpdateCategoryName(cat.id)}
                                          style={{
                                            ...styles.inputLightInline,
                                            border: '1px solid #10B981',
                                            flex: 1
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          onDoubleClick={(e) => e.stopPropagation()}
                                        />
                                      ) : (
                                        <span
                                          title="더블클릭하여 카테고리명 수정"
                                          style={{
                                            fontSize: '13px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          {cat.name}
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                      <span style={{
                                        fontSize: '11px',
                                        color: isSelected ? '#059669' : '#94A3B8',
                                        fontWeight: 600
                                      }}>
                                        ({count})
                                      </span>
                                      {!ALL_FIXED_CATEGORY_IDS.includes(cat.id) && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={(e) => handleOpenCatMenu(e, cat.id)}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: isMobile ? '22px' : '20px',
                                              height: isMobile ? '22px' : '20px',
                                              border: 'none',
                                              backgroundColor: openCatMenuId === cat.id ? '#DCFCE7' : 'transparent',
                                              color: openCatMenuId === cat.id ? '#059669' : '#64748B',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              padding: 0,
                                              transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                              if (openCatMenuId !== cat.id) e.currentTarget.style.backgroundColor = '#F1F5F9';
                                            }}
                                            onMouseLeave={(e) => {
                                              if (openCatMenuId !== cat.id) e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                            title="카테고리 메뉴"
                                          >
                                            <MoreVertical size={13} strokeWidth={2.2} />
                                          </button>

                                          {/* 3점 드롭다운 팝업 메뉴 (수정, 삭제, 취소) */}
                                          {openCatMenuId === cat.id && (
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
                                                  setOpenCatMenuId(null);
                                                }}
                                              />
                                              <div
                                                style={{
                                                  ...styles.checklistDropdownMenu,
                                                  top: openCatMenuPos?.top ?? 0,
                                                  right: openCatMenuPos?.right ?? 0,
                                                  minWidth: '130px',
                                                  padding: '4px',
                                                  zIndex: 10000
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenCatMenuId(null);
                                                    setEditingCategoryId(cat.id);
                                                    setEditingCategoryInput(cat.name);
                                                  }}
                                                  style={styles.checklistDropdownItem}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                  <Edit2 size={13} color="#475569" />
                                                  <span>수정</span>
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenCatMenuId(null);
                                                    openDeleteCategoryModal(cat);
                                                  }}
                                                  style={{ ...styles.checklistDropdownItem, color: '#DC2626' }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                  <Trash2 size={13} color="#DC2626" />
                                                  <span>삭제</span>
                                                </button>

                                                <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '3px 0' }} />

                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenCatMenuId(null);
                                                  }}
                                                  style={{ ...styles.checklistDropdownItem, color: '#64748B' }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                  <X size={13} color="#94A3B8" />
                                                  <span>취소</span>
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Fixed Trash Category at bottom */}
                {(() => {
                  const isSelected = currentFixedTrashCategory.id === selectedCategoryId;
                  const count = items.filter((item) => {
                    return (
                      item.categoryId === currentFixedTrashCategory.id ||
                      (item.isDeleted && (item.categoryId === currentFixedTrashCategory.id || item.deletedTab === activeMainTab))
                    );
                  }).length;

                  return (
                    <div style={{ marginTop: '14px', paddingTop: '6px' }}>
                      <div style={{ height: '1px', backgroundColor: '#CBD5E1', margin: '4px 4px 6px 4px' }} />
                      <div
                        key={currentFixedTrashCategory.id}
                        onClick={() => navigateToItems(currentFixedTrashCategory.id)}
                        style={{
                          ...styles.catRow,
                          backgroundColor: isSelected ? '#FEE2E2' : 'transparent',
                          color: isSelected ? '#991B1B' : '#64748B',
                          fontWeight: isSelected ? 600 : 400,
                          paddingLeft: '6px',
                          paddingRight: '6px',
                          paddingTop: '6px',
                          paddingBottom: '6px',
                          gap: '6px'
                        }}
                      >
                        <span style={{ width: 14, height: 14, flexShrink: 0 }} />
                        <Trash2 size={16} color={isSelected ? '#DC2626' : '#94A3B8'} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                            {currentFixedTrashCategory.name}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: isSelected ? '#DC2626' : '#94A3B8',
                            fontWeight: isSelected ? 700 : 500,
                            flexShrink: 0
                          }}>
                            ({count})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Global Search Input Bar under Trash */}
                <div style={{ padding: '8px 8px 12px 8px', marginTop: '4px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    border: '1px solid #CBD5E1',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}>
                    <Search
                      size={14}
                      color="#64748B"
                      style={{ marginRight: '6px', flexShrink: 0, cursor: isMobile ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (isMobile && searchLower.length > 0) {
                          setMobileView('items');
                        }
                      }}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (e.nativeEvent?.isComposing) return;
                          if (isMobile && searchLower.length > 0) {
                            setMobileView('items');
                          }
                        }
                      }}
                      placeholder="전체 메모/체크리스트 내용 검색..."
                      style={{
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        width: '100%',
                        fontSize: '12px',
                        color: '#1E293B'
                      }}
                    />
                    {isMobile && searchLower.length > 0 && (
                      <button
                        onClick={() => setMobileView('items')}
                        style={{
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginRight: '4px',
                          flexShrink: 0
                        }}
                      >
                        보기
                      </button>
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
                        title="검색어 지우기"
                      >
                        <X size={14} color="#64748B" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Footer for Pane 1 */}
              {isMobile && renderMobileFooter(null, false)}
            </>
          ) : (
            <>
              {/* Calendar Sidebar Area */}
              <div style={{ ...styles.paneContent, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#94A3B8', textAlign: 'center' }}>
                {/* Empty container for calendar mode sidebar */}
              </div>
              {isMobile && renderMobileFooter(null, false)}
            </>
          )}
    </div>
  );
}

export default React.memo(CategorySidebar, (prev, next) => {
  if (prev.isMobile !== next.isMobile) return false;
  if (prev.mobileView !== next.mobileView) return false;
  if (prev.activeMainTab !== next.activeMainTab) return false;
  if (prev.selectedCategoryId !== next.selectedCategoryId) return false;
  if (prev.categories !== next.categories) return false;
  if (prev.filteredCategories !== next.filteredCategories) return false;
  if (prev.displayedCategoryGrouped !== next.displayedCategoryGrouped) return false;
  if (prev.currentScopeCategoryGroups !== next.currentScopeCategoryGroups) return false;
  if (prev.items !== next.items) return false;
  if (prev.templates !== next.templates) return false;
  if (prev.selectedTemplateIdInTab !== next.selectedTemplateIdInTab) return false;
  if (prev.isAddingCategory !== next.isAddingCategory) return false;
  if (prev.newCategoryName !== next.newCategoryName) return false;
  if (prev.isAddingCategoryGroup !== next.isAddingCategoryGroup) return false;
  if (prev.newCategoryGroupName !== next.newCategoryGroupName) return false;
  if (prev.addingCategoryGroupId !== next.addingCategoryGroupId) return false;
  if (prev.editingCategoryId !== next.editingCategoryId) return false;
  if (prev.editingCategoryName !== next.editingCategoryName) return false;
  if (prev.editingCategoryGroupId !== next.editingCategoryGroupId) return false;
  if (prev.editingCategoryGroupName !== next.editingCategoryGroupName) return false;
  if (prev.openCatMenuId !== next.openCatMenuId) return false;
  if (prev.openCatMenuPos !== next.openCatMenuPos) return false;
  if (prev.openCategoryGroupMenuId !== next.openCategoryGroupMenuId) return false;
  if (prev.openCategoryGroupMenuPos !== next.openCategoryGroupMenuPos) return false;
  if (prev.dragOverCategoryId !== next.dragOverCategoryId) return false;
  if (prev.dragOverCategoryGroupId !== next.dragOverCategoryGroupId) return false;
  if (prev.draggedCategoryId !== next.draggedCategoryId) return false;
  if (prev.draggedItemId !== next.draggedItemId) return false;
  if (prev.collapsedCategoryGroups !== next.collapsedCategoryGroups) return false;
  if (prev.currentFixedTrashCategory !== next.currentFixedTrashCategory) return false;
  if (prev.searchQuery !== next.searchQuery) return false;
  if (prev.currentUser !== next.currentUser) return false;
  return true;
});
