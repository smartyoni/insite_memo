import { useState, useEffect } from 'react';

export function useMenuPositioning() {
  const [openChecklistMenuId, setOpenChecklistMenuId] = useState(null);
  const [openChecklistMenuPos, setOpenChecklistMenuPos] = useState({ top: 0, right: 0 });

  const [openGroupMenuId, setOpenGroupMenuId] = useState(null);
  const [openGroupMenuPos, setOpenGroupMenuPos] = useState({ top: 0, right: 0 });

  const [openCatMenuId, setOpenCatMenuId] = useState(null);
  const [openCatMenuPos, setOpenCatMenuPos] = useState({ top: 0, right: 0 });

  const [openCategoryGroupMenuId, setOpenCategoryGroupMenuId] = useState(null);
  const [openCategoryGroupMenuPos, setOpenCategoryGroupMenuPos] = useState({ top: 0, right: 0 });

  const [openItemGroupMenuId, setOpenItemGroupMenuId] = useState(null);
  const [openItemGroupMenuPos, setOpenItemGroupMenuPos] = useState({ top: 0, right: 0 });

  const [openNoteMenuId, setOpenNoteMenuId] = useState(null);
  const [openNoteMenuPos, setOpenNoteMenuPos] = useState({ top: 0, right: 0 });

  const handleOpenChecklistMenu = (e, checkItemId) => {
    e.stopPropagation();
    if (openChecklistMenuId === checkItemId) {
      setOpenChecklistMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 160;
      const wouldOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = wouldOverflowBottom ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4;
      const right = Math.max(10, window.innerWidth - rect.right);
      setOpenChecklistMenuPos({ top, right });
      setOpenChecklistMenuId(checkItemId);
    }
  };

  const handleOpenGroupMenu = (e, groupId) => {
    e.stopPropagation();
    if (openGroupMenuId === groupId) {
      setOpenGroupMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 160;
      const wouldOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = wouldOverflowBottom ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4;
      const right = Math.max(10, window.innerWidth - rect.right);
      setOpenGroupMenuPos({ top, right });
      setOpenGroupMenuId(groupId);
    }
  };

  const handleOpenCatMenu = (e, catId) => {
    e.stopPropagation();
    if (openCatMenuId === catId) {
      setOpenCatMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 190;
      const wouldOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = wouldOverflowBottom ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4;
      const right = Math.max(10, window.innerWidth - rect.right);
      setOpenCatMenuPos({ top, right });
      setOpenCatMenuId(catId);
    }
  };

  const handleOpenCategoryGroupMenu = (e, groupId) => {
    e.stopPropagation();
    if (openCategoryGroupMenuId === groupId) {
      setOpenCategoryGroupMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 220;
      const wouldOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = wouldOverflowBottom ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4;
      const right = Math.max(10, window.innerWidth - rect.right);
      setOpenCategoryGroupMenuPos({ top, right });
      setOpenCategoryGroupMenuId(groupId);
    }
  };

  const handleOpenItemGroupMenu = (e, groupId) => {
    e.stopPropagation();
    if (openItemGroupMenuId === groupId) {
      setOpenItemGroupMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 220;
      const wouldOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = wouldOverflowBottom ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4;
      const right = Math.max(10, window.innerWidth - rect.right);
      setOpenItemGroupMenuPos({ top, right });
      setOpenItemGroupMenuId(groupId);
    }
  };

  const handleOpenNoteMenu = (e, itemId) => {
    e.stopPropagation();
    if (openNoteMenuId === itemId) {
      setOpenNoteMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 160;
      const wouldOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = wouldOverflowBottom ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4;
      const right = Math.max(10, window.innerWidth - rect.right);
      setOpenNoteMenuPos({ top, right });
      setOpenNoteMenuId(itemId);
    }
  };

  const handleCloseAllMenus = () => {
    setOpenChecklistMenuId(null);
    setOpenCatMenuId(null);
    setOpenCategoryGroupMenuId(null);
    setOpenItemGroupMenuId(null);
    setOpenNoteMenuId(null);
    setOpenGroupMenuId(null);
  };

  useEffect(() => {
    if (!openChecklistMenuId && !openCatMenuId && !openCategoryGroupMenuId && !openItemGroupMenuId && !openNoteMenuId && !openGroupMenuId) return;
    window.addEventListener('resize', handleCloseAllMenus);
    window.addEventListener('scroll', handleCloseAllMenus, true);
    return () => {
      window.removeEventListener('resize', handleCloseAllMenus);
      window.removeEventListener('scroll', handleCloseAllMenus, true);
    };
  }, [openChecklistMenuId, openCatMenuId, openCategoryGroupMenuId, openItemGroupMenuId, openNoteMenuId, openGroupMenuId]);

  return {
    openChecklistMenuId,
    setOpenChecklistMenuId,
    openChecklistMenuPos,
    setOpenChecklistMenuPos,
    openGroupMenuId,
    setOpenGroupMenuId,
    openGroupMenuPos,
    setOpenGroupMenuPos,
    openCatMenuId,
    setOpenCatMenuId,
    openCatMenuPos,
    setOpenCatMenuPos,
    openCategoryGroupMenuId,
    setOpenCategoryGroupMenuId,
    openCategoryGroupMenuPos,
    setOpenCategoryGroupMenuPos,
    openItemGroupMenuId,
    setOpenItemGroupMenuId,
    openItemGroupMenuPos,
    setOpenItemGroupMenuPos,
    openNoteMenuId,
    setOpenNoteMenuId,
    openNoteMenuPos,
    setOpenNoteMenuPos,
    handleOpenChecklistMenu,
    handleOpenGroupMenu,
    handleOpenCatMenu,
    handleOpenCategoryGroupMenu,
    handleOpenItemGroupMenu,
    handleOpenNoteMenu,
    handleCloseAllMenus
  };
}
