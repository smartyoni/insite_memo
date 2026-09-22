import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { blocksToPlainText, parseDetailBlocks } from '../../DetailBlocks';
import { getDefaultCategoryIdForTab } from '../notebookConstants';

export function useNoteDetailEdit({
  db,
  selectedItemId,
  activeItem,
  activeMainTab,
  categories = [],
  checklistDetailBlocks = [],
  draftTemplateId,
  draftTemplateValues,
  draftTitle,
  draftBody,
  draftSubBody,
  draftCategoryId,
  draftChecklists,
  selectedCategoryId,
  setSelectedCategoryId,
  isItemInTrash,
  setIsEditMode,
  setIsEditingChecklistDetail,
  setShowSavedToast,
  toastTimerRef,
  recordWorkLocation,
  syncCalendarEventTitle,
  buildTemplateCombinedBody,
  setDraftTitle,
  setDraftBody,
  setDraftSubBody,
  setDraftCategoryId,
  setDraftTemplateId,
  setDraftTemplateValues,
  setDraftChecklists,
  setChecklistDetailDraft,
  setChecklistDetailBlocks,
  setSelectedChecklistId
}) {
  const handleSaveDetail = async () => {
    if (!selectedItemId) return;
    if (recordWorkLocation) recordWorkLocation();
    try {
      const blocksPlainText = blocksToPlainText(checklistDetailBlocks);
      const finalBody = draftTemplateId ? buildTemplateCombinedBody(draftTemplateId, draftTemplateValues) : (blocksPlainText || draftBody);

      const oldTitle = activeItem?.title || '';
      const finalTitle = draftTitle.trim() || activeItem?.title || '새 메모';
      const finalCategoryId = draftCategoryId || activeItem?.categoryId || getDefaultCategoryIdForTab(activeMainTab, categories);
      const updatePayload = {
        title: finalTitle,
        body: finalBody,
        subBody: draftSubBody,
        categoryId: finalCategoryId,
        templateId: draftTemplateId || null,
        templateValues: draftTemplateValues || {},
        updatedAt: serverTimestamp()
      };

      if (!draftTemplateId && checklistDetailBlocks.length > 0) {
        updatePayload.detailBlocks = checklistDetailBlocks;
      }

      if (draftChecklists !== null) {
        updatePayload.checklists = draftChecklists;
      }

      await updateDoc(doc(db, 'items', selectedItemId), updatePayload);

      // 메모 제목 변경 시 연동된 캘린더 일정명 동기화
      if (oldTitle && finalTitle && oldTitle !== finalTitle && syncCalendarEventTitle) {
        syncCalendarEventTitle({
          itemId: selectedItemId,
          checklistId: null,
          oldText: oldTitle,
          newText: finalTitle
        });
      }

      // 체크리스트 변경 시 연동된 캘린더 일정명 동기화
      if (draftChecklists !== null && Array.isArray(activeItem?.checklists) && syncCalendarEventTitle) {
        draftChecklists.forEach((dc) => {
          if (!dc.isSection && dc.id && dc.text) {
            const oldCheck = activeItem.checklists.find((ac) => ac.id === dc.id);
            if (oldCheck && oldCheck.text && oldCheck.text.trim() !== dc.text.trim()) {
              syncCalendarEventTitle({
                itemId: selectedItemId,
                checklistId: dc.id,
                oldText: oldCheck.text,
                newText: dc.text.trim()
              });
            }
          }
        });
      }

      if (draftCategoryId !== selectedCategoryId && setSelectedCategoryId) {
        setSelectedCategoryId(draftCategoryId);
      }
      if (setIsEditMode) setIsEditMode(false);
      if (setIsEditingChecklistDetail) setIsEditingChecklistDetail(false);
      if (setShowSavedToast) setShowSavedToast(true);
      if (toastTimerRef && toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastTimerRef) {
        toastTimerRef.current = setTimeout(() => {
          if (setShowSavedToast) setShowSavedToast(false);
        }, 1800);
      }
    } catch (err) {
      console.error('Error saving detail:', err);
    }
  };

  const handleCancelDetailEdit = () => {
    if (activeItem) {
      if (setDraftTitle) setDraftTitle(activeItem.title || '');
      if (setDraftBody) setDraftBody(activeItem.body || '');
      if (setDraftSubBody) setDraftSubBody(activeItem.subBody || '');
      if (setDraftCategoryId) setDraftCategoryId(activeItem.categoryId || getDefaultCategoryIdForTab(activeMainTab, categories));
      if (setDraftTemplateId) setDraftTemplateId(activeItem.templateId || null);
      if (setDraftTemplateValues) setDraftTemplateValues(activeItem.templateValues || {});
      if (setDraftChecklists) setDraftChecklists(null);
      const initialText = activeItem.body || '';
      const initialBlocks = activeItem.detailBlocks;
      if (setChecklistDetailDraft) setChecklistDetailDraft(initialText);
      if (setChecklistDetailBlocks) setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocks));
    }
    if (setIsEditMode) setIsEditMode(false);
    if (setIsEditingChecklistDetail) setIsEditingChecklistDetail(false);
  };

  const handleEnterEditMode = () => {
    if (isItemInTrash) return;
    if (activeItem) {
      if (setDraftTitle) setDraftTitle(activeItem.title || '');
      if (setDraftBody) setDraftBody(activeItem.body || '');
      if (setDraftSubBody) setDraftSubBody(activeItem.subBody || '');
      if (setDraftCategoryId) setDraftCategoryId(activeItem.categoryId || getDefaultCategoryIdForTab(activeMainTab, categories));
      if (setDraftTemplateId) setDraftTemplateId(activeItem.templateId || null);
      if (setDraftTemplateValues) setDraftTemplateValues(activeItem.templateValues || {});
      if (setDraftChecklists) setDraftChecklists(activeItem.checklists || []);
      const initialText = activeItem.body || '';
      const initialBlocks = activeItem.detailBlocks;
      if (setChecklistDetailDraft) setChecklistDetailDraft(initialText);
      if (setChecklistDetailBlocks) setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocks));
    }
    if (setSelectedChecklistId) setSelectedChecklistId('__main__');
    if (setIsEditMode) setIsEditMode(true);
  };

  return {
    handleSaveDetail,
    handleCancelDetailEdit,
    handleEnterEditMode
  };
}
