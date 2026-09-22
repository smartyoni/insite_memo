import React, { useEffect, useMemo } from 'react';
import {
  ALL_FIXED_CATEGORY_IDS,
  FIXED_TRASH_IDS,
  LEGACY_INBOX_IDS,
  QUICK_MEMO_CATEGORY,
  getFixedTrashCategoryForTab,
  getScopeForTab,
  getItemTimestamp,
} from '../notebookConstants';
import { checkItemMatches } from '../notebookHelpers';

export function useNotebookSelectors({
  categories,
  items,
  categoryGroups,
  templates,
  activeMainTab,
  selectedCategoryId,
  selectedItemId,
  setSelectedItemId,
  isSearchActive,
  searchLower,
  itemSortOrder,
  draggedCategoryId,
  draggedItemId,
  isEditMode,
  draftChecklists,
  setCollapsedItemGroups,
}) {
  // Combine fixed In-box at top, user categories in middle (가나다순), fixed Trash category at bottom
  const currentFixedTrashCategory = getFixedTrashCategoryForTab(activeMainTab);
  const currentScope = getScopeForTab(activeMainTab);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (ALL_FIXED_CATEGORY_IDS.includes(c.id) || LEGACY_INBOX_IDS.includes(c.id) || c.isDeleted) return false;
      if (currentScope === 'explorer') {
        return !c.scope || c.scope === 'explorer';
      }
      return c.scope === currentScope;
    });
  }, [categories, currentScope]);

  const allCategories = useMemo(() => {
    return [
      ...(activeMainTab === 'explorer' ? [QUICK_MEMO_CATEGORY] : []),
      ...[...filteredCategories].sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        const res = nameA.localeCompare(nameB, 'ko-KR', { numeric: true, sensitivity: 'base' });
        if (res !== 0) return res;
        return nameA.localeCompare(nameB, 'ko-KR');
      }),
      currentFixedTrashCategory,
    ];
  }, [activeMainTab, filteredCategories, currentFixedTrashCategory]);

  const isTrashSelected = FIXED_TRASH_IDS.includes(selectedCategoryId);

  // Filter & Sort items by selected category (Default: ascending order by title / 가나다순)
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (isTrashSelected) {
          return (
            item.categoryId === selectedCategoryId ||
            (item.isDeleted && (item.categoryId === selectedCategoryId || item.deletedTab === activeMainTab))
          );
        }
        if (item.isDeleted || FIXED_TRASH_IDS.includes(item.categoryId)) return false;
        return item.categoryId === selectedCategoryId;
      })
      .sort((a, b) => {
        if (selectedCategoryId === 'quick_memo') {
          const titleA = (a.title || '').trim();
          const titleB = (b.title || '').trim();
          const comp = titleB.localeCompare(titleA, 'ko-KR', { numeric: true, sensitivity: 'base' });
          if (comp !== 0) return comp;
          const tA = getItemTimestamp(a);
          const tB = getItemTimestamp(b);
          return tB - tA;
        }
        const orderA = typeof a.order === 'number' ? a.order : null;
        const orderB = typeof b.order === 'number' ? b.order : null;
        if (orderA !== null && orderB !== null) {
          if (orderA !== orderB) return orderA - orderB;
        } else if (orderA !== null) {
          return -1;
        } else if (orderB !== null) {
          return 1;
        }
        const titleA = (a.title || '').trim();
        const titleB = (b.title || '').trim();
        const comp = titleA.localeCompare(titleB, 'ko-KR', { numeric: true, sensitivity: 'base' });
        if (comp !== 0) return comp;
        const tA = getItemTimestamp(a);
        const tB = getItemTimestamp(b);
        return tA - tB;
      });
  }, [items, isTrashSelected, selectedCategoryId, activeMainTab]);

  // Search matched items (across ALL categories and tabs if search is active)
  const matchedItems = useMemo(() => {
    if (!isSearchActive) return [];
    return items
      .filter((item) => {
        if (isTrashSelected) {
          const inThisTrash =
            item.categoryId === selectedCategoryId ||
            (item.isDeleted && (item.categoryId === selectedCategoryId || item.deletedTab === activeMainTab));
          if (!inThisTrash) return false;
        } else {
          if (item.isDeleted || FIXED_TRASH_IDS.includes(item.categoryId)) {
            return false;
          }
        }
        return checkItemMatches(item, searchLower);
      })
      .sort((a, b) => {
        const titleA = (a.title || '').trim();
        const titleB = (b.title || '').trim();
        const comp = titleA.localeCompare(titleB, 'ko-KR', { numeric: true, sensitivity: 'base' });
        if (comp !== 0) {
          return itemSortOrder === 'asc' ? comp : -comp;
        }
        const tA = getItemTimestamp(a);
        const tB = getItemTimestamp(b);
        return itemSortOrder === 'asc' ? tA - tB : tB - tA;
      });
  }, [isSearchActive, items, isTrashSelected, selectedCategoryId, activeMainTab, searchLower, itemSortOrder]);

  const displayedItems = isSearchActive ? matchedItems : filteredItems;

  // Auto-select first item when category changes if current selected item not in category (only after items loaded)
  useEffect(() => {
    if (items.length === 0) return;
    if (filteredItems.length > 0) {
      const exists = filteredItems.some((item) => item.id === selectedItemId);
      if (!exists) {
        setSelectedItemId(filteredItems[0].id);
      }
    } else {
      setSelectedItemId(null);
    }
  }, [selectedCategoryId, filteredItems.length, items.length, selectedItemId, setSelectedItemId]);

  // Current active selected item & category objects
  const activeItem = items.find((item) => item.id === selectedItemId);
  const activeCategory = allCategories.find((cat) => cat.id === selectedCategoryId);

  // Current active tab scope category groups
  const currentScopeCategoryGroups = useMemo(() => {
    const scope = getScopeForTab(activeMainTab);
    return categoryGroups
      .filter((g) => (g.scope || 'explorer') === scope)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categoryGroups, activeMainTab]);

  // Group displayed categories by categoryGroups
  const displayedCategoryGrouped = useMemo(() => {
    if (currentScopeCategoryGroups.length === 0) {
      return [{ group: null, categories: filteredCategories }];
    }

    const groupMap = new Map();
    currentScopeCategoryGroups.forEach((g) => {
      groupMap.set(g.id, { group: g, categories: [] });
    });

    const unassignedCategories = [];

    filteredCategories.forEach((cat) => {
      if (cat.groupId && groupMap.has(cat.groupId)) {
        groupMap.get(cat.groupId).categories.push(cat);
      } else {
        unassignedCategories.push(cat);
      }
    });

    const result = [];
    currentScopeCategoryGroups.forEach((g) => {
      result.push(groupMap.get(g.id));
    });

    if (unassignedCategories.length > 0 || draggedCategoryId) {
      result.push({
        group: { id: '__unassigned__', name: '미분류 카테고리', isUnassigned: true },
        categories: unassignedCategories,
      });
    }

    result.forEach((grp) => {
      if (grp && Array.isArray(grp.categories)) {
        grp.categories.sort((a, b) => {
          const orderA = typeof a.order === 'number' ? a.order : null;
          const orderB = typeof b.order === 'number' ? b.order : null;
          if (orderA !== null && orderB !== null) {
            if (orderA !== orderB) return orderA - orderB;
          } else if (orderA !== null) {
            return -1;
          } else if (orderB !== null) {
            return 1;
          }
          return (a.name || '').localeCompare(b.name || '', 'ko-KR', { numeric: true });
        });
      }
    });

    return result;
  }, [currentScopeCategoryGroups, filteredCategories, draggedCategoryId]);

  // Current active category item groups
  const currentCategoryItemGroups = useMemo(() => {
    if (isTrashSelected || isSearchActive) return [];
    if (!activeCategory || !Array.isArray(activeCategory.itemGroups)) return [];
    return [...activeCategory.itemGroups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [activeCategory, isTrashSelected, isSearchActive]);

  // Group displayed items by itemGroups
  const displayedItemGrouped = useMemo(() => {
    if (isSearchActive || isTrashSelected || currentCategoryItemGroups.length === 0) {
      return [{ group: null, items: displayedItems }];
    }

    const groupMap = new Map();
    currentCategoryItemGroups.forEach((g) => {
      groupMap.set(g.id, { group: g, items: [] });
    });

    const unassignedItems = [];

    displayedItems.forEach((item) => {
      if (item.groupId && groupMap.has(item.groupId)) {
        groupMap.get(item.groupId).items.push(item);
      } else {
        unassignedItems.push(item);
      }
    });

    const result = [];
    currentCategoryItemGroups.forEach((g) => {
      result.push(groupMap.get(g.id));
    });

    if (unassignedItems.length > 0 || draggedItemId) {
      result.push({
        group: { id: '__unassigned__', name: '미분류 메모', isUnassigned: true },
        items: unassignedItems,
      });
    }

    result.forEach((grp) => {
      if (grp && Array.isArray(grp.items)) {
        grp.items.sort((a, b) => {
          const orderA = typeof a.order === 'number' ? a.order : null;
          const orderB = typeof b.order === 'number' ? b.order : null;
          if (orderA !== null && orderB !== null) {
            if (orderA !== orderB) return orderA - orderB;
          } else if (orderA !== null) {
            return -1;
          } else if (orderB !== null) {
            return 1;
          }
          const titleA = (a.title || '').trim();
          const titleB = (b.title || '').trim();
          const comp = titleA.localeCompare(titleB, 'ko-KR', { numeric: true, sensitivity: 'base' });
          if (comp !== 0) return comp;
          const tA = getItemTimestamp(a);
          const tB = getItemTimestamp(b);
          return tA - tB;
        });
      }
    });

    return result;
  }, [displayedItems, currentCategoryItemGroups, isSearchActive, isTrashSelected, draggedItemId]);

  const toggleItemGroupCollapse = (groupId) => {
    if (typeof setCollapsedItemGroups === 'function') {
      setCollapsedItemGroups((prev) => {
        const next = { ...prev, [groupId]: !prev[groupId] };
        try {
          localStorage.setItem('memo_collapsed_item_groups', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const isItemInTrash = Boolean(
    activeItem && (activeItem.isDeleted || FIXED_TRASH_IDS.includes(activeItem.categoryId) || isTrashSelected)
  );

  const hasTpl = Boolean(activeItem?.templateId && templates.find((t) => t.id === activeItem.templateId));
  const activeTpl = hasTpl ? templates.find((t) => t.id === activeItem.templateId) : null;
  const hasBlocks = Boolean(
    Array.isArray(activeItem?.detailBlocks) &&
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
  const hasLegacyBody = Boolean((activeItem?.body && activeItem.body.trim().length > 0) || hasBlocks);

  // Compute active item checklists (with legacy subBody fallback)
  const baseChecklists =
    isEditMode && draftChecklists !== null
      ? draftChecklists
      : activeItem?.checklists
      ? activeItem.checklists
      : activeItem?.subBody
      ? activeItem.subBody
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map((line, idx) => ({
            id: `legacy_${idx}`,
            text: line,
            completed: false,
          }))
      : [];

  const rawChecklists = [];
  if (hasTpl) {
    rawChecklists.push({
      id: '__main__',
      text: activeTpl.title,
      completed: Boolean(activeItem?.completed),
      tag: null,
      detail: activeItem.body || '',
      detailBlocks: activeItem.detailBlocks || [],
      isTemplate: true,
    });
  } else if (hasLegacyBody) {
    rawChecklists.push({
      id: '__main__',
      text: '기본 내용',
      completed: Boolean(activeItem?.completed),
      tag: null,
      detail: activeItem.body || '',
      detailBlocks: activeItem.detailBlocks || [],
    });
  }
  rawChecklists.push(...baseChecklists);

  // Group checklists by section header (isSection: true)
  const checklistGroups = useMemo(() => {
    const groups = [];
    let currentGroup = { section: null, items: [] };

    rawChecklists.forEach((item) => {
      if (item.isSection) {
        if (currentGroup.section || currentGroup.items.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = { section: item, items: [] };
      } else {
        currentGroup.items.push(item);
      }
    });

    if (currentGroup.section || currentGroup.items.length > 0) {
      groups.push(currentGroup);
    }

    return groups.map((g) => {
      const sortedItems = [...g.items].sort((a, b) => {
        if (a.id === '__main__') return -1;
        if (b.id === '__main__') return 1;
        const aDone = Boolean(a.completed);
        const bDone = Boolean(b.completed);
        if (aDone !== bDone) return aDone ? 1 : -1;
        return 0;
      });

      const groupCompletedCount = g.items.filter((i) => i.id !== '__main__' && i.completed).length;
      const groupTotalCount = g.items.filter((i) => i.id !== '__main__').length;

      return {
        ...g,
        sortedItems,
        groupCompletedCount,
        groupTotalCount,
      };
    });
  }, [rawChecklists]);

  const currentChecklists = useMemo(() => {
    return checklistGroups.flatMap((g) => {
      if (g.section) {
        return [g.section, ...g.sortedItems];
      }
      return g.sortedItems;
    });
  }, [checklistGroups]);

  const actualChecklistItems = rawChecklists.filter((c) => !c.isSection && c.id !== '__main__');
  const completedCount = actualChecklistItems.filter((c) => c.completed).length;
  const totalCount = actualChecklistItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    currentFixedTrashCategory,
    currentScope,
    filteredCategories,
    allCategories,
    isTrashSelected,
    filteredItems,
    matchedItems,
    displayedItems,
    activeItem,
    activeCategory,
    currentScopeCategoryGroups,
    displayedCategoryGrouped,
    currentCategoryItemGroups,
    displayedItemGrouped,
    toggleItemGroupCollapse,
    isItemInTrash,
    hasTpl,
    activeTpl,
    hasBlocks,
    hasLegacyBody,
    baseChecklists,
    rawChecklists,
    checklistGroups,
    currentChecklists,
    actualChecklistItems,
    completedCount,
    totalCount,
    progressPercent,
  };
}
