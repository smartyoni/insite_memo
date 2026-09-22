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
  ALL_FIXED_CATEGORY_IDS
} from '../notebookConstants';
import {
  getCategoryDescendantIds,
  canMoveCategory
} from '../notebookHelpers';

export function useCategoryActions({
  db,
  activeMainTab,
  categories = [],
  items = [],
  selectedCategoryId,
  setSelectedCategoryId,
  newCategoryName,
  setNewCategoryName,
  setIsAddingCategory,
  setAddingParentId,
  addingCategoryGroupId,
  setAddingCategoryGroupId,
  editingCategoryName,
  setEditingCategoryId,
  newCategoryGroupName,
  setNewCategoryGroupName,
  setIsAddingCategoryGroup,
  editingCategoryGroupName,
  setEditingCategoryGroupId,
  draggedCategoryId,
  setDraggedCategoryId,
  setDragOverCategoryGroupId,
  setDragOverCategoryId,
  setCollapsedCategoryGroups,
  setExpandedFolders,
  setOpenCatMenuId,
  openDeleteModal,
  navigateToItems,
  currentScopeCategoryGroups = [],
  displayedCategoryGrouped = []
}) {
  const toggleCategoryGroupCollapse = (groupId) => {
    setCollapsedCategoryGroups((prev) => {
      const updated = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('memo_collapsed_category_groups', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddCategoryGroup = async () => {
    const trimmed = newCategoryGroupName.trim();
    if (!trimmed) {
      setIsAddingCategoryGroup(false);
      setNewCategoryGroupName('');
      return;
    }
    const currentScope = getScopeForTab(activeMainTab);
    try {
      const newRef = doc(collection(db, 'categoryGroups'));
      await setDoc(newRef, {
        name: trimmed,
        order: currentScopeCategoryGroups.length,
        scope: currentScope,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewCategoryGroupName('');
      setIsAddingCategoryGroup(false);
    } catch (err) {
      console.error('Error adding category group:', err);
    }
  };

  const handleUpdateCategoryGroupName = async (groupId) => {
    const trimmed = editingCategoryGroupName.trim();
    if (!trimmed) {
      setEditingCategoryGroupId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'categoryGroups', groupId), {
        name: trimmed,
        updatedAt: serverTimestamp()
      });
      setEditingCategoryGroupId(null);
    } catch (err) {
      console.error('Error updating category group name:', err);
    }
  };

  const handleDeleteCategoryGroup = (groupId) => {
    openDeleteModal(
      '그룹 삭제',
      '이 카테고리 그룹을 삭제하시겠습니까? 소속된 카테고리들은 안전하게 [미분류 카테고리]로 이동됩니다.',
      async () => {
        try {
          await deleteDoc(doc(db, 'categoryGroups', groupId));
          const catsInGroup = categories.filter((c) => c.groupId === groupId);
          if (catsInGroup.length > 0) {
            const batch = writeBatch(db);
            catsInGroup.forEach((c) => {
              batch.update(doc(db, 'categories', c.id), {
                groupId: null,
                updatedAt: serverTimestamp()
              });
            });
            await batch.commit();
          }
        } catch (err) {
          console.error('Error deleting category group:', err);
        }
      }
    );
  };

  const handleMoveCategoryGroup = async (groupId, direction) => {
    const list = [...currentScopeCategoryGroups];
    const index = list.findIndex((g) => g.id === groupId);
    if (index === -1) return;

    let newIndex = index;
    if (direction === 'top') newIndex = 0;
    else if (direction === 'bottom') newIndex = list.length - 1;
    else if (direction === 'up') newIndex = Math.max(0, index - 1);
    else if (direction === 'down') newIndex = Math.min(list.length - 1, index + 1);

    if (newIndex === index) return;

    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);

    try {
      const batch = writeBatch(db);
      list.forEach((g, idx) => {
        batch.update(doc(db, 'categoryGroups', g.id), {
          order: idx,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error moving category group:', err);
    }
  };

  const handleDropCategoryOnGroup = async (e, targetGroupId) => {
    e.preventDefault();
    e.stopPropagation();
    const catId = draggedCategoryId || e.dataTransfer.getData('text/plain');
    setDragOverCategoryGroupId(null);
    setDragOverCategoryId(null);
    setDraggedCategoryId(null);
    if (!catId) return;

    const actualGroupId = (targetGroupId === '__unassigned__' || !targetGroupId) ? null : targetGroupId;
    const currentCat = categories.find((c) => c.id === catId);
    if (!currentCat || currentCat.groupId === actualGroupId) return;

    const targetGroupObj = displayedCategoryGrouped.find((g) => {
      if (!g.group && !actualGroupId) return true;
      if (g.group?.isUnassigned && !actualGroupId) return true;
      return g.group?.id === actualGroupId;
    });
    const maxOrder = targetGroupObj && Array.isArray(targetGroupObj.categories)
      ? targetGroupObj.categories.reduce((max, c) => Math.max(max, typeof c.order === 'number' ? c.order : -1), -1)
      : -1;

    try {
      await updateDoc(doc(db, 'categories', catId), {
        groupId: actualGroupId,
        order: maxOrder + 1,
        updatedAt: serverTimestamp()
      });
      if (actualGroupId) {
        setCollapsedCategoryGroups((prev) => ({ ...prev, [actualGroupId]: false }));
      }
    } catch (err) {
      console.error('Error moving category to group:', err);
    }
  };

  const handleDropCategoryOnCategory = async (e, targetCat, targetGroupId) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceCatId = draggedCategoryId || e.dataTransfer.getData('text/plain');
    setDragOverCategoryGroupId(null);
    setDragOverCategoryId(null);
    setDraggedCategoryId(null);
    if (!sourceCatId || sourceCatId === targetCat.id) return;

    const actualGroupId = (targetGroupId === '__unassigned__' || !targetGroupId) ? null : targetGroupId;
    const sourceCat = categories.find((c) => c.id === sourceCatId);
    if (!sourceCat) return;

    const targetGroupObj = displayedCategoryGrouped.find((g) => {
      if (!g.group && !actualGroupId) return true;
      if (g.group?.isUnassigned && !actualGroupId) return true;
      return g.group?.id === actualGroupId;
    });
    if (!targetGroupObj) return;

    const groupCats = (targetGroupObj.categories || []).filter((c) => c.id !== sourceCatId);
    const targetIdx = groupCats.findIndex((c) => c.id === targetCat.id);
    if (targetIdx === -1) return;

    groupCats.splice(targetIdx, 0, sourceCat);

    const batch = writeBatch(db);
    groupCats.forEach((c, idx) => {
      const updateData = { order: idx, updatedAt: serverTimestamp() };
      if (c.id === sourceCatId) {
        updateData.groupId = actualGroupId;
      }
      batch.update(doc(db, 'categories', c.id), updateData);
    });

    try {
      await batch.commit();
      if (actualGroupId) {
        setCollapsedCategoryGroups((prev) => ({ ...prev, [actualGroupId]: false }));
      }
    } catch (err) {
      console.error('Error dropping category on category:', err);
    }
  };

  const handleStartAddCategoryToGroup = (groupId) => {
    if (groupId && groupId !== '__unassigned__') {
      setCollapsedCategoryGroups((prev) => {
        if (!prev[groupId]) return prev;
        const updated = { ...prev, [groupId]: false };
        try {
          localStorage.setItem('memo_collapsed_category_groups', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
    setAddingCategoryGroupId(groupId === '__unassigned__' ? null : groupId);
    setIsAddingCategory(true);
    setNewCategoryName('');
  };

  // ---------------- Category Handlers ----------------
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setIsAddingCategory(false);
      setAddingParentId(null);
      setAddingCategoryGroupId(null);
      return;
    }
    try {
      const currentScope = getScopeForTab(activeMainTab);
      const newRef = doc(collection(db, 'categories'));
      await setDoc(newRef, {
        name: newCategoryName.trim(),
        order: categories.length,
        scope: currentScope,
        groupId: addingCategoryGroupId || null,
        createdAt: serverTimestamp()
      });
      navigateToItems(newRef.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
      setAddingParentId(null);
      setAddingCategoryGroupId(null);
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleUpdateCategoryName = async (catId) => {
    if (ALL_FIXED_CATEGORY_IDS.includes(catId)) return;
    if (!editingCategoryName.trim()) {
      setEditingCategoryId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'categories', catId), {
        name: editingCategoryName.trim()
      });
      setEditingCategoryId(null);
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleMoveCategory = async (catId, targetParentId) => {
    if (!canMoveCategory(catId, targetParentId, categories)) return;
    try {
      await updateDoc(doc(db, 'categories', catId), {
        parentId: targetParentId || null
      });
      if (targetParentId) {
        setExpandedFolders((prev) => ({ ...prev, [targetParentId]: true }));
      }
    } catch (err) {
      console.error('Error moving category:', err);
    }
  };

  const handleMoveCategoryOrder = async (node, direction, siblings) => {
    setOpenCatMenuId(null);
    if (!node || !siblings || siblings.length <= 1) return;
    const currIdx = siblings.findIndex((c) => c.id === node.id);
    if (currIdx === -1) return;

    let targetIdx;
    if (direction === 'up') {
      targetIdx = currIdx - 1;
    } else if (direction === 'down') {
      targetIdx = currIdx + 1;
    } else if (direction === 'top') {
      targetIdx = 0;
    } else if (direction === 'bottom') {
      targetIdx = siblings.length - 1;
    }

    if (targetIdx === undefined || targetIdx === currIdx || targetIdx < 0 || targetIdx >= siblings.length) return;

    const reordered = [...siblings];
    const [moved] = reordered.splice(currIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    try {
      const batch = writeBatch(db);
      reordered.forEach((cat, index) => {
        batch.update(doc(db, 'categories', cat.id), {
          order: index * 10
        });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error updating category order:', err);
    }
  };

  const openDeleteCategoryModal = (cat) => {
    const allTargetCatIds = getCategoryDescendantIds(cat.id, categories);
    const subFolderCount = allTargetCatIds.length - 1;
    const childItemsCount = items.filter((item) => allTargetCatIds.includes(item.categoryId) && !item.isDeleted).length;

    let confirmMsg = `'${cat.name}' 폴더를 삭제하시겠습니까?`;
    if (subFolderCount > 0 || childItemsCount > 0) {
      const parts = [];
      if (subFolderCount > 0) parts.push(`하위 폴더 ${subFolderCount}개`);
      if (childItemsCount > 0) parts.push(`메모 ${childItemsCount}개`);
      confirmMsg = `'${cat.name}' 폴더를 삭제하시겠습니까?\n소속된 ${parts.join('와 ')}는 안전하게 [휴지통]으로 이동되어 언제든 복원할 수 있습니다.`;
    }

    openDeleteModal(
      '폴더 삭제',
      confirmMsg,
      () => handleDeleteCategory(cat.id)
    );
  };

  const handleDeleteCategory = async (catId) => {
    if (ALL_FIXED_CATEGORY_IDS.includes(catId)) return;
    try {
      const allTargetCatIds = getCategoryDescendantIds(catId, categories);
      const trashId = getTrashIdForTab(activeMainTab);
      const batch = writeBatch(db);

      // 1. Safely Soft Delete all categories in the tree (Never hard delete!)
      allTargetCatIds.forEach((id) => {
        batch.update(doc(db, 'categories', id), {
          isDeleted: true,
          deletedAt: serverTimestamp()
        });
      });

      // 2. Safely Soft Delete all child items to Trash (Never hard delete!)
      const childItems = items.filter((item) => allTargetCatIds.includes(item.categoryId) && !item.isDeleted);
      childItems.forEach((item) => {
        batch.update(doc(db, 'items', item.id), {
          isDeleted: true,
          deletedAt: serverTimestamp(),
          originalCategoryId: item.categoryId || null,
          categoryId: trashId,
          deletedTab: activeMainTab,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();

      if (allTargetCatIds.includes(selectedCategoryId)) {
        setSelectedCategoryId(getDefaultCategoryIdForTab(activeMainTab, categories));
      }
    } catch (err) {
      console.error('Error deleting category tree and safely moving items to trash:', err);
    }
  };

  return {
    toggleCategoryGroupCollapse,
    handleAddCategoryGroup,
    handleUpdateCategoryGroupName,
    handleDeleteCategoryGroup,
    handleMoveCategoryGroup,
    handleDropCategoryOnGroup,
    handleDropCategoryOnCategory,
    handleStartAddCategoryToGroup,
    handleAddCategory,
    handleUpdateCategoryName,
    handleMoveCategory,
    handleMoveCategoryOrder,
    openDeleteCategoryModal,
    handleDeleteCategory
  };
}
