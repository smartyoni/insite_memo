import React from 'react';
import { Copy, RotateCcw, X } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ALL_FIXED_CATEGORY_IDS, getScopeForTab } from './notebookConstants';
import { styles } from './notebookStyles';

import ChecklistPrintModal from './modals/ChecklistPrintModal';
import TemplatePrintModal from './modals/TemplatePrintModal';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import MoveBlockModal from './modals/MoveBlockModal';
import CategoryMoveModal from './modals/CategoryMoveModal';
import MoveItemModal from './modals/MoveItemModal';
import AddGroupModal from './modals/AddGroupModal';
import QuickMemoModal from './modals/QuickMemoModal';
import Template2Modal from './modals/Template2Modal';
import SettingsBackupModal from './modals/SettingsBackupModal';
import QuickTabEditModal from './modals/QuickTabEditModal';
import CreateEventModal from '../CreateEventModal';

export default function NotebookModals({
  // Print Modals
  isChecklistPrintModalOpen,
  setIsChecklistPrintModalOpen,
  currentChecklists,
  selectedPrintChecklistIds,
  setSelectedPrintChecklistIds,
  handleConfirmChecklistPrint,
  isPrintModalOpen,
  setIsPrintModalOpen,
  templates,
  activeItem,
  selectedPrintFieldIds,
  setSelectedPrintFieldIds,
  handleConfirmTemplatePrint,

  // Delete Modal
  deleteModalState,
  closeDeleteModal,
  handleConfirmDelete,
  deleteConfirmBtnRef,

  // Move Block Modal
  moveBlockModalState,
  setMoveBlockModalState,
  handleCloseMoveBlockModal,
  handleExecuteMoveBlock,
  rawChecklists,
  checklistGroups,
  isMobile,

  // Category Move Modal
  movingCategory,
  setMovingCategory,
  targetMoveParentId,
  setTargetMoveParentId,
  sidebarRef,
  currentScope,
  getHierarchicalCategoryOptions,
  setExpandedFolders,
  db,

  // Move Item Modal
  movingItem,
  setMovingItem,
  targetMoveItemTab,
  setTargetMoveItemTab,
  targetMoveCategoryGroupId,
  setTargetMoveCategoryGroupId,
  targetMoveItemCategoryId,
  setTargetMoveItemCategoryId,
  targetMoveItemGroupId,
  setTargetMoveItemGroupId,
  mainTabs,
  categoryGroups,
  categories,
  setActiveMainTab,
  setSelectedCategoryId,
  setSelectedItemId,

  // Add Group Modal
  showAddGroupModal,
  groupModalPos,
  newGroupNameInput,
  setNewGroupNameInput,
  setShowAddGroupModal,
  handleCreateGroupFromModal,

  // Context Menus
  categoryContextMenu,
  setCategoryContextMenu,
  handleCopyCategoryPath,
  handleCopyCategoryLink,
  itemContextMenu,
  setItemContextMenu,
  handleCopyItemPath,
  handleCopyItemLink,

  // Return location floating banner
  returnLocation,
  handleReturnToPreviousLocation,
  setReturnLocation,

  // Toasts
  copyToastText,
  showExitToast,

  // Quick Memo Modal
  isQuickMemoOpen,
  quickMemoToast,
  quickMemoText,
  setQuickMemoText,
  quickMemoTextareaRef,
  isSavingQuickMemo,
  handleCloseQuickMemo,
  handleSaveQuickMemo,

  // Template 2 Modal
  showTemplate2Modal,
  setShowTemplate2Modal,
  items,
  templates2,
  handleApplyTemplate2ToItem,

  // Settings Backup Modal
  isTabSettingModalOpen,
  setIsTabSettingModalOpen,
  saveMainTabs,
  setShowSavedToast,

  // Quick Tab Edit Modal
  editingTab,
  editingTabInput,
  setEditingTab,
  setEditingTabInput,
  handleUpdateTabLabel,

  // Create Event Modal
  createEventModalState,
  setCreateEventModalState,
  calendarCategories,
  handleSaveCalendarEvent,
}) {
  return (
    <>
      {/* Checklist Item Print Selection Modal */}
      <ChecklistPrintModal
        isOpen={isChecklistPrintModalOpen}
        onClose={() => setIsChecklistPrintModalOpen(false)}
        currentChecklists={currentChecklists}
        selectedPrintChecklistIds={selectedPrintChecklistIds}
        setSelectedPrintChecklistIds={setSelectedPrintChecklistIds}
        onConfirmPrint={handleConfirmChecklistPrint}
      />

      {/* Template Field Print Selection Modal */}
      <TemplatePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        templates={templates}
        activeItem={activeItem}
        selectedPrintFieldIds={selectedPrintFieldIds}
        setSelectedPrintFieldIds={setSelectedPrintFieldIds}
        onConfirmPrint={handleConfirmTemplatePrint}
      />

      {/* Global Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        message={deleteModalState.message}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        confirmBtnRef={deleteConfirmBtnRef}
      />

      {/* Detail Block Move Modal */}
      <MoveBlockModal
        isOpen={moveBlockModalState.isOpen}
        modalState={moveBlockModalState}
        onClose={handleCloseMoveBlockModal}
        onSelectTarget={(targetCheckId) => setMoveBlockModalState(prev => ({ ...prev, targetCheckId }))}
        onExecute={handleExecuteMoveBlock}
        rawChecklists={rawChecklists}
        checklistGroups={checklistGroups}
        isMobile={isMobile}
      />

      {/* Category Move Modal */}
      <CategoryMoveModal
        movingCategory={movingCategory}
        onClose={() => setMovingCategory(null)}
        targetMoveParentId={targetMoveParentId}
        setTargetMoveParentId={setTargetMoveParentId}
        onConfirm={async (newPid) => {
          try {
            const pid = newPid ? newPid.trim() : null;
            await updateDoc(doc(db, 'categories', movingCategory.id), { parentId: pid });
            if (pid && typeof setExpandedFolders === 'function') {
              setExpandedFolders((prev) => ({ ...prev, [pid]: true }));
            }
            setMovingCategory(null);
          } catch (err) {
            console.error('Error moving category:', err);
          }
        }}
        categoryOptions={movingCategory && typeof getHierarchicalCategoryOptions === 'function' ? getHierarchicalCategoryOptions(currentScope, movingCategory.id).filter((c) => !ALL_FIXED_CATEGORY_IDS.includes(c.id)) : []}
        isMobile={isMobile}
        sidebarRight={sidebarRef?.current?.getBoundingClientRect().right || 280}
      />

      {/* Move Item Modal */}
      {movingItem && (() => {
        const targetScope = getScopeForTab(targetMoveItemTab);
        const targetScopeGroups = (categoryGroups || []).filter((g) => (g.scope || 'explorer') === targetScope);
        const categoryOptions = typeof getHierarchicalCategoryOptions === 'function' ? getHierarchicalCategoryOptions(targetScope, null, targetMoveCategoryGroupId).filter((c) => !ALL_FIXED_CATEGORY_IDS.includes(c.id)) : [];
        const targetCat = (categories || []).find((c) => c.id === targetMoveItemCategoryId);
        const targetGroups = targetCat && Array.isArray(targetCat.itemGroups) ? targetCat.itemGroups : [];

        return (
          <MoveItemModal
            movingItem={movingItem}
            onClose={() => setMovingItem(null)}
            targetMoveItemTab={targetMoveItemTab}
            setTargetMoveItemTab={setTargetMoveItemTab}
            targetMoveCategoryGroupId={targetMoveCategoryGroupId}
            setTargetMoveCategoryGroupId={setTargetMoveCategoryGroupId}
            targetMoveItemCategoryId={targetMoveItemCategoryId}
            setTargetMoveItemCategoryId={setTargetMoveItemCategoryId}
            targetMoveItemGroupId={targetMoveItemGroupId}
            setTargetMoveItemGroupId={setTargetMoveItemGroupId}
            onConfirm={async () => {
              if (!targetMoveItemCategoryId) {
                alert('이동할 카테고리를 선택해 주세요.');
                return;
              }
              try {
                await updateDoc(doc(db, 'items', movingItem.id), {
                  categoryId: targetMoveItemCategoryId,
                  groupId: targetMoveItemGroupId || null,
                  updatedAt: serverTimestamp()
                });
                if (targetMoveItemCategoryId !== 'quick_memo') {
                  const targetCatObj = (categories || []).find((c) => c.id === targetMoveItemCategoryId);
                  const itemTargetScope = targetCatObj ? targetCatObj.scope || 'explorer' : 'explorer';
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
                  if (scopeToTabMap[itemTargetScope]) {
                    setActiveMainTab(scopeToTabMap[itemTargetScope]);
                  }
                  setSelectedCategoryId(targetMoveItemCategoryId);
                  setSelectedItemId(movingItem.id);
                }
                setMovingItem(null);
              } catch (err) {
                console.error('Error moving item:', err);
              }
            }}
            mainTabs={mainTabs}
            targetScopeGroups={targetScopeGroups}
            categoryOptions={categoryOptions}
            targetGroups={targetGroups}
            isMobile={isMobile}
          />
        );
      })()}

      {/* Add Group Popover Modal */}
      <AddGroupModal
        isOpen={showAddGroupModal}
        groupModalPos={groupModalPos}
        newGroupNameInput={newGroupNameInput}
        setNewGroupNameInput={setNewGroupNameInput}
        onClose={() => setShowAddGroupModal(false)}
        onCreateGroup={handleCreateGroupFromModal}
      />

      {/* Category Right-Click Context Menu Popup */}
      {categoryContextMenu && (
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
            onClick={() => setCategoryContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCategoryContextMenu(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: categoryContextMenu.y,
              left: categoryContextMenu.x,
              zIndex: 99999,
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #CBD5E1',
              padding: '4px',
              minWidth: '160px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleCopyCategoryPath(categoryContextMenu.category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0FDF4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Copy size={15} color="#10B981" />
              <span>경로 복사</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyCategoryLink(categoryContextMenu.category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Copy size={15} color="#2563EB" />
              <span>목록 주소 복사</span>
            </button>
          </div>
        </>
      )}

      {/* Item (Memo) Right-Click Context Menu Popup */}
      {itemContextMenu && (
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
            onClick={() => setItemContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setItemContextMenu(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: itemContextMenu.y,
              left: itemContextMenu.x,
              zIndex: 99999,
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #CBD5E1',
              padding: '4px',
              minWidth: '160px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleCopyItemPath(itemContextMenu.item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0FDF4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Copy size={15} color="#10B981" />
              <span>경로 복사</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyItemLink(itemContextMenu.item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Copy size={15} color="#2563EB" />
              <span>메모 주소 복사</span>
            </button>
          </div>
        </>
      )}

      {/* Deep Link Return Floating Banner */}
      {returnLocation && (
        <div
          style={{
            position: 'fixed',
            top: isMobile ? '10px' : '14px',
            right: isMobile ? '10px' : '20px',
            zIndex: 99990,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '7px 14px',
            borderRadius: '24px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.35), 0 4px 6px -2px rgba(15, 23, 42, 0.2)',
            border: '1px solid #334155',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          <span
            style={{
              color: '#93C5FD',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              maxWidth: isMobile ? '140px' : '220px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={`이전 위치: ${returnLocation.categoryName}`}
          >
            이전: {returnLocation.categoryName}
          </span>
          <button
            type="button"
            onClick={handleReturnToPreviousLocation}
            style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 2px rgba(37, 99, 235, 0.3)',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          >
            <RotateCcw size={12} />
            <span>복귀</span>
          </button>
          <button
            type="button"
            onClick={() => setReturnLocation(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="복귀 알림 닫기"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Copy Toast Notification */}
      {copyToastText && (
        <div style={styles.exitToast}>
          {copyToastText}
        </div>
      )}

      {/* Exit Toast Notification for Mobile double back press */}
      {showExitToast && (
        <div style={styles.exitToast}>
          앱을 종료하시겠습니까? 뒤로 가기를 한 번 더 누르면 종료됩니다.
        </div>
      )}

      {/* Global Quick Memo Modal (Ctrl+Enter to save, Esc to close) */}
      <QuickMemoModal
        isOpen={isQuickMemoOpen}
        quickMemoToast={quickMemoToast}
        quickMemoText={quickMemoText}
        setQuickMemoText={setQuickMemoText}
        quickMemoTextareaRef={quickMemoTextareaRef}
        isSavingQuickMemo={isSavingQuickMemo}
        onClose={handleCloseQuickMemo}
        onSave={handleSaveQuickMemo}
      />

      {/* Template 2 Selection & Apply Modal */}
      <Template2Modal
        isOpen={showTemplate2Modal}
        onClose={() => setShowTemplate2Modal(false)}
        categories={categories}
        items={items}
        templates={templates}
        templates2={templates2}
        getHierarchicalCategoryOptions={getHierarchicalCategoryOptions}
        onApplyTemplate={handleApplyTemplate2ToItem}
      />

      {/* Main Tabs Setting & Backup Modal */}
      <SettingsBackupModal
        isOpen={isTabSettingModalOpen}
        onClose={() => setIsTabSettingModalOpen(false)}
        mainTabs={mainTabs}
        onSaveMainTabs={saveMainTabs}
        items={items}
        categories={categories}
        categoryGroups={categoryGroups}
        templates={templates}
        templates2={templates2}
        setShowSavedToast={setShowSavedToast}
      />

      {/* Quick Single Tab Label Edit Modal (Long-press or Right-click) */}
      <QuickTabEditModal
        editingTab={editingTab}
        editingTabInput={editingTabInput}
        setEditingTabInput={setEditingTabInput}
        onClose={() => {
          setEditingTab(null);
          setEditingTabInput('');
        }}
        onUpdateTabLabel={handleUpdateTabLabel}
      />

      {/* Create Calendar Event Modal */}
      <CreateEventModal
        isOpen={createEventModalState.isOpen}
        onClose={() => setCreateEventModalState((prev) => ({ ...prev, isOpen: false }))}
        initialTitle={createEventModalState.initialTitle}
        initialBlocks={createEventModalState.initialBlocks}
        categories={calendarCategories}
        sourceMemo={createEventModalState.sourceMemo}
        initialDate={createEventModalState.date}
        initialEvent={createEventModalState.initialEvent}
        onSaveEvent={handleSaveCalendarEvent}
      />
    </>
  );
}
