import { useState, useRef } from 'react';

export function useNotebookUIState({ initialNavLoc, initialDraftCategoryId, initialCollapsedSections, initialDetailCollapsedBlockIds }) {
  // Item List Sort Order State & Search
  const [itemSortOrder, setItemSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const searchLower = searchQuery.trim().toLowerCase();
  const isSearchActive = searchLower.length > 0;

  // Category inline editing states & hierarchy states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingParentId, setAddingParentId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  // Folder collapse/expand state (persisted to localStorage)
  const [expandedFolders, setExpandedFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('memo_expanded_folders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleFolder = (folderId, e) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => {
      const current = prev[folderId] !== false;
      const next = { ...prev, [folderId]: !current };
      try {
        localStorage.setItem('memo_expanded_folders', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Drag & drop and mobile move modal states
  const [draggedCategoryId, setDraggedCategoryId] = useState(null);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState(null);
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);
  const [movingCategory, setMovingCategory] = useState(null);
  const [targetMoveParentId, setTargetMoveParentId] = useState('');
  const [movingItem, setMovingItem] = useState(null);
  const [targetMoveItemTab, setTargetMoveItemTab] = useState('explorer');
  const [targetMoveCategoryGroupId, setTargetMoveCategoryGroupId] = useState('');
  const [targetMoveItemCategoryId, setTargetMoveItemCategoryId] = useState('');
  const [targetMoveItemGroupId, setTargetMoveItemGroupId] = useState('');

  // Category item groups (그룹화된 메모 목록 관리) states
  const [collapsedItemGroups, setCollapsedItemGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('memo_collapsed_item_groups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isAddingItemGroup, setIsAddingItemGroup] = useState(false);
  const [newItemGroupName, setNewItemGroupName] = useState('');
  const [editingItemGroupId, setEditingItemGroupId] = useState(null);
  const [editingItemGroupName, setEditingItemGroupName] = useState('');
  const [itemGroupTargetForNewItem, setItemGroupTargetForNewItem] = useState(null);
  const [dragOverItemGroupId, setDragOverItemGroupId] = useState(null);
  const [dragOverItemId, setDragOverItemId] = useState(null);

  // Category groups (그룹화된 카테고리 관리) states
  const [collapsedCategoryGroups, setCollapsedCategoryGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('memo_collapsed_category_groups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isAddingCategoryGroup, setIsAddingCategoryGroup] = useState(false);
  const [newCategoryGroupName, setNewCategoryGroupName] = useState('');
  const [editingCategoryGroupId, setEditingCategoryGroupId] = useState(null);
  const [editingCategoryGroupName, setEditingCategoryGroupName] = useState('');
  const [addingCategoryGroupId, setAddingCategoryGroupId] = useState(null);
  const [dragOverCategoryGroupId, setDragOverCategoryGroupId] = useState(null);

  // Item inline editing states (Pane 2)
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemTitle, setEditingItemTitle] = useState('');
  const [deletingItemId, setDeletingItemId] = useState(null);

  // Detail View (Pane 3) states - Split 2-pane Layout
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingChecklistDetail, setIsEditingChecklistDetail] = useState(false);
  const titleInputRef = useRef(null);
  const autoEditItemIdRef = useRef(null);
  const shouldFocusTitleRef = useRef(false);

  const [draftCategoryId, setDraftCategoryId] = useState(() => initialDraftCategoryId ?? 'quick_memo');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftSubBody, setDraftSubBody] = useState('');
  const [draftTemplateId, setDraftTemplateId] = useState(null);
  const [draftTemplateValues, setDraftTemplateValues] = useState({});
  const [draftChecklists, setDraftChecklists] = useState(null);
  const [draggedNoteChecklistId, setDraggedNoteChecklistId] = useState(null);
  const [dragOverNoteChecklistId, setDragOverNoteChecklistId] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Detail Blocks Clipboard State
  const [detailClipboard, setDetailClipboard] = useState(() => {
    try {
      const saved = localStorage.getItem('insite_memo_detail_clipboard');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Global Navigation History States (for '이전' button)
  const [navHistory, setNavHistory] = useState([]);
  const lastNavLocationRef = useRef(null);
  const isNavigatingBackRef = useRef(false);

  // Global Quick Memo Modal States
  const [isQuickMemoOpen, setIsQuickMemoOpen] = useState(false);
  const [quickMemoText, setQuickMemoText] = useState('');
  const [isSavingQuickMemo, setIsSavingQuickMemo] = useState(false);
  const [quickMemoToast, setQuickMemoToast] = useState(false);
  const quickMemoToastTimerRef = useRef(null);
  const quickMemoTextareaRef = useRef(null);

  // Template 2 Dedicated States
  const [selectedTemplate2IdInTab, setSelectedTemplate2IdInTab] = useState(null);
  const [tpl2DraftTitle, setTpl2DraftTitle] = useState('');
  const [tpl2DraftChecklists, setTpl2DraftChecklists] = useState([]);
  const [selectedTpl2ChecklistId, setSelectedTpl2ChecklistId] = useState(null);
  const [newTpl2ChecklistText, setNewTpl2ChecklistText] = useState('');
  const [isSavingTpl2, setIsSavingTpl2] = useState(false);
  const [showTemplate2Modal, setShowTemplate2Modal] = useState(false);
  const [template2ApplyMode, setTemplate2ApplyMode] = useState('replace');
  const [template2SearchKeyword, setTemplate2SearchKeyword] = useState('');
  const [collapsedTplCatIds, setCollapsedTplCatIds] = useState({});

  // Drag and Drop States for Template Canvas Blocks and Intra-Group Items
  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null);
  const [draggedFieldItem, setDraggedFieldItem] = useState(null);
  const [dragOverFieldItem, setDragOverFieldItem] = useState(null);
  const [draggedChecklistIndex, setDraggedChecklistIndex] = useState(null);
  const [dragOverChecklistIndex, setDragOverChecklistIndex] = useState(null);

  // Checklist local states
  const [checklistDetailDraft, setChecklistDetailDraft] = useState('');
  const [checklistDetailBlocks, setChecklistDetailBlocks] = useState([]);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(() => initialCollapsedSections ?? {});
  const [editingCheckId, setEditingCheckId] = useState(null);
  const [editingCheckText, setEditingCheckText] = useState('');
  const [editingCheckTag, setEditingCheckTag] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
  const [detailCollapsedBlockIds, setDetailCollapsedBlockIds] = useState(() => initialDetailCollapsedBlockIds ?? {});
  const [newChecklistText, setNewChecklistText] = useState('');

  return {
    itemSortOrder,
    setItemSortOrder,
    searchQuery,
    setSearchQuery,
    searchLower,
    isSearchActive,
    isAddingCategory,
    setIsAddingCategory,
    addingParentId,
    setAddingParentId,
    newCategoryName,
    setNewCategoryName,
    editingCategoryId,
    setEditingCategoryId,
    editingCategoryName,
    setEditingCategoryName,
    deletingCategoryId,
    setDeletingCategoryId,
    expandedFolders,
    setExpandedFolders,
    toggleFolder,
    draggedCategoryId,
    setDraggedCategoryId,
    draggedItemId,
    setDraggedItemId,
    dragOverCategoryId,
    setDragOverCategoryId,
    isDragOverRoot,
    setIsDragOverRoot,
    movingCategory,
    setMovingCategory,
    targetMoveParentId,
    setTargetMoveParentId,
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
    collapsedItemGroups,
    setCollapsedItemGroups,
    isAddingItemGroup,
    setIsAddingItemGroup,
    newItemGroupName,
    setNewItemGroupName,
    editingItemGroupId,
    setEditingItemGroupId,
    editingItemGroupName,
    setEditingItemGroupName,
    itemGroupTargetForNewItem,
    setItemGroupTargetForNewItem,
    dragOverItemGroupId,
    setDragOverItemGroupId,
    dragOverItemId,
    setDragOverItemId,
    collapsedCategoryGroups,
    setCollapsedCategoryGroups,
    isAddingCategoryGroup,
    setIsAddingCategoryGroup,
    newCategoryGroupName,
    setNewCategoryGroupName,
    editingCategoryGroupId,
    setEditingCategoryGroupId,
    editingCategoryGroupName,
    setEditingCategoryGroupName,
    addingCategoryGroupId,
    setAddingCategoryGroupId,
    dragOverCategoryGroupId,
    setDragOverCategoryGroupId,
    editingItemId,
    setEditingItemId,
    editingItemTitle,
    setEditingItemTitle,
    deletingItemId,
    setDeletingItemId,
    isEditMode,
    setIsEditMode,
    isEditingChecklistDetail,
    setIsEditingChecklistDetail,
    titleInputRef,
    autoEditItemIdRef,
    shouldFocusTitleRef,
    draftCategoryId,
    setDraftCategoryId,
    draftTitle,
    setDraftTitle,
    draftBody,
    setDraftBody,
    draftSubBody,
    setDraftSubBody,
    draftTemplateId,
    setDraftTemplateId,
    draftTemplateValues,
    setDraftTemplateValues,
    draftChecklists,
    setDraftChecklists,
    draggedNoteChecklistId,
    setDraggedNoteChecklistId,
    dragOverNoteChecklistId,
    setDragOverNoteChecklistId,
    showTemplateModal,
    setShowTemplateModal,
    showSavedToast,
    setShowSavedToast,
    detailClipboard,
    setDetailClipboard,
    navHistory,
    setNavHistory,
    lastNavLocationRef,
    isNavigatingBackRef,
    isQuickMemoOpen,
    setIsQuickMemoOpen,
    quickMemoText,
    setQuickMemoText,
    isSavingQuickMemo,
    setIsSavingQuickMemo,
    quickMemoToast,
    setQuickMemoToast,
    quickMemoToastTimerRef,
    quickMemoTextareaRef,
    selectedTemplate2IdInTab,
    setSelectedTemplate2IdInTab,
    tpl2DraftTitle,
    setTpl2DraftTitle,
    tpl2DraftChecklists,
    setTpl2DraftChecklists,
    selectedTpl2ChecklistId,
    setSelectedTpl2ChecklistId,
    newTpl2ChecklistText,
    setNewTpl2ChecklistText,
    isSavingTpl2,
    setIsSavingTpl2,
    showTemplate2Modal,
    setShowTemplate2Modal,
    template2ApplyMode,
    setTemplate2ApplyMode,
    template2SearchKeyword,
    setTemplate2SearchKeyword,
    collapsedTplCatIds,
    setCollapsedTplCatIds,
    draggedBlockIndex,
    setDraggedBlockIndex,
    dragOverBlockIndex,
    setDragOverBlockIndex,
    draggedFieldItem,
    setDraggedFieldItem,
    dragOverFieldItem,
    setDragOverFieldItem,
    draggedChecklistIndex,
    setDraggedChecklistIndex,
    dragOverChecklistIndex,
    setDragOverChecklistIndex,
    checklistDetailDraft,
    setChecklistDetailDraft,
    checklistDetailBlocks,
    setChecklistDetailBlocks,
    editingBlockId,
    setEditingBlockId,
    collapsedSections,
    setCollapsedSections,
    editingCheckId,
    setEditingCheckId,
    editingCheckText,
    setEditingCheckText,
    editingCheckTag,
    setEditingCheckTag,
    customTagInput,
    setCustomTagInput,
    detailCollapsedBlockIds,
    setDetailCollapsedBlockIds,
    newChecklistText,
    setNewChecklistText,
  };
}
