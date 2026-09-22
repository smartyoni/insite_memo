import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Plus,
  Minus,
  Edit2,
  Trash2,
  Check,
  X,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderInput,
  ChevronDown,
  ChevronUp,
  FileText,
  Clipboard,
  ChevronRight,
  Save,
  RotateCcw,
  ArrowLeft,
  Zap,
  Bookmark,
  CheckSquare,
  Square,
  ListChecks,
  Calendar as CalendarIcon,
  Tag,
  ArrowUp,
  ArrowDown,
  Settings,
  Layout,
  Phone,
  MessageSquare,
  Type,
  ExternalLink,
  Printer,
  GripVertical,
  MoreVertical,
  Search,
  Triangle,
  ChevronsUp,
  ChevronsDown,
  Copy,
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';
import { DetailBlocksManager, parseDetailBlocks, blocksToPlainText } from './DetailBlocks';
import CalendarCategoryList from './CalendarCategoryList';
import CalendarView from './CalendarView';
import CreateEventModal from './CreateEventModal';
import Template2Modal from './notebook/modals/Template2Modal';
import SettingsBackupModal from './notebook/modals/SettingsBackupModal';
import MoveBlockModal from './notebook/modals/MoveBlockModal';
import CategoryMoveModal from './notebook/modals/CategoryMoveModal';
import MoveItemModal from './notebook/modals/MoveItemModal';
import { MainModeBar, UserBar } from './notebook/MainModeBar';
import CategorySidebar from './notebook/CategorySidebar';
import ItemSubListPane from './notebook/ItemSubListPane';
import TemplateCanvas from './notebook/TemplateCanvas';
import CalendarDetailPane from './notebook/CalendarDetailPane';
import NotebookDetailPane from './notebook/NotebookDetailPane';
import { useCalendarData } from './notebook/hooks/useCalendarData';
import { useNotebookData } from './notebook/hooks/useNotebookData';
import { useCategoryActions } from './notebook/hooks/useCategoryActions';
import { useItemActions } from './notebook/hooks/useItemActions';
import { useTemplateActions } from './notebook/hooks/useTemplateActions';
import { useChecklistActions } from './notebook/hooks/useChecklistActions';
import { useDetailBlockActions } from './notebook/hooks/useDetailBlockActions';
import { useNoteDetailEdit } from './notebook/hooks/useNoteDetailEdit';
import { useWorkLocationHistory } from './notebook/hooks/useWorkLocationHistory';
import { useQuickMemoActions } from './notebook/hooks/useQuickMemoActions';
import { useMainTabs } from './notebook/hooks/useMainTabs';
import { useNotebookContextMenu } from './notebook/hooks/useNotebookContextMenu';
import { useDeleteModal } from './notebook/hooks/useDeleteModal';
import { usePrintActions } from './notebook/hooks/usePrintActions';
import { useMenuPositioning } from './notebook/hooks/useMenuPositioning';
import { useAddGroupModal } from './notebook/hooks/useAddGroupModal';
import { useNotebookNavigation } from './notebook/hooks/useNotebookNavigation';
import { useNotebookSelectors } from './notebook/hooks/useNotebookSelectors';
import {
  extractAllStrings,
  getCategoryPath as getCategoryPathFn,
  buildCategoryTree,
  getHierarchicalCategoryOptions as getHierarchicalCategoryOptionsFn,
  getCategoryDescendantIds as getCategoryDescendantIdsFn,
  getCategoryFullPath as getCategoryFullPathFn,
  getItemFullPath as getItemFullPathFn,
  getMatchedSnippet,
  checkItemMatches,
  getItemMatchBadges,
} from './notebook/notebookHelpers';
import NotebookModals from './notebook/NotebookModals';
import { useNoteDraftSync } from './notebook/hooks/useNoteDraftSync';
import { useNotebookKeyEvents } from './notebook/hooks/useNotebookKeyEvents';
import { useNotebookLayoutActions } from './notebook/hooks/useNotebookLayoutActions';
import { useNotebookUIState } from './notebook/hooks/useNotebookUIState';
import {
  getLatestCloudBackupInfo,
  saveCloudBackup,
  fetchLatestCloudBackupData,
  applyRestoreData,
  downloadBackupFile,
  readBackupFile,
  getPreRestoreSafeguard
} from '../utils/backupService';

import {
  autoFormatPhoneNumber,
  groupFieldsList,
  getCanvasBlocks,
  DEFAULT_TAGS,
  TAG_COLOR_PALETTE,
  getStoredCustomTags,
  saveStoredCustomTags,
  getStoredNavLocation,
  saveStoredNavLocation,
  getStoredCollapsedSections,
  saveStoredCollapsedSections,
  getStoredDetailCollapsedBlocks,
  saveStoredDetailCollapsedBlocks,
  getTagStyle,
  LEGACY_INBOX_IDS,
  FIXED_INBOX_IDS,
  TRASH_CATEGORY,
  BLOG_TRASH_CATEGORY,
  CLIPBOARD_TRASH_CATEGORY,
  BALANCE_TRASH_CATEGORY,
  CLIP_TRASH_CATEGORY,
  OFFICE_TRASH_CATEGORY,
  AD_TRASH_CATEGORY,
  TEMPLATE2_TRASH_CATEGORY,
  EXPERIENCE_TRASH_CATEGORY,
  CUSTOM1_TRASH_CATEGORY,
  CUSTOM2_TRASH_CATEGORY,
  CUSTOM3_TRASH_CATEGORY,
  CUSTOM4_TRASH_CATEGORY,
  CUSTOM5_TRASH_CATEGORY,
  CUSTOM6_TRASH_CATEGORY,
  FIXED_TRASH_IDS,
  QUICK_MEMO_CATEGORY,
  ALL_FIXED_CATEGORY_IDS,
  DEFAULT_MAIN_TABS,
  MAIN_TABS_STORAGE_KEY,
  getStoredMainTabs,
  getScopeForTab,
  getDefaultCategoryIdForTab,
  getInboxIdForTab,
  getTrashIdForTab,
  getFixedTrashCategoryForTab,
  highlightText,
  getItemTimestamp
} from './notebook/notebookConstants';
import { styles } from './notebook/notebookStyles';

// Re-export for external consumers backwards compatibility
export {
  autoFormatPhoneNumber,
  groupFieldsList,
  getCanvasBlocks,
  DEFAULT_TAGS,
  TAG_COLOR_PALETTE,
  getStoredCustomTags,
  saveStoredCustomTags,
  getStoredNavLocation,
  saveStoredNavLocation,
  getStoredCollapsedSections,
  saveStoredCollapsedSections,
  getStoredDetailCollapsedBlocks,
  saveStoredDetailCollapsedBlocks,
  getTagStyle,
  DEFAULT_MAIN_TABS,
  MAIN_TABS_STORAGE_KEY,
  getStoredMainTabs
};

export default function NotebookExplorer({ currentUser, onLogout } = {}) {
  // Nav Location Persistence: Retrieve saved location
  const initialNavLoc = React.useMemo(() => getStoredNavLocation(), []);

  // Parse initial deep link from URL hash (#tab=...&cat=...)
  const initialHashLoc = React.useMemo(() => {
    if (typeof window === 'undefined' || !window.location.hash) return null;
    try {
      const hashStr = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const params = new URLSearchParams(hashStr);
      const tab = params.get('tab');
      const cat = params.get('cat');
      if (tab || cat) return { activeMainTab: tab, selectedCategoryId: cat };
    } catch (e) {}
    return null;
  }, []);

  // Main View Mode Tab state ('explorer' | 'clipboard' | 'balance' | 'clip' | 'calendar')
  const [activeMainTab, setActiveMainTab] = useState(() => {
    if (initialHashLoc?.activeMainTab) return initialHashLoc.activeMainTab;
    const initial = initialNavLoc?.activeMainTab || 'explorer';
    return initial === 'template' ? 'template2' : initial;
  });

  // Data states
  // Data states from useNotebookData hook
  const {
    categories,
    setCategories,
    items,
    setItems,
    categoryGroups,
    setCategoryGroups,
    templates,
    setTemplates,
    templates2,
    setTemplates2
  } = useNotebookData(db);
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => {
    if (initialHashLoc?.selectedCategoryId) return initialHashLoc.selectedCategoryId;
    const saved = initialNavLoc?.selectedCategoryId;
    if (saved && !LEGACY_INBOX_IDS.includes(saved)) {
      return saved;
    }
    return (initialNavLoc?.activeMainTab === 'explorer' || !initialNavLoc?.activeMainTab) ? 'quick_memo' : '';
  });
  const [selectedItemId, setSelectedItemId] = useState(() => initialNavLoc?.selectedItemId || null);
  const [selectedChecklistId, setSelectedChecklistId] = useState(() => initialNavLoc?.selectedChecklistId || '__main__');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const itemInputRef = useRef(null);

  const {
    isMobile,
    setIsMobile,
    mobileView,
    setMobileView,
    mobileSubTab,
    setMobileSubTab,
    showExitToast,
    handleTouchStart,
    handleTouchEnd,
    navigateToItems,
    navigateToDetail,
    navigateBack,
  } = useNotebookNavigation({
    initialNavLoc,
    activeMainTab,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedItemId,
    setSelectedItemId,
    selectedChecklistId,
    isAddingItem,
    setIsAddingItem,
    setNewItemTitle,
    itemInputRef,
  });

  // Main Tabs Configuration (Custom order, custom labels, drag & drop, cloud sync)
  const {
    mainTabs,
    setMainTabs,
    draggedTabIndex,
    setDraggedTabIndex,
    dragOverTabIndex,
    setDragOverTabIndex,
    editingTab,
    setEditingTab,
    editingTabInput,
    setEditingTabInput,
    isTabSettingModalOpen,
    setIsTabSettingModalOpen,
    saveMainTabs,
    handleTabDragStart,
    handleTabDragOver,
    handleTabDrop,
    handleTabDragEnd,
    moveTab,
    handleUpdateTabLabel,
    handleResetMainTabs,
    handleTabTouchStart,
    handleTabTouchEnd
  } = useMainTabs(db);

  // Backup & Restore States
  const [settingActiveTab, setSettingActiveTab] = useState('tabs'); // 'tabs' | 'backup'
  const [cloudBackupInfo, setCloudBackupInfo] = useState(null);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [backupStatusMessage, setBackupStatusMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const backupFileInputRef = useRef(null);
  const checkItemTouchTimerRef = useRef(null);

  // ---------------- 캘린더 기능 상태 및 핸들러 (커스텀 훅) ----------------
  const {
    DEFAULT_CAL_CATEGORIES,
    DEFAULT_CALENDAR_CATEGORY,
    isCalendarMode,
    setIsCalendarMode,
    calendarCategories,
    setCalendarCategories,
    selectedCalendarCategoryId,
    setSelectedCalendarCategoryId,
    calendarEvents,
    setCalendarEvents,
    selectedCalendarEventId,
    setSelectedCalendarEventId,
    createEventModalState,
    setCreateEventModalState,
    calendarReturnContext,
    setCalendarReturnContext,
    handleAddCalendarCategory,
    handleUpdateCalendarCategory,
    handleDeleteCalendarCategory,
    handleSaveCalendarEvent,
    handleDeleteCalendarEvent,
    handleOpenEditEventModal,
    handleNavigateToEventSource,
    handleSaveCalendarEventBlocks,
    handleReturnToCalendar,
    syncCalendarEventTitle,
    handleOpenCreateEventFromBlock
  } = useCalendarData({
    db,
    currentUser,
    items,
    categories,
    openDeleteModal,
    selectedItemId,
    selectedCategoryId,
    selectedChecklistId,
    isMobile,
    setMobileView,
    setActiveMainTab,
    navigateToDetail,
    setNavigatedFromCalendar,
    setMobileSubTab,
    setSelectedChecklistId,
    setEditingBlockId
  });

  // 체크리스트 항목의 하위 블록 추출 헬퍼 (일정 만들기에 연동)
  const getCheckItemDetailBlocks = (checkItem) => {
    if (!checkItem) return [];
    if (checkItem.id === selectedChecklistId && checklistDetailBlocks && checklistDetailBlocks.length > 0) {
      return checklistDetailBlocks;
    }
    const rawText = checkItem.detail || '';
    const rawBlocks = checkItem.detailBlocks;
    return parseDetailBlocks(rawText, rawBlocks);
  };

  const getCategoryPath = (categoryId) => getCategoryPathFn(categoryId, categories, mainTabs);
  const getCategoryBadgeName = getCategoryPath;
  const getHierarchicalCategoryOptions = (scope, excludeId = null, groupIdFilter = null) =>
    getHierarchicalCategoryOptionsFn(categories, scope, excludeId, groupIdFilter);
  const getCategoryDescendantIds = (rootId) => getCategoryDescendantIdsFn(rootId, categories);

  const isDescendant = (ancestorId, potentialDescendantId) => {
    if (!ancestorId || !potentialDescendantId) return false;
    if (ancestorId === potentialDescendantId) return true;
    let curr = categories.find(c => c.id === potentialDescendantId);
    const visited = new Set();
    while (curr && curr.parentId) {
      if (curr.parentId === ancestorId) return true;
      if (visited.has(curr.id)) break;
      visited.add(curr.id);
      curr = categories.find(c => c.id === curr.parentId);
    }
    return false;
  };

  const canMoveCategory = (sourceId, targetParentId) => {
    if (!sourceId) return false;
    if (ALL_FIXED_CATEGORY_IDS.includes(sourceId)) return false;
    if (targetParentId === null) return true;
    if (ALL_FIXED_CATEGORY_IDS.includes(targetParentId)) return false;
    if (sourceId === targetParentId) return false;
    if (isDescendant(sourceId, targetParentId)) return false;
    return true;
  };

  const sidebarRef = useRef(null);
  const itemScrollRef = useRef(null);
  const isSubmittingItemRef = useRef(false);

  const {
    itemSortOrder, setItemSortOrder,
    searchQuery, setSearchQuery,
    searchLower, isSearchActive,
    isAddingCategory, setIsAddingCategory,
    addingParentId, setAddingParentId,
    newCategoryName, setNewCategoryName,
    editingCategoryId, setEditingCategoryId,
    editingCategoryName, setEditingCategoryName,
    deletingCategoryId, setDeletingCategoryId,
    expandedFolders, setExpandedFolders, toggleFolder,
    draggedCategoryId, setDraggedCategoryId,
    draggedItemId, setDraggedItemId,
    dragOverCategoryId, setDragOverCategoryId,
    isDragOverRoot, setIsDragOverRoot,
    movingCategory, setMovingCategory,
    targetMoveParentId, setTargetMoveParentId,
    movingItem, setMovingItem,
    targetMoveItemTab, setTargetMoveItemTab,
    targetMoveCategoryGroupId, setTargetMoveCategoryGroupId,
    targetMoveItemCategoryId, setTargetMoveItemCategoryId,
    targetMoveItemGroupId, setTargetMoveItemGroupId,
    collapsedItemGroups, setCollapsedItemGroups,
    isAddingItemGroup, setIsAddingItemGroup,
    newItemGroupName, setNewItemGroupName,
    editingItemGroupId, setEditingItemGroupId,
    editingItemGroupName, setEditingItemGroupName,
    itemGroupTargetForNewItem, setItemGroupTargetForNewItem,
    dragOverItemGroupId, setDragOverItemGroupId,
    dragOverItemId, setDragOverItemId,
    collapsedCategoryGroups, setCollapsedCategoryGroups,
    isAddingCategoryGroup, setIsAddingCategoryGroup,
    newCategoryGroupName, setNewCategoryGroupName,
    editingCategoryGroupId, setEditingCategoryGroupId,
    editingCategoryGroupName, setEditingCategoryGroupName,
    addingCategoryGroupId, setAddingCategoryGroupId,
    dragOverCategoryGroupId, setDragOverCategoryGroupId,
    editingItemId, setEditingItemId,
    editingItemTitle, setEditingItemTitle,
    deletingItemId, setDeletingItemId,
    isEditMode, setIsEditMode,
    isEditingChecklistDetail, setIsEditingChecklistDetail,
    titleInputRef, autoEditItemIdRef, shouldFocusTitleRef,
    draftCategoryId, setDraftCategoryId,
    draftTitle, setDraftTitle,
    draftBody, setDraftBody,
    draftSubBody, setDraftSubBody,
    draftTemplateId, setDraftTemplateId,
    draftTemplateValues, setDraftTemplateValues,
    draftChecklists, setDraftChecklists,
    draggedNoteChecklistId, setDraggedNoteChecklistId,
    dragOverNoteChecklistId, setDragOverNoteChecklistId,
    showTemplateModal, setShowTemplateModal,
    showSavedToast, setShowSavedToast,
    detailClipboard, setDetailClipboard,
    navHistory, setNavHistory,
    lastNavLocationRef, isNavigatingBackRef,
    isQuickMemoOpen, setIsQuickMemoOpen,
    quickMemoText, setQuickMemoText,
    isSavingQuickMemo, setIsSavingQuickMemo,
    quickMemoToast, setQuickMemoToast,
    quickMemoToastTimerRef, quickMemoTextareaRef,
    selectedTemplate2IdInTab, setSelectedTemplate2IdInTab,
    tpl2DraftTitle, setTpl2DraftTitle,
    tpl2DraftChecklists, setTpl2DraftChecklists,
    selectedTpl2ChecklistId, setSelectedTpl2ChecklistId,
    newTpl2ChecklistText, setNewTpl2ChecklistText,
    isSavingTpl2, setIsSavingTpl2,
    showTemplate2Modal, setShowTemplate2Modal,
    template2ApplyMode, setTemplate2ApplyMode,
    template2SearchKeyword, setTemplate2SearchKeyword,
    collapsedTplCatIds, setCollapsedTplCatIds,
    draggedBlockIndex, setDraggedBlockIndex,
    dragOverBlockIndex, setDragOverBlockIndex,
    draggedFieldItem, setDraggedFieldItem,
    dragOverFieldItem, setDragOverFieldItem,
    draggedChecklistIndex, setDraggedChecklistIndex,
    dragOverChecklistIndex, setDragOverChecklistIndex,
    checklistDetailDraft, setChecklistDetailDraft,
    checklistDetailBlocks, setChecklistDetailBlocks,
    editingBlockId, setEditingBlockId,
    collapsedSections, setCollapsedSections,
    editingCheckId, setEditingCheckId,
    editingCheckText, setEditingCheckText,
    editingCheckTag, setEditingCheckTag,
    customTagInput, setCustomTagInput,
    detailCollapsedBlockIds, setDetailCollapsedBlockIds,
    newChecklistText, setNewChecklistText,
  } = useNotebookUIState({ initialNavLoc });

  const {
    openChecklistMenuId,
    setOpenChecklistMenuId,
    openChecklistMenuPos,
    openGroupMenuId,
    setOpenGroupMenuId,
    openGroupMenuPos,
    openCatMenuId,
    setOpenCatMenuId,
    openCatMenuPos,
    openCategoryGroupMenuId,
    setOpenCategoryGroupMenuId,
    openCategoryGroupMenuPos,
    openItemGroupMenuId,
    setOpenItemGroupMenuId,
    openItemGroupMenuPos,
    openNoteMenuId,
    setOpenNoteMenuId,
    openNoteMenuPos,
    handleOpenChecklistMenu,
    handleOpenGroupMenu,
    handleOpenCatMenu,
    handleOpenCategoryGroupMenu,
    handleOpenItemGroupMenu,
    handleOpenNoteMenu,
    handleCloseAllMenus
  } = useMenuPositioning();




  // Global Delete Confirmation Modal State
  const {
    deleteModalState,
    setDeleteModalState,
    deleteConfirmBtnRef,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete
  } = useDeleteModal();

  // Detail Block Move Modal State
  const [moveBlockModalState, setMoveBlockModalState] = useState({
    isOpen: false,
    sourceCheckId: null,
    block: null,
    targetCheckId: null
  });

  const toastTimerRef = useRef(null);
  const [copyToastText, setCopyToastText] = useState('');
  const copyToastTimerRef = useRef(null);



  const {
    categoryContextMenu,
    setCategoryContextMenu,
    itemContextMenu,
    setItemContextMenu,
    returnLocation,
    setReturnLocation,
    copyTextToClipboard,
    handleCategoryContextMenu,
    handleCopyCategoryPath,
    handleCopyCategoryLink,
    handleItemContextMenu,
    handleCopyItemPath,
    handleCopyItemLink,
    handleReturnToPreviousLocation
  } = useNotebookContextMenu({
    categories,
    categoryGroups,
    mainTabs,
    activeMainTab,
    setActiveMainTab,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedItemId,
    setSelectedItemId,
    items,
    setCopyToastText,
    copyToastTimerRef
  });



  const {
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
  } = useNotebookSelectors({
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
  });

  const {
    showAddGroupModal,
    setShowAddGroupModal,
    newGroupNameInput,
    setNewGroupNameInput,
    groupModalPos,
    setGroupModalPos,
    handleOpenAddGroupModal,
    handleCreateGroupFromModal,
  } = useAddGroupModal({
    activeItem,
    recordWorkLocation,
    baseChecklists,
    updateCollapsedSections,
    isEditMode,
    setDraftChecklists,
    setSelectedChecklistId,
    setChecklistDetailDraft,
    setChecklistDetailBlocks,
    setEditingCheckId,
    setEditingCheckText,
    setEditingCheckTag,
    setCustomTagInput,
    isMobile,
    setMobileSubTab,
    setItems,
    db,
  });



  const {
    printTarget,
    setPrintTarget,
    isPrintModalOpen,
    setIsPrintModalOpen,
    selectedPrintFieldIds,
    setSelectedPrintFieldIds,
    isChecklistPrintModalOpen,
    setIsChecklistPrintModalOpen,
    selectedPrintChecklistIds,
    setSelectedPrintChecklistIds,
    handleOpenChecklistPrint,
    handleConfirmChecklistPrint,
    isChecklistPrintItemSelected,
    handleOpenDetailPrint,
    handleConfirmTemplatePrint,
    isPrintFieldSelected,
    handlePrint
  } = usePrintActions({
    currentChecklists,
    activeItem,
    templates
  });




  const {
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
  } = useChecklistActions({
    db,
    activeItem,
    isItemInTrash,
    templates,
    baseChecklists,
    checklistGroups,
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
  });

  const {
    handleCopyChecklist,
    getSortedChecklistItems,
    updateDetailCollapsedBlockIds,
    handleExpandAllDetailBlocks,
    handleCollapseAllDetailBlocks,
    handleExpandAllCategories,
    handleCollapseAllCategories,
    handleExpandAllItemGroups,
    handleCollapseAllItemGroups,
  } = useNotebookLayoutActions({
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
  });


  const {
    handleSaveChecklistDetail,
    handleAddNewTextBlock,
    handleAddNewChecklistBlock,
    handleCopyBlockAsPlainText,
    handleCopyBlockToClipboard,
    handleCopyItemToClipboard,
    handleClearDetailClipboard,
    handlePasteBlockFromClipboard,
    handlePasteItemFromClipboard,
    handleOpenMoveBlockModal,
    handleCloseMoveBlockModal,
    handleExecuteMoveBlock
  } = useDetailBlockActions({
    db,
    activeItem,
    baseChecklists,
    rawChecklists,
    checklistDetailBlocks,
    setChecklistDetailBlocks,
    selectedChecklistId,
    setChecklistDetailDraft,
    setIsEditingChecklistDetail,
    setIsEditMode,
    setEditingBlockId,
    setShowSavedToast,
    toastTimerRef,
    recordWorkLocation,
    copyToastTimerRef,
    setCopyToastText,
    detailClipboard,
    setDetailClipboard,
    moveBlockModalState,
    setMoveBlockModalState
  });

  useNoteDraftSync({
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
  });

  useNotebookKeyEvents({
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
  });


  // ---------------- Category Group Handlers ----------------
  const {
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
  } = useCategoryActions({
    db,
    activeMainTab,
    categories,
    items,
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
    currentScopeCategoryGroups,
    displayedCategoryGrouped
  });

  const {
    recordWorkLocation,
    previousWorkTarget,
    handleReturnPrevious
  } = useWorkLocationHistory({
    activeMainTab,
    setActiveMainTab,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedItemId,
    setSelectedItemId,
    activeItem,
    items,
    isMobile,
    mobileView,
    setMobileView,
    navHistory,
    setNavHistory,
    isNavigatingBackRef
  });

  const {
    handleNavigateToQuickMemo,
    handleOpenQuickMemo,
    handleCloseQuickMemo,
    handleSaveQuickMemo
  } = useQuickMemoActions({
    db,
    activeMainTab,
    setActiveMainTab,
    activeCategory,
    activeItem,
    items,
    navigateToItems,
    quickMemoText,
    setQuickMemoText,
    setIsQuickMemoOpen,
    quickMemoTextareaRef,
    isSavingQuickMemo,
    setIsSavingQuickMemo,
    recordWorkLocation,
    setQuickMemoToast,
    quickMemoToastTimerRef
  });

  const {
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
  } = useItemActions({
    db,
    items,
    categories,
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
    displayedItemGrouped,
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
    filteredItems
  });

  const {
    buildTemplateCombinedBody,
    handleSelectTemplateInTab,
    handleCreateNewTemplateInTab,
    handleDeleteTemplateInTab,
    cloneTemplateData,
    handleApplyTemplate2ToItem
  } = useTemplateActions({
    db,
    templates,
    items,
    setItems,
    activeItem,
    isEditMode,
    draftBody,
    setDraftBody,
    draftChecklists,
    setDraftChecklists,
    setChecklistDetailBlocks,
    selectedTemplateIdInTab,
    setSelectedTemplateIdInTab,
    setSelectedChecklistId,
    setShowTemplate2Modal,
    setShowSavedToast,
    toastTimerRef,
    openDeleteModal
  });

  const {
    handleSaveDetail,
    handleCancelDetailEdit,
    handleEnterEditMode
  } = useNoteDetailEdit({
    db,
    selectedItemId,
    activeItem,
    activeMainTab,
    categories,
    checklistDetailBlocks,
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
  });

  const handleTabSwitch = (targetTab) => {
    setActiveMainTab(targetTab);
    const targetScope = getScopeForTab(targetTab);
    const targetTrashId = getTrashIdForTab(targetTab);
    const isCurrentCatValid = categories.some(
      c => c.id === selectedCategoryId && (targetScope === 'explorer' ? (!c.scope || c.scope === 'explorer') : c.scope === targetScope)
    ) || (targetTab === 'explorer' && selectedCategoryId === 'quick_memo');
    if (!isCurrentCatValid && selectedCategoryId !== targetTrashId) {
      const fallbackId = getDefaultCategoryIdForTab(targetTab, categories);
      setSelectedCategoryId(fallbackId);
      setSelectedItemId(null);
    }
    if (isMobile) {
      setMobileView('categories');
      if (window.history.state?.view !== 'categories') {
        window.history.pushState({ view: 'categories' }, '');
      }
    }
  };

  const renderUserBar = (customStyle = {}) => (
    <UserBar
      currentUser={currentUser}
      onLogout={onLogout}
      setIsTabSettingModalOpen={setIsTabSettingModalOpen}
      customStyle={customStyle}
    />
  );

  const renderMainModeBar = (showUserBar = true) => (
    <MainModeBar
      isMobile={isMobile}
      isCalendarMode={isCalendarMode}
      setIsCalendarMode={setIsCalendarMode}
      activeMainTab={activeMainTab}
      setActiveMainTab={setActiveMainTab}
      setMobileView={setMobileView}
      handleOpenQuickMemo={handleOpenQuickMemo}
      showUserBar={showUserBar}
      currentUser={currentUser}
      onLogout={onLogout}
      setIsTabSettingModalOpen={setIsTabSettingModalOpen}
      mainTabs={mainTabs}
      draggedTabIndex={draggedTabIndex}
      dragOverTabIndex={dragOverTabIndex}
      handleTabDragStart={handleTabDragStart}
      handleTabDragOver={handleTabDragOver}
      handleTabDrop={handleTabDrop}
      handleTabDragEnd={handleTabDragEnd}
      handleTabTouchStart={handleTabTouchStart}
      handleTabTouchEnd={handleTabTouchEnd}
      setEditingTab={setEditingTab}
      setEditingTabInput={setEditingTabInput}
      handleTabSwitch={handleTabSwitch}
      previousWorkTarget={previousWorkTarget}
      handleReturnPrevious={handleReturnPrevious}
      handleNavigateToQuickMemo={handleNavigateToQuickMemo}
      handleCategoryContextMenu={handleCategoryContextMenu}
      selectedCategoryId={selectedCategoryId}
    />
  );

  const renderMobileFooter = (screenHeader, showUserBar = true) => (
    <div style={styles.mobileFooterContainer}>
      {screenHeader}
      {renderMainModeBar(showUserBar)}
    </div>
  );

  // Legacy tree renderer replaced with group-card layout

  // ---------------- Render ----------------
  return (
    <div style={styles.appContainer}>
      {/* Pane 1: Category Sidebar (Pastel Blue, 280px or 100% on Mobile) */}
      <CategorySidebar
        sidebarRef={sidebarRef}
        isMobile={isMobile}
        mobileView={mobileView}
        setMobileView={setMobileView}
        activeMainTab={activeMainTab}
        currentUser={currentUser}
        renderMainModeBar={renderMainModeBar}
        renderUserBar={renderUserBar}
        renderMobileFooter={renderMobileFooter}
        templates={templates}
        handleCreateNewTemplateInTab={handleCreateNewTemplateInTab}
        handleSelectTemplateInTab={handleSelectTemplateInTab}
        handleDeleteTemplateInTab={handleDeleteTemplateInTab}
        selectedTemplateIdInTab={selectedTemplateIdInTab}
        handleExpandAllCategories={handleExpandAllCategories}
        handleCollapseAllCategories={handleCollapseAllCategories}
        handleAddCategory={handleAddCategory}
        isAddingCategory={isAddingCategory}
        setIsAddingCategory={setIsAddingCategory}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleAddCategoryGroup={handleAddCategoryGroup}
        isAddingCategoryGroup={isAddingCategoryGroup}
        setIsAddingCategoryGroup={setIsAddingCategoryGroup}
        newCategoryGroupName={newCategoryGroupName}
        setNewCategoryGroupName={setNewCategoryGroupName}
        displayedCategoryGrouped={displayedCategoryGrouped}
        currentScopeCategoryGroups={currentScopeCategoryGroups}
        categories={categories}
        filteredCategories={filteredCategories}
        items={items}
        selectedCategoryId={selectedCategoryId}
        navigateToItems={navigateToItems}
        draggedCategoryId={draggedCategoryId}
        setDraggedCategoryId={setDraggedCategoryId}
        dragOverCategoryId={dragOverCategoryId}
        setDragOverCategoryId={setDragOverCategoryId}
        draggedItemId={draggedItemId}
        setDraggedItemId={setDraggedItemId}
        dragOverCategoryGroupId={dragOverCategoryGroupId}
        setDragOverCategoryGroupId={setDragOverCategoryGroupId}
        openCategoryGroupMenuId={openCategoryGroupMenuId}
        setOpenCategoryGroupMenuId={setOpenCategoryGroupMenuId}
        openCategoryGroupMenuPos={openCategoryGroupMenuPos}
        handleOpenCategoryGroupMenu={handleOpenCategoryGroupMenu}
        handleMoveCategoryGroup={handleMoveCategoryGroup}
        handleDeleteCategoryGroup={handleDeleteCategoryGroup}
        handleStartAddCategoryToGroup={handleStartAddCategoryToGroup}
        addingCategoryGroupId={addingCategoryGroupId}
        setAddingCategoryGroupId={setAddingCategoryGroupId}
        editingCategoryGroupId={editingCategoryGroupId}
        setEditingCategoryGroupId={setEditingCategoryGroupId}
        editingCategoryGroupName={editingCategoryGroupName}
        setEditingCategoryGroupName={setEditingCategoryGroupName}
        handleUpdateCategoryGroupName={handleUpdateCategoryGroupName}
        openCatMenuId={openCatMenuId}
        setOpenCatMenuId={setOpenCatMenuId}
        openCatMenuPos={openCatMenuPos}
        handleOpenCatMenu={handleOpenCatMenu}
        editingCategoryId={editingCategoryId}
        setEditingCategoryId={setEditingCategoryId}
        editingCategoryName={editingCategoryName}
        setEditingCategoryName={setEditingCategoryName}
        handleUpdateCategoryName={handleUpdateCategoryName}
        openDeleteCategoryModal={openDeleteCategoryModal}
        handleDropCategoryOnCategory={handleDropCategoryOnCategory}
        handleDropCategoryOnGroup={handleDropCategoryOnGroup}
        handleCategoryContextMenu={handleCategoryContextMenu}
        collapsedCategoryGroups={collapsedCategoryGroups}
        toggleCategoryGroupCollapse={toggleCategoryGroupCollapse}
        currentFixedTrashCategory={currentFixedTrashCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {activeMainTab === 'calendar' ? (
        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CalendarView
              items={items}
              categories={allCategories}
              onNavigateToDetail={(itemId, isChecklist) => {
                navigateToDetail(itemId);
                setActiveMainTab('explorer');
                setNavigatedFromCalendar(true);
                if (isChecklist) {
                  setMobileSubTab('sub');
                }
              }}
              openDeleteModal={openDeleteModal}
              onNavigateToSource={handleNavigateToEventSource}
            />
          </div>
          {isMobile && renderMobileFooter(
            <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderTop: '1px solid #CBD5E1', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setMobileView('categories');
                }}
                style={styles.mobileBackBtn}
              >
                <ArrowLeft size={16} /> 카테고리 / 메뉴
              </button>
            </div>
          )}
        </div>
      ) : (
        <React.Fragment>
          {/* Pane 2: Note Item List (Light, 308px or 100% on Mobile) - Only shown when NOT in template mode */}
          <ItemSubListPane
            isMobile={isMobile}
            mobileView={mobileView}
            setMobileView={setMobileView}
            activeMainTab={activeMainTab}
            setActiveMainTab={setActiveMainTab}
            isCalendarMode={isCalendarMode}
            calendarCategories={calendarCategories}
            selectedCalendarCategoryId={selectedCalendarCategoryId}
            setSelectedCalendarCategoryId={setSelectedCalendarCategoryId}
            handleAddCalendarCategory={handleAddCalendarCategory}
            handleUpdateCalendarCategory={handleUpdateCalendarCategory}
            handleDeleteCalendarCategory={handleDeleteCalendarCategory}
            calendarEvents={calendarEvents}
            renderMobileFooter={renderMobileFooter}
            activeCategory={activeCategory}
            isSearchActive={isSearchActive}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            displayedItems={displayedItems}
            displayedItemGrouped={displayedItemGrouped}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            selectedItemId={selectedItemId}
            navigateToDetail={navigateToDetail}
            items={items}
            categories={categories}
            collapsedItemGroups={collapsedItemGroups}
            toggleItemGroupCollapse={toggleItemGroupCollapse}
            handleExpandAllItemGroups={handleExpandAllItemGroups}
            handleCollapseAllItemGroups={handleCollapseAllItemGroups}
            isAddingItemGroup={isAddingItemGroup}
            setIsAddingItemGroup={setIsAddingItemGroup}
            newItemGroupName={newItemGroupName}
            setNewItemGroupName={setNewItemGroupName}
            handleAddItemGroup={handleAddItemGroup}
            itemGroupTargetForNewItem={itemGroupTargetForNewItem}
            setItemGroupTargetForNewItem={setItemGroupTargetForNewItem}
            handleAddItemToGroup={handleAddItemToGroup}
            isAddingItem={isAddingItem}
            setIsAddingItem={setIsAddingItem}
            newItemTitle={newItemTitle}
            setNewItemTitle={setNewItemTitle}
            itemInputRef={itemInputRef}
            handleAddItem={handleAddItem}
            handleConfirmAddItem={handleConfirmAddItem}
            editingItemGroupId={editingItemGroupId}
            setEditingItemGroupId={setEditingItemGroupId}
            editingItemGroupName={editingItemGroupName}
            setEditingItemGroupName={setEditingItemGroupName}
            handleUpdateItemGroupName={handleUpdateItemGroupName}
            handleDeleteItemGroup={handleDeleteItemGroup}
            handleMoveItemGroup={handleMoveItemGroup}
            openItemGroupMenuId={openItemGroupMenuId}
            setOpenItemGroupMenuId={setOpenItemGroupMenuId}
            openItemGroupMenuPos={openItemGroupMenuPos}
            handleOpenItemGroupMenu={handleOpenItemGroupMenu}
            openNoteMenuId={openNoteMenuId}
            setOpenNoteMenuId={setOpenNoteMenuId}
            openNoteMenuPos={openNoteMenuPos}
            handleOpenNoteMenu={handleOpenNoteMenu}
            editingItemId={editingItemId}
            setEditingItemId={setEditingItemId}
            editingItemTitle={editingItemTitle}
            setEditingItemTitle={setEditingItemTitle}
            handleUpdateItemTitle={handleUpdateItemTitle}
            itemScrollRef={itemScrollRef}
            draggedItemId={draggedItemId}
            setDraggedItemId={setDraggedItemId}
            dragOverItemId={dragOverItemId}
            setDragOverItemId={setDragOverItemId}
            dragOverItemGroupId={dragOverItemGroupId}
            setDragOverItemGroupId={setDragOverItemGroupId}
            handleDropItemOnItem={handleDropItemOnItem}
            handleDropItemOnGroup={handleDropItemOnGroup}
            handleMoveToTrash={handleMoveToTrash}
            handleRestoreItem={handleRestoreItem}
            handlePermanentDeleteItem={handlePermanentDeleteItem}
            handleEmptyTrash={handleEmptyTrash}
            handleItemContextMenu={handleItemContextMenu}
            getItemMatchBadges={getItemMatchBadges}
            getMatchedSnippet={getMatchedSnippet}
            getCategoryBadgeName={getCategoryBadgeName}
            setMovingItem={setMovingItem}
            setTargetMoveItemTab={setTargetMoveItemTab}
            setTargetMoveCategoryGroupId={setTargetMoveCategoryGroupId}
            setTargetMoveItemCategoryId={setTargetMoveItemCategoryId}
            setTargetMoveItemGroupId={setTargetMoveItemGroupId}
            mainTabs={mainTabs}
            navigateBack={navigateBack}
            openDeleteModal={openDeleteModal}
            deletingItemId={deletingItemId}
          />

          {/* Pane 3: Detail Workspace OR Template Canvas (Flex 1 or 100% on Mobile) */}
          {(!isMobile || mobileView === 'detail') && (
            <div style={styles.pane3}>
              {activeMainTab === 'template' ? (
                /* Dedicated Template Canvas View for Pane 3 */
                <TemplateCanvas
                  isMobile={isMobile}
                  selectedTemplateIdInTab={selectedTemplateIdInTab}
                  setSelectedTemplateIdInTab={setSelectedTemplateIdInTab}
                  templates={templates}
                  handleDeleteTemplateInTab={handleDeleteTemplateInTab}
                  db={db}
                  setShowSavedToast={setShowSavedToast}
                />
              ) : isCalendarMode ? (
                /* Dedicated Calendar View for Pane 3 */
                <CalendarDetailPane
                  isMobile={isMobile}
                  setMobileView={setMobileView}
                  calendarEvents={calendarEvents}
                  selectedCalendarEventId={selectedCalendarEventId}
                  setSelectedCalendarEventId={setSelectedCalendarEventId}
                  calendarCategories={calendarCategories}
                  selectedCalendarCategoryId={selectedCalendarCategoryId}
                  categories={categories}
                  items={items}
                  selectedCategoryId={selectedCategoryId}
                  searchQuery={searchQuery}
                  renderMobileFooter={renderMobileFooter}
                  setCreateEventModalState={setCreateEventModalState}
                  handleDeleteCalendarEvent={handleDeleteCalendarEvent}
                  handleOpenEditEventModal={handleOpenEditEventModal}
                  handleNavigateToEventSource={handleNavigateToEventSource}
                  handleSaveCalendarEventBlocks={handleSaveCalendarEventBlocks}
                  editingBlockId={editingBlockId}
                  setEditingBlockId={setEditingBlockId}
                  handleOpenMoveBlockModal={handleOpenMoveBlockModal}
                  handleCopyBlockToClipboard={handleCopyBlockToClipboard}
                  handleCopyBlockAsPlainText={handleCopyBlockAsPlainText}
                  handleCopyItemToClipboard={handleCopyItemToClipboard}
                  detailClipboard={detailClipboard}
                  handlePasteItemFromClipboard={handlePasteItemFromClipboard}
                  detailCollapsedBlockIds={detailCollapsedBlockIds}
                  updateDetailCollapsedBlockIds={updateDetailCollapsedBlockIds}
                  handleOpenCreateEventFromBlock={handleOpenCreateEventFromBlock}
                  openDeleteModal={openDeleteModal}
                />
              ) : activeItem ? (
                <NotebookDetailPane
                  isMobile={isMobile}
                  mobileSubTab={mobileSubTab}
                  setMobileSubTab={setMobileSubTab}
                  activeItem={activeItem}
                  activeTpl={activeTpl}
                  isItemInTrash={isItemInTrash}
                  handleTouchStart={handleTouchStart}
                  handleTouchEnd={handleTouchEnd}
                  handleRestoreItem={handleRestoreItem}
                  handlePermanentDeleteItem={handlePermanentDeleteItem}
                  openDeleteModal={openDeleteModal}
                  isEditMode={isEditMode}
                  handleEnterEditMode={handleEnterEditMode}
                  handleCancelDetailEdit={handleCancelDetailEdit}
                  handleSaveDetail={handleSaveDetail}
                  printTarget={printTarget}
                  handleOpenDetailPrint={handleOpenDetailPrint}
                  calendarReturnContext={calendarReturnContext}
                  handleReturnToCalendar={handleReturnToCalendar}
                  showSavedToast={showSavedToast}
                  titleInputRef={titleInputRef}
                  draftTitle={draftTitle}
                  setDraftTitle={setDraftTitle}
                  draftCategoryId={draftCategoryId}
                  setDraftCategoryId={setDraftCategoryId}
                  categories={categories}
                  items={items}
                  currentScope={currentScope}
                  getHierarchicalCategoryOptions={getHierarchicalCategoryOptions}
                  draftTemplateId={draftTemplateId}
                  setDraftTemplateId={setDraftTemplateId}
                  templates={templates}
                  templates2={templates2}
                  handleApplyTemplate2ToItem={handleApplyTemplate2ToItem}
                  setShowTemplate2Modal={setShowTemplate2Modal}
                  draftTemplateValues={draftTemplateValues}
                  setDraftTemplateValues={setDraftTemplateValues}
                  setDraftBody={setDraftBody}
                  checklistGroups={checklistGroups}
                  getSortedChecklistItems={getSortedChecklistItems}
                  currentChecklists={currentChecklists}
                  collapsedSections={collapsedSections}
                  toggleSectionCollapse={toggleSectionCollapse}
                  handleExpandAllSections={handleExpandAllSections}
                  handleCollapseAllSections={handleCollapseAllSections}
                  editingBlockId={editingBlockId}
                  setEditingBlockId={setEditingBlockId}
                  handleAddNewChecklistBlock={handleAddNewChecklistBlock}
                  handleAddNewTextBlock={handleAddNewTextBlock}
                  handleOpenAddGroupModal={handleOpenAddGroupModal}
                  openGroupMenuId={openGroupMenuId}
                  setOpenGroupMenuId={setOpenGroupMenuId}
                  openGroupMenuPos={openGroupMenuPos}
                  handleOpenGroupMenu={handleOpenGroupMenu}
                  handleMoveGroup={handleMoveGroup}
                  editingCheckId={editingCheckId}
                  setEditingCheckId={setEditingCheckId}
                  editingCheckText={editingCheckText}
                  setEditingCheckText={setEditingCheckText}
                  setEditingCheckTag={setEditingCheckTag}
                  openChecklistMenuId={openChecklistMenuId}
                  setOpenChecklistMenuId={setOpenChecklistMenuId}
                  openChecklistMenuPos={openChecklistMenuPos}
                  handleOpenChecklistMenu={handleOpenChecklistMenu}
                  handleDeleteChecklist={handleDeleteChecklist}
                  handleSaveEditChecklist={handleSaveEditChecklist}
                  handleAddChecklistToGroup={handleAddChecklistToGroup}
                  handleAddNextChecklistInGroup={handleAddNextChecklistInGroup}
                  newChecklistText={newChecklistText}
                  setNewChecklistText={setNewChecklistText}
                  handleAddChecklist={handleAddChecklist}
                  draggedNoteChecklistId={draggedNoteChecklistId}
                  setDraggedNoteChecklistId={setDraggedNoteChecklistId}
                  dragOverNoteChecklistId={dragOverNoteChecklistId}
                  setDragOverNoteChecklistId={setDragOverNoteChecklistId}
                  handleNoteChecklistDrop={handleNoteChecklistDrop}
                  checkItemTouchTimerRef={checkItemTouchTimerRef}
                  handleToggleInlineChecklistInReadMode={handleToggleInlineChecklistInReadMode}
                  selectedChecklistId={selectedChecklistId}
                  setSelectedChecklistId={setSelectedChecklistId}
                  checklistDetailBlocks={checklistDetailBlocks}
                  setChecklistDetailBlocks={setChecklistDetailBlocks}
                  handleSaveChecklistDetail={handleSaveChecklistDetail}
                  getCheckItemDetailBlocks={getCheckItemDetailBlocks}
                  handleOpenMoveBlockModal={handleOpenMoveBlockModal}
                  handleCopyBlockToClipboard={handleCopyBlockToClipboard}
                  handleCopyBlockAsPlainText={handleCopyBlockAsPlainText}
                  handleCopyItemToClipboard={handleCopyItemToClipboard}
                  detailClipboard={detailClipboard}
                  handlePasteBlockFromClipboard={handlePasteBlockFromClipboard}
                  handlePasteItemFromClipboard={handlePasteItemFromClipboard}
                  handleClearDetailClipboard={handleClearDetailClipboard}
                  detailCollapsedBlockIds={detailCollapsedBlockIds}
                  updateDetailCollapsedBlockIds={updateDetailCollapsedBlockIds}
                  handleExpandAllDetailBlocks={handleExpandAllDetailBlocks}
                  handleCollapseAllDetailBlocks={handleCollapseAllDetailBlocks}
                  handleOpenCreateEventFromBlock={handleOpenCreateEventFromBlock}
                  isPrintFieldSelected={isPrintFieldSelected}
                  renderMobileFooter={renderMobileFooter}
                  navigateBack={navigateBack}
                  selectedCategoryId={selectedCategoryId}
                  searchQuery={searchQuery}
                />
          ) : (
            <>
              <div style={styles.pane3Empty}>
                {isMobile && (
                  <button
                    onClick={navigateBack}
                    style={{ ...styles.mobileBackBtn, marginBottom: '20px' }}
                  >
                    <ArrowLeft size={18} />
                    <span>목록으로 돌아가기</span>
                  </button>
                )}
                <FileText size={48} color="#D0D4DC" style={{ marginBottom: '12px' }} />
                <p style={{ color: '#8A909A', fontSize: '15px' }}>
                  목록에서 메모를 선택하거나 새 메모를 작성하세요.
                </p>
              </div>
              {isMobile && renderMobileFooter(null)}
            </>
          )}
        </div>
      )}
        </React.Fragment>
      )}

      
      <NotebookModals
        isChecklistPrintModalOpen={isChecklistPrintModalOpen}
        setIsChecklistPrintModalOpen={setIsChecklistPrintModalOpen}
        currentChecklists={currentChecklists}
        selectedPrintChecklistIds={selectedPrintChecklistIds}
        setSelectedPrintChecklistIds={setSelectedPrintChecklistIds}
        handleConfirmChecklistPrint={handleConfirmChecklistPrint}
        isPrintModalOpen={isPrintModalOpen}
        setIsPrintModalOpen={setIsPrintModalOpen}
        templates={templates}
        activeItem={activeItem}
        selectedPrintFieldIds={selectedPrintFieldIds}
        setSelectedPrintFieldIds={setSelectedPrintFieldIds}
        handleConfirmTemplatePrint={handleConfirmTemplatePrint}
        deleteModalState={deleteModalState}
        closeDeleteModal={closeDeleteModal}
        handleConfirmDelete={handleConfirmDelete}
        deleteConfirmBtnRef={deleteConfirmBtnRef}
        moveBlockModalState={moveBlockModalState}
        setMoveBlockModalState={setMoveBlockModalState}
        handleCloseMoveBlockModal={handleCloseMoveBlockModal}
        handleExecuteMoveBlock={handleExecuteMoveBlock}
        rawChecklists={rawChecklists}
        checklistGroups={checklistGroups}
        isMobile={isMobile}
        movingCategory={movingCategory}
        setMovingCategory={setMovingCategory}
        targetMoveParentId={targetMoveParentId}
        setTargetMoveParentId={setTargetMoveParentId}
        sidebarRef={sidebarRef}
        currentScope={currentScope}
        getHierarchicalCategoryOptions={getHierarchicalCategoryOptions}
        setExpandedFolders={setExpandedFolders}
        db={db}
        movingItem={movingItem}
        setMovingItem={setMovingItem}
        targetMoveItemTab={targetMoveItemTab}
        setTargetMoveItemTab={setTargetMoveItemTab}
        targetMoveCategoryGroupId={targetMoveCategoryGroupId}
        setTargetMoveCategoryGroupId={setTargetMoveCategoryGroupId}
        targetMoveItemCategoryId={targetMoveItemCategoryId}
        setTargetMoveItemCategoryId={setTargetMoveItemCategoryId}
        targetMoveItemGroupId={targetMoveItemGroupId}
        setTargetMoveItemGroupId={setTargetMoveItemGroupId}
        mainTabs={mainTabs}
        categoryGroups={categoryGroups}
        categories={categories}
        setActiveMainTab={setActiveMainTab}
        setSelectedCategoryId={setSelectedCategoryId}
        setSelectedItemId={setSelectedItemId}
        showAddGroupModal={showAddGroupModal}
        groupModalPos={groupModalPos}
        newGroupNameInput={newGroupNameInput}
        setNewGroupNameInput={setNewGroupNameInput}
        setShowAddGroupModal={setShowAddGroupModal}
        handleCreateGroupFromModal={handleCreateGroupFromModal}
        categoryContextMenu={categoryContextMenu}
        setCategoryContextMenu={setCategoryContextMenu}
        handleCopyCategoryPath={handleCopyCategoryPath}
        handleCopyCategoryLink={handleCopyCategoryLink}
        itemContextMenu={itemContextMenu}
        setItemContextMenu={setItemContextMenu}
        handleCopyItemPath={handleCopyItemPath}
        handleCopyItemLink={handleCopyItemLink}
        returnLocation={returnLocation}
        handleReturnToPreviousLocation={handleReturnToPreviousLocation}
        setReturnLocation={setReturnLocation}
        copyToastText={copyToastText}
        showExitToast={showExitToast}
        isQuickMemoOpen={isQuickMemoOpen}
        quickMemoToast={quickMemoToast}
        quickMemoText={quickMemoText}
        setQuickMemoText={setQuickMemoText}
        quickMemoTextareaRef={quickMemoTextareaRef}
        isSavingQuickMemo={isSavingQuickMemo}
        handleCloseQuickMemo={handleCloseQuickMemo}
        handleSaveQuickMemo={handleSaveQuickMemo}
        showTemplate2Modal={showTemplate2Modal}
        setShowTemplate2Modal={setShowTemplate2Modal}
        items={items}
        templates2={templates2}
        handleApplyTemplate2ToItem={handleApplyTemplate2ToItem}
        isTabSettingModalOpen={isTabSettingModalOpen}
        setIsTabSettingModalOpen={setIsTabSettingModalOpen}
        saveMainTabs={saveMainTabs}
        setShowSavedToast={setShowSavedToast}
        editingTab={editingTab}
        editingTabInput={editingTabInput}
        setEditingTab={setEditingTab}
        setEditingTabInput={setEditingTabInput}
        handleUpdateTabLabel={handleUpdateTabLabel}
        createEventModalState={createEventModalState}
        setCreateEventModalState={setCreateEventModalState}
        calendarCategories={calendarCategories}
        handleSaveCalendarEvent={handleSaveCalendarEvent}
      />
    </div>
  );
}
