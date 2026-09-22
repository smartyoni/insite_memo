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
  getItemMatchBadges
} from './notebook/notebookHelpers';
import ChecklistPrintModal from './notebook/modals/ChecklistPrintModal';
import TemplatePrintModal from './notebook/modals/TemplatePrintModal';
import DeleteConfirmModal from './notebook/modals/DeleteConfirmModal';
import AddGroupModal from './notebook/modals/AddGroupModal';
import QuickMemoModal from './notebook/modals/QuickMemoModal';
import QuickTabEditModal from './notebook/modals/QuickTabEditModal';
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

  // Item List Sort Order State (Default: 'asc' for ascending order)
  const [itemSortOrder, setItemSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [searchQuery, setSearchQuery] = useState('');

  const searchLower = searchQuery.trim().toLowerCase();
  const isSearchActive = searchLower.length > 0;

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

  // Combine fixed In-box at top, user categories in middle (가나다순), fixed Trash category at bottom
  const currentFixedTrashCategory = getFixedTrashCategoryForTab(activeMainTab);
  const currentScope = getScopeForTab(activeMainTab);
  const filteredCategories = categories.filter((c) => {
    if (ALL_FIXED_CATEGORY_IDS.includes(c.id) || LEGACY_INBOX_IDS.includes(c.id) || c.isDeleted) return false;
    if (currentScope === 'explorer') {
      return !c.scope || c.scope === 'explorer';
    }
    return c.scope === currentScope;
  });

  const allCategories = [
    ...(activeMainTab === 'explorer' ? [QUICK_MEMO_CATEGORY] : []),
    ...filteredCategories
      .sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        const res = nameA.localeCompare(nameB, 'ko-KR', { numeric: true, sensitivity: 'base' });
        if (res !== 0) return res;
        return nameA.localeCompare(nameB, 'ko-KR');
      }),
    currentFixedTrashCategory
  ];

  const isTrashSelected = FIXED_TRASH_IDS.includes(selectedCategoryId);

  // Mobile responsiveness & navigation state (Threshold 860px for tablets & mobile)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 860);
  const [mobileView, setMobileView] = useState(() => initialNavLoc?.mobileView || 'categories'); // 'categories' | 'items' | 'detail'
  const [mobileSubTab, setMobileSubTab] = useState(() => initialNavLoc?.mobileSubTab || 'main'); // 'main' (상세내용) | 'sub' (보충노트)
  const [showExitToast, setShowExitToast] = useState(false);

  const lastBackPressRef = useRef(0);
  const exitToastTimerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const sidebarRef = useRef(null);

  // Category inline editing states & hierarchy states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingParentId, setAddingParentId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  // Item inline adding states
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const itemScrollRef = useRef(null);
  const itemInputRef = useRef(null);
  const isSubmittingItemRef = useRef(false);

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

  const [draftCategoryId, setDraftCategoryId] = useState(() => {
    const saved = initialNavLoc?.selectedCategoryId;
    if (saved && !LEGACY_INBOX_IDS.includes(saved)) {
      return saved;
    }
    return (initialNavLoc?.activeMainTab === 'explorer' || !initialNavLoc?.activeMainTab) ? 'quick_memo' : '';
  });
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftSubBody, setDraftSubBody] = useState('');
  const [draftTemplateId, setDraftTemplateId] = useState(null); // null = 기본 텍스트 박스
  const [draftTemplateValues, setDraftTemplateValues] = useState({}); // { [fieldId]: val }
  const [draftChecklists, setDraftChecklists] = useState(null); // template applied or edited checklists
  const [draggedNoteChecklistId, setDraggedNoteChecklistId] = useState(null);
  const [dragOverNoteChecklistId, setDragOverNoteChecklistId] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Detail Blocks Clipboard State (For copying blocks or items across items, categories, and tabs)
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
  const [selectedTemplate2IdInTab, setSelectedTemplate2IdInTab] = useState(null); // templateId or 'NEW'
  const [tpl2DraftTitle, setTpl2DraftTitle] = useState('');
  const [tpl2DraftChecklists, setTpl2DraftChecklists] = useState([]); // [{ id, text, completed, detailBlocks }]
  const [selectedTpl2ChecklistId, setSelectedTpl2ChecklistId] = useState(null);
  const [newTpl2ChecklistText, setNewTpl2ChecklistText] = useState('');
  const [isSavingTpl2, setIsSavingTpl2] = useState(false);
  const [showTemplate2Modal, setShowTemplate2Modal] = useState(false);
  const [template2ApplyMode, setTemplate2ApplyMode] = useState('replace'); // 'replace' | 'append'
  const [template2SearchKeyword, setTemplate2SearchKeyword] = useState('');
  const [collapsedTplCatIds, setCollapsedTplCatIds] = useState({});

  // Drag and Drop States for Template Canvas Blocks and Intra-Group Items
  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null);
  const [draggedFieldItem, setDraggedFieldItem] = useState(null); // { groupTitle, indexInGroup }
  const [dragOverFieldItem, setDragOverFieldItem] = useState(null); // { groupTitle, indexInGroup }
  const [draggedChecklistIndex, setDraggedChecklistIndex] = useState(null);
  const [dragOverChecklistIndex, setDragOverChecklistIndex] = useState(null);

  // Checklist local states
  const [newChecklistText, setNewChecklistText] = useState('');

  const [editingCheckId, setEditingCheckId] = useState(null);
  const [editingCheckText, setEditingCheckText] = useState('');
  const [editingCheckTag, setEditingCheckTag] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
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

  const [selectedChecklistId, setSelectedChecklistId] = useState(() => initialNavLoc?.selectedChecklistId || '__main__'); // '__main__' (부모 메모/템플릿) | checklistId
  const [checklistDetailDraft, setChecklistDetailDraft] = useState('');
  const [checklistDetailBlocks, setChecklistDetailBlocks] = useState([]);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(() => {
    return getStoredCollapsedSections(initialNavLoc?.selectedItemId);
  });
  const [detailCollapsedBlockIds, setDetailCollapsedBlockIds] = useState(() => {
    return getStoredDetailCollapsedBlocks(initialNavLoc?.selectedItemId, initialNavLoc?.selectedChecklistId || '__main__');
  });




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

  const handleCopyChecklist = async (checkItem) => {
    setOpenChecklistMenuId(null);
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
      setCopyToastText('✓ 체크리스트 내용이 복사되었습니다.');
      if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      copyToastTimerRef.current = setTimeout(() => {
        setCopyToastText('');
      }, 1800);
    } catch (err) {
      console.error('체크리스트 복사 실패:', err);
    }
  };

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

  // Resize listener for mobile responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 860;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Touch Swipe Handlers for Mobile Tab Switching
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!isMobile || touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    // Ensure horizontal swipe is dominant over vertical scroll
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      if (diffX < 0) {
        // Swiped Left -> Switch to 'sub' (보충노트)
        setMobileSubTab('sub');
      } else {
        // Swiped Right -> Switch to 'main' (상세내용)
        setMobileSubTab('main');
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Automatically ensure history guard entry exists whenever mobileView becomes 'categories'
  useEffect(() => {
    if (!isMobile) return;
    if (mobileView === 'categories') {
      if (window.history.state?.view !== 'categories') {
        window.history.pushState({ view: 'categories' }, '');
      }
    }
  }, [isMobile, mobileView, activeMainTab]);

  // Hardware/Browser Back button handling (popstate)
  useEffect(() => {
    // Initial mount guard state - align with initial mobileView
    const initView = initialNavLoc?.mobileView || 'categories';
    if (initView !== 'categories') {
      window.history.replaceState({ view: 'categories' }, '');
      if (initView === 'items') {
        window.history.pushState({ view: 'items' }, '');
      } else if (initView === 'detail') {
        window.history.pushState({ view: 'items' }, '');
        window.history.pushState({ view: 'detail' }, '');
      }
    } else {
      if (window.history.state?.view !== 'categories') {
        window.history.pushState({ view: 'categories' }, '');
      }
    }

    const handlePopState = (e) => {
      const stateView = e.state?.view;

      if (stateView === 'detail') {
        setMobileView('detail');
      } else if (stateView === 'items') {
        setMobileView('items');
      } else {
        // Popped back while at top-level categories or invalid state
        setMobileView('categories');

        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // Double back press within 2 seconds: Allow actual app exit
          try {
            window.close();
          } catch (err) {
            console.log('App exited');
          }
          window.history.back();
        } else {
          lastBackPressRef.current = now;
          // Re-push categories guard state to block immediate page exit
          window.history.pushState({ view: 'categories' }, '');

          setShowExitToast(true);
          if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
          exitToastTimerRef.current = setTimeout(() => {
            setShowExitToast(false);
          }, 2000);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation Helpers
  const navigateToItems = (catId) => {
    setSelectedCategoryId(catId);
    setIsAddingItem(false);
    setNewItemTitle('');
    if (isMobile) {
      setMobileView('items');
      window.history.pushState({ view: 'items' }, '');
    }
  };

  useEffect(() => {
    if (isAddingItem && itemInputRef.current) {
      itemInputRef.current.focus();
    }
  }, [isAddingItem]);

  const navigateToDetail = (itemId) => {
    setSelectedItemId(itemId);
    setMobileSubTab('main');
    if (isMobile) {
      setMobileView('detail');
      window.history.pushState({ view: 'detail' }, '');
    }
  };

  const navigateBack = () => {
    window.history.back();
  };

  // Ensure valid selectedCategoryId when categories or tab change
  useEffect(() => {
    if (categories.length === 0) return;
    const isFixed = ALL_FIXED_CATEGORY_IDS.includes(selectedCategoryId);
    const currentTabScope = getScopeForTab(activeMainTab);
    const isValid = isFixed || categories.some(
      (c) => c.id === selectedCategoryId && (currentTabScope === 'explorer' ? (!c.scope || c.scope === 'explorer') : c.scope === currentTabScope)
    );
    if (!isValid || LEGACY_INBOX_IDS.includes(selectedCategoryId)) {
      const defId = getDefaultCategoryIdForTab(activeMainTab, categories);
      if (defId) {
        setSelectedCategoryId(defId);
      }
    }
  }, [categories, activeMainTab, selectedCategoryId]);

  // Automatically save current navigation location to localStorage
  useEffect(() => {
    saveStoredNavLocation({
      activeMainTab,
      selectedCategoryId,
      selectedItemId,
      selectedChecklistId,
      mobileView,
      mobileSubTab
    });
  }, [activeMainTab, selectedCategoryId, selectedItemId, selectedChecklistId, mobileView, mobileSubTab]);

  // Filter & Sort items by selected category (Default: ascending order by title / 가나다순)
  const filteredItems = items
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

  // Search matched items helpers imported from notebookHelpers

  // Search matched items (across ALL categories and tabs if search is active)
  const matchedItems = isSearchActive
    ? items
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
        })
    : [];

  const displayedItems = isSearchActive ? matchedItems : filteredItems;

  // Auto-select first item when category changes if current selected item not in category (only after items loaded)
  useEffect(() => {
    if (items.length === 0) return; // Wait until items are loaded from Firestore before auto-selecting
    if (filteredItems.length > 0) {
      const exists = filteredItems.some((item) => item.id === selectedItemId);
      if (!exists) {
        setSelectedItemId(filteredItems[0].id);
      }
    } else {
      setSelectedItemId(null);
    }
  }, [selectedCategoryId, filteredItems.length, items.length]);

  // Current active selected item & category objects
  const activeItem = items.find((item) => item.id === selectedItemId);
  const activeCategory = allCategories.find((cat) => cat.id === selectedCategoryId);

  // Current active tab scope category groups
  const currentScopeCategoryGroups = React.useMemo(() => {
    const currentScope = getScopeForTab(activeMainTab);
    return categoryGroups
      .filter((g) => (g.scope || 'explorer') === currentScope)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categoryGroups, activeMainTab]);

  // Group displayed categories by categoryGroups
  const displayedCategoryGrouped = React.useMemo(() => {
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
        categories: unassignedCategories
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
  const currentCategoryItemGroups = React.useMemo(() => {
    if (isTrashSelected || isSearchActive) return [];
    if (!activeCategory || !Array.isArray(activeCategory.itemGroups)) return [];
    return [...activeCategory.itemGroups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [activeCategory, isTrashSelected, isSearchActive]);

  // Group displayed items by itemGroups
  const displayedItemGrouped = React.useMemo(() => {
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
        items: unassignedItems
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
    setCollapsedItemGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('memo_collapsed_item_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isItemInTrash = Boolean(activeItem && (activeItem.isDeleted || FIXED_TRASH_IDS.includes(activeItem.categoryId) || isTrashSelected));

  const hasTpl = Boolean(activeItem?.templateId && templates.find(t => t.id === activeItem.templateId));
  const activeTpl = hasTpl ? templates.find(t => t.id === activeItem.templateId) : null;
  const hasBlocks = Boolean(
    Array.isArray(activeItem?.detailBlocks) &&
    activeItem.detailBlocks.some((b) => {
      if (!b) return false;
      if (b.type === 'checklist') {
        const hasCustomTitle = b.title && b.title.trim() && b.title.trim() !== '체크리스트';
        const hasValidItems = Array.isArray(b.items) && b.items.some((it) => it && typeof it.text === 'string' && it.text.trim().length > 0);
        return Boolean(hasCustomTitle || hasValidItems);
      }
      return Boolean((b.title && b.title.trim().length > 0) || (b.content && b.content.trim().length > 0));
    })
  );
  const hasLegacyBody = Boolean((activeItem?.body && activeItem.body.trim().length > 0) || hasBlocks);

  // Compute active item checklists (with legacy subBody fallback)
  const baseChecklists = (isEditMode && draftChecklists !== null)
    ? draftChecklists
    : (activeItem?.checklists
      ? activeItem.checklists
      : activeItem?.subBody
        ? activeItem.subBody.split('\n').filter((l) => l.trim().length > 0).map((line, idx) => ({
            id: `legacy_${idx}`,
            text: line,
            completed: false
          }))
        : []);

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

  const rawChecklists = [];
  if (hasTpl) {
    rawChecklists.push({
      id: '__main__',
      text: activeTpl.title,
      completed: Boolean(activeItem?.completed),
      tag: null,
      detail: activeItem.body || '',
      detailBlocks: activeItem.detailBlocks || [],
      isTemplate: true
    });
  } else if (hasLegacyBody) {
    rawChecklists.push({
      id: '__main__',
      text: '기본 내용',
      completed: Boolean(activeItem?.completed),
      tag: null,
      detail: activeItem.body || '',
      detailBlocks: activeItem.detailBlocks || []
    });
  }
  rawChecklists.push(...baseChecklists);

  // Group checklists by section header (isSection: true)
  const checklistGroups = React.useMemo(() => {
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
        groupTotalCount
      };
    });
  }, [rawChecklists]);

  const currentChecklists = React.useMemo(() => {
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


  // Inline Template Checklist Handlers
  const getSortedChecklistItems = (rawVal, defaultItems) => {
    const list = Array.isArray(rawVal)
      ? rawVal
      : (defaultItems || []).map((t) => (typeof t === 'object' ? t : { text: t, completed: false }));

    const indexed = list.map((item, idx) => ({
      ...(typeof item === 'object' ? item : { text: item, completed: false }),
      originalIndex: idx
    }));

    return indexed.sort((a, b) => {
      const aDone = Boolean(a.completed);
      const bDone = Boolean(b.completed);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.originalIndex - b.originalIndex;
    });
  };

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

  const updateDetailCollapsedBlockIds = (updater) => {
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
    setCollapsedCategoryGroups({});
    try {
      localStorage.setItem('memo_collapsed_category_groups', JSON.stringify({}));
    } catch {}

    const allExpanded = {};
    categories.forEach((c) => {
      if (c && c.id) allExpanded[c.id] = true;
    });
    setExpandedFolders(allExpanded);
    try {
      localStorage.setItem('memo_expanded_folders', JSON.stringify(allExpanded));
    } catch {}
  };

  const handleCollapseAllCategories = () => {
    const allCollapsedGroups = {};
    categoryGroups.forEach((g) => {
      if (g && g.id) allCollapsedGroups[g.id] = true;
    });
    setCollapsedCategoryGroups(allCollapsedGroups);
    try {
      localStorage.setItem('memo_collapsed_category_groups', JSON.stringify(allCollapsedGroups));
    } catch {}

    const allCollapsedFolders = {};
    categories.forEach((c) => {
      if (c && c.id) allCollapsedFolders[c.id] = false;
    });
    setExpandedFolders(allCollapsedFolders);
    try {
      localStorage.setItem('memo_expanded_folders', JSON.stringify(allCollapsedFolders));
    } catch {}
  };

  const handleExpandAllItemGroups = () => {
    const next = { ...collapsedItemGroups };
    if (activeCategory && Array.isArray(activeCategory.itemGroups)) {
      activeCategory.itemGroups.forEach((g) => {
        if (g && g.id) delete next[g.id];
      });
    }
    setCollapsedItemGroups(next);
    try {
      localStorage.setItem('memo_collapsed_item_groups', JSON.stringify(next));
    } catch {}
  };

  const handleCollapseAllItemGroups = () => {
    const next = { ...collapsedItemGroups };
    if (activeCategory && Array.isArray(activeCategory.itemGroups)) {
      activeCategory.itemGroups.forEach((g) => {
        if (g && g.id) next[g.id] = true;
      });
    }
    setCollapsedItemGroups(next);
    try {
      localStorage.setItem('memo_collapsed_item_groups', JSON.stringify(next));
    } catch {}
  };

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
      const hasTpl = Boolean(activeItem.templateId && templates.find(t => t.id === activeItem.templateId));
      const hasItemBlocks = Boolean(
        Array.isArray(activeItem.detailBlocks) &&
        activeItem.detailBlocks.some((b) => {
          if (!b) return false;
          if (b.type === 'checklist') {
            const hasCustomTitle = b.title && b.title.trim() && b.title.trim() !== '체크리스트';
            const hasValidItems = Array.isArray(b.items) && b.items.some((it) => it && typeof it.text === 'string' && it.text.trim().length > 0);
            return Boolean(hasCustomTitle || hasValidItems);
          }
          return Boolean((b.title && b.title.trim().length > 0) || (b.content && b.content.trim().length > 0));
        })
      );
      const hasLegacyBody = Boolean((activeItem.body && activeItem.body.trim()) || hasItemBlocks);
      const firstId = hasTpl || hasLegacyBody ? '__main__' : (baseChecklists[0]?.id || null);
      const isSavedChecklistValid = Boolean(
        selectedChecklistId && (
          selectedChecklistId === '__main__' ||
          baseChecklists.some((c) => c.id === selectedChecklistId)
        )
      );
      const targetCheckId = isSavedChecklistValid ? selectedChecklistId : firstId;
      setSelectedChecklistId(targetCheckId);
      const initialText = firstId === '__main__' ? (activeItem.body || '') : (baseChecklists[0]?.detail || '');
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
    setDetailCollapsedBlockIds(getStoredDetailCollapsedBlocks(activeItem?.id, selectedChecklistId || '__main__'));
  }, [selectedChecklistId, activeItem?.id, activeItem?.body, activeItem?.detailBlocks]);

  // ESC & Enter key handler for modals & detail edit mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. 확인 모달(삭제 등)이 열려있을 때의 키보드 동작
      if (deleteModalState.isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          closeDeleteModal();
          return;
        }
        if (e.key === 'Enter') {
          if (e.isComposing) return;
          e.preventDefault();
          e.stopPropagation();
          handleConfirmDelete();
          return;
        }
        return;
      }

      // 2. 일반 ESC 동작
      if (e.key === 'Escape') {
        if (moveBlockModalState.isOpen) {
          e.preventDefault();
          e.stopPropagation();
          handleCloseMoveBlockModal();
          return;
        }
        if (movingCategory) {
          setMovingCategory(null);
        } else if (openCategoryGroupMenuId) {
          setOpenCategoryGroupMenuId(null);
        } else if (openItemGroupMenuId) {
          setOpenItemGroupMenuId(null);
        } else if (openCatMenuId) {
          setOpenCatMenuId(null);
        } else if (openNoteMenuId) {
          setOpenNoteMenuId(null);
        } else if (openChecklistMenuId) {
          setOpenChecklistMenuId(null);
        } else if (isEditingChecklistDetail) {
          if (selectedChecklistId === '__main__') {
            const initialText = activeItem?.body || '';
            const initialBlocksData = activeItem?.detailBlocks;
            setChecklistDetailDraft(initialText);
            setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocksData));
          } else {
            const found = currentChecklists.find((c) => c.id === selectedChecklistId);
            const initialText = found?.detail || '';
            const initialBlocksData = found?.detailBlocks;
            setChecklistDetailDraft(initialText);
            setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocksData));
          }
          setIsEditingChecklistDetail(false);
        } else if (isEditMode) {
          handleCancelDetailEdit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openChecklistMenuId, openCatMenuId, openCategoryGroupMenuId, openItemGroupMenuId, openNoteMenuId, deleteModalState, isEditMode, activeItem, movingCategory]);


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

      
      {/* Checklist Item Print Selection Modal */}
      <ChecklistPrintModal
        isOpen={isChecklistPrintModalOpen}
        onClose={() => setIsChecklistPrintModalOpen(false)}
        currentChecklists={currentChecklists}
        selectedPrintChecklistIds={selectedPrintChecklistIds}
        setSelectedPrintChecklistIds={setSelectedPrintChecklistIds}
        onConfirmPrint={handleConfirmChecklistPrint}
      />

      {/* Template Field Print Selection Modal */}
      <TemplatePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        templates={templates}
        activeItem={activeItem}
        selectedPrintFieldIds={selectedPrintFieldIds}
        setSelectedPrintFieldIds={setSelectedPrintFieldIds}
        onConfirmPrint={handleConfirmTemplatePrint}
      />

      {/* Global Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        message={deleteModalState.message}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        confirmBtnRef={deleteConfirmBtnRef}
      />

      {/* Detail Block Move Modal */}
      <MoveBlockModal
        isOpen={moveBlockModalState.isOpen}
        modalState={moveBlockModalState}
        onClose={handleCloseMoveBlockModal}
        onSelectTarget={(targetCheckId) => setMoveBlockModalState(prev => ({ ...prev, targetCheckId }))}
        onExecute={handleExecuteMoveBlock}
        rawChecklists={rawChecklists}
        checklistGroups={checklistGroups}
        isMobile={isMobile}
      />

      {/* Category Move Modal */}
      <CategoryMoveModal
        movingCategory={movingCategory}
        onClose={() => setMovingCategory(null)}
        targetMoveParentId={targetMoveParentId}
        setTargetMoveParentId={setTargetMoveParentId}
        onConfirm={async (newPid) => {
          try {
            const pid = newPid ? newPid.trim() : null;
            await updateDoc(doc(db, 'categories', movingCategory.id), { parentId: pid });
            if (pid) {
              setExpandedFolders((prev) => ({ ...prev, [pid]: true }));
            }
            setMovingCategory(null);
          } catch (err) {
            console.error('Error moving category:', err);
          }
        }}
        categoryOptions={movingCategory ? getHierarchicalCategoryOptions(currentScope, movingCategory.id).filter((c) => !ALL_FIXED_CATEGORY_IDS.includes(c.id)) : []}
        isMobile={isMobile}
        sidebarRight={sidebarRef.current?.getBoundingClientRect().right || 280}
      />

      {/* Move Item Modal */}
      {movingItem && (() => {
        const targetScope = getScopeForTab(targetMoveItemTab);
        const targetScopeGroups = categoryGroups.filter((g) => (g.scope || 'explorer') === targetScope);
        const categoryOptions = getHierarchicalCategoryOptions(targetScope, null, targetMoveCategoryGroupId).filter((c) => !ALL_FIXED_CATEGORY_IDS.includes(c.id));
        const targetCat = categories.find((c) => c.id === targetMoveItemCategoryId);
        const targetGroups = targetCat && Array.isArray(targetCat.itemGroups) ? targetCat.itemGroups : [];

        return (
          <MoveItemModal
            movingItem={movingItem}
            onClose={() => setMovingItem(null)}
            targetMoveItemTab={targetMoveItemTab}
            setTargetMoveItemTab={setTargetMoveItemTab}
            targetMoveCategoryGroupId={targetMoveCategoryGroupId}
            setTargetMoveCategoryGroupId={setTargetMoveCategoryGroupId}
            targetMoveItemCategoryId={targetMoveItemCategoryId}
            setTargetMoveItemCategoryId={setTargetMoveItemCategoryId}
            targetMoveItemGroupId={targetMoveItemGroupId}
            setTargetMoveItemGroupId={setTargetMoveItemGroupId}
            onConfirm={async () => {
              if (!targetMoveItemCategoryId) {
                alert('이동할 카테고리를 선택해 주세요.');
                return;
              }
              try {
                await updateDoc(doc(db, 'items', movingItem.id), {
                  categoryId: targetMoveItemCategoryId,
                  groupId: targetMoveItemGroupId || null,
                  updatedAt: serverTimestamp()
                });
                if (targetMoveItemCategoryId !== 'quick_memo') {
                  const targetCatObj = categories.find((c) => c.id === targetMoveItemCategoryId);
                  const targetScope = targetCatObj ? targetCatObj.scope || 'explorer' : 'explorer';
                  const scopeToTabMap = {
                    explorer: 'explorer',
                    blog: 'blog',
                    clipboard: 'clipboard',
                    balance: 'balance',
                    clip: 'clip',
                    office: 'office',
                    ad: 'ad',
                    template2: 'template2',
                    experience: 'experience',
                    custom1: 'custom1',
                    custom2: 'custom2',
                    custom3: 'custom3',
                    custom4: 'custom4',
                    custom5: 'custom5',
                    custom6: 'custom6'
                  };
                  if (scopeToTabMap[targetScope]) {
                    setActiveMainTab(scopeToTabMap[targetScope]);
                  }
                  setSelectedCategoryId(targetMoveItemCategoryId);
                  setSelectedItemId(movingItem.id);
                }
                setMovingItem(null);
              } catch (err) {
                console.error('Error moving item:', err);
              }
            }}
            mainTabs={mainTabs}
            targetScopeGroups={targetScopeGroups}
            categoryOptions={categoryOptions}
            targetGroups={targetGroups}
            isMobile={isMobile}
          />
        );
      })()}

      {/* Add Group Popover Modal */}
      <AddGroupModal
        isOpen={showAddGroupModal}
        groupModalPos={groupModalPos}
        newGroupNameInput={newGroupNameInput}
        setNewGroupNameInput={setNewGroupNameInput}
        onClose={() => setShowAddGroupModal(false)}
        onCreateGroup={handleCreateGroupFromModal}
      />

      {/* Category Right-Click Context Menu Popup */}
      {categoryContextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99998,
              backgroundColor: 'transparent'
            }}
            onClick={() => setCategoryContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCategoryContextMenu(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: categoryContextMenu.y,
              left: categoryContextMenu.x,
              zIndex: 99999,
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #CBD5E1',
              padding: '4px',
              minWidth: '160px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleCopyCategoryPath(categoryContextMenu.category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0FDF4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Copy size={15} color="#10B981" />
              <span>경로 복사</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyCategoryLink(categoryContextMenu.category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Copy size={15} color="#2563EB" />
              <span>목록 주소 복사</span>
            </button>
          </div>
        </>
      )}

      {/* Item (Memo) Right-Click Context Menu Popup */}
      {itemContextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99998,
              backgroundColor: 'transparent'
            }}
            onClick={() => setItemContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setItemContextMenu(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: itemContextMenu.y,
              left: itemContextMenu.x,
              zIndex: 99999,
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #CBD5E1',
              padding: '4px',
              minWidth: '160px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleCopyItemPath(itemContextMenu.item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0FDF4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Copy size={15} color="#10B981" />
              <span>경로 복사</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyItemLink(itemContextMenu.item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Copy size={15} color="#2563EB" />
              <span>메모 주소 복사</span>
            </button>
          </div>
        </>
      )}

      {/* Deep Link Return Floating Banner */}
      {returnLocation && (
        <div
          style={{
            position: 'fixed',
            top: isMobile ? '10px' : '14px',
            right: isMobile ? '10px' : '20px',
            zIndex: 99990,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '7px 14px',
            borderRadius: '24px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.35), 0 4px 6px -2px rgba(15, 23, 42, 0.2)',
            border: '1px solid #334155',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          <span
            style={{
              color: '#93C5FD',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              maxWidth: isMobile ? '140px' : '220px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={`이전 위치: ${returnLocation.categoryName}`}
          >
            이전: {returnLocation.categoryName}
          </span>
          <button
            type="button"
            onClick={handleReturnToPreviousLocation}
            style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 2px rgba(37, 99, 235, 0.3)',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          >
            <RotateCcw size={12} />
            <span>복귀</span>
          </button>
          <button
            type="button"
            onClick={() => setReturnLocation(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="복귀 알림 닫기"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Copy Toast Notification */}
      {copyToastText && (
        <div style={styles.exitToast}>
          {copyToastText}
        </div>
      )}

      {/* Exit Toast Notification for Mobile double back press */}
      {showExitToast && (
        <div style={styles.exitToast}>
          앱을 종료하시겠습니까? 뒤로 가기를 한 번 더 누르면 종료됩니다.
        </div>
      )}

      {/* Global Quick Memo Modal (Ctrl+Enter to save, Esc to close) */}
      <QuickMemoModal
        isOpen={isQuickMemoOpen}
        quickMemoToast={quickMemoToast}
        quickMemoText={quickMemoText}
        setQuickMemoText={setQuickMemoText}
        quickMemoTextareaRef={quickMemoTextareaRef}
        isSavingQuickMemo={isSavingQuickMemo}
        onClose={handleCloseQuickMemo}
        onSave={handleSaveQuickMemo}
      />

      {/* Template 2 Selection & Apply Modal */}
      <Template2Modal
        isOpen={showTemplate2Modal}
        onClose={() => setShowTemplate2Modal(false)}
        categories={categories}
        items={items}
        templates={templates}
        templates2={templates2}
        getHierarchicalCategoryOptions={getHierarchicalCategoryOptions}
        onApplyTemplate={handleApplyTemplate2ToItem}
      />

      {/* Main Tabs Setting & Backup Modal */}
      <SettingsBackupModal
        isOpen={isTabSettingModalOpen}
        onClose={() => setIsTabSettingModalOpen(false)}
        mainTabs={mainTabs}
        onSaveMainTabs={saveMainTabs}
        items={items}
        categories={categories}
        categoryGroups={categoryGroups}
        templates={templates}
        templates2={templates2}
        setShowSavedToast={setShowSavedToast}
      />

      {/* Quick Single Tab Label Edit Modal (Long-press or Right-click) */}
      <QuickTabEditModal
        editingTab={editingTab}
        editingTabInput={editingTabInput}
        setEditingTabInput={setEditingTabInput}
        onClose={() => {
          setEditingTab(null);
          setEditingTabInput('');
        }}
        onUpdateTabLabel={handleUpdateTabLabel}
      />

      {/* Create Calendar Event Modal */}
      <CreateEventModal
        isOpen={createEventModalState.isOpen}
        onClose={() => setCreateEventModalState((prev) => ({ ...prev, isOpen: false }))}
        initialTitle={createEventModalState.initialTitle}
        initialBlocks={createEventModalState.initialBlocks}
        categories={calendarCategories}
        sourceMemo={createEventModalState.sourceMemo}
        initialDate={createEventModalState.date}
        initialEvent={createEventModalState.initialEvent}
        onSaveEvent={handleSaveCalendarEvent}
      />
    </div>
  );
}
