import { useEffect } from 'react';
import { parseDetailBlocks } from '../../DetailBlocks';

export function useNotebookKeyEvents({
  deleteModalState,
  closeDeleteModal,
  handleConfirmDelete,
  moveBlockModalState,
  handleCloseMoveBlockModal,
  movingCategory,
  setMovingCategory,
  openCategoryGroupMenuId,
  setOpenCategoryGroupMenuId,
  openItemGroupMenuId,
  setOpenItemGroupMenuId,
  openCatMenuId,
  setOpenCatMenuId,
  openNoteMenuId,
  setOpenNoteMenuId,
  openChecklistMenuId,
  setOpenChecklistMenuId,
  isEditingChecklistDetail,
  setIsEditingChecklistDetail,
  selectedChecklistId,
  activeItem,
  setChecklistDetailDraft,
  setChecklistDetailBlocks,
  currentChecklists,
  isEditMode,
  handleCancelDetailEdit,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. 확인 모달(삭제 등)이 열려있을 때의 키보드 동작
      if (deleteModalState?.isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          closeDeleteModal();
          return;
        }
        if (e.key === 'Enter') {
          if (e.isComposing) return;
          e.preventDefault();
          e.stopPropagation();
          handleConfirmDelete();
          return;
        }
        return;
      }

      // 2. 일반 ESC 동작
      if (e.key === 'Escape') {
        if (moveBlockModalState?.isOpen) {
          e.preventDefault();
          e.stopPropagation();
          handleCloseMoveBlockModal();
          return;
        }
        if (movingCategory) {
          setMovingCategory(null);
        } else if (openCategoryGroupMenuId) {
          setOpenCategoryGroupMenuId(null);
        } else if (openItemGroupMenuId) {
          setOpenItemGroupMenuId(null);
        } else if (openCatMenuId) {
          setOpenCatMenuId(null);
        } else if (openNoteMenuId) {
          setOpenNoteMenuId(null);
        } else if (openChecklistMenuId) {
          setOpenChecklistMenuId(null);
        } else if (isEditingChecklistDetail) {
          if (selectedChecklistId === '__main__') {
            const initialText = activeItem?.body || '';
            const initialBlocksData = activeItem?.detailBlocks;
            setChecklistDetailDraft(initialText);
            setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocksData));
          } else {
            const found = currentChecklists?.find((c) => c.id === selectedChecklistId);
            const initialText = found?.detail || '';
            const initialBlocksData = found?.detailBlocks;
            setChecklistDetailDraft(initialText);
            setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocksData));
          }
          setIsEditingChecklistDetail(false);
        } else if (isEditMode) {
          handleCancelDetailEdit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    openChecklistMenuId,
    openCatMenuId,
    openCategoryGroupMenuId,
    openItemGroupMenuId,
    openNoteMenuId,
    deleteModalState,
    isEditMode,
    activeItem,
    movingCategory,
    moveBlockModalState,
    isEditingChecklistDetail,
    selectedChecklistId,
    currentChecklists,
  ]);
}
