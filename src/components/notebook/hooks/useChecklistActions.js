import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { saveStoredCollapsedSections } from '../notebookConstants';

export function useChecklistActions({
  db,
  activeItem,
  isItemInTrash,
  templates = [],
  baseChecklists = [],
  checklistGroups = [],
  isEditMode,
  draftChecklists,
  setDraftChecklists,
  items,
  setItems,
  newChecklistText,
  setNewChecklistText,
  selectedChecklistId,
  setSelectedChecklistId,
  setChecklistDetailDraft,
  checklistDetailBlocks,
  setChecklistDetailBlocks,
  editingCheckId,
  setEditingCheckId,
  editingCheckText,
  setEditingCheckText,
  editingCheckTag,
  setEditingCheckTag,
  customTagInput,
  setCustomTagInput,
  draggedNoteChecklistId,
  setDraggedNoteChecklistId,
  setDragOverNoteChecklistId,
  setOpenGroupMenuId,
  selectedItemId,
  setCollapsedSections,
  syncCalendarEventTitle,
  recordWorkLocation,
  hasTpl,
  hasLegacyBody
}) {
  const updateCollapsedSections = (updater) => {
    setCollapsedSections((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const targetId = activeItem?.id || selectedItemId;
      if (targetId) {
        saveStoredCollapsedSections(targetId, next);
      }
      return next;
    });
  };

  const toggleSectionCollapse = (sectionId) => {
    updateCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleExpandAllSections = () => {
    updateCollapsedSections({});
  };

  const handleCollapseAllSections = () => {
    const newCollapsed = {};
    checklistGroups.forEach((g) => {
      if (g.section?.id) {
        newCollapsed[g.section.id] = true;
      }
    });
    updateCollapsedSections(newCollapsed);
  };

  const handleToggleInlineChecklistInReadMode = async (fieldId, originalIdx, newCompleted) => {
    if (!activeItem || isItemInTrash) return;
    const currentVal = activeItem.templateValues?.[fieldId];
    const activeTpl = templates.find((t) => t.id === activeItem.templateId);
    const field = activeTpl?.fields?.find((f) => f.id === fieldId);

    const rawList = Array.isArray(currentVal)
      ? currentVal
      : (field?.defaultItems || []).map((t) => (typeof t === 'object' ? t : { text: t, completed: false }));

    const updatedList = rawList.map((item, idx) => {
      const obj = typeof item === 'object' ? item : { text: item, completed: false };
      if (idx === originalIdx) {
        return { ...obj, completed: newCompleted };
      }
      return obj;
    });

    const updatedTemplateValues = {
      ...(activeItem.templateValues || {}),
      [fieldId]: updatedList
    };

    if (setItems) {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === activeItem.id
            ? { ...item, templateValues: updatedTemplateValues }
            : item
        )
      );
    }

    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        templateValues: updatedTemplateValues,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating inline checklist in read mode:', err);
    }
  };

  // Checklist Handlers
  const handleToggleChecklist = async (checkId) => {
    if (!activeItem || isItemInTrash) return;
    if (recordWorkLocation) recordWorkLocation();
    if (checkId === '__main__') {
      try {
        await updateDoc(doc(db, 'items', activeItem.id), {
          completed: !activeItem.completed,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error toggling main checklist item:', err);
      }
      return;
    }
    const updated = baseChecklists.map((c) =>
      c.id === checkId ? { ...c, completed: !c.completed } : c
    );
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error toggling checklist:', err);
    }
  };

  const handleAddChecklist = async () => {
    if (!activeItem || !newChecklistText.trim()) return;
    if (recordWorkLocation) recordWorkLocation();
    const newItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      text: newChecklistText.trim(),
      completed: false,
      detail: '',
      detailBlocks: []
    };
    const updated = [...baseChecklists, newItem];
    setNewChecklistText('');
    setSelectedChecklistId(newItem.id);
    setChecklistDetailDraft('');
    setChecklistDetailBlocks([]);
    if (isEditMode && setDraftChecklists) {
      setDraftChecklists(updated);
    }
    if (setItems) {
      setItems((prevItems) => prevItems.map((it) => it.id === activeItem.id ? { ...it, checklists: updated } : it));
    }
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding checklist:', err);
    }
  };

  const handleAddChecklistSection = async () => {
    if (!activeItem || !newChecklistText.trim()) return;
    if (recordWorkLocation) recordWorkLocation();
    const newSection = {
      id: 'sec_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      isSection: true,
      type: 'section',
      text: newChecklistText.trim()
    };
    const updated = [...baseChecklists, newSection];
    setNewChecklistText('');
    if (isEditMode && setDraftChecklists) {
      setDraftChecklists(updated);
    }
    if (setItems) {
      setItems((prevItems) => prevItems.map((it) => it.id === activeItem.id ? { ...it, checklists: updated } : it));
    }
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding checklist section:', err);
    }
  };

  const handleAddChecklistToGroup = async (sectionId) => {
    if (!activeItem || !sectionId) return;
    if (recordWorkLocation) recordWorkLocation();
    const newItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      text: '',
      completed: false,
      detail: '',
      detailBlocks: []
    };

    const secIdx = baseChecklists.findIndex((c) => c.id === sectionId);
    let updated;
    if (secIdx === -1) {
      updated = [...baseChecklists, newItem];
    } else {
      let insertIdx = baseChecklists.length;
      for (let i = secIdx + 1; i < baseChecklists.length; i++) {
        if (baseChecklists[i].isSection) {
          insertIdx = i;
          break;
        }
      }
      updated = [...baseChecklists];
      updated.splice(insertIdx, 0, newItem);
    }

    // 그룹이 접혀있다면 자동 펼치기
    updateCollapsedSections((prev) => ({ ...prev, [sectionId]: false }));

    if (isEditMode && setDraftChecklists) {
      setDraftChecklists(updated);
    }
    setSelectedChecklistId(newItem.id);
    setChecklistDetailDraft('');
    setChecklistDetailBlocks([]);
    setEditingCheckId(newItem.id);
    setEditingCheckText('');
    setEditingCheckTag('');
    setCustomTagInput('');

    if (setItems) {
      setItems((prevItems) => prevItems.map((it) => it.id === activeItem.id ? { ...it, checklists: updated } : it));
    }

    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding checklist to group:', err);
    }
  };

  const handleAddNextChecklistInGroup = async (sectionId, currentItemId, currentText) => {
    if (!activeItem || !sectionId || !currentItemId) return;
    if (recordWorkLocation) recordWorkLocation();
    const newItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      text: '',
      completed: false,
      detail: '',
      detailBlocks: []
    };

    const currentIdx = baseChecklists.findIndex((c) => c.id === currentItemId);
    let updated;
    if (currentIdx === -1) {
      updated = [...baseChecklists, newItem];
    } else {
      updated = [...baseChecklists];
      if (currentText !== undefined) {
        const finalTag = editingCheckTag === 'custom' ? customTagInput.trim() : (editingCheckTag || updated[currentIdx]?.tag);
        updated[currentIdx] = {
          ...updated[currentIdx],
          text: currentText.trim(),
          tag: finalTag || null
        };
      }
      updated.splice(currentIdx + 1, 0, newItem);
    }

    // 그룹이 접혀있다면 자동 펼치기
    updateCollapsedSections((prev) => ({ ...prev, [sectionId]: false }));

    if (isEditMode && setDraftChecklists) {
      setDraftChecklists(updated);
    }
    setSelectedChecklistId(newItem.id);
    setChecklistDetailDraft('');
    setChecklistDetailBlocks([]);
    setEditingCheckId(newItem.id);
    setEditingCheckText('');
    setEditingCheckTag('');
    setCustomTagInput('');

    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
      if (currentIdx !== -1 && currentText !== undefined) {
        const oldText = baseChecklists[currentIdx]?.text || '';
        const newText = currentText.trim();
        if (oldText && newText && oldText !== newText && syncCalendarEventTitle) {
          syncCalendarEventTitle({
            itemId: activeItem.id,
            checklistId: currentItemId,
            oldText,
            newText
          });
        }
      }
    } catch (err) {
      console.error('Error adding next checklist in group:', err);
    }
  };

  const handleMoveGroup = async (sectionId, direction) => {
    if (setOpenGroupMenuId) setOpenGroupMenuId(null);
    if (!sectionId) return;

    // Build raw groups from baseChecklists
    const groups = [];
    let curGroup = { section: null, items: [] };
    baseChecklists.forEach((item) => {
      if (item.isSection) {
        if (curGroup.section || curGroup.items.length > 0) {
          groups.push(curGroup);
        }
        curGroup = { section: item, items: [] };
      } else {
        curGroup.items.push(item);
      }
    });
    if (curGroup.section || curGroup.items.length > 0) {
      groups.push(curGroup);
    }

    const secGroupIdx = groups.findIndex((g) => g.section && g.section.id === sectionId);
    if (secGroupIdx === -1) return;

    let targetGroupIdx;
    if (direction === 'up') {
      targetGroupIdx = secGroupIdx - 1;
    } else if (direction === 'down') {
      targetGroupIdx = secGroupIdx + 1;
    } else if (direction === 'top') {
      targetGroupIdx = 0;
    } else if (direction === 'bottom') {
      targetGroupIdx = groups.length - 1;
    }

    if (targetGroupIdx === undefined || targetGroupIdx === secGroupIdx || targetGroupIdx < 0 || targetGroupIdx >= groups.length) return;

    // Move group
    const updatedGroups = [...groups];
    const [movedGroup] = updatedGroups.splice(secGroupIdx, 1);
    updatedGroups.splice(targetGroupIdx, 0, movedGroup);

    // Flatten back to array
    const updated = updatedGroups.flatMap((g) => (g.section ? [g.section, ...g.items] : g.items));

    if (isEditMode && setDraftChecklists) {
      setDraftChecklists(updated);
    }
    if (activeItem) {
      try {
        await updateDoc(doc(db, 'items', activeItem.id), {
          checklists: updated,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error moving group:', err);
      }
    }
  };

  const handleNoteChecklistDrop = async (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedNoteChecklistId || draggedNoteChecklistId === targetId) {
      setDraggedNoteChecklistId(null);
      setDragOverNoteChecklistId(null);
      return;
    }
    if (draggedNoteChecklistId === '__main__' || targetId === '__main__') {
      setDraggedNoteChecklistId(null);
      setDragOverNoteChecklistId(null);
      return;
    }

    // Build raw groups from baseChecklists
    const groups = [];
    let curGroup = { section: null, items: [] };
    baseChecklists.forEach((item) => {
      if (item.isSection) {
        if (curGroup.section || curGroup.items.length > 0) {
          groups.push(curGroup);
        }
        curGroup = { section: item, items: [] };
      } else {
        curGroup.items.push(item);
      }
    });
    if (curGroup.section || curGroup.items.length > 0) {
      groups.push(curGroup);
    }

    const draggedItem = baseChecklists.find((c) => c.id === draggedNoteChecklistId);
    const draggedIsSection = Boolean(draggedItem?.isSection);

    let updated = [];

    if (draggedIsSection) {
      // 1. 그룹 전체 단위 이동 (해당 섹션과 그에 속한 모든 아이템 묶음 통째로 이동)
      const fromGroupIdx = groups.findIndex((g) => g.section && g.section.id === draggedNoteChecklistId);
      const toGroupIdx = groups.findIndex(
        (g) => (g.section && g.section.id === targetId) || g.items.some((i) => i.id === targetId)
      );

      if (fromGroupIdx === -1 || toGroupIdx === -1 || fromGroupIdx === toGroupIdx) {
        setDraggedNoteChecklistId(null);
        setDragOverNoteChecklistId(null);
        return;
      }

      const updatedGroups = [...groups];
      const [movedGroup] = updatedGroups.splice(fromGroupIdx, 1);
      updatedGroups.splice(toGroupIdx, 0, movedGroup);
      updated = updatedGroups.flatMap((g) => (g.section ? [g.section, ...g.items] : g.items));
    } else {
      // 2. 단일 체크리스트 아이템 이동
      const fromIdx = baseChecklists.findIndex((c) => c.id === draggedNoteChecklistId);
      const toIdx = baseChecklists.findIndex((c) => c.id === targetId);
      if (fromIdx === -1 || toIdx === -1) {
        setDraggedNoteChecklistId(null);
        setDragOverNoteChecklistId(null);
        return;
      }
      const listCopy = [...baseChecklists];
      const [moved] = listCopy.splice(fromIdx, 1);
      listCopy.splice(toIdx, 0, moved);
      updated = listCopy;
    }

    setDraggedNoteChecklistId(null);
    setDragOverNoteChecklistId(null);

    if (isEditMode && setDraftChecklists) {
      setDraftChecklists(updated);
    }
    if (activeItem) {
      try {
        await updateDoc(doc(db, 'items', activeItem.id), {
          checklists: updated,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error reordering note checklists:', err);
      }
    }
  };

  const handleMoveChecklistItem = async (checkId, direction) => {
    const idx = baseChecklists.findIndex((c) => c.id === checkId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= baseChecklists.length) return;

    const listCopy = [...baseChecklists];
    const [moved] = listCopy.splice(idx, 1);
    listCopy.splice(targetIdx, 0, moved);

    if (isEditMode && setDraftChecklists) {
      setDraftChecklists(listCopy);
    }
    if (activeItem) {
      try {
        await updateDoc(doc(db, 'items', activeItem.id), {
          checklists: listCopy,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error moving checklist item:', err);
      }
    }
  };

  const handleSaveEditChecklist = async (checkId) => {
    if (!activeItem) return;
    if (!editingCheckText.trim()) {
      if (checkId !== '__main__') {
        handleDeleteChecklist(checkId);
      }
      setEditingCheckId(null);
      setEditingCheckText('');
      setEditingCheckTag('');
      setCustomTagInput('');
      return;
    }
    if (checkId === '__main__') {
      setEditingCheckId(null);
      setEditingCheckText('');
      return;
    }
    const oldItem = baseChecklists.find((c) => c.id === checkId);
    const oldText = oldItem?.text || '';
    const newText = editingCheckText.trim();
    const finalTag = editingCheckTag === 'custom' ? customTagInput.trim() : editingCheckTag;
    const updated = baseChecklists.map((c) =>
      c.id === checkId
        ? {
            ...c,
            text: newText,
            tag: finalTag || null
          }
        : c
    );
    setEditingCheckId(null);
    setEditingCheckText('');
    setEditingCheckTag('');
    setCustomTagInput('');
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
      if (oldText && newText && oldText !== newText && syncCalendarEventTitle) {
        syncCalendarEventTitle({
          itemId: activeItem.id,
          checklistId: checkId,
          oldText,
          newText
        });
      }
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  const handleDeleteChecklist = async (checkId) => {
    if (!activeItem) return;
    if (checkId === '__main__') {
      try {
        await updateDoc(doc(db, 'items', activeItem.id), {
          body: '',
          detailBlocks: [],
          templateId: null,
          templateValues: {},
          updatedAt: serverTimestamp()
        });
        setChecklistDetailDraft('');
        setChecklistDetailBlocks([]);
        setSelectedChecklistId(baseChecklists[0]?.id || null);
      } catch (err) {
        console.error('Error deleting main body:', err);
      }
      return;
    }
    const updated = baseChecklists.filter((c) => c.id !== checkId);
    if (selectedChecklistId === checkId) {
      setSelectedChecklistId(hasTpl || hasLegacyBody ? '__main__' : (updated[0]?.id || null));
    }
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error deleting checklist:', err);
    }
  };

  return {
    updateCollapsedSections,
    toggleSectionCollapse,
    handleExpandAllSections,
    handleCollapseAllSections,
    handleToggleInlineChecklistInReadMode,
    handleToggleChecklist,
    handleAddChecklist,
    handleAddChecklistSection,
    handleAddChecklistToGroup,
    handleAddNextChecklistInGroup,
    handleMoveGroup,
    handleNoteChecklistDrop,
    handleMoveChecklistItem,
    handleSaveEditChecklist,
    handleDeleteChecklist
  };
}
