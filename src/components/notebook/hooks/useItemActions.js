import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import {
  getScopeForTab,
  getTrashIdForTab,
  getDefaultCategoryIdForTab,
  ALL_FIXED_CATEGORY_IDS,
  FIXED_TRASH_IDS,
  LEGACY_INBOX_IDS
} from '../notebookConstants';

export function useItemActions({
  db,
  items = [],
  categories = [],
  activeCategory,
  activeMainTab,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedItemId,
  setSelectedItemId,
  newItemGroupName,
  setNewItemGroupName,
  setIsAddingItemGroup,
  editingItemGroupName,
  setEditingItemGroupId,
  openDeleteModal,
  displayedItemGrouped = [],
  draggedItemId,
  setDraggedItemId,
  setDragOverItemGroupId,
  setDragOverItemId,
  setCollapsedItemGroups,
  setItemGroupTargetForNewItem,
  itemGroupTargetForNewItem,
  newItemTitle,
  setNewItemTitle,
  setIsAddingItem,
  itemInputRef,
  itemScrollRef,
  isSubmittingItemRef,
  navigateToDetail,
  recordWorkLocation,
  autoEditItemIdRef,
  shouldFocusTitleRef,
  setDraftCategoryId,
  setDraftTitle,
  setDraftBody,
  setDraftSubBody,
  setDraftTemplateId,
  setDraftTemplateValues,
  setDraftChecklists,
  setSelectedChecklistId,
  setChecklistDetailDraft,
  setChecklistDetailBlocks,
  setIsEditMode,
  editingItemTitle,
  setEditingItemId,
  syncCalendarEventTitle,
  setDeletingItemId,
  filteredItems = []
}) {
  // ---------------- Quick Add Note (Fast Entry) ----------------
  const handleQuickAddNote = async () => {
    const targetCatId = getDefaultCategoryIdForTab(activeMainTab, categories);
    try {
      const newRef = doc(collection(db, 'items'));
      await setDoc(newRef, {
        categoryId: targetCatId,
        title: '',
        body: '',
        subBody: '',
        detailBlocks: [],
        checklists: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSelectedCategoryId(targetCatId);
      if (autoEditItemIdRef) autoEditItemIdRef.current = newRef.id;
      if (shouldFocusTitleRef) shouldFocusTitleRef.current = true;
      navigateToDetail(newRef.id);
      setDraftCategoryId(targetCatId);
      setDraftTitle('');
      setDraftBody('');
      setDraftSubBody('');
      setDraftTemplateId(null);
      setDraftTemplateValues({});
      setDraftChecklists([]);
      setSelectedChecklistId(null);
      setChecklistDetailDraft('');
      setChecklistDetailBlocks([]);
      setIsEditMode(true);
    } catch (err) {
      console.error('Error adding quick note:', err);
    }
  };

  // ---------------- Category Item Group Handlers ----------------
  const handleAddItemGroup = async () => {
    const trimmed = newItemGroupName.trim();
    if (!trimmed) {
      setIsAddingItemGroup(false);
      setNewItemGroupName('');
      return;
    }
    if (!activeCategory || ALL_FIXED_CATEGORY_IDS.includes(activeCategory.id)) {
      alert('이 카테고리에는 그룹을 추가할 수 없습니다.');
      setIsAddingItemGroup(false);
      setNewItemGroupName('');
      return;
    }
    const currentGroups = Array.isArray(activeCategory.itemGroups) ? activeCategory.itemGroups : [];
    const newGroup = {
      id: 'igrp_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      name: trimmed,
      order: currentGroups.length
    };
    const updatedGroups = [...currentGroups, newGroup];
    try {
      await updateDoc(doc(db, 'categories', activeCategory.id), {
        itemGroups: updatedGroups,
        updatedAt: serverTimestamp()
      });
      setNewItemGroupName('');
      setIsAddingItemGroup(false);
    } catch (err) {
      console.error('Error adding item group:', err);
    }
  };

  const handleUpdateItemGroupName = async (groupId) => {
    const trimmed = editingItemGroupName.trim();
    if (!trimmed || !activeCategory) {
      setEditingItemGroupId(null);
      return;
    }
    const currentGroups = Array.isArray(activeCategory.itemGroups) ? activeCategory.itemGroups : [];
    const updatedGroups = currentGroups.map((g) => (g.id === groupId ? { ...g, name: trimmed } : g));
    try {
      await updateDoc(doc(db, 'categories', activeCategory.id), {
        itemGroups: updatedGroups,
        updatedAt: serverTimestamp()
      });
      setEditingItemGroupId(null);
    } catch (err) {
      console.error('Error updating item group name:', err);
    }
  };

  const handleDeleteItemGroup = (groupId) => {
    if (!activeCategory) return;
    openDeleteModal(
      '그룹 삭제',
      '이 그룹을 삭제하시겠습니까? 소속된 메모들은 안전하게 [미분류] 목록으로 이동됩니다.',
      async () => {
        try {
          const currentGroups = Array.isArray(activeCategory.itemGroups) ? activeCategory.itemGroups : [];
          const updatedGroups = currentGroups.filter((g) => g.id !== groupId);
          await updateDoc(doc(db, 'categories', activeCategory.id), {
            itemGroups: updatedGroups,
            updatedAt: serverTimestamp()
          });

          // 소속 메모들의 groupId를 null로 리셋
          const itemsInGroup = items.filter(
            (it) => it.categoryId === activeCategory.id && it.groupId === groupId
          );
          if (itemsInGroup.length > 0) {
            const batch = writeBatch(db);
            itemsInGroup.forEach((it) => {
              batch.update(doc(db, 'items', it.id), {
                groupId: null,
                updatedAt: serverTimestamp()
              });
            });
            await batch.commit();
          }
        } catch (err) {
          console.error('Error deleting item group:', err);
        }
      }
    );
  };

  const handleMoveItemGroup = async (groupId, direction) => {
    if (!activeCategory) return;
    const currentGroups = [...(Array.isArray(activeCategory.itemGroups) ? activeCategory.itemGroups : [])];
    const index = currentGroups.findIndex((g) => g.id === groupId);
    if (index === -1) return;

    let newIndex = index;
    if (direction === 'top') newIndex = 0;
    else if (direction === 'bottom') newIndex = currentGroups.length - 1;
    else if (direction === 'up') newIndex = Math.max(0, index - 1);
    else if (direction === 'down') newIndex = Math.min(currentGroups.length - 1, index + 1);

    if (newIndex === index) return;

    const [moved] = currentGroups.splice(index, 1);
    currentGroups.splice(newIndex, 0, moved);
    const updatedGroups = currentGroups.map((g, idx) => ({ ...g, order: idx }));

    try {
      await updateDoc(doc(db, 'categories', activeCategory.id), {
        itemGroups: updatedGroups,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error moving item group:', err);
    }
  };

  const handleAddItemToGroup = (groupId) => {
    setItemGroupTargetForNewItem(groupId);
    setIsAddingItem(true);
    setNewItemTitle('');
    if (groupId) {
      setCollapsedItemGroups((prev) => ({ ...prev, [groupId]: false }));
    }
    setTimeout(() => {
      if (itemInputRef.current) {
        itemInputRef.current.focus();
      }
    }, 50);
  };

  const handleMoveItemOrderInGroup = async (item, direction) => {
    if (!item) return;
    const targetGroupObj = displayedItemGrouped.find((g) => {
      if (!g.group && !item.groupId) return true;
      if (g.group?.isUnassigned && !item.groupId) return true;
      return g.group?.id === item.groupId;
    });
    if (!targetGroupObj) return;
    const groupItems = [...targetGroupObj.items];
    const curIdx = groupItems.findIndex((it) => it.id === item.id);
    if (curIdx === -1) return;
    const targetIdx = direction === 'up' ? curIdx - 1 : curIdx + 1;
    if (targetIdx < 0 || targetIdx >= groupItems.length) return;

    const [moved] = groupItems.splice(curIdx, 1);
    groupItems.splice(targetIdx, 0, moved);

    const batch = writeBatch(db);
    groupItems.forEach((it, idx) => {
      batch.update(doc(db, 'items', it.id), { order: idx, updatedAt: serverTimestamp() });
    });
    try {
      await batch.commit();
    } catch (err) {
      console.error('Error moving item order:', err);
    }
  };

  const handleDropItemOnGroup = async (e, targetGroupId) => {
    e.preventDefault();
    e.stopPropagation();
    const itemId = draggedItemId || e.dataTransfer?.getData('text/plain');
    setDragOverItemGroupId(null);
    setDragOverItemId(null);
    setDraggedItemId(null);
    if (!itemId) return;
    const actualGroupId = (targetGroupId === '__unassigned__' || !targetGroupId) ? null : targetGroupId;
    const currentItem = items.find((it) => it.id === itemId);
    if (!currentItem || currentItem.groupId === actualGroupId) return;

    const targetGroupObj = displayedItemGrouped.find((g) => {
      if (!g.group && !actualGroupId) return true;
      if (g.group?.isUnassigned && !actualGroupId) return true;
      return g.group?.id === actualGroupId;
    });
    const maxOrder = targetGroupObj && Array.isArray(targetGroupObj.items)
      ? targetGroupObj.items.reduce((max, it) => Math.max(max, typeof it.order === 'number' ? it.order : -1), -1)
      : -1;

    try {
      await updateDoc(doc(db, 'items', itemId), {
        groupId: actualGroupId,
        order: maxOrder + 1,
        updatedAt: serverTimestamp()
      });
      if (actualGroupId) {
        setCollapsedItemGroups((prev) => ({ ...prev, [actualGroupId]: false }));
      }
    } catch (err) {
      console.error('Error dropping item on group:', err);
    }
  };

  const handleDropItemOnItem = async (e, targetItem, targetGroupId) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceItemId = draggedItemId || e.dataTransfer?.getData('text/plain');
    setDragOverItemGroupId(null);
    setDragOverItemId(null);
    setDraggedItemId(null);
    if (!sourceItemId || sourceItemId === targetItem.id) return;

    const actualGroupId = (targetGroupId === '__unassigned__' || !targetGroupId) ? null : targetGroupId;
    const sourceItem = items.find((it) => it.id === sourceItemId);
    if (!sourceItem) return;

    const targetGroupObj = displayedItemGrouped.find((g) => {
      if (!g.group && !actualGroupId) return true;
      if (g.group?.isUnassigned && !actualGroupId) return true;
      return g.group?.id === actualGroupId;
    });
    if (!targetGroupObj) return;

    const groupItems = (targetGroupObj.items || []).filter((it) => it.id !== sourceItemId);
    const targetIdx = groupItems.findIndex((it) => it.id === targetItem.id);
    if (targetIdx === -1) return;

    groupItems.splice(targetIdx, 0, sourceItem);

    const batch = writeBatch(db);
    groupItems.forEach((it, idx) => {
      const updateData = { order: idx, updatedAt: serverTimestamp() };
      if (it.id === sourceItemId) {
        updateData.groupId = actualGroupId;
      }
      batch.update(doc(db, 'items', it.id), updateData);
    });

    try {
      await batch.commit();
      if (actualGroupId) {
        setCollapsedItemGroups((prev) => ({ ...prev, [actualGroupId]: false }));
      }
    } catch (err) {
      console.error('Error dropping item on item:', err);
    }
  };

  // ---------------- Item Handlers ----------------
  const handleAddItem = () => {
    setItemGroupTargetForNewItem(null);
    setIsAddingItem(true);
    setNewItemTitle('');
    setTimeout(() => {
      if (itemScrollRef.current) {
        itemScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (itemInputRef.current) {
        itemInputRef.current.focus();
      }
    }, 50);
  };

  const handleConfirmAddItem = async () => {
    if (isSubmittingItemRef.current) return;
    const trimmedTitle = newItemTitle.trim();
    if (!trimmedTitle) {
      setIsAddingItem(false);
      setNewItemTitle('');
      setItemGroupTargetForNewItem(null);
      return;
    }
    isSubmittingItemRef.current = true;
    const activeScope = getScopeForTab(activeMainTab);
    const scopeCategories = categories.filter(c => {
      if (ALL_FIXED_CATEGORY_IDS.includes(c.id) || LEGACY_INBOX_IDS.includes(c.id)) return false;
      if (activeScope === 'explorer') return !c.scope || c.scope === 'explorer';
      return c.scope === activeScope;
    });
    let targetCatId = selectedCategoryId;
    
    // Validate targetCatId belongs to active scope
    const isValidTarget = targetCatId && (
      (activeMainTab === 'explorer' && targetCatId === 'quick_memo') ||
      scopeCategories.some(c => c.id === targetCatId)
    );
    if (!isValidTarget) {
      targetCatId = getDefaultCategoryIdForTab(activeMainTab, categories);
    }
    try {
      const newRef = doc(collection(db, 'items'));
      const newDocData = {
        categoryId: targetCatId,
        title: trimmedTitle,
        body: '',
        subBody: '',
        detailBlocks: [],
        checklists: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (itemGroupTargetForNewItem) {
        newDocData.groupId = itemGroupTargetForNewItem;
      }
      const targetGroupItems = items.filter(it =>
        it.categoryId === targetCatId &&
        (itemGroupTargetForNewItem ? it.groupId === itemGroupTargetForNewItem : !it.groupId)
      );
      const maxOrder = targetGroupItems.reduce((max, it) => Math.max(max, typeof it.order === 'number' ? it.order : -1), -1);
      newDocData.order = maxOrder + 1;

      await setDoc(newRef, newDocData);
      setIsAddingItem(false);
      setNewItemTitle('');
      setItemGroupTargetForNewItem(null);
      navigateToDetail(newRef.id);
      recordWorkLocation({
        tab: activeMainTab,
        catId: targetCatId,
        itemId: newRef.id,
        itemTitle: trimmedTitle
      });
      setDraftCategoryId(targetCatId);
      setDraftTitle(trimmedTitle);
      setDraftBody('');
      setDraftSubBody('');
      setDraftTemplateId(null);
      setDraftTemplateValues({});
      setDraftChecklists([]);
      setSelectedChecklistId(null);
      setChecklistDetailDraft('');
      setChecklistDetailBlocks([]);
      setIsEditMode(false);
    } catch (err) {
      console.error('Error adding item:', err);
      setIsAddingItem(false);
      setNewItemTitle('');
      setItemGroupTargetForNewItem(null);
    } finally {
      isSubmittingItemRef.current = false;
    }
  };

  const handleUpdateItemTitle = async (itemId) => {
    const trimmed = editingItemTitle.trim();
    if (!trimmed) {
      setEditingItemId(null);
      return;
    }
    const currentItem = items.find((it) => it.id === itemId);
    const oldTitle = currentItem?.title || '';
    if (currentItem && currentItem.title === trimmed) {
      setEditingItemId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'items', itemId), {
        title: trimmed,
        updatedAt: serverTimestamp()
      });
      setEditingItemId(null);
      if (oldTitle && trimmed && oldTitle !== trimmed && syncCalendarEventTitle) {
        syncCalendarEventTitle({
          itemId,
          checklistId: null,
          oldText: oldTitle,
          newText: trimmed
        });
      }
    } catch (err) {
      console.error('Error updating item title:', err);
    }
  };

  // Move item to trash (Soft Delete)
  const handleMoveToTrash = async (itemId) => {
    try {
      const itemToTrash = items.find((i) => i.id === itemId);
      const trashId = getTrashIdForTab(activeMainTab);
      const originalCatId = (itemToTrash && itemToTrash.categoryId && !FIXED_TRASH_IDS.includes(itemToTrash.categoryId) && !LEGACY_INBOX_IDS.includes(itemToTrash.categoryId))
        ? itemToTrash.categoryId
        : getDefaultCategoryIdForTab(activeMainTab, categories);

      await updateDoc(doc(db, 'items', itemId), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        originalCategoryId: originalCatId,
        categoryId: trashId,
        deletedTab: activeMainTab,
        updatedAt: serverTimestamp()
      });

      setDeletingItemId(null);
      if (selectedItemId === itemId) {
        const remaining = filteredItems.filter((i) => i.id !== itemId);
        setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Error moving item to trash:', err);
    }
  };

  // Restore item from trash
  const handleRestoreItem = async (item) => {
    if (!item) return;
    try {
      const fallbackCatId = getDefaultCategoryIdForTab(activeMainTab, categories);
      const targetCategoryId = (item.originalCategoryId && !LEGACY_INBOX_IDS.includes(item.originalCategoryId)) ? item.originalCategoryId : fallbackCatId;
      const isValidCat = (activeMainTab === 'explorer' && targetCategoryId === 'quick_memo') || categories.some((c) => c.id === targetCategoryId && !c.isDeleted);
      const restoreCatId = isValidCat ? targetCategoryId : fallbackCatId;

      await updateDoc(doc(db, 'items', item.id), {
        isDeleted: false,
        deletedAt: null,
        categoryId: restoreCatId,
        updatedAt: serverTimestamp()
      });

      if (selectedItemId === item.id) {
        const remaining = filteredItems.filter((i) => i.id !== item.id);
        setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Error restoring item:', err);
    }
  };

  // Permanent Delete single item
  const handlePermanentDeleteItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'items', itemId));
      setDeletingItemId(null);
      if (selectedItemId === itemId) {
        const remaining = filteredItems.filter((i) => i.id !== itemId);
        setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Error permanently deleting item:', err);
    }
  };

  // Empty all items in current trash
  const handleEmptyTrash = async () => {
    try {
      const currentTrashId = getTrashIdForTab(activeMainTab);
      const trashedItems = items.filter(
        (it) => it.categoryId === currentTrashId || (it.isDeleted && (it.categoryId === currentTrashId || it.deletedTab === activeMainTab))
      );
      if (trashedItems.length === 0) return;

      const batchSize = 400;
      for (let i = 0; i < trashedItems.length; i += batchSize) {
        const chunk = trashedItems.slice(i, i + batchSize);
        const batch = writeBatch(db);
        chunk.forEach((it) => {
          batch.delete(doc(db, 'items', it.id));
        });
        await batch.commit();
      }

      setSelectedItemId(null);
    } catch (err) {
      console.error('Error emptying trash:', err);
    }
  };

  const handleDeleteItem = handleMoveToTrash;

  return {
    handleQuickAddNote,
    handleAddItemGroup,
    handleUpdateItemGroupName,
    handleDeleteItemGroup,
    handleMoveItemGroup,
    handleAddItemToGroup,
    handleMoveItemOrderInGroup,
    handleDropItemOnGroup,
    handleDropItemOnItem,
    handleAddItem,
    handleConfirmAddItem,
    handleUpdateItemTitle,
    handleMoveToTrash,
    handleRestoreItem,
    handlePermanentDeleteItem,
    handleEmptyTrash,
    handleDeleteItem
  };
}
