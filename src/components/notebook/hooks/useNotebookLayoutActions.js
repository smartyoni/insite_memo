import { saveStoredDetailCollapsedBlocks } from '../notebookConstants';
import { blocksToPlainText } from '../../DetailBlocks';

export function useNotebookLayoutActions({
  setOpenChecklistMenuId,
  setCopyToastText,
  copyToastTimerRef,
  setDetailCollapsedBlockIds,
  activeItem,
  selectedItemId,
  selectedChecklistId,
  checklistDetailBlocks,
  setCollapsedCategoryGroups,
  categories,
  setExpandedFolders,
  categoryGroups,
  collapsedItemGroups,
  activeCategory,
  setCollapsedItemGroups,
}) {
  const handleCopyChecklist = async (checkItem) => {
    if (typeof setOpenChecklistMenuId === 'function') {
      setOpenChecklistMenuId(null);
    }
    if (!checkItem) return;

    let detailText = '';
    if (checkItem.detail) {
      detailText = checkItem.detail;
    } else if (checkItem.detailBlocks && Array.isArray(checkItem.detailBlocks)) {
      detailText = blocksToPlainText(checkItem.detailBlocks);
    }

    const trimmedText = (checkItem.text || '').trim();
    const trimmedDetail = (detailText || '').trim();

    let copyContent = trimmedText;
    if (trimmedDetail) {
      copyContent = trimmedText ? `${trimmedText}\n\n${trimmedDetail}` : trimmedDetail;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copyContent);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = copyContent;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (typeof setCopyToastText === 'function') {
        setCopyToastText('✓ 체크리스트 내용이 복사되었습니다.');
      }
      if (copyToastTimerRef?.current) clearTimeout(copyToastTimerRef.current);
      if (copyToastTimerRef) {
        copyToastTimerRef.current = setTimeout(() => {
          if (typeof setCopyToastText === 'function') {
            setCopyToastText('');
          }
        }, 1800);
      }
    } catch (err) {
      console.error('체크리스트 복사 실패:', err);
    }
  };

  const getSortedChecklistItems = (rawVal, defaultItems) => {
    const list = Array.isArray(rawVal)
      ? rawVal
      : (defaultItems || []).map((t) => (typeof t === 'object' ? t : { text: t, completed: false }));

    const indexed = list.map((item, idx) => ({
      ...(typeof item === 'object' ? item : { text: item, completed: false }),
      originalIndex: idx,
    }));

    return indexed.sort((a, b) => {
      const aDone = Boolean(a.completed);
      const bDone = Boolean(b.completed);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.originalIndex - b.originalIndex;
    });
  };

  const updateDetailCollapsedBlockIds = (updater) => {
    if (typeof setDetailCollapsedBlockIds !== 'function') return;
    setDetailCollapsedBlockIds((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const targetId = activeItem?.id || selectedItemId;
      if (targetId) {
        saveStoredDetailCollapsedBlocks(targetId, selectedChecklistId || '__main__', next);
      }
      return next;
    });
  };

  const handleExpandAllDetailBlocks = () => {
    updateDetailCollapsedBlockIds({});
  };

  const handleCollapseAllDetailBlocks = () => {
    const newCollapsed = {};
    (checklistDetailBlocks || []).forEach((b) => {
      if (b && b.id) {
        newCollapsed[b.id] = true;
      }
    });
    updateDetailCollapsedBlockIds(newCollapsed);
  };

  const handleExpandAllCategories = () => {
    if (typeof setCollapsedCategoryGroups === 'function') {
      setCollapsedCategoryGroups({});
      try {
        localStorage.setItem('memo_collapsed_category_groups', JSON.stringify({}));
      } catch {}
    }

    const allExpanded = {};
    (categories || []).forEach((c) => {
      if (c && c.id) allExpanded[c.id] = true;
    });
    if (typeof setExpandedFolders === 'function') {
      setExpandedFolders(allExpanded);
      try {
        localStorage.setItem('memo_expanded_folders', JSON.stringify(allExpanded));
      } catch {}
    }
  };

  const handleCollapseAllCategories = () => {
    const allCollapsedGroups = {};
    (categoryGroups || []).forEach((g) => {
      if (g && g.id) allCollapsedGroups[g.id] = true;
    });
    if (typeof setCollapsedCategoryGroups === 'function') {
      setCollapsedCategoryGroups(allCollapsedGroups);
      try {
        localStorage.setItem('memo_collapsed_category_groups', JSON.stringify(allCollapsedGroups));
      } catch {}
    }

    const allCollapsedFolders = {};
    (categories || []).forEach((c) => {
      if (c && c.id) allCollapsedFolders[c.id] = false;
    });
    if (typeof setExpandedFolders === 'function') {
      setExpandedFolders(allCollapsedFolders);
      try {
        localStorage.setItem('memo_expanded_folders', JSON.stringify(allCollapsedFolders));
      } catch {}
    }
  };

  const handleExpandAllItemGroups = () => {
    const next = { ...collapsedItemGroups };
    if (activeCategory && Array.isArray(activeCategory.itemGroups)) {
      activeCategory.itemGroups.forEach((g) => {
        if (g && g.id) delete next[g.id];
      });
    }
    if (typeof setCollapsedItemGroups === 'function') {
      setCollapsedItemGroups(next);
      try {
        localStorage.setItem('memo_collapsed_item_groups', JSON.stringify(next));
      } catch {}
    }
  };

  const handleCollapseAllItemGroups = () => {
    const next = { ...collapsedItemGroups };
    if (activeCategory && Array.isArray(activeCategory.itemGroups)) {
      activeCategory.itemGroups.forEach((g) => {
        if (g && g.id) next[g.id] = true;
      });
    }
    if (typeof setCollapsedItemGroups === 'function') {
      setCollapsedItemGroups(next);
      try {
        localStorage.setItem('memo_collapsed_item_groups', JSON.stringify(next));
      } catch {}
    }
  };

  return {
    handleCopyChecklist,
    getSortedChecklistItems,
    updateDetailCollapsedBlockIds,
    handleExpandAllDetailBlocks,
    handleCollapseAllDetailBlocks,
    handleExpandAllCategories,
    handleCollapseAllCategories,
    handleExpandAllItemGroups,
    handleCollapseAllItemGroups,
  };
}
