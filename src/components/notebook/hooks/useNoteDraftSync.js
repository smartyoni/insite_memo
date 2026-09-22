import { useEffect } from 'react';
import {
  getDefaultCategoryIdForTab,
  getStoredCollapsedSections,
  getStoredDetailCollapsedBlocks,
} from '../notebookConstants';
import { parseDetailBlocks } from '../../DetailBlocks';

export function useNoteDraftSync({
  autoEditItemIdRef,
  selectedItemId,
  setIsEditMode,
  setEditingBlockId,
  setIsEditingChecklistDetail,
  activeItem,
  setDraftTitle,
  setDraftBody,
  setDraftSubBody,
  setDraftCategoryId,
  activeMainTab,
  categories,
  setDraftTemplateId,
  setDraftTemplateValues,
  setDraftChecklists,
  templates,
  baseChecklists,
  selectedChecklistId,
  setSelectedChecklistId,
  setChecklistDetailDraft,
  setChecklistDetailBlocks,
  setCollapsedSections,
  isEditMode,
  shouldFocusTitleRef,
  titleInputRef,
  mobileView,
  currentChecklists,
  setDetailCollapsedBlockIds,
}) {
  // Sync draft state when active item changes
  useEffect(() => {
    if (autoEditItemIdRef.current && autoEditItemIdRef.current === selectedItemId) {
      autoEditItemIdRef.current = null;
      setIsEditMode(true);
      setEditingBlockId(null);
      setIsEditingChecklistDetail(false);
      return;
    }

    if (activeItem) {
      setDraftTitle(activeItem.title || '');
      setDraftBody(activeItem.body || '');
      setDraftSubBody(activeItem.subBody || '');
      setDraftCategoryId(activeItem.categoryId || getDefaultCategoryIdForTab(activeMainTab, categories));
      setDraftTemplateId(activeItem.templateId || null);
      setDraftTemplateValues(activeItem.templateValues || {});
      setDraftChecklists(null);
      const hasTpl = Boolean(activeItem.templateId && templates.find((t) => t.id === activeItem.templateId));
      const hasItemBlocks = Boolean(
        Array.isArray(activeItem.detailBlocks) &&
          activeItem.detailBlocks.some((b) => {
            if (!b) return false;
            if (b.type === 'checklist') {
              const hasCustomTitle = b.title && b.title.trim() && b.title.trim() !== '체크리스트';
              const hasValidItems =
                Array.isArray(b.items) && b.items.some((it) => it && typeof it.text === 'string' && it.text.trim().length > 0);
              return Boolean(hasCustomTitle || hasValidItems);
            }
            return Boolean((b.title && b.title.trim().length > 0) || (b.content && b.content.trim().length > 0));
          })
      );
      const hasLegacyBody = Boolean((activeItem.body && activeItem.body.trim()) || hasItemBlocks);
      const firstId = hasTpl || hasLegacyBody ? '__main__' : baseChecklists[0]?.id || null;
      const isSavedChecklistValid = Boolean(
        selectedChecklistId &&
          (selectedChecklistId === '__main__' || baseChecklists.some((c) => c.id === selectedChecklistId))
      );
      const targetCheckId = isSavedChecklistValid ? selectedChecklistId : firstId;
      setSelectedChecklistId(targetCheckId);
      const initialText = firstId === '__main__' ? activeItem.body || '' : baseChecklists[0]?.detail || '';
      const initialBlocksData = firstId === '__main__' ? activeItem.detailBlocks : baseChecklists[0]?.detailBlocks;
      setChecklistDetailDraft(initialText);
      setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocksData));
    } else {
      setDraftTitle('');
      setDraftBody('');
      setDraftSubBody('');
      setDraftCategoryId(getDefaultCategoryIdForTab(activeMainTab, categories));
      setDraftTemplateId(null);
      setDraftTemplateValues({});
      setDraftChecklists(null);
      setSelectedChecklistId(null);
      setChecklistDetailDraft('');
      setChecklistDetailBlocks([]);
    }
    setEditingBlockId(null);
    setIsEditMode(false);
    setIsEditingChecklistDetail(false);
    if (selectedItemId) {
      setCollapsedSections(getStoredCollapsedSections(selectedItemId));
    } else {
      setCollapsedSections({});
    }
  }, [selectedItemId]);

  // Auto-focus title input when entering edit mode for newly created item
  useEffect(() => {
    if (isEditMode && shouldFocusTitleRef.current) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          shouldFocusTitleRef.current = false;
          clearInterval(interval);
        } else if (attempts > 10) {
          shouldFocusTitleRef.current = false;
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isEditMode, selectedItemId, mobileView]);

  // Sync checklist detail draft when selectedChecklistId changes
  useEffect(() => {
    if (!activeItem) return;
    if (selectedChecklistId === '__main__') {
      const initialText = activeItem.body || '';
      const initialBlocksData = activeItem.detailBlocks;
      setChecklistDetailDraft(initialText);
      setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocksData));
    } else {
      const found = currentChecklists.find((c) => c.id === selectedChecklistId);
      const initialText = found?.detail || '';
      const initialBlocksData = found?.detailBlocks;
      setChecklistDetailDraft(initialText);
      setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocksData));
    }
    setEditingBlockId(null);
    setIsEditingChecklistDetail(false);
    if (typeof setDetailCollapsedBlockIds === 'function') {
      setDetailCollapsedBlockIds(getStoredDetailCollapsedBlocks(activeItem?.id, selectedChecklistId || '__main__'));
    }
  }, [selectedChecklistId, activeItem?.id, activeItem?.body, activeItem?.detailBlocks]);
}
