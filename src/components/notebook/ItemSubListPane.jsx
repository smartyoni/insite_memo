import React from 'react';
import {
  Folder,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MoreVertical,
  Calendar,
  ArrowLeft,
  X,
  ChevronsDown,
  ChevronsUp
} from 'lucide-react';
import { styles } from './notebookStyles';
import { getScopeForTab, FIXED_TRASH_IDS } from './notebookConstants';
import CalendarCategoryList from '../CalendarCategoryList';

function ItemSubListPane(props) {
  const {
    isMobile,
    mobileView,
    setMobileView,
    activeMainTab,
    setActiveMainTab,
    isCalendarMode,
    calendarCategories,
    selectedCalendarCategoryId,
    setSelectedCalendarCategoryId,
    handleAddCalendarCategory,
    handleUpdateCalendarCategory,
    handleDeleteCalendarCategory,
    calendarEvents,
    renderMobileFooter,
    activeCategory,
    isSearchActive,
    searchQuery,
    setSearchQuery,
    displayedItems,
    displayedItemGrouped,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedItemId,
    navigateToDetail,
    items,
    categories,
    collapsedItemGroups,
    toggleItemGroupCollapse,
    handleExpandAllItemGroups,
    handleCollapseAllItemGroups,
    isAddingItemGroup,
    setIsAddingItemGroup,
    newItemGroupName,
    setNewItemGroupName,
    handleAddItemGroup,
    itemGroupTargetForNewItem,
    setItemGroupTargetForNewItem,
    handleAddItemToGroup,
    isAddingItem,
    setIsAddingItem,
    newItemTitle,
    setNewItemTitle,
    itemInputRef,
    handleAddItem,
    handleConfirmAddItem,
    editingItemGroupId,
    setEditingItemGroupId,
    editingItemGroupName,
    setEditingItemGroupName,
    handleUpdateItemGroupName,
    handleDeleteItemGroup,
    handleMoveItemGroup,
    openItemGroupMenuId,
    setOpenItemGroupMenuId,
    openItemGroupMenuPos,
    handleOpenItemGroupMenu,
    openNoteMenuId,
    setOpenNoteMenuId,
    openNoteMenuPos,
    handleOpenNoteMenu,
    editingItemId,
    setEditingItemId,
    editingItemTitle,
    setEditingItemTitle,
    handleUpdateItemTitle,
    itemScrollRef,
    draggedItemId,
    setDraggedItemId,
    dragOverItemId,
    setDragOverItemId,
    dragOverItemGroupId,
    setDragOverItemGroupId,
    handleDropItemOnItem,
    handleDropItemOnGroup,
    handleMoveToTrash,
    handleRestoreItem,
    handlePermanentDeleteItem,
    handleEmptyTrash,
    handleItemContextMenu,
    getItemMatchBadges,
    getMatchedSnippet,
    getCategoryBadgeName,
    setMovingItem,
    setTargetMoveItemTab,
    setTargetMoveCategoryGroupId,
    setTargetMoveItemCategoryId,
    setTargetMoveItemGroupId,
    mainTabs,
    navigateBack,
    openDeleteModal,
    deletingItemId
  } = props;

  const searchLower = (searchQuery || '').trim().toLowerCase();
  const isTrashSelected = FIXED_TRASH_IDS.includes(selectedCategoryId);

  if (activeMainTab === 'template') return null;
  if (isMobile && mobileView !== 'items') return null;

  return (
    <div
      style={{
        ...styles.pane2,
        width: isMobile ? '100%' : '308px',
        minWidth: isMobile ? '100%' : '308px'
      }}
    >
              {isCalendarMode ? (
                <>
                  <CalendarCategoryList
                    categories={calendarCategories}
                    selectedCategoryId={selectedCalendarCategoryId}
                    onSelectCategory={(catId) => {
                      setSelectedCalendarCategoryId(catId);
                      if (isMobile) setMobileView('detail');
                    }}
                    onAddCategory={handleAddCalendarCategory}
                    onUpdateCategory={handleUpdateCalendarCategory}
                    onDeleteCategory={handleDeleteCalendarCategory}
                    events={calendarEvents}
                  />
                  {isMobile && renderMobileFooter(
                    <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderTop: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button
                        onClick={() => setMobileView('categories')}
                        style={styles.mobileBackBtn}
                      >
                        <ArrowLeft size={16} /> 메뉴
                      </button>
                      <button
                        onClick={() => setMobileView('detail')}
                        style={{ ...styles.mobileBackBtn, color: '#2563EB', fontWeight: 700 }}
                      >
                        캘린더 보기 <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                {!isMobile ? (
                  <div style={{
                    ...styles.pane2Header,
                    padding: '0 8px 0 14px',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                      <span style={{
                        ...styles.pane2Title,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {isSearchActive ? '전체 검색 결과' : (activeCategory ? activeCategory.name : '목록')} ({displayedItems.length})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {!isTrashSelected && activeCategory && Array.isArray(activeCategory.itemGroups) && activeCategory.itemGroups.length > 0 && (
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
                          title="그룹 전체 펼치기 / 전체 접기"
                        >
                          <button
                            type="button"
                            onClick={handleExpandAllItemGroups}
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
                              e.currentTarget.style.color = '#2563EB';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#475569';
                            }}
                            title="모든 그룹 펼치기 (︾)"
                          >
                            <ChevronsDown size={13} />
                          </button>
                          <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />
                          <button
                            type="button"
                            onClick={handleCollapseAllItemGroups}
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
                              e.currentTarget.style.color = '#2563EB';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#475569';
                            }}
                            title="모든 그룹 접기 (︽)"
                          >
                            <ChevronsUp size={13} />
                          </button>
                        </div>
                      )}
                      {isTrashSelected ? (
                        displayedItems.length > 0 && (
                          <button
                            onClick={() => {
                              openDeleteModal(
                                '휴지통 비우기',
                                '휴지통의 모든 메모를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                                handleEmptyTrash
                              );
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: '5px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="휴지통 비우기"
                          >
                            <Trash2 size={13} />
                            <span>휴지통 비우기</span>
                          </button>
                        )
                      ) : (
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
                          {!isSearchActive && selectedCategoryId !== 'quick_memo' && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingItemGroup((prev) => !prev);
                                setNewItemGroupName('');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 9px',
                                height: '100%',
                                border: 'none',
                                borderRight: '1px solid #E2E8F0',
                                backgroundColor: isAddingItemGroup ? '#EFF6FF' : 'transparent',
                                color: isAddingItemGroup ? '#2563EB' : '#334155',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="새 그룹 추가"
                            >
                              그룹
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleAddItem}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 10px',
                              height: '100%',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#2563EB',
                              fontSize: '15px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="메모 추가"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: '52px',
                    padding: '0 8px 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    flexShrink: 0,
                    gap: '6px'
                  }}>
                    <button
                      onClick={navigateBack}
                      style={styles.mobileBackBtn}
                    >
                      <ArrowLeft size={16} />
                      <span>카테고리</span>
                    </button>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#1E293B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      {isSearchActive ? '전체 검색 결과' : (activeCategory ? activeCategory.name : '목록')} ({displayedItems.length})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {isTrashSelected && displayedItems.length > 0 && (
                        <button
                          onClick={() => {
                            openDeleteModal(
                              '휴지통 비우기',
                              '휴지통의 모든 메모를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                              handleEmptyTrash
                            );
                          }}
                          style={{
                            padding: '4px 6px',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="휴지통 비우기"
                        >
                          <Trash2 size={12} />
                          <span>비우기</span>
                        </button>
                      )}
                      {!isTrashSelected && activeCategory && Array.isArray(activeCategory.itemGroups) && activeCategory.itemGroups.length > 0 && (
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
                          title="그룹 전체 펼치기 / 전체 접기"
                        >
                          <button
                            type="button"
                            onClick={handleExpandAllItemGroups}
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
                              padding: 0
                            }}
                            title="모든 그룹 펼치기 (︾)"
                          >
                            <ChevronsDown size={13} />
                          </button>
                          <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />
                          <button
                            type="button"
                            onClick={handleCollapseAllItemGroups}
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
                              padding: 0
                            }}
                            title="모든 그룹 접기 (︽)"
                          >
                            <ChevronsUp size={13} />
                          </button>
                        </div>
                      )}
                      {!isTrashSelected && (
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
                          {!isSearchActive && selectedCategoryId !== 'quick_memo' && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingItemGroup((prev) => !prev);
                                setNewItemGroupName('');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 8px',
                                height: '100%',
                                border: 'none',
                                borderRight: '1px solid #E2E8F0',
                                backgroundColor: isAddingItemGroup ? '#EFF6FF' : 'transparent',
                                color: isAddingItemGroup ? '#2563EB' : '#334155',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="새 그룹 추가"
                            >
                              그룹
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleAddItem}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 9px',
                              height: '100%',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#2563EB',
                              fontSize: '15px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="목록 추가"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}



                {/* Inline input for creating new item group */}
                {isAddingItemGroup && (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <FolderPlus size={16} color="#2563EB" style={{ flexShrink: 0 }} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="새 그룹 이름 입력..."
                      value={newItemGroupName}
                      onChange={(e) => setNewItemGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (e.nativeEvent.isComposing) return;
                          handleAddItemGroup();
                        }
                        if (e.key === 'Escape') {
                          setIsAddingItemGroup(false);
                          setNewItemGroupName('');
                        }
                      }}
                      style={{
                        flex: 1,
                        fontSize: '13px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #3B82F6',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddItemGroup}
                      style={{ ...styles.btnPrimary, padding: '4px 8px', fontSize: '11px' }}
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingItemGroup(false);
                        setNewItemGroupName('');
                      }}
                      style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: '11px' }}
                    >
                      취소
                    </button>
                  </div>
                )}

                <div style={{ ...styles.paneContent, padding: 0 }} ref={itemScrollRef}>
                  {/* Inline input for creating new item (no group target) */}
                  {isAddingItem && !itemGroupTargetForNewItem && (
                    <div style={{
                      padding: '8px 10px',
                      margin: '4px 6px 6px 6px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1.5px solid #2563EB',
                      boxShadow: '0 2px 5px rgba(37,99,235,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <input
                        ref={itemInputRef}
                        autoFocus
                        type="text"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (e.nativeEvent.isComposing) return;
                            handleConfirmAddItem();
                          }
                          if (e.key === 'Escape') {
                            setIsAddingItem(false);
                            setNewItemTitle('');
                          }
                        }}
                        onBlur={handleConfirmAddItem}
                        placeholder="새 목록명 입력..."
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: '#1E293B',
                          backgroundColor: 'transparent'
                        }}
                      />
                    </div>
                  )}

                  {displayedItems.length === 0 && !isAddingItem && (!activeCategory?.itemGroups || activeCategory.itemGroups.length === 0) ? (
                    <div style={styles.emptyStateText}>
                      {isSearchActive ? '검색 결과와 일치하는 메모가 없습니다.' : '등록된 메모가 없습니다.'}
                    </div>
                  ) : (
                    displayedItemGrouped.map((groupObj, groupIdx) => {
                      const { group, items: grpItems } = groupObj;
                      const isSecCollapsed = group ? Boolean(collapsedItemGroups[group.id]) : false;
                      const isSecEditing = group ? editingItemGroupId === group.id : false;
                      const isFirstGroup = groupIdx === 0;
                      const isLastGroup = groupIdx === displayedItemGrouped.length - 1;
                      const isGroupDragOver = group && dragOverItemGroupId === group.id;

                      return (
                        <div
                          key={group ? group.id : 'default_grp'}
                          onDragOver={(e) => {
                            if (!draggedItemId) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (group && dragOverItemGroupId !== group.id) {
                              setDragOverItemGroupId(group.id);
                            }
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                              if (group && dragOverItemGroupId === group.id) {
                                setDragOverItemGroupId(null);
                              }
                            }
                          }}
                          onDrop={(e) => {
                            if (!draggedItemId) return;
                            handleDropItemOnGroup(e, group?.id);
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            marginBottom: group ? '2px' : '0',
                            borderRadius: 0,
                            overflow: 'hidden',
                            border: group
                              ? isGroupDragOver
                                ? '2px dashed #EA580C'
                                : '1px solid #CBD5E1'
                              : 'none',
                            borderLeft: isGroupDragOver ? undefined : 'none',
                            borderRight: isGroupDragOver ? undefined : 'none',
                            backgroundColor: '#FFFFFF',
                            boxShadow: 'none'
                          }}
                        >
                          {/* 그룹 헤더 바 */}
                          {group && (
                            <div
                              onDragOver={(e) => {
                                if (!draggedItemId) return;
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = 'move';
                                if (dragOverItemGroupId !== group.id) {
                                  setDragOverItemGroupId(group.id);
                                }
                              }}
                              onDrop={(e) => {
                                if (!draggedItemId) return;
                                e.preventDefault();
                                e.stopPropagation();
                                handleDropItemOnGroup(e, group.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: isMobile ? '4px' : '6px',
                                height: isMobile ? '22px' : '24px',
                                padding: isMobile ? '1px 0 1px 6px' : '1px 0 1px 8px',
                                boxSizing: 'border-box',
                                backgroundColor: isGroupDragOver ? '#FFEDD5' : '#F8C8A0',
                                border: 'none',
                                borderBottom: isSecCollapsed ? 'none' : '1px solid #E2A374',
                                borderRadius: '0',
                                boxShadow: 'none',
                                cursor: isSecEditing ? 'default' : 'pointer',
                                userSelect: 'none'
                              }}
                              onClick={() => {
                                if (!isSecEditing) {
                                  toggleItemGroupCollapse(group.id);
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
                                    value={editingItemGroupName}
                                    onChange={(e) => setEditingItemGroupName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleUpdateItemGroupName(group.id);
                                      } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                        setEditingItemGroupId(null);
                                      }
                                    }}
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      color: '#1E293B',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid #EA580C',
                                      outline: 'none',
                                      flex: 1
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemGroupName(group.id)}
                                    style={{ ...styles.btnPrimary, backgroundColor: '#EA580C', padding: '2px 8px', fontSize: '11px' }}
                                  >
                                    저장
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemGroupId(null)}
                                    style={{ ...styles.btnSecondary, padding: '2px 8px', fontSize: '11px' }}
                                  >
                                    취소
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                  <span
                                    style={{ display: 'flex', alignItems: 'center', color: '#C2410C' }}
                                    title={isSecCollapsed ? '펼치기' : '접기'}
                                  >
                                    {isSecCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                  </span>
                                  <span
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      if (group.isUnassigned) return;
                                      setEditingItemGroupId(group.id);
                                      setEditingItemGroupName(group.name);
                                    }}
                                    title={group.isUnassigned ? undefined : "더블클릭하여 그룹 이름 수정"}
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      color: '#0F172A',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      cursor: group.isUnassigned ? 'default' : 'text'
                                    }}
                                  >
                                    {group.name}
                                  </span>
                                  {isSecCollapsed && (
                                    <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                                      (접힘)
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* 우측: 추가 & 3점 메뉴 (미분류가 아닐 때) */}
                              {!isSecEditing && !group.isUnassigned && !isTrashSelected && (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
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
                                  {/* 1. 메모 추가 (+) 버튼 */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddItemToGroup(group.id);
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
                                      padding: 0
                                    }}
                                    title="이 그룹에 메모 추가"
                                  >
                                    <Plus size={isMobile ? 12 : 13} strokeWidth={2.5} />
                                  </button>

                                  {/* 2. 3점 더보기 (⋮) 메뉴 버튼 */}
                                  <div style={{ position: 'relative', height: '100%' }}>
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenItemGroupMenu(e, group.id)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: isMobile ? '20px' : '22px',
                                        height: '100%',
                                        border: 'none',
                                        backgroundColor: openItemGroupMenuId === group.id ? '#EFF6FF' : 'transparent',
                                        color: openItemGroupMenuId === group.id ? '#2563EB' : '#475569',
                                        cursor: 'pointer',
                                        padding: 0,
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (openItemGroupMenuId !== group.id) e.currentTarget.style.backgroundColor = '#F8FAFC';
                                      }}
                                      onMouseLeave={(e) => {
                                        if (openItemGroupMenuId !== group.id) e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                      title="그룹 메뉴"
                                    >
                                      <MoreVertical size={isMobile ? 12 : 13} strokeWidth={2.5} />
                                    </button>

                                    {/* 3점 드롭다운 팝업 메뉴 */}
                                    {openItemGroupMenuId === group.id && (
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
                                            setOpenItemGroupMenuId(null);
                                          }}
                                        />
                                        <div
                                          style={{
                                            ...styles.checklistDropdownMenu,
                                            top: openItemGroupMenuPos?.top ?? 0,
                                            right: openItemGroupMenuPos?.right ?? 0,
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
                                              setOpenItemGroupMenuId(null);
                                              handleMoveItemGroup(group.id, 'top');
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
                                              setOpenItemGroupMenuId(null);
                                              handleMoveItemGroup(group.id, 'up');
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
                                              setOpenItemGroupMenuId(null);
                                              handleMoveItemGroup(group.id, 'down');
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
                                              setOpenItemGroupMenuId(null);
                                              handleMoveItemGroup(group.id, 'bottom');
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
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenItemGroupMenuId(null);
                                              setEditingItemGroupId(group.id);
                                              setEditingItemGroupName(group.name);
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
                                              setOpenItemGroupMenuId(null);
                                              handleDeleteItemGroup(group.id);
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

                          {/* 그룹 소속 아이템 렌더링 (그룹이 접혀있지 않을 때) */}
                          {!isSecCollapsed && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              backgroundColor: '#FFFFFF'
                            }}>
                              {/* 그룹 내 인라인 항목 추가창 */}
                              {isAddingItem && group && itemGroupTargetForNewItem === group.id && (
                                <div style={{
                                  padding: '6px 8px',
                                  margin: '4px 6px 4px 6px',
                                  backgroundColor: '#F0F7FF',
                                  borderRadius: '5px',
                                  border: '1.5px solid #2563EB',
                                  boxShadow: '0 1px 4px rgba(37,99,235,0.10)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <input
                                    ref={itemInputRef}
                                    autoFocus
                                    type="text"
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (e.nativeEvent.isComposing) return;
                                        handleConfirmAddItem();
                                      }
                                      if (e.key === 'Escape') {
                                        setIsAddingItem(false);
                                        setNewItemTitle('');
                                        setItemGroupTargetForNewItem(null);
                                      }
                                    }}
                                    onBlur={handleConfirmAddItem}
                                    placeholder="새 목록명 입력..."
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
                                    onClick={handleConfirmAddItem}
                                    style={{
                                      backgroundColor: '#2563EB',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      flexShrink: 0
                                    }}
                                  >
                                    추가
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setIsAddingItem(false);
                                      setNewItemTitle('');
                                      setItemGroupTargetForNewItem(null);
                                    }}
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: '#64748B',
                                      border: '1px solid #CBD5E1',
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      fontSize: '11px',
                                      cursor: 'pointer',
                                      flexShrink: 0
                                    }}
                                  >
                                    취소
                                  </button>
                                </div>
                              )}

                              {grpItems.length === 0 && group && !(isAddingItem && itemGroupTargetForNewItem === group.id) ? (
                                <div style={{
                                  padding: '12px 14px',
                                  fontSize: '12px',
                                  color: '#94A3B8',
                                  backgroundColor: '#F8FAFC',
                                  textAlign: 'center'
                                }}>
                                  여기에 메모를 드래그하거나 [+] 버튼으로 추가하세요.
                                </div>
                              ) : grpItems.length > 0 ? (
                                grpItems.map((item, itemIdx) => {
                                  if (!item) return null;
                                  const isSelected = item.id === selectedItemId;
                                  const isEditing = item.id === editingItemId;
                                  const isDeleting = item.id === deletingItemId;
                                  const isItemDragOver = dragOverItemId === item.id;
                                  const isDragged = draggedItemId === item.id;

                                  return (
                                    <div
                                      key={item.id}
                                      draggable={!isTrashSelected && !isEditing}
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        e.dataTransfer.setData('text/plain', item.id);
                                        e.dataTransfer.effectAllowed = 'move';
                                        setDraggedItemId(item.id);
                                      }}
                                      onDragOver={(e) => {
                                        if (!draggedItemId || draggedItemId === item.id) return;
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.dataTransfer.dropEffect = 'move';
                                        if (dragOverItemId !== item.id) {
                                          setDragOverItemId(item.id);
                                        }
                                        if (group && dragOverItemGroupId !== group.id) {
                                          setDragOverItemGroupId(group.id);
                                        }
                                      }}
                                      onDragLeave={(e) => {
                                        e.stopPropagation();
                                        if (!e.currentTarget.contains(e.relatedTarget)) {
                                          if (dragOverItemId === item.id) {
                                            setDragOverItemId(null);
                                          }
                                        }
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!draggedItemId) return;
                                        handleDropItemOnItem(e, item, group?.id);
                                      }}
                                      onDragEnd={() => {
                                        setDraggedItemId(null);
                                        setDragOverItemId(null);
                                        setDragOverItemGroupId(null);
                                      }}
                                      onClick={() => {
                                        if (!isEditing && !isDeleting) {
                                          if (isSearchActive) {
                                            const itemCat = categories.find(c => c.id === item.categoryId);
                                            const targetScope = item.categoryId === 'quick_memo' ? 'explorer' : (itemCat ? (itemCat.scope || 'explorer') : 'explorer');
                                            const scopeToTabMap = {
                                              explorer: 'explorer',
                                              blog: 'blog',
                                              clipboard: 'clipboard',
                                              balance: 'balance',
                                              clip: 'clip',
                                              office: 'office',
                                              ad: 'ad',
                                              template2: 'template2',
                                              experience: 'experience',
                                              custom1: 'custom1',
                                              custom2: 'custom2',
                                              custom3: 'custom3',
                                              custom4: 'custom4',
                                              custom5: 'custom5',
                                              custom6: 'custom6'
                                            };
                                            if (scopeToTabMap[targetScope]) {
                                              setActiveMainTab(scopeToTabMap[targetScope]);
                                            }
                                            setSelectedCategoryId(item.categoryId);
                                          }
                                          navigateToDetail(item.id);
                                        }
                                      }}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        if (isTrashSelected) return;
                                        setEditingItemId(item.id);
                                        setEditingItemTitle(item.title || '');
                                      }}
                                      onContextMenu={(e) => handleItemContextMenu(e, item)}
                                      style={{
                                        padding: isMobile ? '7px 8px' : '8px 12px',
                                        backgroundColor: isItemDragOver
                                          ? '#DBEAFE'
                                          : isSelected
                                          ? '#EFF6FF'
                                          : '#FFFFFF',
                                        borderBottom: itemIdx < grpItems.length - 1 ? '1px solid #E2E8F0' : 'none',
                                        borderTop: isItemDragOver ? '2px solid #2563EB' : 'none',
                                        boxShadow: isSelected ? 'inset 3px 0 0 #2563EB' : 'none',
                                        opacity: isDragged ? 0.35 : 1,
                                        cursor: isTrashSelected ? 'pointer' : 'grab',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '3px',
                                        userSelect: 'none',
                                        transition: 'background-color 0.15s ease'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                                        <div
                                          style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}
                                          title={isTrashSelected ? undefined : "더블클릭하여 목록명 수정"}
                                        >
                                          {isEditing ? (
                                            <input
                                              autoFocus
                                              type="text"
                                              value={editingItemTitle}
                                              onChange={(e) => setEditingItemTitle(e.target.value)}
                                              onFocus={(e) => e.target.select()}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateItemTitle(item.id);
                                                if (e.key === 'Escape') setEditingItemId(null);
                                              }}
                                              onBlur={() => handleUpdateItemTitle(item.id)}
                                              style={styles.inputLightInline}
                                              onClick={(e) => e.stopPropagation()}
                                              onDoubleClick={(e) => e.stopPropagation()}
                                            />
                                          ) : (
                                            <span style={{
                                              fontSize: '13px',
                                              fontWeight: isSelected ? 700 : 600,
                                              color: isSelected ? '#163326' : '#2D3748',
                                              whiteSpace: 'normal',
                                              wordBreak: 'break-word',
                                              lineHeight: 1.45,
                                              flex: 1
                                            }}>
                                              {highlightText(item.title || '제목 없음', searchQuery)}
                                            </span>
                                          )}
                                        </div>

                                        <div
                                          style={styles.actionGroup}
                                          onClick={(e) => e.stopPropagation()}
                                          onDoubleClick={(e) => e.stopPropagation()}
                                        >
                                          {isTrashSelected ? (
                                            <>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRestoreItem(item);
                                                }}
                                                style={styles.actionBtnLight}
                                                title="원래 카테고리로 복원"
                                              >
                                                <RotateCcw size={13} color="#16A34A" />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openDeleteModal(
                                                    '영구 삭제',
                                                    `'${item.title || '제목 없음'}' 메모를 영구 삭제하시겠습니까? 복구할 수 없습니다.`,
                                                    () => handlePermanentDeleteItem(item.id)
                                                  );
                                                }}
                                                style={styles.actionBtnLight}
                                                title="영구 삭제"
                                              >
                                                <Trash2 size={13} color="#DC2626" />
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                type="button"
                                                onClick={(e) => handleOpenNoteMenu(e, item.id)}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  width: isMobile ? '22px' : '20px',
                                                  height: isMobile ? '22px' : '20px',
                                                  border: 'none',
                                                  backgroundColor: openNoteMenuId === item.id ? '#DCFCE7' : 'transparent',
                                                  color: openNoteMenuId === item.id ? '#059669' : '#64748B',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  padding: 0,
                                                  transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (openNoteMenuId !== item.id) e.currentTarget.style.backgroundColor = '#F1F5F9';
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (openNoteMenuId !== item.id) e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                                title="메모 메뉴"
                                              >
                                                <MoreVertical size={13} strokeWidth={2.2} />
                                              </button>

                                              {/* 3점 드롭다운 팝업 메뉴 (수정, 메뉴이동, 삭제, 취소) */}
                                              {openNoteMenuId === item.id && (
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
                                                      setOpenNoteMenuId(null);
                                                    }}
                                                  />
                                                  <div
                                                    style={{
                                                      ...styles.checklistDropdownMenu,
                                                      top: openNoteMenuPos?.top ?? 0,
                                                      right: openNoteMenuPos?.right ?? 0,
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
                                                        setOpenNoteMenuId(null);
                                                        setEditingItemId(item.id);
                                                        setEditingItemInput(item.title || '');
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
                                                        setOpenNoteMenuId(null);
                                                        const curCat = categories.find((c) => c.id === item.categoryId);
                                                        let initialTab = activeMainTab;
                                                        if (item.categoryId === 'quick_memo') {
                                                          initialTab = 'explorer';
                                                        } else if (curCat && curCat.scope) {
                                                          const matchedTab = mainTabs.find((t) => getScopeForTab(t.id) === curCat.scope);
                                                          if (matchedTab) initialTab = matchedTab.id;
                                                        }
                                                        setTargetMoveItemTab(initialTab);
                                                        setTargetMoveCategoryGroupId(curCat ? (curCat.groupId || '') : '');
                                                        setTargetMoveItemCategoryId(item.categoryId || '');
                                                        setTargetMoveItemGroupId(item.groupId || '');
                                                        setMovingItem(item);
                                                      }}
                                                      style={styles.checklistDropdownItem}
                                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                      <FolderInput size={13} color="#2563EB" />
                                                      <span>메뉴 이동</span>
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenNoteMenuId(null);
                                                        openDeleteModal(
                                                          '휴지통으로 이동',
                                                          `'${item.title || '제목 없음'}' 메모를 휴지통으로 이동하시겠습니까?`,
                                                          () => handleMoveToTrash(item.id)
                                                        );
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
                                                        setOpenNoteMenuId(null);
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

                                      {isSearchActive && (() => {
                                        const snip = getMatchedSnippet(item, searchQuery);
                                        return (
                                          <>
                                            {snip && (
                                              <div style={{
                                                fontSize: '11px',
                                                color: '#475569',
                                                backgroundColor: '#F8FAFC',
                                                padding: '4px 6px',
                                                borderRadius: '4px',
                                                borderLeft: '2.5px solid #3B82F6',
                                                marginTop: '2px',
                                                wordBreak: 'break-all'
                                              }}>
                                                💡 {highlightText(snip.snippetText, searchQuery)}
                                              </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap', alignItems: 'center' }}>
                                              <span style={{ fontSize: '10px', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                                {getCategoryBadgeName(item.categoryId)}
                                              </span>
                                              {getItemMatchBadges(item, searchLower).map((b, bIdx) => (
                                                <span key={bIdx} style={{ fontSize: '10px', backgroundColor: b.bg, color: b.color, padding: '1px 5px', borderRadius: '4px' }}>
                                                  {b.label}
                                                </span>
                                              ))}
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  );
                                })
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  </div>

                {/* Floating Action Button (FAB) for Mobile Sublist */}
                {isMobile && !isTrashSelected && (
                  <button
                    onClick={handleAddItem}
                    style={styles.mobileFabBtn}
                    title="새 메모 추가"
                    aria-label="새 메모 추가"
                  >
                    <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
                  </button>
                )}

                {/* Mobile Footer for Pane 2 */}
                {isMobile && renderMobileFooter(null)}
              </>
              )}
    </div>
  );
}

export default React.memo(ItemSubListPane, (prev, next) => {
  if (prev.isMobile !== next.isMobile) return false;
  if (prev.mobileView !== next.mobileView) return false;
  if (prev.activeMainTab !== next.activeMainTab) return false;
  if (prev.isCalendarMode !== next.isCalendarMode) return false;
  if (prev.selectedCategoryId !== next.selectedCategoryId) return false;
  if (prev.selectedItemId !== next.selectedItemId) return false;
  if (prev.displayedItems !== next.displayedItems) return false;
  if (prev.displayedItemGrouped !== next.displayedItemGrouped) return false;
  if (prev.activeCategory !== next.activeCategory) return false;
  if (prev.searchQuery !== next.searchQuery) return false;
  if (prev.isSearchActive !== next.isSearchActive) return false;
  if (prev.isAddingItem !== next.isAddingItem) return false;
  if (prev.newItemTitle !== next.newItemTitle) return false;
  if (prev.isAddingItemGroup !== next.isAddingItemGroup) return false;
  if (prev.newItemGroupName !== next.newItemGroupName) return false;
  if (prev.itemGroupTargetForNewItem !== next.itemGroupTargetForNewItem) return false;
  if (prev.editingItemId !== next.editingItemId) return false;
  if (prev.editingItemTitle !== next.editingItemTitle) return false;
  if (prev.editingItemGroupId !== next.editingItemGroupId) return false;
  if (prev.editingItemGroupName !== next.editingItemGroupName) return false;
  if (prev.openNoteMenuId !== next.openNoteMenuId) return false;
  if (prev.openNoteMenuPos !== next.openNoteMenuPos) return false;
  if (prev.openItemGroupMenuId !== next.openItemGroupMenuId) return false;
  if (prev.openItemGroupMenuPos !== next.openItemGroupMenuPos) return false;
  if (prev.collapsedItemGroups !== next.collapsedItemGroups) return false;
  if (prev.draggedItemId !== next.draggedItemId) return false;
  if (prev.dragOverItemId !== next.dragOverItemId) return false;
  if (prev.dragOverItemGroupId !== next.dragOverItemGroupId) return false;
  if (prev.deletingItemId !== next.deletingItemId) return false;
  if (prev.calendarCategories !== next.calendarCategories) return false;
  if (prev.selectedCalendarCategoryId !== next.selectedCalendarCategoryId) return false;
  if (prev.calendarEvents !== next.calendarEvents) return false;
  if (prev.categories !== next.categories) return false;
  return true;
});
