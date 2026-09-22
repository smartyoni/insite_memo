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
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => {
    if (initialHashLoc?.selectedCategoryId) return initialHashLoc.selectedCategoryId;
    const saved = initialNavLoc?.selectedCategoryId;
    if (saved && !LEGACY_INBOX_IDS.includes(saved)) {
      return saved;
    }
    return (initialNavLoc?.activeMainTab === 'explorer' || !initialNavLoc?.activeMainTab) ? 'quick_memo' : '';
  });
  const [selectedItemId, setSelectedItemId] = useState(() => initialNavLoc?.selectedItemId || null);

  // Deep Link Category Bookmark & Navigation States
  const [categoryContextMenu, setCategoryContextMenu] = useState(null); // { x, y, category }
  const [itemContextMenu, setItemContextMenu] = useState(null); // { x, y, item }
  const [returnLocation, setReturnLocation] = useState(null); // { tab, categoryId, categoryName, itemId }

  // Main Tabs Configuration State (Custom order & custom labels)
  const [mainTabs, setMainTabs] = useState(() => getStoredMainTabs());
  const [draggedTabIndex, setDraggedTabIndex] = useState(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState(null);
  const [isTabSettingModalOpen, setIsTabSettingModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState(null); // { id, label }
  const [editingTabInput, setEditingTabInput] = useState('');
  const tabLongPressTimerRef = useRef(null);

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

  // Save main tabs to both localStorage and Firestore cloud
  const saveMainTabs = async (newTabs) => {
    setMainTabs(newTabs);
    try {
      localStorage.setItem(MAIN_TABS_STORAGE_KEY, JSON.stringify(newTabs));
    } catch (err) {}
    try {
      await setDoc(doc(db, 'settings', 'mainTabs'), {
        tabs: newTabs,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Error syncing main tabs to Firestore:', err);
    }
  };

  // Real-time Cloud Sync for Main Tabs
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'mainTabs'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.tabs) && data.tabs.length > 0) {
          const currentIds = new Set(data.tabs.map(t => t.id));
          const merged = [...data.tabs];
          DEFAULT_MAIN_TABS.forEach(d => {
            if (!currentIds.has(d.id)) {
              merged.push({ ...d });
            }
          });
          setMainTabs(merged);
          try {
            localStorage.setItem(MAIN_TABS_STORAGE_KEY, JSON.stringify(merged));
          } catch (err) {}
        }
      } else {
        // 최초 1회: 로컬에 설정된 탭을 Firestore 클라우드에 자동 백업/동기화
        const currentStored = getStoredMainTabs();
        setDoc(doc(db, 'settings', 'mainTabs'), {
          tabs: currentStored,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch((e) => console.error('Initial mainTabs cloud save error:', e));
      }
    });

    return () => unsub();
  }, []);

  // Tab Drag & Drop handlers
  const handleTabDragStart = (e, index) => {
    setDraggedTabIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', index.toString());
      } catch (err) {}
    }
  };

  const handleTabDragOver = (e, index) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverTabIndex !== index) {
      setDragOverTabIndex(index);
    }
  };

  const handleTabDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedTabIndex === null || draggedTabIndex === dropIndex) {
      setDraggedTabIndex(null);
      setDragOverTabIndex(null);
      return;
    }
    const newTabs = [...mainTabs];
    const [moved] = newTabs.splice(draggedTabIndex, 1);
    newTabs.splice(dropIndex, 0, moved);
    saveMainTabs(newTabs);
    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
  };

  const handleTabDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
  };

  // Reorder tabs with arrow buttons
  const moveTab = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= mainTabs.length) return;
    const newTabs = [...mainTabs];
    const temp = newTabs[index];
    newTabs[index] = newTabs[targetIndex];
    newTabs[targetIndex] = temp;
    saveMainTabs(newTabs);
  };

  const handleUpdateTabLabel = (id, newLabel) => {
    const trimmed = (newLabel || '').trim();
    if (!trimmed) return;
    const newTabs = mainTabs.map(t => t.id === id ? { ...t, label: trimmed } : t);
    saveMainTabs(newTabs);
    if (editingTab && editingTab.id === id) {
      setEditingTab(null);
      setEditingTabInput('');
    }
  };

  const handleResetMainTabs = () => {
    if (window.confirm('메인탭 순서와 이름을 초기 기본값으로 되돌리시겠습니까?')) {
      saveMainTabs(DEFAULT_MAIN_TABS);
      setIsTabSettingModalOpen(false);
      setEditingTab(null);
    }
  };

  const handleTabTouchStart = (tab) => {
    tabLongPressTimerRef.current = setTimeout(() => {
      setEditingTab(tab);
      setEditingTabInput(tab.label);
    }, 600);
  };

  const handleTabTouchEnd = () => {
    if (tabLongPressTimerRef.current) {
      clearTimeout(tabLongPressTimerRef.current);
      tabLongPressTimerRef.current = null;
    }
  };

  // Item List Sort Order State (Default: 'asc' for ascending order)
  const [itemSortOrder, setItemSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [searchQuery, setSearchQuery] = useState('');

  const searchLower = searchQuery.trim().toLowerCase();
  const isSearchActive = searchLower.length > 0;

  const getCategoryPath = (categoryId) => {
    const scopeMap = {
      explorer: 'ME',
      blog: '블로그',
      clipboard: '계약',
      balance: '앱개발',
      clip: '북마크',
      office: '정보',
      ad: '광고',
      template2: '템플릿',
      experience: '경험',
      custom1: '새탭 1',
      custom2: '새탭 2',
      custom3: '새탭 3',
      custom4: '새탭 4',
      custom5: '새탭 5',
      custom6: '새탭 6'
    };
    (mainTabs || []).forEach(t => {
      if (t.id && t.label) {
        scopeMap[t.id] = t.label;
      }
    });
    const meLabel = scopeMap.explorer || 'ME';
    if (categoryId === 'quick_memo') {
      return `${meLabel} > 퀵메모`;
    }
    if (LEGACY_INBOX_IDS.includes(categoryId)) {
      return 'In-box';
    }
    const found = categories.find(c => c.id === categoryId);
    if (!found) return '기타';

    const pathSegments = [found.name];
    let curr = found;
    const visited = new Set([found.id]);
    while (curr && curr.parentId) {
      const parent = categories.find(c => c.id === curr.parentId);
      if (!parent || visited.has(parent.id)) break;
      visited.add(parent.id);
      pathSegments.unshift(parent.name);
      curr = parent;
    }
    const scopeName = scopeMap[found.scope || 'explorer'] || meLabel;
    return `${scopeName} > ${pathSegments.join(' > ')}`;
  };
  const getCategoryBadgeName = getCategoryPath;

  // Tree Structure & Hierarchy Helpers
  const buildCategoryTree = (catList) => {
    const nodeMap = new Map();
    catList.forEach(c => nodeMap.set(c.id, { ...c, children: [] }));

    const roots = [];
    catList.forEach(c => {
      const node = nodeMap.get(c.id);
      if (c.parentId && nodeMap.has(c.parentId) && c.parentId !== c.id) {
        nodeMap.get(c.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortNodes = (nodes) => {
      nodes.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        const res = nameA.localeCompare(nameB, 'ko-KR', { numeric: true, sensitivity: 'base' });
        if (res !== 0) return res;
        return nameA.localeCompare(nameB, 'ko-KR');
      });
      nodes.forEach(n => {
        if (n.children && n.children.length > 0) {
          sortNodes(n.children);
        }
      });
    };

    sortNodes(roots);
    return roots;
  };

  const getHierarchicalCategoryOptions = (scope, excludeId = null, groupIdFilter = null) => {
    const scopeCategories = categories.filter(c => {
      if (ALL_FIXED_CATEGORY_IDS.includes(c.id) || LEGACY_INBOX_IDS.includes(c.id) || c.isDeleted) return false;
      const isScopeMatch = scope === 'explorer' ? (!c.scope || c.scope === 'explorer') : (c.scope === scope);
      if (!isScopeMatch) return false;
      if (groupIdFilter === '__ungrouped__') return !c.groupId;
      if (groupIdFilter && groupIdFilter !== '') return c.groupId === groupIdFilter;
      return true;
    });

    const invalidIds = new Set();
    if (excludeId) {
      invalidIds.add(excludeId);
      const addDescendants = (pid) => {
        scopeCategories.filter(c => c.parentId === pid).forEach(child => {
          invalidIds.add(child.id);
          addDescendants(child.id);
        });
      };
      addDescendants(excludeId);
    }

    const validCategories = scopeCategories.filter(c => !invalidIds.has(c.id));
    const tree = buildCategoryTree(validCategories);

    const flatList = [];
    const traverse = (nodes, level = 0) => {
      nodes.forEach(node => {
        const indentPrefix = level > 0 ? `${'\u00A0\u00A0'.repeat(level)}└ ` : '';
        flatList.push({
          id: node.id,
          name: node.name,
          displayName: `${indentPrefix}📁 ${node.name}`,
          level
        });
        if (node.children && node.children.length > 0) {
          traverse(node.children, level + 1);
        }
      });
    };
    traverse(tree);

    return [
      ...(scope === 'explorer' ? [{ id: 'quick_memo', name: '퀵메모', displayName: '⚡ 퀵메모', level: 0 }] : []),
      ...flatList
    ];
  };

  const getCategoryDescendantIds = (rootId) => {
    const result = [rootId];
    const getChildren = (pid) => {
      const children = categories.filter(c => c.parentId === pid);
      children.forEach(c => {
        result.push(c.id);
        getChildren(c.id);
      });
    };
    getChildren(rootId);
    return result;
  };

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
  const [categoryGroups, setCategoryGroups] = useState([]);
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
  const [printTarget, setPrintTarget] = useState('detail');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintFieldIds, setSelectedPrintFieldIds] = useState({});
  const [isChecklistPrintModalOpen, setIsChecklistPrintModalOpen] = useState(false);
  const [selectedPrintChecklistIds, setSelectedPrintChecklistIds] = useState({});

  const handleOpenChecklistPrint = () => {
    setPrintTarget('checklist');
    if (currentChecklists.length > 0) {
      const initialMap = {};
      currentChecklists.forEach(item => {
        initialMap[item.id] = true;
      });
      setSelectedPrintChecklistIds(initialMap);
      setIsChecklistPrintModalOpen(true);
    } else {
      handlePrint('checklist');
    }
  };

  const handleConfirmChecklistPrint = () => {
    setIsChecklistPrintModalOpen(false);
    handlePrint('checklist');
  };

  const isChecklistPrintItemSelected = (checkId) => {
    return selectedPrintChecklistIds[checkId] !== false;
  };

  const handleOpenDetailPrint = () => {
    setPrintTarget('detail');
    const tpl = activeItem?.templateId ? templates.find(t => t.id === activeItem.templateId) : null;
    if (tpl && tpl.fields && tpl.fields.length > 0) {
      const initialMap = {};
      tpl.fields.forEach(f => {
        initialMap[f.id] = true;
      });
      setSelectedPrintFieldIds(initialMap);
      setIsPrintModalOpen(true);
    } else {
      handlePrint('detail');
    }
  };

  const handleConfirmTemplatePrint = () => {
    setIsPrintModalOpen(false);
    handlePrint('detail');
  };

  const isPrintFieldSelected = (fieldId) => {
    if (!activeItem?.templateId) return true;
    return selectedPrintFieldIds[fieldId] !== false;
  };

  const handlePrint = (target) => {
    setPrintTarget(target);
    setTimeout(() => {
      window.print();
    }, 100);
  };
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
  const [templates, setTemplates] = useState([]);
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

  // Template Tab Dedicated Canvas States
  const [selectedTemplateIdInTab, setSelectedTemplateIdInTab] = useState(null); // templateId or 'NEW'
  const [tplDraftTitle, setTplDraftTitle] = useState('');
  const [tplDraftFields, setTplDraftFields] = useState([]);
  const [tplDraftChecklists, setTplDraftChecklists] = useState([]);
  const [selectedTplFieldIds, setSelectedTplFieldIds] = useState([]); // Array of field IDs selected for grouping
  const [tplEditorSection, setTplEditorSection] = useState('fields'); // 'fields' | 'checklists'
  const [isSavingTpl, setIsSavingTpl] = useState(false);

  // Template checklist multiline input states
  const [tplChecklistInputModes, setTplChecklistInputModes] = useState({}); // { [fieldId]: 'textarea' | 'list' }
  const [showTplBulkChecklistInput, setShowTplBulkChecklistInput] = useState(false);
  const [tplBulkChecklistText, setTplBulkChecklistText] = useState('');
  const [noteBulkChecklistInputs, setNoteBulkChecklistInputs] = useState({}); // { [fieldId]: boolean }
  const [noteBulkChecklistTexts, setNoteBulkChecklistTexts] = useState({}); // { [fieldId]: string }

  // Template 2 Dedicated States
  const [templates2, setTemplates2] = useState([]);
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
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [groupModalPos, setGroupModalPos] = useState(null);

  const handleOpenAddGroupModal = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const modalWidth = 260;
    let right = window.innerWidth - rect.right;
    if (right < 10) right = 10;
    if (rect.right - modalWidth < 10) right = Math.max(10, window.innerWidth - 270);
    setGroupModalPos({ top: rect.bottom + 6, right });
    setNewGroupNameInput('');
    setShowAddGroupModal(true);
  };

  const handleCreateGroupFromModal = async () => {
    if (!activeItem || !newGroupNameInput.trim()) return;
    recordWorkLocation();
    const sectionName = newGroupNameInput.trim();
    const newSectionId = 'sec_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6);
    const newSection = {
      id: newSectionId,
      isSection: true,
      type: 'section',
      text: sectionName
    };
    const firstItemId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6);
    const firstItem = {
      id: firstItemId,
      text: '',
      completed: false,
      detail: '',
      detailBlocks: []
    };
    const updated = [...baseChecklists, newSection, firstItem];
    setShowAddGroupModal(false);
    setNewGroupNameInput('');

    if (typeof updateCollapsedSections === 'function') {
      updateCollapsedSections((prev) => ({ ...prev, [newSectionId]: false }));
    }

    if (isEditMode) {
      setDraftChecklists(updated);
    }
    setSelectedChecklistId(firstItemId);
    setChecklistDetailDraft('');
    setChecklistDetailBlocks([]);
    setEditingCheckId(firstItemId);
    setEditingCheckText('');
    setEditingCheckTag('');
    setCustomTagInput('');
    if (isMobile) {
      setMobileSubTab('main');
    }

    // 로컬 낙관적 업데이트
    setItems((prevItems) => prevItems.map((it) => it.id === activeItem.id ? { ...it, checklists: updated } : it));

    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding checklist section:', err);
    }
  };



  // Global Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const deleteConfirmBtnRef = useRef(null);
  const isDeletingRef = useRef(false);

  // Detail Block Move Modal State
  const [moveBlockModalState, setMoveBlockModalState] = useState({
    isOpen: false,
    sourceCheckId: null,
    block: null,
    targetCheckId: null
  });

  const openDeleteModal = (title, message, onConfirm) => {
    setDeleteModalState({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const closeDeleteModal = () => {
    setDeleteModalState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null
    });
  };

  const handleConfirmDelete = async () => {
    if (isDeletingRef.current) return;
    if (deleteModalState.onConfirm) {
      isDeletingRef.current = true;
      const confirmFn = deleteModalState.onConfirm;
      closeDeleteModal();
      try {
        await confirmFn();
      } catch (err) {
        console.error('Delete execution error:', err);
      } finally {
        isDeletingRef.current = false;
      }
    } else {
      closeDeleteModal();
    }
  };

  // 모달 오픈 시 기본 선택(삭제 버튼)에 포커스
  useEffect(() => {
    if (deleteModalState.isOpen) {
      const timer = setTimeout(() => {
        deleteConfirmBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [deleteModalState.isOpen]);

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

  // Helper to compute category full path
  const getCategoryFullPath = (cat) => {
    if (!cat) return '';
    if (cat.id === 'quick_memo') {
      const tabLabel = mainTabs.find((t) => t.id === 'explorer')?.label || 'ME';
      return `${tabLabel} > 퀵메모`;
    }
    const scope = cat.scope || activeMainTab || 'explorer';
    const tabLabel = mainTabs.find((t) => t.id === scope)?.label || scope;

    const group = cat.groupId ? categoryGroups.find((g) => g.id === cat.groupId) : null;
    const groupName = group ? group.name : null;

    const segments = [cat.name];
    let curr = cat;
    const visited = new Set([cat.id]);
    while (curr && curr.parentId) {
      const parent = categories.find((c) => c.id === curr.parentId);
      if (!parent || visited.has(parent.id)) break;
      visited.add(parent.id);
      segments.unshift(parent.name);
      curr = parent;
    }

    const parts = [tabLabel];
    if (groupName) parts.push(groupName);
    parts.push(...segments);
    return parts.join(' > ');
  };

  // Helper to compute item (memo) full path
  const getItemFullPath = (it) => {
    if (!it) return '';
    const cat = it.categoryId === 'quick_memo'
      ? { id: 'quick_memo', name: '퀵메모', scope: 'explorer' }
      : categories.find((c) => c.id === it.categoryId);
    const catPath = getCategoryFullPath(cat) || '기타';
    return `${catPath} > ${it.title || '제목 없음'}`;
  };

  // General Clipboard Copy Helper with Toast
  const copyTextToClipboard = async (text, toastMsg) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyToastText(toastMsg || '✓ 복사되었습니다.');
      if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      copyToastTimerRef.current = setTimeout(() => {
        setCopyToastText('');
      }, 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  // Handle Category Right-Click Context Menu
  const handleCategoryContextMenu = (e, cat) => {
    e.preventDefault();
    e.stopPropagation();
    const clickX = e.clientX;
    const clickY = e.clientY;
    const menuWidth = 180;
    const menuHeight = 85;
    const adjustedX = (clickX + menuWidth > window.innerWidth) ? Math.max(10, window.innerWidth - menuWidth - 10) : clickX;
    const adjustedY = (clickY + menuHeight > window.innerHeight) ? Math.max(10, window.innerHeight - menuHeight - 10) : clickY;

    setCategoryContextMenu({
      x: adjustedX,
      y: adjustedY,
      category: cat
    });
  };

  // Copy Category Hierarchical Path
  const handleCopyCategoryPath = async (cat) => {
    if (!cat) return;
    setCategoryContextMenu(null);
    const pathStr = getCategoryFullPath(cat);
    await copyTextToClipboard(pathStr, `✓ '${pathStr}' 경로가 복사되었습니다.`);
  };

  // Copy Category Deep Link Bookmark [CategoryName](URL)
  const handleCopyCategoryLink = async (cat) => {
    if (!cat) return;
    setCategoryContextMenu(null);
    const catId = cat.id;
    const catName = cat.name || (catId === 'quick_memo' ? '퀵메모' : '목록');
    const scope = cat.scope || activeMainTab || 'explorer';

    const origin = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const linkUrl = `${origin}#tab=${encodeURIComponent(scope)}&cat=${encodeURIComponent(catId)}`;
    const markdownLink = `[${catName}](${linkUrl})`;

    await copyTextToClipboard(markdownLink, `✓ '${catName}' 목록 주소가 복사되었습니다.`);
  };

  // Handle Item (Memo) Right-Click Context Menu
  const handleItemContextMenu = (e, it) => {
    e.preventDefault();
    e.stopPropagation();
    const clickX = e.clientX;
    const clickY = e.clientY;
    const menuWidth = 190;
    const menuHeight = 85;
    const adjustedX = (clickX + menuWidth > window.innerWidth) ? Math.max(10, window.innerWidth - menuWidth - 10) : clickX;
    const adjustedY = (clickY + menuHeight > window.innerHeight) ? Math.max(10, window.innerHeight - menuHeight - 10) : clickY;

    setItemContextMenu({
      x: adjustedX,
      y: adjustedY,
      item: it
    });
  };

  // Copy Item Hierarchical Path
  const handleCopyItemPath = async (it) => {
    if (!it) return;
    setItemContextMenu(null);
    const pathStr = getItemFullPath(it);
    await copyTextToClipboard(pathStr, `✓ '${pathStr}' 경로가 복사되었습니다.`);
  };

  // Copy Item Deep Link Bookmark [ItemTitle](URL)
  const handleCopyItemLink = async (it) => {
    if (!it) return;
    setItemContextMenu(null);
    const title = it.title || '메모';
    const origin = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const scope = it.scope || activeMainTab || 'explorer';
    const linkUrl = `${origin}#tab=${encodeURIComponent(scope)}&cat=${encodeURIComponent(it.categoryId || 'quick_memo')}&item=${encodeURIComponent(it.id)}`;
    const markdownLink = `[${title}](${linkUrl})`;

    await copyTextToClipboard(markdownLink, `✓ '${title}' 메모 주소가 복사되었습니다.`);
  };

  // Return to previous work location (Bookmark Back)
  const handleReturnToPreviousLocation = () => {
    if (!returnLocation) return;
    if (returnLocation.tab && returnLocation.tab !== activeMainTab) {
      setActiveMainTab(returnLocation.tab);
    }
    if (returnLocation.categoryId) {
      setSelectedCategoryId(returnLocation.categoryId);
    }
    if (returnLocation.itemId) {
      setSelectedItemId(returnLocation.itemId);
    }
    setReturnLocation(null);
  };

  // Listen to deep-link hash navigation from [title](url) clicks
  useEffect(() => {
    const handleAppNavigateHash = (e) => {
      const { url } = e.detail || {};
      if (!url) return;

      try {
        const hashIdx = url.indexOf('#');
        const hashStr = hashIdx !== -1 ? url.slice(hashIdx + 1) : url;
        const params = new URLSearchParams(hashStr);
        const targetTab = params.get('tab');
        const targetCat = params.get('cat');

        if (targetCat) {
          // Save current return location
          const currentCat = categories.find(c => c.id === selectedCategoryId);
          const currentItem = items.find(i => i.id === selectedItemId);
          const fromLabel = currentItem?.title
            ? `메모: ${currentItem.title.slice(0, 15)}`
            : (selectedCategoryId === 'quick_memo' ? '퀵메모' : (currentCat?.name || '이전 작업'));

          setReturnLocation({
            tab: activeMainTab,
            categoryId: selectedCategoryId,
            categoryName: fromLabel,
            itemId: selectedItemId
          });

          if (targetTab && targetTab !== activeMainTab) {
            setActiveMainTab(targetTab);
          }
          setSelectedCategoryId(targetCat);
          setSelectedItemId(null);

          const fullHash = `#tab=${targetTab || activeMainTab}&cat=${targetCat}`;
          if (window.location.hash !== fullHash) {
            window.history.pushState(null, '', fullHash);
          }
        }
      } catch (err) {
        console.error('Error handling deep-link navigation:', err);
      }
    };

    window.addEventListener('app-navigate-hash', handleAppNavigateHash);
    return () => {
      window.removeEventListener('app-navigate-hash', handleAppNavigateHash);
    };
  }, [activeMainTab, selectedCategoryId, selectedItemId, categories, items]);

  // Browser back/forward button support for URL hash
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined' || !window.location.hash) return;
      try {
        const hashStr = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
        const params = new URLSearchParams(hashStr);
        const targetTab = params.get('tab');
        const targetCat = params.get('cat');
        if (targetCat) {
          if (targetTab) setActiveMainTab(targetTab);
          setSelectedCategoryId(targetCat);
          setSelectedItemId(null);
        }
      } catch (e) {}
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Close category & item context menus on global click
  useEffect(() => {
    if (!categoryContextMenu && !itemContextMenu) return;
    const handleCloseContextMenu = () => {
      setCategoryContextMenu(null);
      setItemContextMenu(null);
    };
    window.addEventListener('click', handleCloseContextMenu);
    window.addEventListener('contextmenu', handleCloseContextMenu);
    return () => {
      window.removeEventListener('click', handleCloseContextMenu);
      window.removeEventListener('contextmenu', handleCloseContextMenu);
    };
  }, [categoryContextMenu, itemContextMenu]);

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

  // 1. Subscribe to Categories
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const catList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setCategories(catList);
    }, (err) => {
      console.error("Firestore categories snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 1.5. Subscribe to Category Groups
  useEffect(() => {
    const q = query(collection(db, 'categoryGroups'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setCategoryGroups(list);
    }, (err) => {
      console.error("Firestore categoryGroups snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

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

  // 2. Subscribe to Items (Default order: ascending)
  useEffect(() => {
    const q = query(collection(db, 'items'), orderBy('updatedAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setItems(itemList);
    }, (err) => {
      console.error("Firestore items snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 2.5. Subscribe to Templates in Firestore
  useEffect(() => {
    const q = query(collection(db, 'templates'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setTemplates(list);
    }, (err) => {
      console.error("Firestore templates snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 2.6. Subscribe to Templates2 in Firestore
  useEffect(() => {
    const q = query(collection(db, 'templates2'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setTemplates2(list);
    }, (err) => {
      console.error("Firestore templates2 snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

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

  // Helper to extract all text strings from any object recursively
  const extractAllStrings = (obj, acc = []) => {
    if (obj === null || obj === undefined) return acc;
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      acc.push(String(obj));
    } else if (Array.isArray(obj)) {
      obj.forEach(item => extractAllStrings(item, acc));
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(val => extractAllStrings(val, acc));
    }
    return acc;
  };

  const getMatchedSnippet = (item, searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return null;
    const q = searchQuery.trim().toLowerCase();

    const formatSnippet = (str, label) => {
      if (!str || typeof str !== 'string') return null;
      const idx = str.toLowerCase().indexOf(q);
      if (idx === -1) return null;
      const start = Math.max(0, idx - 18);
      const end = Math.min(str.length, idx + q.length + 22);
      const prefix = start > 0 ? '...' : '';
      const suffix = end < str.length ? '...' : '';
      return {
        snippetText: prefix + str.substring(start, end) + suffix,
        label
      };
    };

    // 1. Check body
    const bodySnip = formatSnippet(item.body, '본문');
    if (bodySnip) return bodySnip;

    // 2. Check subBody
    const subBodySnip = formatSnippet(item.subBody, '보충노트');
    if (subBodySnip) return subBodySnip;

    // 3. Check checklists
    if (item.checklists) {
      const listStrings = extractAllStrings(item.checklists);
      for (let s of listStrings) {
        const snip = formatSnippet(s, '체크리스트');
        if (snip) return snip;
      }
    }

    // 4. Check templateValues
    if (item.templateValues) {
      const tplStrings = extractAllStrings(item.templateValues);
      for (let s of tplStrings) {
        const snip = formatSnippet(s, '템플릿');
        if (snip) return snip;
      }
    }

    return null;
  };

  const checkItemMatches = (item, searchLower) => {
    if (!searchLower) return false;

    // 1. Check title
    if ((item.title || '').toLowerCase().includes(searchLower)) return true;

    // 2. Check body (상세내용)
    if ((item.body || '').toLowerCase().includes(searchLower)) return true;

    // 3. Check subBody (보충노트 / 체크리스트 텍스트)
    if ((item.subBody || '').toLowerCase().includes(searchLower)) return true;

    // 4. Check checklists array (재귀 텍스트 추출)
    if (item.checklists) {
      const checklistTexts = extractAllStrings(item.checklists).join(' ').toLowerCase();
      if (checklistTexts.includes(searchLower)) return true;
    }

    // 5. Check templateValues (템플릿 필드 입력값 재귀 텍스트 추출)
    if (item.templateValues) {
      const templateTexts = extractAllStrings(item.templateValues).join(' ').toLowerCase();
      if (templateTexts.includes(searchLower)) return true;
    }

    return false;
  };

  const getItemMatchBadges = (item, searchLower) => {
    const badges = [];
    if (!searchLower) return badges;

    // Title match
    if ((item.title || '').toLowerCase().includes(searchLower)) {
      badges.push({ label: '제목', bg: '#FEF3C7', color: '#B45309' });
    }

    // Body match
    if ((item.body || '').toLowerCase().includes(searchLower)) {
      badges.push({ label: '본문', bg: '#E0F2FE', color: '#0369A1' });
    }

    // Checklist / SubBody match
    const subBodyMatch = (item.subBody || '').toLowerCase().includes(searchLower);
    const checklistMatch = item.checklists && extractAllStrings(item.checklists).join(' ').toLowerCase().includes(searchLower);
    if (subBodyMatch || checklistMatch) {
      badges.push({ label: '체크리스트', bg: '#DCFCE7', color: '#15803D' });
    }

    // TemplateValues match
    const templateMatch = item.templateValues && extractAllStrings(item.templateValues).join(' ').toLowerCase().includes(searchLower);
    if (templateMatch) {
      badges.push({ label: '템플릿', bg: '#F3E8FF', color: '#7E22CE' });
    }

    return badges;
  };

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

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === activeItem.id
          ? { ...item, templateValues: updatedTemplateValues }
          : item
      )
    );

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
    recordWorkLocation();
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
    recordWorkLocation();
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
    if (isEditMode) {
      setDraftChecklists(updated);
    }
    setItems((prevItems) => prevItems.map((it) => it.id === activeItem.id ? { ...it, checklists: updated } : it));
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
    recordWorkLocation();
    const newSection = {
      id: 'sec_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      isSection: true,
      type: 'section',
      text: newChecklistText.trim()
    };
    const updated = [...baseChecklists, newSection];
    setNewChecklistText('');
    if (isEditMode) {
      setDraftChecklists(updated);
    }
    setItems((prevItems) => prevItems.map((it) => it.id === activeItem.id ? { ...it, checklists: updated } : it));
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
    recordWorkLocation();
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

    if (isEditMode) {
      setDraftChecklists(updated);
    }
    setSelectedChecklistId(newItem.id);
    setChecklistDetailDraft('');
    setChecklistDetailBlocks([]);
    setEditingCheckId(newItem.id);
    setEditingCheckText('');
    setEditingCheckTag('');
    setCustomTagInput('');

    setItems((prevItems) => prevItems.map((it) => it.id === activeItem.id ? { ...it, checklists: updated } : it));

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
    recordWorkLocation();
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

    if (isEditMode) {
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
        if (oldText && newText && oldText !== newText) {
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

  const toggleSectionCollapse = (sectionId) => {
    updateCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const hasChecklistSections = React.useMemo(() => {
    return checklistGroups.some((g) => g.section?.id);
  }, [checklistGroups]);

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

  const handleMoveGroup = async (sectionId, direction) => {
    setOpenGroupMenuId(null);
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

    if (isEditMode) {
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

    if (isEditMode) {
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

    if (isEditMode) {
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
      if (oldText && newText && oldText !== newText) {
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

  const handleSaveChecklistDetail = async (checkId, blocksToSave) => {
    recordWorkLocation();
    const targetBlocks = blocksToSave !== undefined ? blocksToSave : checklistDetailBlocks;
    const plainText = blocksToPlainText(targetBlocks);
    if (checkId === '__main__') {
      try {
        await updateDoc(doc(db, 'items', activeItem.id), {
          body: plainText,
          detailBlocks: targetBlocks,
          updatedAt: serverTimestamp()
        });
        setChecklistDetailDraft(plainText);
        setChecklistDetailBlocks(targetBlocks);
        setIsEditingChecklistDetail(false);
        setIsEditMode(false);
        setShowSavedToast(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setShowSavedToast(false), 1800);
      } catch (err) {
        console.error('Error saving main body:', err);
      }
      return;
    }
    const updated = baseChecklists.map((c) =>
      c.id === checkId ? { ...c, detail: plainText, detailBlocks: targetBlocks } : c
    );
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
      setChecklistDetailDraft(plainText);
      setChecklistDetailBlocks(targetBlocks);
      setIsEditingChecklistDetail(false);
      setIsEditMode(false);
      setShowSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowSavedToast(false), 1800);
    } catch (err) {
      console.error('Error saving checklist detail:', err);
    }
  };

  const handleAddNewTextBlock = () => {
    if (!selectedChecklistId) return;
    recordWorkLocation();
    const newBlockId = `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newBlock = {
      id: newBlockId,
      type: 'text',
      title: '',
      content: ''
    };
    const updated = [...checklistDetailBlocks, newBlock];
    setChecklistDetailBlocks(updated);
    setEditingBlockId(newBlockId);
  };

  const handleAddNewChecklistBlock = () => {
    if (!selectedChecklistId) return;
    recordWorkLocation();
    const newBlockId = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newBlock = {
      id: newBlockId,
      type: 'checklist',
      title: '체크리스트',
      items: [
        {
          id: `item_${Date.now()}_0`,
          text: '',
          completed: false
        }
      ]
    };
    const updated = [...checklistDetailBlocks, newBlock];
    setChecklistDetailBlocks(updated);
    handleSaveChecklistDetail(selectedChecklistId, updated);
  };

  // Detail Block 통합 텍스트 복사 핸들러 (그룹 헤더 3점 메뉴용)
  const handleCopyBlockAsPlainText = async (block) => {
    if (!block) return;
    const title = block.title && block.title.trim() ? block.title.trim() : '';
    const parts = [];

    if (block.type === 'checklist') {
      const validItems = (block.items || []).filter((it) => it && typeof it.text === 'string' && it.text.trim());
      if (title && title !== '체크리스트') {
        parts.push(`[${title}]`);
      }
      validItems.forEach((it) => {
        parts.push(`• ${it.text.trim()}`);
      });
    } else {
      if (title) parts.push(`[${title}]`);
      if (block.content && block.content.trim()) parts.push(block.content.trim());
    }

    const textToCopy = parts.join('\n');
    if (!textToCopy.trim()) {
      setCopyToastText('복사할 내용이 없습니다.');
      if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      copyToastTimerRef.current = setTimeout(() => setCopyToastText(''), 1800);
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      const displayTitle = title || (block.type === 'checklist' ? '체크리스트' : '블록');
      setCopyToastText(`✓ '${displayTitle}' 내용이 통합 복사되었습니다.`);
      if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      copyToastTimerRef.current = setTimeout(() => setCopyToastText(''), 2000);
    } catch (err) {
      console.error('통합 복사 실패:', err);
      setCopyToastText('복사에 실패했습니다.');
      if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      copyToastTimerRef.current = setTimeout(() => setCopyToastText(''), 2000);
    }
  };

  // Detail Blocks Clipboard Handlers
  const handleCopyBlockToClipboard = (block) => {
    if (!block) return;
    const title = block.title && block.title.trim()
      ? block.title.trim()
      : (block.type === 'checklist' ? '체크리스트' : '텍스트 박스');
    const payload = {
      type: 'block',
      data: {
        type: block.type,
        title: block.title || '',
        content: block.content || '',
        items: Array.isArray(block.items) ? block.items.map((it) => ({ ...it })) : []
      },
      title,
      copiedAt: Date.now()
    };
    setDetailClipboard(payload);
    try {
      localStorage.setItem('insite_memo_detail_clipboard', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save detail clipboard to localStorage:', e);
    }
    setCopyToastText(`✓ '${title}' 블록이 복사되었습니다. 다른 항목이나 탭에서 붙여넣기 하세요.`);
    if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    copyToastTimerRef.current = setTimeout(() => setCopyToastText(''), 2500);
  };

  const handleCopyItemToClipboard = (item) => {
    if (!item) return;
    const rawText = (item.text || '').trim();
    const preview = rawText.length > 20 ? rawText.slice(0, 20) + '...' : (rawText || '체크 항목');
    const payload = {
      type: 'item',
      data: {
        text: item.text || '',
        completed: Boolean(item.completed)
      },
      title: preview,
      copiedAt: Date.now()
    };
    setDetailClipboard(payload);
    try {
      localStorage.setItem('insite_memo_detail_clipboard', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save detail clipboard to localStorage:', e);
    }
    setCopyToastText(`✓ '${preview}' 항목이 복사되었습니다.`);
    if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    copyToastTimerRef.current = setTimeout(() => setCopyToastText(''), 2500);
  };

  const handleClearDetailClipboard = () => {
    setDetailClipboard(null);
    try {
      localStorage.removeItem('insite_memo_detail_clipboard');
    } catch (e) {
      // ignore
    }
  };

  const handlePasteBlockFromClipboard = () => {
    if (!detailClipboard || detailClipboard.type !== 'block' || !selectedChecklistId) return;
    recordWorkLocation();
    const source = detailClipboard.data;
    const isChk = source.type === 'checklist';
    const newBlockId = isChk
      ? `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      : `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newBlock = {
      id: newBlockId,
      type: source.type || 'text',
      title: source.title || '',
      content: source.content || '',
      ...(isChk ? {
        items: Array.isArray(source.items) && source.items.length > 0
          ? source.items.map((it, idx) => ({
              id: `item_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
              text: it.text || '',
              completed: Boolean(it.completed)
            }))
          : [{ id: `item_${Date.now()}_0`, text: '', completed: false }]
      } : {})
    };

    const updated = [...checklistDetailBlocks, newBlock];
    setChecklistDetailBlocks(updated);
    handleSaveChecklistDetail(selectedChecklistId, updated);
    setCopyToastText(`✓ '${detailClipboard.title}' 블록을 붙여넣었습니다.`);
    if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    copyToastTimerRef.current = setTimeout(() => setCopyToastText(''), 2200);
  };

  const handlePasteItemFromClipboard = (targetBlockId) => {
    if (!detailClipboard || detailClipboard.type !== 'item' || !selectedChecklistId) return;
    recordWorkLocation();
    const sourceItem = detailClipboard.data;
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: sourceItem.text || '',
      completed: Boolean(sourceItem.completed)
    };

    let updated = [];
    if (targetBlockId) {
      // 특정 체크리스트 블록에 붙여넣기
      updated = checklistDetailBlocks.map((b) => {
        if (b.id !== targetBlockId) return b;
        const currentItems = Array.isArray(b.items) ? [...b.items] : [];
        return { ...b, items: [...currentItems, newItem] };
      });
    } else {
      // 상단 툴바 등에서 붙여넣기 시:
      // 기존 체크리스트 블록이 있으면 마지막 체크리스트 블록에 추가, 없으면 새 체크리스트 블록 생성 후 추가
      const lastChkIdx = checklistDetailBlocks.map(b => b.type).lastIndexOf('checklist');
      if (lastChkIdx !== -1) {
        updated = checklistDetailBlocks.map((b, idx) => {
          if (idx !== lastChkIdx) return b;
          const currentItems = Array.isArray(b.items) ? [...b.items] : [];
          return { ...b, items: [...currentItems, newItem] };
        });
      } else {
        const newBlock = {
          id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'checklist',
          title: '체크리스트',
          items: [newItem]
        };
        updated = [...checklistDetailBlocks, newBlock];
      }
    }

    setChecklistDetailBlocks(updated);
    handleSaveChecklistDetail(selectedChecklistId, updated);
    setCopyToastText(`✓ '${detailClipboard.title}' 항목을 붙여넣었습니다.`);
    if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    copyToastTimerRef.current = setTimeout(() => setCopyToastText(''), 2200);
  };

  const handleOpenMoveBlockModal = (block) => {
    if (!activeItem || !block) return;
    const currentId = selectedChecklistId || '__main__';
    const candidates = rawChecklists.filter((c) => !c.isSection && c.id !== currentId);
    const defaultTarget = candidates.length > 0 ? candidates[0].id : null;

    setMoveBlockModalState({
      isOpen: true,
      sourceCheckId: currentId,
      block,
      targetCheckId: defaultTarget
    });
  };

  const handleCloseMoveBlockModal = () => {
    setMoveBlockModalState({
      isOpen: false,
      sourceCheckId: null,
      block: null,
      targetCheckId: null
    });
  };

  const handleExecuteMoveBlock = async () => {
    const { sourceCheckId, targetCheckId, block } = moveBlockModalState;
    if (!activeItem || !block || !targetCheckId || sourceCheckId === targetCheckId) {
      handleCloseMoveBlockModal();
      return;
    }

    try {
      // 1. 출처 블록 가져오기 (현재 화면에서 보고 있는 경우 checklistDetailBlocks가 최신일 수 있음)
      let sourceBlocks = [];
      if (sourceCheckId === selectedChecklistId) {
        sourceBlocks = [...checklistDetailBlocks];
      } else if (sourceCheckId === '__main__') {
        sourceBlocks = parseDetailBlocks(activeItem.body || '', activeItem.detailBlocks);
      } else {
        const srcItem = baseChecklists.find((c) => c.id === sourceCheckId);
        sourceBlocks = parseDetailBlocks(srcItem?.detail || '', srcItem?.detailBlocks);
      }

      // 2. 대상 블록 가져오기
      let targetBlocks = [];
      if (targetCheckId === selectedChecklistId) {
        targetBlocks = [...checklistDetailBlocks];
      } else if (targetCheckId === '__main__') {
        targetBlocks = parseDetailBlocks(activeItem.body || '', activeItem.detailBlocks);
      } else {
        const tgtItem = baseChecklists.find((c) => c.id === targetCheckId);
        targetBlocks = parseDetailBlocks(tgtItem?.detail || '', tgtItem?.detailBlocks);
      }

      // 3. 출처에서 블록 제거
      const updatedSourceBlocks = sourceBlocks.filter((b) => b.id !== block.id);
      const finalSourceBlocks = updatedSourceBlocks.length > 0 ? updatedSourceBlocks : [
        {
          id: `chk_init_${Date.now()}`,
          type: 'checklist',
          title: '체크리스트',
          items: [
            {
              id: `item_${Date.now()}_0`,
              text: '',
              completed: false
            }
          ]
        }
      ];

      // 4. 대상에 블록 추가
      const isTargetEmpty = targetBlocks.length === 1 && (
        (targetBlocks[0].type === 'text' && !targetBlocks[0].title?.trim() && !targetBlocks[0].content?.trim()) ||
        (targetBlocks[0].type === 'checklist' &&
          (!targetBlocks[0].title || targetBlocks[0].title === '체크리스트') &&
          (!targetBlocks[0].items || targetBlocks[0].items.length === 0 || (targetBlocks[0].items.length === 1 && !targetBlocks[0].items[0].text?.trim())))
      );

      const finalTargetBlocks = isTargetEmpty ? [block] : [...targetBlocks, block];

      const sourcePlainText = blocksToPlainText(finalSourceBlocks);
      const targetPlainText = blocksToPlainText(finalTargetBlocks);

      // 5. Firestore 업데이트 페이로드 구성
      const updatePayload = {
        updatedAt: serverTimestamp()
      };

      if (sourceCheckId === '__main__') {
        updatePayload.body = sourcePlainText;
        updatePayload.detailBlocks = finalSourceBlocks;
      }
      if (targetCheckId === '__main__') {
        updatePayload.body = targetPlainText;
        updatePayload.detailBlocks = finalTargetBlocks;
      }

      const updatedChecklists = baseChecklists.map((c) => {
        if (c.id === sourceCheckId) {
          return { ...c, detail: sourcePlainText, detailBlocks: finalSourceBlocks };
        }
        if (c.id === targetCheckId) {
          return { ...c, detail: targetPlainText, detailBlocks: finalTargetBlocks };
        }
        return c;
      });
      updatePayload.checklists = updatedChecklists;

      await updateDoc(doc(db, 'items', activeItem.id), updatePayload);

      // 6. 상태 동기화
      if (selectedChecklistId === sourceCheckId) {
        setChecklistDetailBlocks(finalSourceBlocks);
        setChecklistDetailDraft(sourcePlainText);
      } else if (selectedChecklistId === targetCheckId) {
        setChecklistDetailBlocks(finalTargetBlocks);
        setChecklistDetailDraft(targetPlainText);
      }

      setShowSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowSavedToast(false), 1800);

      handleCloseMoveBlockModal();
    } catch (err) {
      console.error('Error moving detail block:', err);
      alert('블록 소속 이동 중 오류가 발생했습니다: ' + err.message);
    }
  };

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

  useEffect(() => {
    if (!openChecklistMenuId && !openCatMenuId && !openCategoryGroupMenuId && !openItemGroupMenuId && !openNoteMenuId) return;
    const handleCloseMenu = () => {
      setOpenChecklistMenuId(null);
      setOpenCatMenuId(null);
      setOpenCategoryGroupMenuId(null);
      setOpenItemGroupMenuId(null);
      setOpenNoteMenuId(null);
    };
    window.addEventListener('resize', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    return () => {
      window.removeEventListener('resize', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
    };
  }, [openChecklistMenuId, openCatMenuId, openCategoryGroupMenuId, openItemGroupMenuId, openNoteMenuId]);

  // ---------------- Category Group Handlers ----------------
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
    if (!canMoveCategory(catId, targetParentId)) return;
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
    const allTargetCatIds = getCategoryDescendantIds(cat.id);
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
      const allTargetCatIds = getCategoryDescendantIds(catId);
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

      setDeletingCategoryId(null);
      if (allTargetCatIds.includes(selectedCategoryId)) {
        setSelectedCategoryId(getDefaultCategoryIdForTab(activeMainTab, categories));
      }
    } catch (err) {
      console.error('Error deleting category tree and safely moving items to trash:', err);
    }
  };

  // ---------------- Global Work History Tracker (실제 작업 위치 추적) ----------------
  const recordWorkLocation = (overrideLoc = null) => {
    const tab = overrideLoc?.tab || activeMainTab;
    const catId = overrideLoc?.catId || selectedCategoryId;
    const itemId = overrideLoc?.itemId || selectedItemId;
    const targetItem = items.find(i => i.id === itemId) || activeItem;
    const itemTitle = overrideLoc?.itemTitle || targetItem?.title || (catId === 'quick_memo' ? '퀵메모' : '작업 메모');
    const mobView = isMobile ? (overrideLoc?.mobileView || mobileView || 'detail') : null;

    if (!catId && !itemId) return;

    const newLoc = {
      tab,
      catId,
      itemId,
      itemTitle,
      mobileView: mobView,
      timestamp: Date.now()
    };

    setNavHistory((prevStack) => {
      if (prevStack.length > 0) {
        const last = prevStack[prevStack.length - 1];
        if (last.tab === newLoc.tab && last.catId === newLoc.catId && last.itemId === newLoc.itemId) {
          const updated = [...prevStack];
          updated[updated.length - 1] = newLoc;
          return updated;
        }
      }
      const nextStack = [...prevStack, newLoc];
      return nextStack.length > 30 ? nextStack.slice(nextStack.length - 30) : nextStack;
    });
  };

  const previousWorkTarget = React.useMemo(() => {
    if (navHistory.length === 0) return null;
    const last = navHistory[navHistory.length - 1];
    const isCurrent =
      last.tab === activeMainTab &&
      last.catId === selectedCategoryId &&
      last.itemId === selectedItemId;

    if (isCurrent) {
      return navHistory.length > 1 ? navHistory[navHistory.length - 2] : null;
    }
    return last;
  }, [navHistory, activeMainTab, selectedCategoryId, selectedItemId]);

  const handleReturnPrevious = () => {
    if (!previousWorkTarget) return;

    setNavHistory((prevStack) => {
      if (prevStack.length === 0) return prevStack;

      let nextStack = [...prevStack];
      let targetLoc = nextStack[nextStack.length - 1];

      const isCurrent =
        targetLoc.tab === activeMainTab &&
        targetLoc.catId === selectedCategoryId &&
        targetLoc.itemId === selectedItemId;

      if (isCurrent) {
        nextStack.pop(); // 현재 작업 위치 제거
        if (nextStack.length === 0) return [];
        targetLoc = nextStack[nextStack.length - 1];
      }

      nextStack.pop(); // 복귀할 대상 위치 제거

      isNavigatingBackRef.current = true;
      if (targetLoc.tab && targetLoc.tab !== activeMainTab) {
        setActiveMainTab(targetLoc.tab);
      }
      if (targetLoc.catId) {
        setSelectedCategoryId(targetLoc.catId);
      }
      setSelectedItemId(targetLoc.itemId || null);

      if (isMobile) {
        if (targetLoc.mobileView) {
          setMobileView(targetLoc.mobileView);
        } else if (targetLoc.itemId) {
          setMobileView('detail');
        } else {
          setMobileView('items');
        }
      }

      return nextStack;
    });
  };

  // ---------------- Global Quick Memo (Modal & Append to Today's Daily Note) ----------------
  const handleNavigateToQuickMemo = () => {
    if (activeMainTab !== 'explorer') {
      setActiveMainTab('explorer');
    }
    navigateToItems(QUICK_MEMO_CATEGORY.id);
  };

  const handleOpenQuickMemo = () => {
    setQuickMemoText('');
    setIsQuickMemoOpen(true);
    setTimeout(() => {
      if (quickMemoTextareaRef.current) {
        quickMemoTextareaRef.current.focus();
      }
    }, 60);
  };

  const handleCloseQuickMemo = () => {
    setIsQuickMemoOpen(false);
    setQuickMemoText('');
  };

  const handleSaveQuickMemo = async () => {
    const text = quickMemoText.trim();
    if (!text || isSavingQuickMemo) return;

    setIsSavingQuickMemo(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      // 2줄 요약 (체크리스트 표시용)
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const summaryLines = lines.slice(0, 2).join(' ');
      const summaryText = summaryLines.length > 70 ? `${summaryLines.slice(0, 70)}...` : summaryLines;
      const checkItemTitle = `[${timeStr}] ${summaryText}`;

      // 세부 원문
      const fullMemoBody = text;

      const newChecklistId = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newChecklistItem = {
        id: newChecklistId,
        text: checkItemTitle,
        completed: false,
        detail: fullMemoBody,
        detailBlocks: [
          {
            id: `b_${Date.now()}`,
            type: 'text',
            title: '',
            content: fullMemoBody
          }
        ],
        createdAt: Date.now()
      };

      // 오늘 날짜 퀵메모 노트 찾기
      const existingTodayNote = items.find(
        (item) => item.categoryId === 'quick_memo' && item.title === todayStr && !item.isDeleted
      );

      if (existingTodayNote) {
        // 기존 노트의 체크리스트 맨 아래에 추가(Append)
        const updatedChecklists = [...(existingTodayNote.checklists || []), newChecklistItem];
        await updateDoc(doc(db, 'items', existingTodayNote.id), {
          checklists: updatedChecklists,
          updatedAt: serverTimestamp()
        });
        recordWorkLocation({
          tab: 'explorer',
          catId: 'quick_memo',
          itemId: existingTodayNote.id,
          itemTitle: `퀵메모 (${todayStr})`
        });
      } else {
        // 오늘 첫 퀵메모 노트 신규 생성
        const newRef = doc(collection(db, 'items'));
        await setDoc(newRef, {
          categoryId: 'quick_memo',
          title: todayStr,
          scope: 'explorer',
          body: '',
          subBody: '',
          checklists: [newChecklistItem],
          detailBlocks: [],
          order: -Date.now(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        recordWorkLocation({
          tab: 'explorer',
          catId: 'quick_memo',
          itemId: newRef.id,
          itemTitle: `퀵메모 (${todayStr})`
        });
      }

      setIsQuickMemoOpen(false);
      setQuickMemoText('');
      setQuickMemoToast(true);
      if (quickMemoToastTimerRef.current) clearTimeout(quickMemoToastTimerRef.current);
      quickMemoToastTimerRef.current = setTimeout(() => setQuickMemoToast(false), 2200);
    } catch (err) {
      console.error('Error saving quick memo:', err);
      alert('퀵메모 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingQuickMemo(false);
    }
  };

  // Alt + Q Global Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + Q (또는 한글 ㅂ 자판)
      if (e.altKey && (e.key === 'q' || e.key === 'Q' || e.key === 'ㅂ' || e.code === 'KeyQ')) {
        e.preventDefault();
        handleOpenQuickMemo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMainTab, activeCategory, activeItem]);

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
      autoEditItemIdRef.current = newRef.id;
      shouldFocusTitleRef.current = true;
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
      if (oldTitle && trimmed && oldTitle !== trimmed) {
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

  // Helper to construct combined body text from template fields
  const buildTemplateCombinedBody = (tplId, tplVals) => {
    if (!tplId) return draftBody;
    const targetTpl = templates.find(t => t.id === tplId);
    if (!targetTpl || !targetTpl.fields) return draftBody;

    return targetTpl.fields.map((f) => {
      const val = tplVals[f.id];
      if (f.type === 'checklist') {
        const listItems = Array.isArray(val) ? val : (f.defaultItems || []).map(t => ({ text: t, completed: false }));
        const listText = listItems.map(it => `- [${it.completed ? 'v' : ' '}] ${it.text}`).join('\n');
        return `[${f.label}]\n${listText}`;
      } else {
        return `[${f.label}]\n${val || ''}`;
      }
    }).join('\n\n');
  };

  // ---------------- Template Tab Dedicated Canvas Handlers ----------------
  const handleSelectTemplateInTab = (tpl) => {
    setSelectedTemplateIdInTab(tpl.id);
    setTplDraftTitle(tpl.title || '');
    setTplDraftFields(tpl.fields ? JSON.parse(JSON.stringify(tpl.fields)) : []);
    setTplDraftChecklists(tpl.checklists ? JSON.parse(JSON.stringify(tpl.checklists)) : []);
  };

  const handleCreateNewTemplateInTab = () => {
    setSelectedTemplateIdInTab('NEW');
    setTplDraftTitle('');
    setTplDraftFields([
      { id: `field_${Date.now()}_1`, type: 'text', label: '항목 1', placeholder: '내용을 입력하세요' }
    ]);
    setTplDraftChecklists([]);
    setTplEditorSection('fields');
  };

  const handleAddTplFieldInCanvas = (type, targetGroupTitle = '') => {
    const newId = `field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let defaultLabel = '새 항목';
    let defaultPlaceholder = '';
    let extraProps = {};

    if (type === 'text') {
      defaultLabel = '텍스트 항목';
      defaultPlaceholder = '내용을 입력하세요';
    } else if (type === 'phone') {
      defaultLabel = '전화번호';
      defaultPlaceholder = '010-0000-0000';
    } else if (type === 'datetime') {
      defaultLabel = '날짜 및 시간';
      defaultPlaceholder = '';
    } else if (type === 'checklist') {
      defaultLabel = '체크리스트';
      extraProps = { defaultItems: ['항목 1', '항목 2'] };
    }

    setTplDraftFields((prev) => [
      ...prev,
      { id: newId, type, label: defaultLabel, placeholder: defaultPlaceholder, groupTitle: targetGroupTitle, ...extraProps }
    ]);
  };

  const handleRemoveTplFieldInCanvas = (index) => {
    setTplDraftFields((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleMoveTplFieldInCanvas = (index, direction) => {
    setTplDraftFields((prev) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      const target = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = target;
      return updated;
    });
  };

  // Block Move Handlers (Whole Groups & Standalone Items)
  const handleMoveBlockInCanvas = (blockIdx, direction) => {
    const blocks = getCanvasBlocks(tplDraftFields);
    const newIdx = blockIdx + direction;
    if (newIdx < 0 || newIdx >= blocks.length) return;

    const [moved] = blocks.splice(blockIdx, 1);
    blocks.splice(newIdx, 0, moved);

    const flattened = [];
    blocks.forEach((blk) => {
      blk.fields.forEach((f) => {
        const { originalIdx, ...rest } = f;
        flattened.push(rest);
      });
    });
    setTplDraftFields(flattened);
  };

  const handleMoveFieldWithinGroup = (groupTitle, fromIdxInGroup, direction) => {
    const toIdxInGroup = fromIdxInGroup + direction;
    setTplDraftFields((prev) => {
      const groupIndices = [];
      prev.forEach((f, idx) => {
        if ((f.groupTitle || '') === (groupTitle || '')) {
          groupIndices.push(idx);
        }
      });

      if (toIdxInGroup < 0 || toIdxInGroup >= groupIndices.length) return prev;

      const actualFrom = groupIndices[fromIdxInGroup];
      const actualTo = groupIndices[toIdxInGroup];

      const updated = [...prev];
      const [moved] = updated.splice(actualFrom, 1);
      updated.splice(actualTo, 0, moved);
      return updated;
    });
  };

  // HTML5 Drag and Drop Handlers for Canvas Blocks (Groups & Standalone)
  const handleBlockDragStart = (e, blockIdx) => {
    e.stopPropagation();
    setDraggedBlockIndex(blockIdx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `block_${blockIdx}`);
  };

  const handleBlockDragOver = (e, blockIdx) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedBlockIndex !== null && dragOverBlockIndex !== blockIdx) {
      setDragOverBlockIndex(blockIdx);
    }
  };

  const handleBlockDrop = (e, targetBlockIdx) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedBlockIndex === null || draggedBlockIndex === targetBlockIdx) {
      setDraggedBlockIndex(null);
      setDragOverBlockIndex(null);
      return;
    }

    const blocks = getCanvasBlocks(tplDraftFields);
    const [movedBlock] = blocks.splice(draggedBlockIndex, 1);
    blocks.splice(targetBlockIdx, 0, movedBlock);

    const flattened = [];
    blocks.forEach((blk) => {
      blk.fields.forEach((f) => {
        const { originalIdx, ...rest } = f;
        flattened.push(rest);
      });
    });

    setTplDraftFields(flattened);
    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  // HTML5 Drag and Drop Handlers for Intra-Group Field Reordering
  const handleIntraGroupDragStart = (e, groupTitle, indexInGroup) => {
    e.stopPropagation();
    setDraggedFieldItem({ groupTitle, indexInGroup });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `item_${groupTitle}_${indexInGroup}`);
  };

  const handleIntraGroupDragOver = (e, groupTitle, indexInGroup) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFieldItem && draggedFieldItem.groupTitle === groupTitle) {
      e.dataTransfer.dropEffect = 'move';
      if (
        !dragOverFieldItem ||
        dragOverFieldItem.groupTitle !== groupTitle ||
        dragOverFieldItem.indexInGroup !== indexInGroup
      ) {
        setDragOverFieldItem({ groupTitle, indexInGroup });
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleIntraGroupDrop = (e, groupTitle, targetIndexInGroup) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedFieldItem || draggedFieldItem.groupTitle !== groupTitle) {
      setDraggedFieldItem(null);
      setDragOverFieldItem(null);
      return;
    }

    const fromIdxInGroup = draggedFieldItem.indexInGroup;
    if (fromIdxInGroup === targetIndexInGroup) {
      setDraggedFieldItem(null);
      setDragOverFieldItem(null);
      return;
    }

    setTplDraftFields((prev) => {
      const groupIndices = [];
      prev.forEach((f, idx) => {
        if ((f.groupTitle || '') === (groupTitle || '')) {
          groupIndices.push(idx);
        }
      });

      const actualFrom = groupIndices[fromIdxInGroup];
      const actualTo = groupIndices[targetIndexInGroup];

      if (actualFrom === undefined || actualTo === undefined) return prev;

      const updated = [...prev];
      const [movedItem] = updated.splice(actualFrom, 1);
      updated.splice(actualTo, 0, movedItem);
      return updated;
    });

    setDraggedFieldItem(null);
    setDragOverFieldItem(null);
  };

  // HTML5 Drag and Drop Handlers for Template Checklists
  const handleChecklistDragStart = (e, index) => {
    setDraggedChecklistIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleChecklistDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverChecklistIndex !== index) {
      setDragOverChecklistIndex(index);
    }
  };

  const handleChecklistDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedChecklistIndex === null || draggedChecklistIndex === targetIndex) {
      setDraggedChecklistIndex(null);
      setDragOverChecklistIndex(null);
      return;
    }

    setTplDraftChecklists((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedChecklistIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      return updated;
    });

    setDraggedChecklistIndex(null);
    setDragOverChecklistIndex(null);
  };

  // Field Grouping Handlers
  const handleToggleSelectField = (fieldId) => {
    setSelectedTplFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleGroupSelectedFields = () => {
    if (selectedTplFieldIds.length === 0) {
      alert('그룹화할 요소를 먼저 1개 이상 선택해 주세요.');
      return;
    }
    const name = prompt('그룹 이름을 입력해 주세요 (예: 기본 정보, 계약 상세):', '신규 그룹');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();

    setTplDraftFields((prev) =>
      prev.map((f) => (selectedTplFieldIds.includes(f.id) ? { ...f, groupTitle: trimmed } : f))
    );
    setSelectedTplFieldIds([]);
  };

  const handleUngroupSelectedFields = () => {
    if (selectedTplFieldIds.length === 0) return;
    setTplDraftFields((prev) =>
      prev.map((f) => (selectedTplFieldIds.includes(f.id) ? { ...f, groupTitle: '' } : f))
    );
    setSelectedTplFieldIds([]);
  };

  // Template Checklist Handlers
  const handleAddTplChecklistInCanvas = () => {
    setTplDraftChecklists((prev) => [
      ...prev,
      { id: `tplchk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, text: '' }
    ]);
  };

  const handleRemoveTplChecklistInCanvas = (index) => {
    setTplDraftChecklists((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleMoveTplChecklistInCanvas = (index, direction) => {
    setTplDraftChecklists((prev) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      const target = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = target;
      return updated;
    });
  };

  const handleUpdateTplChecklistInCanvas = (index, key, value) => {
    setTplDraftChecklists((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleSaveTemplateFromCanvas = async () => {
    if (!tplDraftTitle.trim()) {
      alert('템플릿 이름을 입력해 주세요.');
      return;
    }
    if (tplDraftFields.length === 0 && tplDraftChecklists.length === 0) {
      alert('상세내용 요소 또는 체크리스트 항목을 최소 1개 이상 등록해 주세요.');
      return;
    }

    setIsSavingTpl(true);
    try {
      const docId = (selectedTemplateIdInTab && selectedTemplateIdInTab !== 'NEW')
        ? selectedTemplateIdInTab
        : `tpl_${Date.now()}`;

      const cleanFields = tplDraftFields.map((f) => ({
        id: f.id || `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: f.type || 'text',
        label: f.label || '항목',
        placeholder: f.placeholder || '',
        defaultItems: Array.isArray(f.defaultItems) ? f.defaultItems : [],
        groupTitle: f.groupTitle || ''
      }));

      const cleanChecklists = tplDraftChecklists.map((c) => ({
        id: c.id || `tplchk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: c.text || ''
      }));

      const tplData = {
        id: docId,
        title: tplDraftTitle.trim(),
        fields: cleanFields,
        checklists: cleanChecklists,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'templates', docId), tplData);
      setSelectedTemplateIdInTab(docId);
      setShowSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowSavedToast(false), 1800);
    } catch (err) {
      console.error('템플릿 저장 오류:', err);
      alert('템플릿 저장에 실패했습니다.');
    } finally {
      setIsSavingTpl(false);
    }
  };

  const handleDeleteTemplateInTab = (id) => {
    openDeleteModal(
      '템플릿 삭제',
      '정말 이 템플릿을 삭제하시겠습니까?',
      async () => {
        try {
          await deleteDoc(doc(db, 'templates', id));
          if (selectedTemplateIdInTab === id) {
            setSelectedTemplateIdInTab(null);
            setTplDraftTitle('');
            setTplDraftFields([]);
            setTplDraftChecklists([]);
          }
        } catch (err) {
          console.error('템플릿 삭제 오류:', err);
          alert('템플릿 삭제에 실패했습니다.');
        }
      }
    );
  };

  // ==================== Template 2 Handlers ====================
  const handleCreateNewTemplate2InTab = () => {
    const initCheckId = `chk_${Date.now()}_1`;
    setSelectedTemplate2IdInTab('NEW');
    setTpl2DraftTitle('');
    setTpl2DraftChecklists([
      {
        id: initCheckId,
        text: '1. 첫 번째 체크 항목',
        completed: false,
        detailBlocks: [
          {
            id: `chk_${Date.now()}_sub`,
            type: 'checklist',
            title: '세부 체크리스트',
            items: [
              { id: `item_${Date.now()}_1`, text: '세부 항목 1', completed: false }
            ]
          }
        ]
      }
    ]);
    setSelectedTpl2ChecklistId(initCheckId);
    setNewTpl2ChecklistText('');
  };

  const handleSelectTemplate2InTab = (tpl) => {
    setSelectedTemplate2IdInTab(tpl.id);
    setTpl2DraftTitle(tpl.title || '');
    const checks = Array.isArray(tpl.checklists) ? tpl.checklists : [];
    setTpl2DraftChecklists(checks);
    setSelectedTpl2ChecklistId(checks[0]?.id || null);
    setNewTpl2ChecklistText('');
  };

  const handleAddTpl2UpperChecklist = () => {
    if (!newTpl2ChecklistText.trim()) return;
    const newId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem = {
      id: newId,
      text: newTpl2ChecklistText.trim(),
      completed: false,
      detailBlocks: [
        {
          id: `chk_${Date.now()}_sub`,
          type: 'checklist',
          title: '세부 체크리스트',
          items: [
            { id: `item_${Date.now()}_1`, text: '', completed: false }
          ]
        }
      ]
    };
    setTpl2DraftChecklists((prev) => [...prev, newItem]);
    setSelectedTpl2ChecklistId(newId);
    setNewTpl2ChecklistText('');
  };

  const handleDeleteTpl2UpperChecklist = (id) => {
    setTpl2DraftChecklists((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (selectedTpl2ChecklistId === id) {
        setSelectedTpl2ChecklistId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  const handleUpdateTpl2UpperChecklistText = (id, newText) => {
    setTpl2DraftChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text: newText } : c))
    );
  };

  const handleSaveTpl2DetailBlocks = (targetCheckId, newBlocks) => {
    setTpl2DraftChecklists((prev) =>
      prev.map((c) => (c.id === targetCheckId ? { ...c, detailBlocks: newBlocks } : c))
    );
  };

  const handleSaveTemplate2FromCanvas = async () => {
    if (!tpl2DraftTitle.trim()) {
      alert('템플릿2 이름을 입력해 주세요.');
      return;
    }
    if (tpl2DraftChecklists.length === 0) {
      alert('상위 체크리스트 항목을 최소 1개 이상 작성해 주세요.');
      return;
    }

    setIsSavingTpl2(true);
    try {
      const docId = (selectedTemplate2IdInTab && selectedTemplate2IdInTab !== 'NEW')
        ? selectedTemplate2IdInTab
        : `tpl2_${Date.now()}`;

      const tplData = {
        id: docId,
        title: tpl2DraftTitle.trim(),
        checklists: tpl2DraftChecklists,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'templates2', docId), tplData);
      setSelectedTemplate2IdInTab(docId);
      setShowSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowSavedToast(false), 1800);
    } catch (err) {
      console.error('템플릿2 저장 오류:', err);
      alert('템플릿2 저장에 실패했습니다.');
    } finally {
      setIsSavingTpl2(false);
    }
  };

  const handleDeleteTemplate2InTab = (id) => {
    openDeleteModal(
      '템플릿2 삭제',
      '정말 이 템플릿2를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.',
      async () => {
        try {
          await deleteDoc(doc(db, 'templates2', id));
          if (selectedTemplate2IdInTab === id) {
            setSelectedTemplate2IdInTab(null);
            setTpl2DraftTitle('');
            setTpl2DraftChecklists([]);
            setSelectedTpl2ChecklistId(null);
          }
        } catch (err) {
          console.error('템플릿2 삭제 오류:', err);
          alert('템플릿2 삭제에 실패했습니다.');
        }
      }
    );
  };

  const cloneTemplateData = (tpl) => {
    if (!tpl) return { checklists: [], body: '', detailBlocks: [] };

    const clonedChecklists = (tpl.checklists || []).map((chk, cIdx) => {
      const isSec = Boolean(chk.isSection || chk.type === 'section');
      const newChkId = isSec
        ? `sec_${Date.now()}_${cIdx}_${Math.random().toString(36).substring(2, 6)}`
        : `chk_${Date.now()}_${cIdx}_${Math.random().toString(36).substring(2, 6)}`;

      const clonedBlocks = (chk.detailBlocks || []).map((b, bIdx) => ({
        ...b,
        id: `b_${Date.now()}_${cIdx}_${bIdx}_${Math.random().toString(36).substring(2, 6)}`,
        items: Array.isArray(b.items)
          ? b.items.map((it, itIdx) => ({
              ...it,
              id: `it_${Date.now()}_${cIdx}_${bIdx}_${itIdx}_${Math.random().toString(36).substring(2, 6)}`,
              completed: false
            }))
          : []
      }));

      let detailText = '';
      if (clonedBlocks.length > 0) {
        detailText = blocksToPlainText(clonedBlocks);
      } else if (chk.detail) {
        detailText = chk.detail;
      }

      return {
        ...chk,
        id: newChkId,
        text: chk.text || '',
        completed: false,
        isSection: isSec,
        type: chk.type || (isSec ? 'section' : 'item'),
        tag: chk.tag || null,
        detailBlocks: clonedBlocks,
        detail: detailText
      };
    });

    const clonedMainBlocks = (tpl.detailBlocks || []).map((b, bIdx) => ({
      ...b,
      id: `mb_${Date.now()}_${bIdx}_${Math.random().toString(36).substring(2, 6)}`,
      items: Array.isArray(b.items)
        ? b.items.map((it, itIdx) => ({
            ...it,
            id: `mit_${Date.now()}_${bIdx}_${itIdx}_${Math.random().toString(36).substring(2, 6)}`,
            completed: false
          }))
        : []
    }));

    return {
      checklists: clonedChecklists,
      body: tpl.body || '',
      detailBlocks: clonedMainBlocks
    };
  };

  const handleApplyTemplate2ToItem = async (tpl2, mode = 'replace') => {
    if (!tpl2) return;
    try {
      const { checklists: clonedChecklists, body: tplBody, detailBlocks: tplBlocks } = cloneTemplateData(tpl2);

      let finalChecklists = [];
      let finalBody = isEditMode ? draftBody : (activeItem?.body || '');
      let finalDetailBlocks = Array.isArray(activeItem?.detailBlocks) ? activeItem.detailBlocks : [];

      if (mode === 'append') {
        const existing = Array.isArray(isEditMode && draftChecklists !== null ? draftChecklists : activeItem?.checklists)
          ? (isEditMode && draftChecklists !== null ? draftChecklists : (activeItem?.checklists || []))
          : [];
        finalChecklists = [...existing, ...clonedChecklists];
        if (tplBody) {
          finalBody = finalBody ? `${finalBody}\n\n${tplBody}` : tplBody;
        }
        if (tplBlocks.length > 0) {
          finalDetailBlocks = [...finalDetailBlocks, ...tplBlocks];
        }
      } else {
        finalChecklists = clonedChecklists;
        if (tplBody) finalBody = tplBody;
        if (tplBlocks.length > 0) finalDetailBlocks = tplBlocks;
      }

      // 1. 현재 편집 모드(isEditMode)일 경우 draft 상태 즉시 갱신
      if (isEditMode) {
        setDraftChecklists(finalChecklists);
        setDraftBody(finalBody);
        if (finalDetailBlocks.length > 0) {
          setChecklistDetailBlocks(finalDetailBlocks);
        }
      }

      // 2. 만약 activeItem이 존재한다면 Firestore DB 및 items 상태도 업데이트
      if (activeItem && activeItem.id) {
        const updatePayload = {
          checklists: finalChecklists,
          updatedAt: new Date().toISOString()
        };
        if (tplBody || mode === 'replace') {
          updatePayload.body = finalBody;
        }
        if (finalDetailBlocks.length > 0 || mode === 'replace') {
          updatePayload.detailBlocks = finalDetailBlocks;
        }

        await updateDoc(doc(db, 'items', activeItem.id), updatePayload);

        setItems((prev) =>
          prev.map((item) =>
            item.id === activeItem.id ? { ...item, ...updatePayload } : item
          )
        );
      }

      // 3. 네비게이션 포커스 설정
      if (finalChecklists.length > 0) {
        const targetIndex = (mode === 'append' && activeItem?.checklists?.length)
          ? activeItem.checklists.length
          : 0;
        const firstTarget = finalChecklists[targetIndex] || finalChecklists[0];
        setSelectedChecklistId(firstTarget?.id || '__main__');
        if (firstTarget && Array.isArray(firstTarget.detailBlocks) && firstTarget.detailBlocks.length > 0) {
          setChecklistDetailBlocks(firstTarget.detailBlocks);
        } else {
          setChecklistDetailBlocks([]);
        }
      }

      setShowTemplate2Modal(false);
      setShowSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowSavedToast(false), 1800);
    } catch (err) {
      console.error('템플릿 적용 오류:', err);
      alert('템플릿을 적용하지 못했습니다.');
    }
  };


  const handleSaveDetail = async () => {
    if (!selectedItemId) return;
    recordWorkLocation();
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
      if (oldTitle && finalTitle && oldTitle !== finalTitle) {
        syncCalendarEventTitle({
          itemId: selectedItemId,
          checklistId: null,
          oldText: oldTitle,
          newText: finalTitle
        });
      }

      // 체크리스트 변경 시 연동된 캘린더 일정명 동기화
      if (draftChecklists !== null && Array.isArray(activeItem?.checklists)) {
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

      if (draftCategoryId !== selectedCategoryId) {
        setSelectedCategoryId(draftCategoryId);
      }
      setIsEditMode(false);
      setIsEditingChecklistDetail(false);
      setShowSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setShowSavedToast(false);
      }, 1800);
    } catch (err) {
      console.error('Error saving detail:', err);
    }
  };

  const handleCancelDetailEdit = () => {
    if (activeItem) {
      setDraftTitle(activeItem.title || '');
      setDraftBody(activeItem.body || '');
      setDraftSubBody(activeItem.subBody || '');
      setDraftCategoryId(activeItem.categoryId || getDefaultCategoryIdForTab(activeMainTab, categories));
      setDraftTemplateId(activeItem.templateId || null);
      setDraftTemplateValues(activeItem.templateValues || {});
      setDraftChecklists(null);
      const initialText = activeItem.body || '';
      const initialBlocks = activeItem.detailBlocks;
      setChecklistDetailDraft(initialText);
      setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocks));
    }
    setIsEditMode(false);
    setIsEditingChecklistDetail(false);
  };

  const handleEnterEditMode = () => {
    if (isItemInTrash) return;
    if (activeItem) {
      setDraftTitle(activeItem.title || '');
      setDraftBody(activeItem.body || '');
      setDraftSubBody(activeItem.subBody || '');
      setDraftCategoryId(activeItem.categoryId || getDefaultCategoryIdForTab(activeMainTab, categories));
      setDraftTemplateId(activeItem.templateId || null);
      setDraftTemplateValues(activeItem.templateValues || {});
      setDraftChecklists(activeItem.checklists || []);
      const initialText = activeItem.body || '';
      const initialBlocks = activeItem.detailBlocks;
      setChecklistDetailDraft(initialText);
      setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocks));
    }
    setSelectedChecklistId('__main__');
    setIsEditMode(true);
  };

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
                  tplDraftTitle={tplDraftTitle}
                  setTplDraftTitle={setTplDraftTitle}
                  tplDraftFields={tplDraftFields}
                  setTplDraftFields={setTplDraftFields}
                  tplDraftChecklists={tplDraftChecklists}
                  setTplDraftChecklists={setTplDraftChecklists}
                  selectedTplFieldIds={selectedTplFieldIds}
                  setSelectedTplFieldIds={setSelectedTplFieldIds}
                  isSavingTpl={isSavingTpl}
                  showTplBulkChecklistInput={showTplBulkChecklistInput}
                  setShowTplBulkChecklistInput={setShowTplBulkChecklistInput}
                  tplBulkChecklistText={tplBulkChecklistText}
                  setTplBulkChecklistText={setTplBulkChecklistText}
                  draggedFieldItem={draggedFieldItem}
                  setDraggedFieldItem={setDraggedFieldItem}
                  dragOverFieldItem={dragOverFieldItem}
                  setDragOverFieldItem={setDragOverFieldItem}
                  draggedBlockIndex={draggedBlockIndex}
                  setDraggedBlockIndex={setDraggedBlockIndex}
                  dragOverBlockIndex={dragOverBlockIndex}
                  setDragOverBlockIndex={setDragOverBlockIndex}
                  draggedChecklistIndex={draggedChecklistIndex}
                  setDraggedChecklistIndex={setDraggedChecklistIndex}
                  dragOverChecklistIndex={dragOverChecklistIndex}
                  setDragOverChecklistIndex={setDragOverChecklistIndex}
                  handleDeleteTemplateInTab={handleDeleteTemplateInTab}
                  handleSaveTemplateFromCanvas={handleSaveTemplateFromCanvas}
                  handleAddTplFieldInCanvas={handleAddTplFieldInCanvas}
                  handleRemoveTplFieldInCanvas={handleRemoveTplFieldInCanvas}
                  handleToggleSelectField={handleToggleSelectField}
                  handleGroupSelectedFields={handleGroupSelectedFields}
                  handleUngroupSelectedFields={handleUngroupSelectedFields}
                  handleBlockDragStart={handleBlockDragStart}
                  handleBlockDragOver={handleBlockDragOver}
                  handleBlockDrop={handleBlockDrop}
                  handleIntraGroupDragStart={handleIntraGroupDragStart}
                  handleIntraGroupDragOver={handleIntraGroupDragOver}
                  handleIntraGroupDrop={handleIntraGroupDrop}
                  handleAddTplChecklistInCanvas={handleAddTplChecklistInCanvas}
                  handleRemoveTplChecklistInCanvas={handleRemoveTplChecklistInCanvas}
                  handleUpdateTplChecklistInCanvas={handleUpdateTplChecklistInCanvas}
                  handleChecklistDragStart={handleChecklistDragStart}
                  handleChecklistDragOver={handleChecklistDragOver}
                  handleChecklistDrop={handleChecklistDrop}
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
