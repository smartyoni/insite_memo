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
  FolderPlus,
  FolderInput,
  ChevronDown,
  FileText,
  Clipboard,
  ChevronRight,
  Save,
  RotateCcw,
  ArrowLeft,
  Inbox,
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
  Search
} from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';
import { DetailBlocksManager, parseDetailBlocks, blocksToPlainText } from './DetailBlocks';

export const autoFormatPhoneNumber = (val) => {
  if (!val) return '';
  const raw = val.replace(/[^0-9]/g, '');
  if (!raw) return '';

  if (raw.startsWith('02')) {
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}-${raw.slice(2)}`;
    if (raw.length <= 9) return `${raw.slice(0, 2)}-${raw.slice(2, 5)}-${raw.slice(5)}`;
    return `${raw.slice(0, 2)}-${raw.slice(2, 6)}-${raw.slice(6, 10)}`;
  }

  if (raw.length <= 3) return raw;
  if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
  if (raw.length <= 10) return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
  return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
};

export const groupFieldsList = (fields) => {
  const groups = [];
  let curGroup = null;
  let curFields = [];

  (fields || []).forEach((f) => {
    const gTitle = f.groupTitle || '';
    if (gTitle !== curGroup) {
      if (curFields.length > 0) {
        groups.push({ title: curGroup, fields: curFields });
      }
      curGroup = gTitle;
      curFields = [f];
    } else {
      curFields.push(f);
    }
  });
  if (curFields.length > 0) {
    groups.push({ title: curGroup, fields: curFields });
  }
  return groups;
};

export const getCanvasBlocks = (fields) => {
  const blocks = [];
  let currentGroupTitle = null;
  let currentGroupFields = [];

  (fields || []).forEach((field, fieldIdx) => {
    const gTitle = field.groupTitle || '';

    // ungrouped fields: each becomes its own standalone block
    if (!gTitle) {
      // flush any open group first
      if (currentGroupFields.length > 0) {
        blocks.push({
          type: currentGroupTitle ? 'group' : 'single',
          groupTitle: currentGroupTitle,
          fields: currentGroupFields
        });
        currentGroupFields = [];
        currentGroupTitle = null;
      }
      blocks.push({
        type: 'single',
        groupTitle: '',
        fields: [{ ...field, originalIdx: fieldIdx }]
      });
      return;
    }

    if (gTitle !== currentGroupTitle) {
      if (currentGroupFields.length > 0) {
        blocks.push({
          type: 'group',
          groupTitle: currentGroupTitle,
          fields: currentGroupFields
        });
      }
      currentGroupTitle = gTitle;
      currentGroupFields = [{ ...field, originalIdx: fieldIdx }];
    } else {
      currentGroupFields.push({ ...field, originalIdx: fieldIdx });
    }
  });

  if (currentGroupFields.length > 0) {
    blocks.push({
      type: currentGroupTitle ? 'group' : 'single',
      groupTitle: currentGroupTitle,
      fields: currentGroupFields
    });
  }

  return blocks;
};

export const DEFAULT_TAGS = [
  { id: 'def_1', name: '계약서작성', bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' },
  { id: 'def_2', name: '잔금', bg: '#FEE2E2', border: '#FCA5A5', color: '#B91C1C' }
];

export const TAG_COLOR_PALETTE = [
  { bg: '#FEF3C7', border: '#FDE047', color: '#B45309', label: '주황' },
  { bg: '#DBEAFE', border: '#93C5FD', color: '#1E40AF', label: '파랑' },
  { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D', label: '초록' },
  { bg: '#F3E8FF', border: '#D8B4FE', color: '#7E22CE', label: '보라' },
  { bg: '#FEE2E2', border: '#FCA5A5', color: '#B91C1C', label: '빨강' },
  { bg: '#FFEDD5', border: '#FDBA74', color: '#C2410C', label: '다홍' },
  { bg: '#E0F2FE', border: '#7DD3FC', color: '#0369A1', label: '하늘' },
  { bg: '#FCE7F3', border: '#F472B6', color: '#BE185D', label: '분홍' },
  { bg: '#F1F5F9', border: '#CBD5E1', color: '#334155', label: '회색' }
];

export function getStoredCustomTags() {
  try {
    const saved = localStorage.getItem('insite_custom_tags');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredCustomTags(tags) {
  try {
    localStorage.setItem('insite_custom_tags', JSON.stringify(tags));
  } catch (e) {}
}

export function getTagStyle(tagName, customBadgesList = null) {
  if (!tagName) return null;
  const foundDefault = DEFAULT_TAGS.find(t => t.name === tagName);
  if (foundDefault) return foundDefault;

  const customList = customBadgesList || getStoredCustomTags();
  const foundCustom = customList.find(t => t.name === tagName);
  if (foundCustom) return foundCustom;

  // Fallback color palette by string hash
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}
// CalendarView import removed

// Fixed In-box category definitions
const INBOX_CATEGORY = { id: 'inbox', name: 'In-box', order: -99999, isFixed: true, scope: 'explorer' };
const BLOG_INBOX_CATEGORY = { id: 'blog_inbox', name: 'In-box', order: -99999, isFixed: true, scope: 'blog' };
const CLIPBOARD_INBOX_CATEGORY = { id: 'clipboard_inbox', name: 'In-box', order: -99999, isFixed: true, scope: 'clipboard' };
const BALANCE_INBOX_CATEGORY = { id: 'balance_inbox', name: 'In-box', order: -99999, isFixed: true, scope: 'balance' };
const CLIP_INBOX_CATEGORY = { id: 'clip_inbox', name: 'In-box', order: -99999, isFixed: true, scope: 'clip' };
const OFFICE_INBOX_CATEGORY = { id: 'office_inbox', name: 'In-box', order: -99999, isFixed: true, scope: 'office' };
const AD_INBOX_CATEGORY = { id: 'ad_inbox', name: 'In-box', order: -99999, isFixed: true, scope: 'ad' };

const FIXED_INBOX_IDS = ['inbox', 'blog_inbox', 'clipboard_inbox', 'balance_inbox', 'clip_inbox', 'office_inbox', 'ad_inbox'];

const getScopeForTab = (tab) => {
  if (tab === 'blog') return 'blog';
  if (tab === 'clipboard') return 'clipboard';
  if (tab === 'balance') return 'balance';
  if (tab === 'clip') return 'clip';
  if (tab === 'office') return 'office';
  if (tab === 'ad') return 'ad';
  return 'explorer';
};

const getInboxIdForTab = (tab) => {
  if (tab === 'blog') return 'blog_inbox';
  if (tab === 'clipboard') return 'clipboard_inbox';
  if (tab === 'balance') return 'balance_inbox';
  if (tab === 'clip') return 'clip_inbox';
  if (tab === 'office') return 'office_inbox';
  if (tab === 'ad') return 'ad_inbox';
  return 'inbox';
};

const getFixedCategoryForTab = (tab) => {
  if (tab === 'blog') return BLOG_INBOX_CATEGORY;
  if (tab === 'clipboard') return CLIPBOARD_INBOX_CATEGORY;
  if (tab === 'balance') return BALANCE_INBOX_CATEGORY;
  if (tab === 'clip') return CLIP_INBOX_CATEGORY;
  if (tab === 'office') return OFFICE_INBOX_CATEGORY;
  if (tab === 'ad') return AD_INBOX_CATEGORY;
  return INBOX_CATEGORY;
};

// Helper to highlight matching searchQuery in text
export function highlightText(text, searchQuery) {
  if (!text || typeof text !== 'string' || !searchQuery || !searchQuery.trim()) {
    return text;
  }
  const q = searchQuery.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const segs = text.split(new RegExp(`(${escaped})`, 'gi'));
  return segs.map((seg, idx) =>
    seg.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={`hl_${idx}`}
        style={{
          backgroundColor: '#FDE047',
          color: '#854D0E',
          padding: '0 2px',
          borderRadius: '3px',
          fontWeight: 700
        }}
      >
        {seg}
      </mark>
    ) : (
      seg
    )
  );
}

// Helper to safely extract milliseconds timestamp from item updated/created time
function getItemTimestamp(item) {
  if (!item) return 0;
  const ts = item.updatedAt || item.createdAt;
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (ts.seconds) return ts.seconds * 1000;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') return new Date(ts).getTime();
  return 0;
}

export default function NotebookExplorer() {
  // Main View Mode Tab state ('explorer' | 'clipboard' | 'balance' | 'clip' | 'calendar')
  const [activeMainTab, setActiveMainTab] = useState('explorer');

  // Data states
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('inbox');
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Item List Sort Order State (Default: 'asc' for ascending order)
  const [itemSortOrder, setItemSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [searchQuery, setSearchQuery] = useState('');

  const searchLower = searchQuery.trim().toLowerCase();
  const isSearchActive = searchLower.length > 0;

  const getCategoryPath = (categoryId) => {
    const scopeMap = {
      explorer: '노트',
      blog: '블로그',
      clipboard: '계약',
      balance: '앱개발',
      clip: '클립',
      office: '사무실',
      ad: '광고'
    };
    const foundFixed = [
      INBOX_CATEGORY, BLOG_INBOX_CATEGORY, CLIPBOARD_INBOX_CATEGORY, 
      BALANCE_INBOX_CATEGORY, CLIP_INBOX_CATEGORY, OFFICE_INBOX_CATEGORY, AD_INBOX_CATEGORY
    ].find(c => c.id === categoryId);
    if (foundFixed) {
      return `${scopeMap[foundFixed.scope] || '노트'} > In-box`;
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
    const scopeName = scopeMap[found.scope || 'explorer'] || '노트';
    return `${scopeName} > ${pathSegments.join(' > ')}`;
  };
  const getCategoryBadgeName = getCategoryPath;

  // Tree Structure & Hierarchy Helpers
  const buildCategoryTree = (catList) => {
    const sorted = [...catList].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'ko-KR', { numeric: true, sensitivity: 'base' })
    );
    const nodeMap = new Map();
    sorted.forEach(c => nodeMap.set(c.id, { ...c, children: [] }));

    const roots = [];
    sorted.forEach(c => {
      const node = nodeMap.get(c.id);
      if (c.parentId && nodeMap.has(c.parentId) && c.parentId !== c.id) {
        nodeMap.get(c.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const getHierarchicalCategoryOptions = (scope, excludeId = null) => {
    const fixed = getFixedCategoryForTab(activeMainTab);
    const scopeCategories = categories.filter(c => {
      if (FIXED_INBOX_IDS.includes(c.id)) return false;
      if (scope === 'explorer') return !c.scope || c.scope === 'explorer';
      return c.scope === scope;
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
      { id: fixed.id, name: fixed.name, displayName: `📥 ${fixed.name}`, level: 0 },
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
    if (FIXED_INBOX_IDS.includes(sourceId)) return false;
    if (targetParentId === null) return true;
    if (FIXED_INBOX_IDS.includes(targetParentId)) return false;
    if (sourceId === targetParentId) return false;
    if (isDescendant(sourceId, targetParentId)) return false;
    return true;
  };

  // Combine fixed In-box category at top, sort remaining categories in ascending order (가나다순)
  const currentFixedCategory = getFixedCategoryForTab(activeMainTab);
  const currentScope = getScopeForTab(activeMainTab);
  const filteredCategories = categories.filter((c) => {
    if (FIXED_INBOX_IDS.includes(c.id)) return false;
    if (currentScope === 'explorer') {
      return !c.scope || c.scope === 'explorer';
    }
    return c.scope === currentScope;
  });

  const allCategories = [
    currentFixedCategory,
    ...filteredCategories
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko-KR', { numeric: true, sensitivity: 'base' }))
  ];

  // Mobile responsiveness & navigation state (Threshold 860px for tablets & mobile)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 860);
  const [mobileView, setMobileView] = useState('categories'); // 'categories' | 'items' | 'detail'
  const [mobileSubTab, setMobileSubTab] = useState('main'); // 'main' (상세내용) | 'sub' (보충노트)
  const [showExitToast, setShowExitToast] = useState(false);

  const lastBackPressRef = useRef(0);
  const exitToastTimerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

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
  const [dragOverCategoryId, setDragOverCategoryId] = useState(null);
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);
  const [movingCategory, setMovingCategory] = useState(null);
  const [targetMoveParentId, setTargetMoveParentId] = useState('');

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
  const [draftCategoryId, setDraftCategoryId] = useState('inbox');
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
  const [selectedChecklistId, setSelectedChecklistId] = useState('__main__'); // '__main__' (부모 메모/템플릿) | checklistId
  const [checklistDetailDraft, setChecklistDetailDraft] = useState('');
  const [checklistDetailBlocks, setChecklistDetailBlocks] = useState([]);
  const [editingBlockId, setEditingBlockId] = useState(null);



  // Global Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const deleteConfirmBtnRef = useRef(null);
  const isDeletingRef = useRef(false);

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
    // Initial mount guard state
    if (window.history.state?.view !== 'categories') {
      window.history.pushState({ view: 'categories' }, '');
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
    if (isMobile) {
      setMobileView('items');
      window.history.pushState({ view: 'items' }, '');
    }
  };

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

  // Filter & Sort items by selected category (Default: ascending order by title / 가나다순)
  const filteredItems = items
    .filter((item) => item.categoryId === selectedCategoryId)
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
        .filter((item) => checkItemMatches(item, searchLower))
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

  // Auto-select first item when category changes if current selected item not in category
  useEffect(() => {
    if (filteredItems.length > 0) {
      const exists = filteredItems.some((item) => item.id === selectedItemId);
      if (!exists) {
        setSelectedItemId(filteredItems[0].id);
      }
    } else {
      setSelectedItemId(null);
    }
  }, [selectedCategoryId, filteredItems.length]);

  // Get active selected item & category objects
  const activeItem = items.find((item) => item.id === selectedItemId);
  const activeCategory = allCategories.find((cat) => cat.id === selectedCategoryId);

  const hasTpl = Boolean(activeItem?.templateId && templates.find(t => t.id === activeItem.templateId));
  const activeTpl = hasTpl ? templates.find(t => t.id === activeItem.templateId) : null;
  const hasBlocks = Boolean(Array.isArray(activeItem?.detailBlocks) && activeItem.detailBlocks.length > 0);
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

  const currentChecklists = [...rawChecklists].sort((a, b) => {
    const aDone = Boolean(a.completed);
    const bDone = Boolean(b.completed);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return 0;
  });

  const completedCount = currentChecklists.filter((c) => c.completed).length;
  const totalCount = currentChecklists.length;
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
    if (!activeItem) return;
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
    if (!activeItem) return;
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
    const newItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      text: newChecklistText.trim(),
      completed: false,
      detail: ''
    };
    const updated = [...baseChecklists, newItem];
    setNewChecklistText('');
    setSelectedChecklistId(newItem.id);
    setChecklistDetailDraft('');
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding checklist:', err);
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
    const fromIdx = baseChecklists.findIndex((c) => c.id === draggedNoteChecklistId);
    const toIdx = baseChecklists.findIndex((c) => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedNoteChecklistId(null);
      setDragOverNoteChecklistId(null);
      return;
    }
    const updated = [...baseChecklists];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);

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

  const handleSaveEditChecklist = async (checkId) => {
    if (!activeItem || !editingCheckText.trim()) return;
    if (checkId === '__main__') {
      setEditingCheckId(null);
      setEditingCheckText('');
      return;
    }
    const finalTag = editingCheckTag === 'custom' ? customTagInput.trim() : editingCheckTag;
    const updated = baseChecklists.map((c) =>
      c.id === checkId
        ? {
            ...c,
            text: editingCheckText.trim(),
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
      const menuHeight = 125;
      const wouldOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = wouldOverflowBottom ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4;
      const right = Math.max(10, window.innerWidth - rect.right);
      setOpenChecklistMenuPos({ top, right });
      setOpenChecklistMenuId(checkItemId);
    }
  };

  const handleSaveChecklistDetail = async (checkId, blocksToSave) => {
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
    handleSaveChecklistDetail(selectedChecklistId, updated);
  };

  const handleAddNewDividerBlock = () => {
    if (!selectedChecklistId) return;
    const newBlock = {
      id: `div_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'divider'
    };
    const updated = [...checklistDetailBlocks, newBlock];
    setChecklistDetailBlocks(updated);
    handleSaveChecklistDetail(selectedChecklistId, updated);
  };

  // Sync draft state when active item changes
  useEffect(() => {
    if (activeItem) {
      setDraftTitle(activeItem.title || '');
      setDraftBody(activeItem.body || '');
      setDraftSubBody(activeItem.subBody || '');
      setDraftCategoryId(activeItem.categoryId || 'inbox');
      setDraftTemplateId(activeItem.templateId || null);
      setDraftTemplateValues(activeItem.templateValues || {});
      setDraftChecklists(null);
      const hasTpl = Boolean(activeItem.templateId && templates.find(t => t.id === activeItem.templateId));
      const hasLegacyBody = Boolean((activeItem.body && activeItem.body.trim()) || (Array.isArray(activeItem.detailBlocks) && activeItem.detailBlocks.length > 0));
      const firstId = hasTpl || hasLegacyBody ? '__main__' : (baseChecklists[0]?.id || null);
      setSelectedChecklistId(firstId);
      const initialText = firstId === '__main__' ? (activeItem.body || '') : (baseChecklists[0]?.detail || '');
      const initialBlocksData = firstId === '__main__' ? activeItem.detailBlocks : baseChecklists[0]?.detailBlocks;
      setChecklistDetailDraft(initialText);
      setChecklistDetailBlocks(parseDetailBlocks(initialText, initialBlocksData));
    } else {
      setDraftTitle('');
      setDraftBody('');
      setDraftSubBody('');
      setDraftCategoryId('inbox');
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
  }, [selectedItemId]);

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
        if (movingCategory) {
          setMovingCategory(null);
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
  }, [openChecklistMenuId, deleteModalState, isEditMode, activeItem, movingCategory]);

  useEffect(() => {
    if (!openChecklistMenuId) return;
    const handleCloseMenu = () => setOpenChecklistMenuId(null);
    window.addEventListener('resize', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    return () => {
      window.removeEventListener('resize', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
    };
  }, [openChecklistMenuId]);

  // ---------------- Category Handlers ----------------
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setIsAddingCategory(false);
      setAddingParentId(null);
      return;
    }
    try {
      const currentScope = getScopeForTab(activeMainTab);
      const newRef = doc(collection(db, 'categories'));
      await setDoc(newRef, {
        name: newCategoryName.trim(),
        order: categories.length,
        scope: currentScope,
        parentId: addingParentId || null,
        createdAt: serverTimestamp()
      });
      if (addingParentId) {
        setExpandedFolders((prev) => ({ ...prev, [addingParentId]: true }));
      }
      navigateToItems(newRef.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
      setAddingParentId(null);
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleUpdateCategoryName = async (catId) => {
    if (FIXED_INBOX_IDS.includes(catId)) return;
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

  const openDeleteCategoryModal = (cat) => {
    const allTargetCatIds = getCategoryDescendantIds(cat.id);
    const subFolderCount = allTargetCatIds.length - 1;
    const childItemsCount = items.filter((item) => allTargetCatIds.includes(item.categoryId)).length;

    let confirmMsg = `'${cat.name}' 폴더를 삭제하시겠습니까?`;
    if (subFolderCount > 0 || childItemsCount > 0) {
      const parts = [];
      if (subFolderCount > 0) parts.push(`하위 폴더 ${subFolderCount}개`);
      if (childItemsCount > 0) parts.push(`메모 ${childItemsCount}개`);
      confirmMsg = `'${cat.name}' 폴더를 삭제하시겠습니까?\n${parts.join('와 ')}가 모두 함께 일괄 삭제됩니다.`;
    }

    openDeleteModal(
      '폴더 삭제',
      confirmMsg,
      () => handleDeleteCategory(cat.id)
    );
  };

  const handleDeleteCategory = async (catId) => {
    if (FIXED_INBOX_IDS.includes(catId)) return;
    try {
      const allTargetCatIds = getCategoryDescendantIds(catId);
      const batch = writeBatch(db);

      // Delete all categories in the tree
      allTargetCatIds.forEach((id) => {
        batch.delete(doc(db, 'categories', id));
      });

      // Delete all items in these categories (Option A)
      const childItems = items.filter((item) => allTargetCatIds.includes(item.categoryId));
      childItems.forEach((item) => {
        batch.delete(doc(db, 'items', item.id));
      });
      await batch.commit();

      setDeletingCategoryId(null);
      if (allTargetCatIds.includes(selectedCategoryId)) {
        setSelectedCategoryId(getInboxIdForTab(activeMainTab));
      }
    } catch (err) {
      console.error('Error deleting category tree and child items:', err);
    }
  };

  // ---------------- Quick Add Note (Fast Entry to In-box) ----------------
  const handleQuickAddNote = async () => {
    const targetInboxId = getInboxIdForTab(activeMainTab);
    try {
      const newRef = doc(collection(db, 'items'));
      await setDoc(newRef, {
        categoryId: targetInboxId,
        title: '새 빠른 메모',
        body: '',
        subBody: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSelectedCategoryId(targetInboxId);
      navigateToDetail(newRef.id);
      setDraftCategoryId(targetInboxId);
      setDraftTitle('새 빠른 메모');
      setDraftBody('');
      setDraftSubBody('');
      setIsEditMode(true);
    } catch (err) {
      console.error('Error adding quick note:', err);
    }
  };

  // ---------------- Item Handlers ----------------
  const handleAddItem = async () => {
    const activeScope = getScopeForTab(activeMainTab);
    const activeInboxId = getInboxIdForTab(activeMainTab);
    let targetCatId = selectedCategoryId;
    
    // Validate targetCatId belongs to active scope
    const isValidTarget = targetCatId && (
      targetCatId === activeInboxId ||
      categories.some(c => c.id === targetCatId && (activeScope === 'explorer' ? (!c.scope || c.scope === 'explorer') : c.scope === activeScope))
    );
    if (!isValidTarget) {
      targetCatId = activeInboxId;
    }
    try {
      const newRef = doc(collection(db, 'items'));
      await setDoc(newRef, {
        categoryId: targetCatId,
        title: '새 메모',
        body: '',
        subBody: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      navigateToDetail(newRef.id);
      setDraftCategoryId(targetCatId);
      setDraftTitle('새 메모');
      setDraftBody('');
      setDraftSubBody('');
      setIsEditMode(true);
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleUpdateItemTitle = async (itemId) => {
    if (!editingItemTitle.trim()) {
      setEditingItemId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'items', itemId), {
        title: editingItemTitle.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingItemId(null);
    } catch (err) {
      console.error('Error updating item title:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'items', itemId));
      setDeletingItemId(null);
      if (selectedItemId === itemId) {
        const remaining = filteredItems.filter((i) => i.id !== itemId);
        setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

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

  const handleSaveDetail = async () => {
    if (!selectedItemId) return;
    try {
      const blocksPlainText = blocksToPlainText(checklistDetailBlocks);
      const finalBody = draftTemplateId ? buildTemplateCombinedBody(draftTemplateId, draftTemplateValues) : (blocksPlainText || draftBody);

      const updatePayload = {
        title: draftTitle,
        body: finalBody,
        subBody: draftSubBody,
        categoryId: draftCategoryId,
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
      setDraftCategoryId(activeItem.categoryId || 'inbox');
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

  const handleTabSwitch = (targetTab) => {
    setActiveMainTab(targetTab);
    const targetScope = getScopeForTab(targetTab);
    const targetInboxId = getInboxIdForTab(targetTab);
    const isCurrentCatValid = categories.some(
      c => c.id === selectedCategoryId && (targetScope === 'explorer' ? (!c.scope || c.scope === 'explorer') : c.scope === targetScope)
    );
    if (!isCurrentCatValid && selectedCategoryId !== targetInboxId) {
      setSelectedCategoryId(targetInboxId);
      setSelectedItemId(null);
    }
    if (isMobile) {
      setMobileView('categories');
      if (window.history.state?.view !== 'categories') {
        window.history.pushState({ view: 'categories' }, '');
      }
    }
  };

  const renderMainModeBar = () => (
    <div style={isMobile ? {
      ...styles.mainModeBar,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      borderBottom: 'none',
      borderTop: '1px solid #CBD5E1',
      backgroundColor: '#F8FAFC',
      padding: '6px 8px'
    } : {
      ...styles.mainModeBar,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      {/* Top Row: 노트, 블로그, 사무실, 앱개발 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
        <button
          onClick={() => handleTabSwitch('explorer')}
          style={{
            ...styles.mainModeTabBtn,
            flex: 1,
            backgroundColor: activeMainTab === 'explorer' ? '#2563EB' : 'transparent',
            color: activeMainTab === 'explorer' ? '#FFFFFF' : '#4A607A',
            fontWeight: activeMainTab === 'explorer' ? 700 : 500
          }}
        >
          <span>노트</span>
        </button>
        <button
          onClick={() => handleTabSwitch('blog')}
          style={{
            ...styles.mainModeTabBtn,
            flex: 1,
            backgroundColor: activeMainTab === 'blog' ? '#2563EB' : 'transparent',
            color: activeMainTab === 'blog' ? '#FFFFFF' : '#4A607A',
            fontWeight: activeMainTab === 'blog' ? 700 : 500
          }}
        >
          <span>블로그</span>
        </button>
        <button
          onClick={() => handleTabSwitch('office')}
          style={{
            ...styles.mainModeTabBtn,
            flex: 1,
            backgroundColor: activeMainTab === 'office' ? '#2563EB' : 'transparent',
            color: activeMainTab === 'office' ? '#FFFFFF' : '#4A607A',
            fontWeight: activeMainTab === 'office' ? 700 : 500
          }}
        >
          <span>사무실</span>
        </button>
        <button
          onClick={() => handleTabSwitch('balance')}
          style={{
            ...styles.mainModeTabBtn,
            flex: 1,
            backgroundColor: activeMainTab === 'balance' ? '#2563EB' : 'transparent',
            color: activeMainTab === 'balance' ? '#FFFFFF' : '#4A607A',
            fontWeight: activeMainTab === 'balance' ? 700 : 500
          }}
        >
          <span>앱개발</span>
        </button>
      </div>

      {/* Bottom Row: 계약, 광고, 클립, 템플릿 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
        <button
          onClick={() => handleTabSwitch('clipboard')}
          style={{
            ...styles.mainModeTabBtn,
            flex: 1,
            backgroundColor: activeMainTab === 'clipboard' ? '#2563EB' : 'transparent',
            color: activeMainTab === 'clipboard' ? '#FFFFFF' : '#4A607A',
            fontWeight: activeMainTab === 'clipboard' ? 700 : 500
          }}
        >
          <span>계약</span>
        </button>
        <button
          onClick={() => handleTabSwitch('ad')}
          style={{
            ...styles.mainModeTabBtn,
            flex: 1,
            backgroundColor: activeMainTab === 'ad' ? '#2563EB' : 'transparent',
            color: activeMainTab === 'ad' ? '#FFFFFF' : '#4A607A',
            fontWeight: activeMainTab === 'ad' ? 700 : 500
          }}
        >
          <span>광고</span>
        </button>
        <button
          onClick={() => handleTabSwitch('clip')}
          style={{
            ...styles.mainModeTabBtn,
            flex: 1,
            backgroundColor: activeMainTab === 'clip' ? '#2563EB' : 'transparent',
            color: activeMainTab === 'clip' ? '#FFFFFF' : '#4A607A',
            fontWeight: activeMainTab === 'clip' ? 700 : 500
          }}
        >
          <span>클립</span>
        </button>
        <button
          onClick={() => handleTabSwitch('template')}
          style={{
            ...styles.mainModeTabBtn,
            flex: 1,
            backgroundColor: activeMainTab === 'template' ? '#2563EB' : 'transparent',
            color: activeMainTab === 'template' ? '#FFFFFF' : '#4A607A',
            fontWeight: activeMainTab === 'template' ? 700 : 500
          }}
        >
          <span>템플릿</span>
        </button>
      </div>
    </div>
  );

  const renderMobileFooter = (screenHeader) => (
    <div style={styles.mobileFooterContainer}>
      {screenHeader}
      {renderMainModeBar()}
    </div>
  );

  const renderCategoryNode = (node, level = 0) => {
    const isSelected = node.id === selectedCategoryId;
    const isEditing = node.id === editingCategoryId;
    const count = items.filter((item) => item.categoryId === node.id).length;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedFolders[node.id] !== false;
    const isBeingDragged = draggedCategoryId === node.id;
    const isDropTarget = dragOverCategoryId === node.id;

    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          draggable={!isEditing}
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', node.id);
            e.dataTransfer.effectAllowed = 'move';
            setDraggedCategoryId(node.id);
          }}
          onDragEnd={() => {
            setDraggedCategoryId(null);
            setDragOverCategoryId(null);
            setIsDragOverRoot(false);
          }}
          onDragOver={(e) => {
            if (canMoveCategory(draggedCategoryId, node.id)) {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverCategoryId !== node.id) {
                setDragOverCategoryId(node.id);
              }
            }
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            if (dragOverCategoryId === node.id) {
              setDragOverCategoryId(null);
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sourceId = draggedCategoryId || e.dataTransfer.getData('text/plain');
            setDragOverCategoryId(null);
            setDraggedCategoryId(null);
            if (!canMoveCategory(sourceId, node.id)) return;
            try {
              await updateDoc(doc(db, 'categories', sourceId), {
                parentId: node.id
              });
              setExpandedFolders((prev) => ({ ...prev, [node.id]: true }));
            } catch (err) {
              console.error('Error moving category:', err);
            }
          }}
          onClick={() => {
            if (!isEditing) navigateToItems(node.id);
          }}
          style={{
            ...styles.catRow,
            backgroundColor: isDropTarget ? '#EFF6FF' : isSelected ? '#D8E6F5' : 'transparent',
            border: isDropTarget ? '1.5px dashed #2563EB' : isBeingDragged ? '1px dashed #94A3B8' : '1px solid transparent',
            opacity: isBeingDragged ? 0.5 : 1,
            color: isSelected ? '#1E3A5F' : '#4A607A',
            fontWeight: isSelected ? 600 : 400,
            paddingLeft: '6px',
            paddingRight: '6px',
            paddingTop: '6px',
            paddingBottom: '6px',
            gap: '6px',
            transition: 'background-color 0.15s, border-color 0.15s'
          }}
        >
          {/* Chevron toggle arrow if has children, else blank spacer */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleFolder(node.id, e)}
              style={{
                background: 'none',
                border: 'none',
                color: isSelected ? '#2563EB' : '#7C95B1',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                flexShrink: 0
              }}
              title={isExpanded ? '접기' : '펼치기'}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span style={{ width: 14, height: 14, flexShrink: 0 }} />
          )}

          <Folder size={16} color={isSelected ? '#2563EB' : '#7C95B1'} style={{ flexShrink: 0 }} />

          {isEditing ? (
            <input
              autoFocus
              type="text"
              value={editingCategoryName}
              onChange={(e) => setEditingCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateCategoryName(node.id);
                if (e.key === 'Escape') setEditingCategoryId(null);
              }}
              onBlur={() => handleUpdateCategoryName(node.id)}
              style={styles.inputDarkInline}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                {node.name}
              </span>
              <span style={{
                fontSize: '11px',
                color: isSelected ? '#2563EB' : '#7C95B1',
                fontWeight: isSelected ? 700 : 500,
                flexShrink: 0
              }}>
                ({count})
              </span>
            </div>
          )}

          <div style={styles.actionGroup}>
            {/* Add Subfolder [+] */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAddingParentId(node.id);
                setIsAddingCategory(true);
                setNewCategoryName('');
                setExpandedFolders((prev) => ({ ...prev, [node.id]: true }));
              }}
              style={styles.actionBtnDark}
              title="하위 폴더 추가"
            >
              <FolderPlus size={13} />
            </button>

            {/* Change Parent / Move Folder */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMovingCategory(node);
                setTargetMoveParentId(node.parentId || '');
              }}
              style={styles.actionBtnDark}
              title="폴더 이동"
            >
              <FolderInput size={13} />
            </button>

            {/* Rename */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingCategoryId(node.id);
                setEditingCategoryName(node.name);
              }}
              style={styles.actionBtnDark}
              title="이름 변경"
            >
              <Edit2 size={13} />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeleteCategoryModal(node);
              }}
              style={styles.actionBtnDark}
              title="삭제"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Subfolders & inline add container with Obsidian-style vertical line */}
        {isExpanded && (hasChildren || (isAddingCategory && addingParentId === node.id)) && (
          <div
            style={{
              marginLeft: '14px',
              paddingLeft: '6px',
              borderLeft: '1.5px solid #CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              marginTop: '1px'
            }}
          >
            {isAddingCategory && addingParentId === node.id && (
              <div style={{ ...styles.inlineInputRowDark, padding: '2px 0' }}>
                <input
                  autoFocus
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory();
                    if (e.key === 'Escape') {
                      setIsAddingCategory(false);
                      setAddingParentId(null);
                    }
                  }}
                  onBlur={handleAddCategory}
                  placeholder="하위 폴더명..."
                  style={styles.inputDark}
                />
              </div>
            )}
            {hasChildren && node.children.map((child) => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // ---------------- Render ----------------
  return (
    <div style={styles.appContainer}>
      {/* Pane 1: Category Sidebar (Pastel Blue, 280px or 100% on Mobile) */}
      {(!isMobile || mobileView === 'categories') && (
        <div style={{
          ...styles.pane1,
          width: isMobile ? '100%' : '280px',
          minWidth: isMobile ? '100%' : '280px'
        }}>
          {/* Main Mode Tab Switcher & Header for Desktop */}
          {!isMobile && renderMainModeBar()}

          {activeMainTab === 'template' ? (
            <>
              {!isMobile && (
                <div style={{ ...styles.pane1Header, justifyContent: 'space-between' }}>
                  <span style={{ ...styles.pane1Title, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layout size={16} color="#2563EB" />
                    템플릿 목록 ({templates.length})
                  </span>
                  <button
                    onClick={handleCreateNewTemplateInTab}
                    style={styles.iconBtnDark}
                    title="새 템플릿 만들기"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}

              <div style={{ ...styles.paneContent, padding: '10px' }}>
                {templates.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#7C95B1', fontSize: '13px' }}>
                    등록된 템플릿이 없습니다.<br />위 <strong>[+]</strong> 버튼을 눌러 새 템플릿을 만들어보세요.
                  </div>
                ) : (
                  templates.map((tpl) => {
                    const isSelected = selectedTemplateIdInTab === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          handleSelectTemplateInTab(tpl);
                          if (isMobile) setMobileView('detail');
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: `1px solid ${isSelected ? '#3B82F6' : 'transparent'}`,
                          backgroundColor: isSelected ? '#D8E6F5' : 'rgba(255, 255, 255, 0.05)',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? '#1E3A5F' : '#2B5278', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📋 {tpl.title || '제목 없는 템플릿'}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplateInTab(tpl.id);
                          }}
                          style={styles.actionBtnDark}
                          title="템플릿 삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {isMobile && renderMobileFooter(
                <div style={{
                  ...styles.pane1Header,
                  borderBottom: 'none',
                  borderTop: '1px solid #D4E3F3',
                  justifyContent: 'space-between'
                }}>
                  <span style={styles.pane1Title}>템플릿 목록 ({templates.length})</span>
                  <button
                    onClick={handleCreateNewTemplateInTab}
                    style={styles.iconBtnDark}
                    title="새 템플릿 만들기"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </>
          ) : activeMainTab !== 'calendar' ? (
            <>
              {!isMobile && (
                <div style={styles.pane1Header}>
                  <span style={styles.pane1Title}>카테고리</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={handleQuickAddNote}
                      style={styles.quickAddBtn}
                      title="빠른 메모 생성 (In-box에 자동 저장)"
                    >
                      <Zap size={13} fill="#2563EB" color="#2563EB" />
                      <span>빠른입력</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCategory(true);
                        setAddingParentId(null);
                        setNewCategoryName('');
                      }}
                      style={styles.iconBtnDark}
                      title="최상위 카테고리 추가"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div style={styles.paneContent}>
                {/* Fixed In-box Category */}
                {(() => {
                  const isSelected = currentFixedCategory.id === selectedCategoryId;
                  const count = items.filter((item) => {
                    if (currentFixedCategory.id === 'inbox') return !item.categoryId || item.categoryId === 'inbox';
                    return item.categoryId === currentFixedCategory.id;
                  }).length;

                  return (
                    <div
                      key={currentFixedCategory.id}
                      onClick={() => navigateToItems(currentFixedCategory.id)}
                      style={{
                        ...styles.catRow,
                        backgroundColor: isSelected ? '#D8E6F5' : 'transparent',
                        color: isSelected ? '#1E3A5F' : '#4A607A',
                        fontWeight: isSelected ? 600 : 400,
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        gap: '6px'
                      }}
                    >
                      <span style={{ width: 14, height: 14, flexShrink: 0 }} />
                      <Inbox size={16} color={isSelected ? '#2563EB' : '#7C95B1'} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                          {currentFixedCategory.name}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: isSelected ? '#2563EB' : '#7C95B1',
                          fontWeight: isSelected ? 700 : 500,
                          flexShrink: 0
                        }}>
                          ({count})
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Drag-to-Root Drop Target */}
                {draggedCategoryId && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverRoot(true);
                    }}
                    onDragLeave={() => setIsDragOverRoot(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDragOverRoot(false);
                      const sourceId = draggedCategoryId || e.dataTransfer.getData('text/plain');
                      setDraggedCategoryId(null);
                      if (!sourceId) return;
                      try {
                        await updateDoc(doc(db, 'categories', sourceId), {
                          parentId: null
                        });
                      } catch (err) {
                        console.error('Error moving category to root:', err);
                      }
                    }}
                    style={{
                      padding: '8px 10px',
                      margin: '4px 0 6px 0',
                      border: isDragOverRoot ? '2px dashed #2563EB' : '1.5px dashed #93C5FD',
                      backgroundColor: isDragOverRoot ? '#EFF6FF' : '#F0F7FF',
                      borderRadius: '6px',
                      color: '#2563EB',
                      fontSize: '12px',
                      fontWeight: 600,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    최상위(루트)로 이동하려면 여기에 놓으세요
                  </div>
                )}

                {/* Inline input for creating root category */}
                {isAddingCategory && addingParentId === null && (
                  <div style={styles.inlineInputRowDark}>
                    <input
                      autoFocus
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory();
                        if (e.key === 'Escape') {
                          setIsAddingCategory(false);
                          setAddingParentId(null);
                        }
                      }}
                      onBlur={handleAddCategory}
                      placeholder="새 최상위 카테고리명..."
                      style={styles.inputDark}
                    />
                  </div>
                )}

                {/* Hierarchical category tree nodes */}
                {buildCategoryTree(filteredCategories).map((node) => renderCategoryNode(node, 0))}
              </div>

              {/* Mobile Footer for Pane 1 */}
              {isMobile && renderMobileFooter(
                <div style={{
                  ...styles.pane1Header,
                  borderBottom: 'none',
                  borderTop: '1px solid #D4E3F3'
                }}>
                  <span style={styles.pane1Title}>카테고리</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={handleQuickAddNote}
                      style={styles.quickAddBtn}
                      title="빠른 메모 생성 (In-box에 자동 저장)"
                    >
                      <Zap size={13} fill="#2563EB" color="#2563EB" />
                      <span>빠른입력</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCategory(true);
                        setAddingParentId(null);
                        setNewCategoryName('');
                      }}
                      style={styles.iconBtnDark}
                      title="최상위 카테고리 추가"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Calendar Sidebar Area */}
              <div style={{ ...styles.paneContent, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#94A3B8', textAlign: 'center' }}>
                {/* Empty container for calendar mode sidebar */}
              </div>
              {isMobile && renderMobileFooter(null)}
            </>
          )}
        </div>
      )}

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
          {activeMainTab !== 'template' && (!isMobile || mobileView === 'items') && (
            <div style={{
              ...styles.pane2,
              width: isMobile ? '100%' : '308px',
              minWidth: isMobile ? '100%' : '308px'
            }}>
              {/* Standard Note Items List for Pane 2 */}
              <>
                {!isMobile ? (
                  <div style={styles.pane2Header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={styles.pane2Title}>
                        {isSearchActive ? '전체 검색 결과' : (activeCategory ? activeCategory.name : '목록')} ({displayedItems.length})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => setItemSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                        style={{
                          ...styles.iconBtnLight,
                          padding: '4px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          color: '#4B5563'
                        }}
                        title={itemSortOrder === 'asc' ? '현재: 오름차순 (클릭 시 내림차순)' : '현재: 내림차순 (클릭 시 오름차순)'}
                      >
                        {itemSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        <span>{itemSortOrder === 'asc' ? '오름차순' : '내림차순'}</span>
                      </button>
                      <button
                        onClick={handleAddItem}
                        style={styles.iconBtnLight}
                        title="메모 추가"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: '52px',
                    padding: '0 12px 0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    flexShrink: 0
                  }}>
                    <button
                      onClick={navigateBack}
                      style={styles.mobileBackBtn}
                    >
                      <ArrowLeft size={16} />
                      <span>카테고리</span>
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                      {isSearchActive ? '전체 검색 결과' : (activeCategory ? activeCategory.name : '목록')} ({displayedItems.length})
                    </span>
                    <button
                      onClick={() => setItemSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                      style={{
                        ...styles.iconBtnLight,
                        padding: '4px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '11px',
                        color: '#4B5563'
                      }}
                      title={itemSortOrder === 'asc' ? '현재: 오름차순 (클릭 시 내림차순)' : '현재: 내림차순 (클릭 시 오름차순)'}
                    >
                      {itemSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      <span>{itemSortOrder === 'asc' ? '오름차순' : '내림차순'}</span>
                    </button>
                  </div>
                )}

                {/* Global Search Input Bar */}
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    border: '1px solid #CBD5E1'
                  }}>
                    <Search size={15} color="#64748B" style={{ marginRight: '6px', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="전체 메모/체크리스트 내용 검색..."
                      style={{
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        width: '100%',
                        fontSize: '12px',
                        color: '#1E293B'
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <X size={14} color="#64748B" />
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.paneContent}>
                  {displayedItems.length === 0 ? (
                    <div style={styles.emptyStateText}>
                      {isSearchActive ? '검색 결과와 일치하는 메모가 없습니다.' : '등록된 메모가 없습니다.'}
                    </div>
                  ) : (
                    displayedItems.map((item) => {
                        const isSelected = item.id === selectedItemId;
                        const isEditing = item.id === editingItemId;
                        const isDeleting = item.id === deletingItemId;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (!isEditing && !isDeleting) {
                                if (isSearchActive) {
                                  const itemCat = categories.find(c => c.id === item.categoryId);
                                  const itemFixedCat = [
                                    INBOX_CATEGORY, BLOG_INBOX_CATEGORY, CLIPBOARD_INBOX_CATEGORY, 
                                    BALANCE_INBOX_CATEGORY, CLIP_INBOX_CATEGORY, OFFICE_INBOX_CATEGORY, AD_INBOX_CATEGORY
                                  ].find(c => c.id === item.categoryId);
                                  
                                  const targetScope = itemFixedCat ? itemFixedCat.scope : (itemCat ? (itemCat.scope || 'explorer') : 'explorer');
                                  const scopeToTabMap = {
                                    explorer: 'explorer',
                                    blog: 'blog',
                                    clipboard: 'clipboard',
                                    balance: 'balance',
                                    clip: 'clip',
                                    office: 'office',
                                    ad: 'ad'
                                  };
                                  if (scopeToTabMap[targetScope]) {
                                    setActiveMainTab(scopeToTabMap[targetScope]);
                                  }
                                  setSelectedCategoryId(item.categoryId);
                                }
                                navigateToDetail(item.id);
                              }
                            }}
                            style={{
                              ...styles.itemCard,
                              backgroundColor: isSelected ? '#F0F7F4' : '#FFFFFF',
                              borderColor: isSelected ? '#3F7A63' : '#ECEBE7',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    type="text"
                                    value={editingItemTitle}
                                    onChange={(e) => setEditingItemTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateItemTitle(item.id);
                                      if (e.key === 'Escape') setEditingItemId(null);
                                    }}
                                    onBlur={() => handleUpdateItemTitle(item.id)}
                                    style={styles.inputLightInline}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span style={{
                                    fontSize: '13px',
                                    fontWeight: isSelected ? 700 : 600,
                                    color: isSelected ? '#163326' : '#2D3748',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    flex: 1
                                  }}>
                                    {highlightText(item.title || '제목 없음', searchQuery)}
                                  </span>
                                )}
                              </div>

                              <div style={styles.actionGroup}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteModal(
                                      '메모 삭제',
                                      `'${item.title || '제목 없음'}' 메모를 삭제하시겠습니까?`,
                                      () => handleDeleteItem(item.id)
                                    );
                                  }}
                                  style={styles.actionBtnLight}
                                  title="삭제"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {isSearchActive && (() => {
                              const snip = getMatchedSnippet(item, searchQuery);
                              return (
                                <>
                                  {snip && (
                                    <div style={{
                                      fontSize: '11px',
                                      color: '#475569',
                                      backgroundColor: '#F8FAFC',
                                      padding: '4px 6px',
                                      borderRadius: '4px',
                                      borderLeft: '2.5px solid #3B82F6',
                                      marginTop: '2px',
                                      wordBreak: 'break-all'
                                    }}>
                                      💡 {highlightText(snip.snippetText, searchQuery)}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                      {getCategoryBadgeName(item.categoryId)}
                                    </span>
                                    {getItemMatchBadges(item, searchLower).map((b, bIdx) => (
                                      <span key={bIdx} style={{ fontSize: '10px', backgroundColor: b.bg, color: b.color, padding: '1px 5px', borderRadius: '4px' }}>
                                        {b.label}
                                      </span>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        );
                      })
                    )}
                  </div>

                {/* Floating Action Button (FAB) for Mobile Sublist */}
                {isMobile && (
                  <button
                    onClick={handleAddItem}
                    style={styles.mobileFabBtn}
                    title="새 메모 추가"
                    aria-label="새 메모 추가"
                  >
                    <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
                  </button>
                )}

                {/* Mobile Footer for Pane 2 */}
                {isMobile && renderMobileFooter(null)}
              </>
            </div>
          )}

          {/* Pane 3: Detail Workspace OR Template Canvas (Flex 1 or 100% on Mobile) */}
          {(!isMobile || mobileView === 'detail') && (
            <div style={styles.pane3}>
              {activeMainTab === 'template' ? (
                /* Dedicated Template Canvas View for Pane 3 */
                <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#FFFFFF', overflowY: 'auto' }}>
                  {/* Canvas Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #F1F5F9', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
                      <Layout size={24} color="#2563EB" />
                      <input
                        type="text"
                        value={tplDraftTitle}
                        onChange={(e) => setTplDraftTitle(e.target.value)}
                        placeholder="템플릿 이름 (예: 고객 미팅 양식, 주간 업무 보고)"
                        style={{ fontSize: '20px', fontWeight: 700, border: 'none', borderBottom: '2px solid #3B82F6', outline: 'none', padding: '4px 8px', flex: 1, color: '#0F172A' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedTemplateIdInTab && selectedTemplateIdInTab !== 'NEW' && (
                        <button
                          onClick={() => handleDeleteTemplateInTab(selectedTemplateIdInTab)}
                          style={{ ...styles.btnSecondary, color: '#EF4444', borderColor: '#FCA5A5' }}
                        >
                          <Trash2 size={15} /> 템플릿 삭제
                        </button>
                      )}
                      <button
                        onClick={handleSaveTemplateFromCanvas}
                        disabled={isSavingTpl}
                        style={styles.btnPrimary}
                      >
                        <Save size={16} />
                        {isSavingTpl ? '저장 중...' : '템플릿 저장'}
                      </button>
                    </div>
                  </div>

                  {/* Canvas Main 2-Pane Split Area (Left: Detailed Content Editor / Right: Checklist Pre-set Editor) */}
                  <div style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden', minHeight: 0, flexDirection: isMobile ? 'column' : 'row' }}>
                    {/* Left Pane: Detailed Content Editor */}
                    <div style={{ flex: 1, minWidth: isMobile ? '100%' : '0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Type size={16} color="#2563EB" /> 1. 상세내용 구성 ({tplDraftFields.length})
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleAddTplFieldInCanvas('text')} style={{ ...styles.toolBtn, borderColor: '#1E293B', color: '#1E293B', padding: '4px 8px', fontSize: '11px' }}>
                            📝 텍스트
                          </button>
                          <button onClick={() => handleAddTplFieldInCanvas('phone')} style={{ ...styles.toolBtn, borderColor: '#EC4899', color: '#EC4899', padding: '4px 8px', fontSize: '11px' }}>
                            📞 전화번호
                          </button>
                          <button onClick={() => handleAddTplFieldInCanvas('datetime')} style={{ ...styles.toolBtn, borderColor: '#10B981', color: '#10B981', padding: '4px 8px', fontSize: '11px' }}>
                            📅 날짜/시간
                          </button>
                          <button onClick={() => handleAddTplFieldInCanvas('checklist')} style={{ ...styles.toolBtn, borderColor: '#8B5CF6', color: '#8B5CF6', padding: '4px 8px', fontSize: '11px' }}>
                            ☑️ 인라인 체크
                          </button>
                        </div>
                      </div>

                      {/* Selection & Grouping Action Bar */}
                      {selectedTplFieldIds.length > 0 && (() => {
                        const existingGroupTitles = Array.from(new Set(tplDraftFields.map(f => f.groupTitle).filter(Boolean)));
                        return (
                          <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #60A5FA', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckSquare size={14} color="#2563EB" /> {selectedTplFieldIds.length}개 요소 선택됨
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                onClick={handleGroupSelectedFields}
                                style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Folder size={13} /> 새 그룹 생성
                              </button>

                              {existingGroupTitles.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    const gTitle = e.target.value;
                                    if (!gTitle) return;
                                    setTplDraftFields((prev) =>
                                      prev.map((f) => (selectedTplFieldIds.includes(f.id) ? { ...f, groupTitle: gTitle } : f))
                                    );
                                    setSelectedTplFieldIds([]);
                                  }}
                                  value=""
                                  style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#1E40AF', border: '1px solid #93C5FD', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  <option value="" disabled>📂 기존 그룹으로 이동...</option>
                                  {existingGroupTitles.map(gt => (
                                    <option key={gt} value={gt}>{gt} 그룹으로 편입</option>
                                  ))}
                                </select>
                              )}

                              <button
                                onClick={handleUngroupSelectedFields}
                                style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                그룹 해제
                              </button>
                              <button
                                onClick={() => setSelectedTplFieldIds([])}
                                style={{ padding: '4px 6px', borderRadius: '6px', backgroundColor: 'transparent', color: '#64748B', border: 'none', fontSize: '11px', cursor: 'pointer' }}
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {tplDraftFields.length === 0 ? (
                        <div style={{ padding: '36px 16px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '2px dashed #CBD5E1' }}>
                          <p style={{ fontSize: '14px', color: '#334155', fontWeight: 700, margin: 0 }}>
                            배치된 상세내용 요소가 없습니다.
                          </p>
                          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                            상단 버튼을 눌러 텍스트, 전화번호, 날짜/시간 박스를 추가해보세요.
                          </p>
                        </div>
                      ) : (
                        getCanvasBlocks(tplDraftFields).map((block, blockIdx) => {
                          const isBlockDragged = draggedBlockIndex === blockIdx;
                          const isBlockDragOver = dragOverBlockIndex === blockIdx;

                          if (block.type === 'group') {
                            return (
                              <div
                                key={`block_group_${block.groupTitle}_${blockIdx}`}
                                draggable={true}
                                onDragStart={(e) => handleBlockDragStart(e, blockIdx)}
                                onDragOver={(e) => handleBlockDragOver(e, blockIdx)}
                                onDrop={(e) => handleBlockDrop(e, blockIdx)}
                                onDragEnd={() => {
                                  setDraggedBlockIndex(null);
                                  setDragOverBlockIndex(null);
                                }}
                                style={{
                                  backgroundColor: '#F1F5F9',
                                  border: `2px solid ${isBlockDragOver ? '#2563EB' : '#BFDBFE'}`,
                                  borderRadius: '14px',
                                  padding: '14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  opacity: isBlockDragged ? 0.4 : 1,
                                  boxShadow: isBlockDragOver ? '0 4px 14px rgba(37,99,235,0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {/* Group Header: Drag handle, Group Title, Add inner elements, Group release */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1.5px solid #DBEAFE', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }} title="그룹 전체 드래그하여 순서 변경">
                                      <GripVertical size={18} color="#2563EB" />
                                    </span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                      <Folder size={15} color="#2563EB" />
                                      그룹: <strong>{block.groupTitle}</strong> ({block.fields.length}개 항목)
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', marginRight: '2px' }}>+ 요소 추가:</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTplFieldInCanvas('text', block.groupTitle)}
                                        style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: '#F8FAFC', color: '#1E293B', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        title="이 그룹에 텍스트 요소 추가"
                                      >
                                        📝 텍스트
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTplFieldInCanvas('phone', block.groupTitle)}
                                        style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: '#FDF2F8', color: '#DB2777', border: '1px solid #F472B6', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        title="이 그룹에 전화번호 요소 추가"
                                      >
                                        📞 전화번호
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTplFieldInCanvas('datetime', block.groupTitle)}
                                        style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: '#F0FDF4', color: '#059669', border: '1px solid #34D399', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        title="이 그룹에 날짜/시간 요소 추가"
                                      >
                                        📅 일시
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTplFieldInCanvas('checklist', block.groupTitle)}
                                        style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #A78BFA', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        title="이 그룹에 체크리스트 요소 추가"
                                      >
                                        ☑️ 체크
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => {
                                        setTplDraftFields((prev) =>
                                          prev.map((f) => ((f.groupTitle || '') === block.groupTitle ? { ...f, groupTitle: '' } : f))
                                        );
                                      }}
                                      style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                      title="그룹 해제"
                                    >
                                      그룹 해제
                                    </button>
                                  </div>
                                </div>

                                {/* Group Inner Fields List (Intra-Group Drag & Drop) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {block.fields.map((field, indexInGroup) => {
                                    const originalIdx = field.originalIdx;
                                    const borderColor = field.type === 'phone' ? '#EC4899' : field.type === 'datetime' ? '#10B981' : field.type === 'checklist' ? '#8B5CF6' : '#1E293B';
                                    const bgColor = field.type === 'phone' ? '#FDF2F8' : field.type === 'datetime' ? '#F0FDF4' : field.type === 'checklist' ? '#F5F3FF' : '#FFFFFF';

                                    const isFieldDragged = draggedFieldItem && draggedFieldItem.groupTitle === block.groupTitle && draggedFieldItem.indexInGroup === indexInGroup;
                                    const isFieldDragOver = dragOverFieldItem && dragOverFieldItem.groupTitle === block.groupTitle && dragOverFieldItem.indexInGroup === indexInGroup;

                                    return (
                                      <div
                                        key={field.id}
                                        draggable={true}
                                        onDragStart={(e) => handleIntraGroupDragStart(e, block.groupTitle, indexInGroup)}
                                        onDragOver={(e) => handleIntraGroupDragOver(e, block.groupTitle, indexInGroup)}
                                        onDrop={(e) => handleIntraGroupDrop(e, block.groupTitle, indexInGroup)}
                                        onDragEnd={() => {
                                          setDraggedFieldItem(null);
                                          setDragOverFieldItem(null);
                                        }}
                                        style={{
                                          backgroundColor: bgColor,
                                          border: `1.5px solid ${isFieldDragOver ? '#2563EB' : borderColor}`,
                                          borderRadius: '10px',
                                          padding: '12px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '8px',
                                          opacity: isFieldDragged ? 0.4 : 1,
                                          boxShadow: isFieldDragOver ? '0 3px 10px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px', borderBottom: '1px dashed #E2E8F0', paddingBottom: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }} title="그룹 내에서 순서 변경">
                                              <GripVertical size={15} color="#475569" />
                                            </span>
                                            <input
                                              type="checkbox"
                                              checked={selectedTplFieldIds.includes(field.id)}
                                              onChange={() => handleToggleSelectField(field.id)}
                                              style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#2563EB' }}
                                            />
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: borderColor }}>
                                              #{indexInGroup + 1} {field.type === 'text' ? '📝 텍스트' : field.type === 'phone' ? '📞 전화번호' : field.type === 'datetime' ? '📅 날짜/시간' : '☑️ 체크리스트'}
                                            </span>
                                          </div>
                                          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>🔒 그룹 내 이동</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                                          <div style={{ flex: 1, minWidth: '130px' }}>
                                            <input
                                              type="text"
                                              value={field.label}
                                              onChange={(e) => {
                                                const updated = [...tplDraftFields];
                                                updated[originalIdx].label = e.target.value;
                                                setTplDraftFields(updated);
                                              }}
                                              placeholder="라벨명 입력"
                                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                            />
                                          </div>

                                          {field.type !== 'checklist' && (
                                            <div style={{ flex: 1.2, minWidth: '130px' }}>
                                              <input
                                                type="text"
                                                value={field.placeholder || ''}
                                                onChange={(e) => {
                                                  const updated = [...tplDraftFields];
                                                  const val = field.type === 'phone' ? autoFormatPhoneNumber(e.target.value) : e.target.value;
                                                  updated[originalIdx].placeholder = val;
                                                  setTplDraftFields(updated);
                                                }}
                                                placeholder="초기내용 입력"
                                                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                              />
                                            </div>
                                          )}

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', paddingBottom: '2px', marginLeft: 'auto' }}>
                                            <button onClick={() => handleRemoveTplFieldInCanvas(originalIdx)} style={{ ...styles.iconBtn, padding: '5px' }} title="요소 삭제">
                                              <Trash2 size={14} color="#EF4444" />
                                            </button>
                                          </div>
                                        </div>

                                        {field.type === 'checklist' && (
                                          <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: `1px dashed ${borderColor}` }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: borderColor, marginBottom: '6px' }}>
                                              기본 체크리스트 항목
                                              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 400 }}>
                                                ({(field.defaultItems || []).length}개)
                                              </span>
                                            </label>
                                            <div>
                                              {(field.defaultItems || []).map((subItemText, subIdx) => (
                                                <div key={subIdx} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                                  <input
                                                    type="text"
                                                    value={typeof subItemText === 'object' ? subItemText.text : subItemText}
                                                    onChange={(e) => {
                                                      const updated = [...tplDraftFields];
                                                      if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                                      updated[originalIdx].defaultItems[subIdx] = e.target.value;
                                                      setTplDraftFields(updated);
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        const updated = [...tplDraftFields];
                                                        if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                                        updated[originalIdx].defaultItems.splice(subIdx + 1, 0, '');
                                                        setTplDraftFields(updated);
                                                      }
                                                    }}
                                                    placeholder={`항목 ${subIdx + 1}`}
                                                    style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '12px', backgroundColor: '#FFFFFF' }}
                                                  />
                                                  <button
                                                    onClick={() => {
                                                      const updated = [...tplDraftFields];
                                                      if (updated[originalIdx].defaultItems) {
                                                        updated[originalIdx].defaultItems.splice(subIdx, 1);
                                                      }
                                                      setTplDraftFields(updated);
                                                    }}
                                                    style={styles.iconBtn}
                                                    title="삭제"
                                                  >
                                                    <Trash2 size={13} color="#EF4444" />
                                                  </button>
                                                </div>
                                              ))}
                                              <button
                                                onClick={() => {
                                                  const updated = [...tplDraftFields];
                                                  if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                                  updated[originalIdx].defaultItems.push('');
                                                  setTplDraftFields(updated);
                                                }}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, backgroundColor: '#FFFFFF', fontSize: '11px', cursor: 'pointer', marginTop: '2px', color: borderColor, fontWeight: 600 }}
                                              >
                                                <Plus size={13} /> 항목 추가
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          // Standalone Single Field Block
                          const field = block.fields[0];
                          const originalIdx = field.originalIdx;
                          const borderColor = field.type === 'phone' ? '#EC4899' : field.type === 'datetime' ? '#10B981' : field.type === 'checklist' ? '#8B5CF6' : '#1E293B';
                          const bgColor = field.type === 'phone' ? '#FDF2F8' : field.type === 'datetime' ? '#F0FDF4' : field.type === 'checklist' ? '#F5F3FF' : '#FFFFFF';

                          return (
                            <div
                              key={field.id}
                              draggable={true}
                              onDragStart={(e) => handleBlockDragStart(e, blockIdx)}
                              onDragOver={(e) => handleBlockDragOver(e, blockIdx)}
                              onDrop={(e) => handleBlockDrop(e, blockIdx)}
                              onDragEnd={() => {
                                setDraggedBlockIndex(null);
                                setDragOverBlockIndex(null);
                              }}
                              style={{
                                backgroundColor: bgColor,
                                border: `1.5px solid ${isBlockDragOver ? '#2563EB' : borderColor}`,
                                borderRadius: '12px',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                opacity: isBlockDragged ? 0.4 : 1,
                                boxShadow: isBlockDragOver ? '0 4px 12px rgba(37,99,235,0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px', borderBottom: '1px dashed #E2E8F0', paddingBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }} title="드래그하여 순서 변경">
                                    <GripVertical size={16} color="#64748B" />
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={selectedTplFieldIds.includes(field.id)}
                                    onChange={() => handleToggleSelectField(field.id)}
                                    style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#2563EB' }}
                                  />
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: borderColor }}>
                                    #{originalIdx + 1} {field.type === 'text' ? '📝 텍스트' : field.type === 'phone' ? '📞 전화번호' : field.type === 'datetime' ? '📅 날짜/시간' : '☑️ 체크리스트'}
                                  </span>
                                </div>
                                <span style={{ fontSize: '10px', color: '#94A3B8' }}>체크 후 그룹화</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '140px' }}>
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => {
                                      const updated = [...tplDraftFields];
                                      updated[originalIdx].label = e.target.value;
                                      setTplDraftFields(updated);
                                    }}
                                    placeholder="라벨명 입력"
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                  />
                                </div>

                                {field.type !== 'checklist' && (
                                  <div style={{ flex: 1.2, minWidth: '140px' }}>
                                    <input
                                      type="text"
                                      value={field.placeholder || ''}
                                      onChange={(e) => {
                                        const updated = [...tplDraftFields];
                                        const val = field.type === 'phone' ? autoFormatPhoneNumber(e.target.value) : e.target.value;
                                        updated[originalIdx].placeholder = val;
                                        setTplDraftFields(updated);
                                      }}
                                      placeholder="초기내용 입력"
                                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                    />
                                  </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', paddingBottom: '2px', marginLeft: 'auto' }}>
                                  <button onClick={() => handleRemoveTplFieldInCanvas(originalIdx)} style={{ ...styles.iconBtn, padding: '5px' }} title="요소 삭제">
                                    <Trash2 size={15} color="#EF4444" />
                                  </button>
                                </div>
                              </div>

                              {field.type === 'checklist' && (
                                <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: `1px dashed ${borderColor}` }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: borderColor, marginBottom: '6px' }}>
                                    기본 체크리스트 항목
                                    <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 400 }}>
                                      ({(field.defaultItems || []).length}개)
                                    </span>
                                  </label>
                                  <div>
                                    {(field.defaultItems || []).map((subItemText, subIdx) => (
                                      <div key={subIdx} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                        <input
                                          type="text"
                                          value={typeof subItemText === 'object' ? subItemText.text : subItemText}
                                          onChange={(e) => {
                                            const updated = [...tplDraftFields];
                                            if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                            updated[originalIdx].defaultItems[subIdx] = e.target.value;
                                            setTplDraftFields(updated);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              const updated = [...tplDraftFields];
                                              if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                              updated[originalIdx].defaultItems.splice(subIdx + 1, 0, '');
                                              setTplDraftFields(updated);
                                            }
                                          }}
                                          placeholder={`항목 ${subIdx + 1}`}
                                          style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '12px', backgroundColor: '#FFFFFF' }}
                                        />
                                        <button
                                          onClick={() => {
                                            const updated = [...tplDraftFields];
                                            if (updated[originalIdx].defaultItems) {
                                              updated[originalIdx].defaultItems.splice(subIdx, 1);
                                            }
                                            setTplDraftFields(updated);
                                          }}
                                          style={styles.iconBtn}
                                          title="삭제"
                                        >
                                          <Trash2 size={13} color="#EF4444" />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const updated = [...tplDraftFields];
                                        if (!updated[originalIdx].defaultItems) updated[originalIdx].defaultItems = [];
                                        updated[originalIdx].defaultItems.push('');
                                        setTplDraftFields(updated);
                                      }}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, backgroundColor: '#FFFFFF', fontSize: '11px', cursor: 'pointer', marginTop: '2px', color: borderColor, fontWeight: 600 }}
                                    >
                                      <Plus size={13} /> 항목 추가
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Right Pane: Checklist Pre-set Editor */}
                    <div style={{ flex: 1, minWidth: isMobile ? '100%' : '0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#F5F3FF', borderRadius: '16px', border: '1px solid #DDD6FE', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #DDD6FE' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#4C1D95', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckSquare size={16} color="#8B5CF6" /> 2. 체크리스트 미리 설정 ({tplDraftChecklists.length})
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setShowTplBulkChecklistInput(!showTplBulkChecklistInput)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: '1px solid #8B5CF6', backgroundColor: showTplBulkChecklistInput ? '#8B5CF6' : '#FFFFFF', color: showTplBulkChecklistInput ? '#FFFFFF' : '#7C3AED', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            title="여러 항목을 줄바꿈하여 한 번에 추가"
                          >
                            📝 줄바꿈 일괄 추가
                          </button>
                          <button
                            onClick={handleAddTplChecklistInCanvas}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #8B5CF6', backgroundColor: '#FFFFFF', color: '#7C3AED', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                          >
                            <Plus size={14} /> 체크 항목 추가
                          </button>
                        </div>
                      </div>

                      {showTplBulkChecklistInput && (
                        <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #8B5CF6', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 8px rgba(124,58,237,0.15)' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#6D28D9' }}>📝 줄바꿈으로 일괄 추가</label>
                          <textarea
                            rows={4}
                            value={tplBulkChecklistText}
                            onChange={(e) => setTplBulkChecklistText(e.target.value)}
                            placeholder={`추가할 체크 항목들을 줄바꿈(Enter)으로 입력해 주세요.\n예:\n1. 현장 점검\n2. 서류 검토\n3. 최종 승인`}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #C4B5FD', fontSize: '12px', lineHeight: '1.4', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setShowTplBulkChecklistInput(false);
                                setTplBulkChecklistText('');
                              }}
                              style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', fontSize: '11px', cursor: 'pointer' }}
                            >
                              취소
                            </button>
                            <button
                              onClick={() => {
                                if (!tplBulkChecklistText.trim()) return;
                                const lines = tplBulkChecklistText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                                if (lines.length > 0) {
                                  const newItems = lines.map((text, i) => ({
                                    id: `tplchk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                                    text
                                  }));
                                  setTplDraftChecklists(prev => [...prev, ...newItems]);
                                }
                                setTplBulkChecklistText('');
                                setShowTplBulkChecklistInput(false);
                              }}
                              style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#7C3AED', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {tplBulkChecklistText.trim() ? `${tplBulkChecklistText.split(/\r?\n/).filter(Boolean).length}개 항목 일괄 추가` : '추가'}
                            </button>
                          </div>
                        </div>
                      )}

                      {tplDraftChecklists.length === 0 ? (
                        <div style={{ padding: '36px 16px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '2px dashed #C4B5FD' }}>
                          <p style={{ fontSize: '14px', color: '#5B21B6', fontWeight: 700, margin: 0 }}>
                            등록된 사전 체크리스트 항목이 없습니다.
                          </p>
                          <p style={{ fontSize: '12px', color: '#7C3AED', marginTop: '6px' }}>
                            상단 <strong>[+ 체크 항목 추가]</strong> 버튼을 눌러 메모 적용 시 자동으로 채워질 체크 항목을 미리 설정해두세요.
                          </p>
                        </div>
                      ) : (
                        tplDraftChecklists.map((checkItem, idx) => {
                          const isDragged = draggedChecklistIndex === idx;
                          const isDragOver = dragOverChecklistIndex === idx;

                          return (
                            <div
                              key={checkItem.id || idx}
                              draggable={true}
                              onDragStart={(e) => handleChecklistDragStart(e, idx)}
                              onDragOver={(e) => handleChecklistDragOver(e, idx)}
                              onDrop={(e) => handleChecklistDrop(e, idx)}
                              onDragEnd={() => {
                                setDraggedChecklistIndex(null);
                                setDragOverChecklistIndex(null);
                              }}
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: `1.5px solid ${isDragOver ? '#7C3AED' : '#8B5CF6'}`,
                                borderRadius: '12px',
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                boxShadow: isDragOver ? '0 4px 12px rgba(124,58,237,0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                                opacity: isDragged ? 0.4 : 1,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }} title="드래그하여 순서 변경">
                                  <GripVertical size={16} color="#8B5CF6" />
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', minWidth: '20px' }}>
                                  #{idx + 1}
                                </span>
                              <textarea
                                rows={Math.max(1, (checkItem.text || '').split('\n').length)}
                                value={checkItem.text || ''}
                                onChange={(e) => handleUpdateTplChecklistInCanvas(idx, 'text', e.target.value)}
                                placeholder="체크리스트 사전 항목 내용... (Enter 키로 줄바꿈 가능)"
                                style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #C4B5FD', fontSize: '13px', lineHeight: 1.4, whiteSpace: 'pre-wrap', backgroundColor: '#FFFFFF', fontFamily: 'inherit', resize: 'vertical' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <button onClick={() => handleRemoveTplChecklistInCanvas(idx)} style={{ ...styles.iconBtn, padding: '5px' }} title="삭제">
                                  <Trash2 size={15} color="#EF4444" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                      )}
                    </div>
                  </div>
                </div>
              ) : activeItem ? (
                <>

              {/* Content Body - Split 2-pane Workspace (Touch Swipe enabled) */}
              <div
                style={styles.pane3Body}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {isEditMode ? (
                  <div style={styles.splitEditContainer}>
                    {/* Split Edit Textarea Fields (Desktop: 2 Cards side-by-side, Mobile: 1 Full Card by SubTab) */}
                    <div style={styles.splitEditFields}>
                      {(!isMobile || mobileSubTab === 'main') && (
                        <div style={styles.editPaneMainCard} className={printTarget === 'checklist' ? 'print-area' : 'no-print'}>
                          {/* Top Control Bar: Category Selector + Template Selector + Cancel/Save Buttons */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #F1F5F9',
                            flexWrap: 'wrap'
                          }}>
                            {/* Left Controls: Category & Template Selectors */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <div style={styles.headerCategorySelector}>
                                <span style={styles.headerCategoryLabel}>이동:</span>
                                <select
                                  value={draftCategoryId}
                                  onChange={(e) => setDraftCategoryId(e.target.value)}
                                  style={styles.headerCategorySelect}
                                >
                                  {getHierarchicalCategoryOptions(currentScope).map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.displayName || cat.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div style={styles.headerCategorySelector}>
                                <span style={styles.headerCategoryLabel}>템플릿:</span>
                                <select
                                  value={draftTemplateId || ''}
                                  onChange={(e) => {
                                    const val = e.target.value || null;
                                    setDraftTemplateId(val);
                                    if (val) {
                                      const targetTpl = templates.find(t => t.id === val);
                                      if (targetTpl) {
                                        if (targetTpl.fields) {
                                          const initialVals = { ...draftTemplateValues };
                                          targetTpl.fields.forEach(f => {
                                            if (f.type === 'checklist') {
                                              if (!initialVals[f.id]) {
                                                initialVals[f.id] = (f.defaultItems || []).map(text => ({ text, completed: false }));
                                              }
                                            } else {
                                              if (initialVals[f.id] === undefined && f.placeholder) {
                                                initialVals[f.id] = f.placeholder.replace(/\//g, '\n');
                                              }
                                            }
                                          });
                                          setDraftTemplateValues(initialVals);
                                        }
                                        if (targetTpl.checklists && targetTpl.checklists.length > 0) {
                                          const converted = targetTpl.checklists.map((c, i) => ({
                                            id: `tcheck_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                                            text: typeof c === 'string' ? c : c.text,
                                            completed: false,
                                            tag: typeof c === 'object' ? (c.tag || null) : null
                                          }));
                                          setDraftChecklists(converted);
                                        }
                                      }
                                    }
                                  }}
                                  style={{ ...styles.headerCategorySelect, minWidth: '130px', fontWeight: 600, color: draftTemplateId ? '#2563EB' : '#334155' }}
                                >
                                  <option value="">기본 텍스트 박스</option>
                                  {templates.map((tpl) => (
                                    <option key={tpl.id} value={tpl.id}>
                                      📋 {tpl.title}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                onClick={() => setActiveMainTab('template')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#F8FAFC',
                                  border: '1px solid #CBD5E1',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#475569',
                                  cursor: 'pointer'
                                }}
                                title="템플릿 탭으로 이동하여 템플릿 직접 제작"
                              >
                                <Settings size={13} color="#2563EB" />
                                <span>템플릿 관리</span>
                              </button>
                            </div>

                            {/* Right Controls: Cancel & Save Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={handleCancelDetailEdit}
                                style={styles.btnSecondary}
                              >
                                <RotateCcw size={13} />
                                취소
                              </button>
                              <button
                                onClick={handleSaveDetail}
                                style={styles.btnPrimary}
                              >
                                <Save size={13} />
                                저장
                              </button>
                            </div>
                          </div>

                          {/* Standalone Full-Width Title Input Box */}
                          <input
                            type="text"
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            style={{ ...styles.editTitleInput, width: '100%', marginBottom: '10px' }}
                          />



                          {/* Checklist Header Bar & Print Button */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingBottom: '8px',
                            marginBottom: '10px',
                            borderBottom: '1px solid #E2E8F0'
                          }} className="no-print">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                              <ListChecks size={16} color="#2563EB" />
                              <span>진행 체크리스트 ({completedCount}/{totalCount})</span>
                            </div>
                            <button
                              onClick={handleOpenChecklistPrint}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#334155',
                                backgroundColor: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              title="체크리스트 인쇄"
                            >
                              <Printer size={13} color="#334155" />
                              <span>인쇄</span>
                            </button>
                          </div>

                          {/* Input Form for new checklist item */}
                          <div style={styles.checklistInputContainer} className="no-print">
                            <div style={styles.checklistInputGroup}>
                              <textarea
                                rows={2}
                                value={newChecklistText}
                                onChange={(e) => setNewChecklistText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleAddChecklist();
                                  }
                                }}
                                placeholder="새 체크리스트 항목 입력... (Ctrl+Enter 항목 추가)"
                                style={styles.checklistTextarea}
                              />
                              <button
                                onClick={handleAddChecklist}
                                style={{
                                  ...styles.checklistAddBtn,
                                  opacity: newChecklistText.trim() ? 1 : 0.6,
                                  cursor: newChecklistText.trim() ? 'pointer' : 'not-allowed'
                                }}
                                disabled={!newChecklistText.trim()}
                                title="체크리스트 추가 (Ctrl+Enter)"
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Checklist Items List */}
                          <div style={styles.checklistListContainer}>
                            {currentChecklists.length === 0 ? (
                              <div style={styles.checklistEmptyText}>
                                등록된 체크리스트 항목이 없습니다. 위 입력창에서 항목을 추가해보세요!
                              </div>
                            ) : (
                              currentChecklists.map((checkItem) => {
                                const isEditing = editingCheckId === checkItem.id;
                                const isSelected = selectedChecklistId === checkItem.id;
                                const isDragged = draggedNoteChecklistId === checkItem.id;
                                const isDragOver = dragOverNoteChecklistId === checkItem.id;
                                const canDrag = !isEditing && checkItem.id !== '__main__';

                                return (
                                  <div
                                    key={checkItem.id}
                                    draggable={canDrag}
                                    onDragStart={(e) => {
                                      if (!canDrag) return;
                                      setDraggedNoteChecklistId(checkItem.id);
                                      e.dataTransfer.effectAllowed = 'move';
                                      e.dataTransfer.setData('text/plain', checkItem.id);
                                    }}
                                    onDragOver={(e) => {
                                      if (!canDrag) return;
                                      e.preventDefault();
                                      e.dataTransfer.dropEffect = 'move';
                                      if (dragOverNoteChecklistId !== checkItem.id) {
                                        setDragOverNoteChecklistId(checkItem.id);
                                      }
                                    }}
                                    onDrop={(e) => {
                                      if (!canDrag) return;
                                      handleNoteChecklistDrop(e, checkItem.id);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedNoteChecklistId(null);
                                      setDragOverNoteChecklistId(null);
                                    }}
                                    onClick={() => {
                                      if (!isEditing) {
                                        setSelectedChecklistId(checkItem.id);
                                        if (isMobile) setMobileSubTab('sub');
                                      }
                                    }}
                                    style={{
                                      ...styles.checklistItemRow,
                                      backgroundColor: isSelected ? '#EFF6FF' : (checkItem.completed ? '#F8FAFC' : '#FFFFFF'),
                                      border: isDragOver
                                        ? '1.5px solid #2563EB'
                                        : isSelected
                                          ? '1.5px solid #2563EB'
                                          : isEditing
                                            ? '1.5px solid #3B82F6'
                                            : checkItem.completed
                                              ? '1px solid #E2E8F0'
                                              : '1px solid #CBD5E1',
                                      boxShadow: isDragOver
                                        ? '0 -3px 0 0 #2563EB, 0 4px 12px rgba(37, 99, 235, 0.2)'
                                        : isSelected
                                          ? '0 0 0 1px #2563EB, 0 2px 6px rgba(37, 99, 235, 0.1)'
                                          : '0 1px 2px rgba(0, 0, 0, 0.03)',
                                      opacity: isDragged ? 0.4 : 1,
                                      cursor: canDrag ? 'grab' : 'pointer'
                                    }}
                                  >
                                    {isEditing ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                        <textarea
                                          rows={2}
                                          value={editingCheckText}
                                          onChange={(e) => setEditingCheckText(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                              e.preventDefault();
                                              handleSaveEditChecklist(checkItem.id);
                                            }
                                          }}
                                          style={styles.checklistEditTextarea}
                                          autoFocus
                                        />
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'flex-end',
                                          gap: '6px',
                                          marginTop: '6px'
                                        }}>
                                          <button
                                            type="button"
                                            onClick={() => setEditingCheckId(null)}
                                            style={styles.btnSmallCancel}
                                          >
                                            <X size={13} /> 취소
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveEditChecklist(checkItem.id)}
                                            style={styles.btnSmallSave}
                                          >
                                            <Check size={13} /> 저장
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        gap: '8px',
                                        minHeight: '26px'
                                      }}>
                                        {/* Left Row: Drag Handle + Checkbox + Pure Text */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                          {canDrag && (
                                            <span
                                              style={{
                                                cursor: 'grab',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                color: '#94A3B8',
                                                flexShrink: 0
                                              }}
                                              title="드래그하여 순서 변경"
                                            >
                                              <GripVertical size={15} />
                                            </span>
                                          )}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleChecklist(checkItem.id);
                                            }}
                                            style={styles.checkboxBtn}
                                            title={checkItem.completed ? '미완료로 변경' : '완료로 변경'}
                                          >
                                            {checkItem.completed ? (
                                              <CheckSquare size={18} color="#2563EB" />
                                            ) : (
                                              <Square size={18} color="#94A3B8" />
                                            )}
                                          </button>
                                          <span
                                            style={{
                                              ...styles.checkitemText,
                                              flex: 1,
                                              minWidth: 0,
                                              textDecoration: checkItem.completed ? 'line-through' : 'none',
                                              color: checkItem.completed ? '#94A3B8' : (isSelected ? '#1E40AF' : '#1E293B'),
                                              fontWeight: isSelected ? 700 : (checkItem.completed ? 400 : 500)
                                            }}
                                          >
                                            {renderWithLinks(checkItem.text)}
                                          </span>
                                        </div>

                                        {/* Right End: 3-dot Menu with Floating Dropdown */}
                                        <div style={{ position: 'relative', flexShrink: 0 }} className="no-print" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            type="button"
                                            onClick={(e) => handleOpenChecklistMenu(e, checkItem.id)}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: '28px',
                                              height: '28px',
                                              borderRadius: '6px',
                                              border: 'none',
                                              backgroundColor: openChecklistMenuId === checkItem.id ? '#E2E8F0' : 'transparent',
                                              color: openChecklistMenuId === checkItem.id ? '#2563EB' : '#64748B',
                                              cursor: 'pointer'
                                            }}
                                            title="메뉴"
                                          >
                                            <MoreVertical size={16} />
                                          </button>

                                          {openChecklistMenuId === checkItem.id && (
                                            <>
                                              {/* Invisible backdrop to close dropdown on click outside */}
                                              <div
                                                style={{
                                                  position: 'fixed',
                                                  top: 0,
                                                  left: 0,
                                                  right: 0,
                                                  bottom: 0,
                                                  zIndex: 9999,
                                                  backgroundColor: 'transparent'
                                                }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenChecklistMenuId(null);
                                                }}
                                              />

                                              {/* Context Dropdown Card */}
                                              <div
                                                style={{
                                                  ...styles.checklistDropdownMenu,
                                                  top: openChecklistMenuPos?.top ?? 0,
                                                  right: openChecklistMenuPos?.right ?? 0
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setOpenChecklistMenuId(null);
                                                    setEditingCheckId(checkItem.id);
                                                    setEditingCheckText(checkItem.text);
                                                    setEditingCheckTag(checkItem.tag || '');
                                                  }}
                                                  style={styles.checklistDropdownItem}
                                                >
                                                  <Edit2 size={14} color="#475569" />
                                                  <span>수정</span>
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setOpenChecklistMenuId(null);
                                                    const preview = checkItem.text.length > 35 ? checkItem.text.slice(0, 35) + '...' : checkItem.text;
                                                    openDeleteModal(
                                                      '체크리스트 항목 삭제',
                                                      `'${preview}' 항목을 정말 삭제하시겠습니까?`,
                                                      () => handleDeleteChecklist(checkItem.id)
                                                    );
                                                  }}
                                                  style={{ ...styles.checklistDropdownItem, color: '#DC2626' }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                  <Trash2 size={14} color="#DC2626" />
                                                  <span>삭제</span>
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={() => setOpenChecklistMenuId(null)}
                                                  style={styles.checklistDropdownItem}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                  <X size={14} color="#64748B" />
                                                  <span>취소</span>
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Right Card for Edit Mode: Main Body, Template Form, or Checklist Detail */}
                      {(!isMobile || mobileSubTab === 'sub') && (
                        <div style={styles.editPaneSubCard} className={printTarget === 'detail' ? 'print-area' : 'no-print'}>
                          {selectedChecklistId === '__main__' ? (
                            draftTemplateId === null ? (
                              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <DetailBlocksManager
                                  blocks={checklistDetailBlocks}
                                  onChangeAndSave={(newBlocks) => {
                                    setChecklistDetailBlocks(newBlocks);
                                    setDraftBody(blocksToPlainText(newBlocks));
                                  }}
                                  searchQuery={searchQuery}
                                  editingBlockId={editingBlockId}
                                  setEditingBlockId={setEditingBlockId}
                                />
                              </div>
                            ) : (
                              (() => {
                                const activeTpl = templates.find(t => t.id === draftTemplateId);
                                if (!activeTpl || !activeTpl.fields || activeTpl.fields.length === 0) {
                                  return (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                                      선택된 템플릿에 필드가 없습니다. 상단 [템플릿 관리]에서 구성 요소를 추가해 주세요.
                                    </div>
                                  );
                                }

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                                    <div style={{ padding: '8px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>📋 <strong>{activeTpl.title}</strong> 템플릿 서식 편집 중</span>
                                      <button
                                        onClick={() => setDraftTemplateId(null)}
                                        style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
                                      >
                                        기본 텍스트박스로 변경
                                      </button>
                                    </div>

                                    {groupFieldsList(activeTpl.fields).map((grp, gIdx) => {
                                      const renderedFields = grp.fields.map((field) => {
                                        const fieldVal = draftTemplateValues[field.id];

                                        if (field.type === 'phone') {
                                          return (
                                            <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                                              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px', flexShrink: 0 }}>
                                                <Phone size={14} color="#10B981" />
                                                {field.label}
                                              </label>
                                              <input
                                                type="tel"
                                                value={fieldVal || ''}
                                                onChange={(e) => setDraftTemplateValues({ ...draftTemplateValues, [field.id]: autoFormatPhoneNumber(e.target.value) })}
                                                placeholder={field.placeholder || '010-0000-0000'}
                                                style={{ flex: 1, minWidth: '140px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                                              />
                                              {fieldVal && (
                                                <a
                                                  href={`sms:${fieldVal.replace(/[^0-9]/g, '')}`}
                                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}
                                                >
                                                  <MessageSquare size={12} />
                                                  SMS 전송
                                                </a>
                                              )}
                                            </div>
                                          );
                                        }

                                        if (field.type === 'datetime') {
                                          return (
                                            <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                                              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px', flexShrink: 0 }}>
                                                <CalendarIcon size={14} color="#8B5CF6" />
                                                {field.label}
                                              </label>
                                              <input
                                                type="datetime-local"
                                                value={fieldVal || ''}
                                                onChange={(e) => setDraftTemplateValues({ ...draftTemplateValues, [field.id]: e.target.value })}
                                                style={{ flex: 1, minWidth: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box', color: '#0F172A', fontFamily: 'inherit' }}
                                              />
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {field.type === 'text' && <Type size={14} color="#2563EB" />}
                                                {field.type === 'checklist' && <CheckSquare size={14} color="#F59E0B" />}
                                                {field.label}
                                              </label>
                                            </div>

                                            {field.type === 'text' && (() => {
                                              const defaultTextVal = field.placeholder ? field.placeholder.replace(/\//g, '\n') : '';
                                              const currentTextVal = fieldVal !== undefined ? fieldVal : defaultTextVal;
                                              const lineCount = currentTextVal.split('\n').length;
                                              return (
                                                <textarea
                                                  value={currentTextVal}
                                                  onChange={(e) => setDraftTemplateValues({ ...draftTemplateValues, [field.id]: e.target.value })}
                                                  placeholder="내용을 입력하세요"
                                                  rows={Math.max(3, lineCount)}
                                                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                                                />
                                              );
                                            })()}

                                            {field.type === 'checklist' && (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                                {getSortedChecklistItems(fieldVal, field.defaultItems).map((chkItem) => (
                                                  <div key={chkItem.originalIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: chkItem.completed ? '#F8FAFC' : '#FFFFFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                                    <input
                                                      type="checkbox"
                                                      checked={Boolean(chkItem.completed)}
                                                      onChange={(e) => {
                                                        const currentArr = Array.isArray(fieldVal)
                                                          ? [...fieldVal]
                                                          : (field.defaultItems || []).map(t => (typeof t === 'object' ? { ...t } : { text: t, completed: false }));
                                                        currentArr[chkItem.originalIndex] = {
                                                          ...(typeof currentArr[chkItem.originalIndex] === 'object' ? currentArr[chkItem.originalIndex] : { text: currentArr[chkItem.originalIndex] }),
                                                          completed: e.target.checked
                                                        };
                                                        setDraftTemplateValues({ ...draftTemplateValues, [field.id]: currentArr });
                                                      }}
                                                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10B981' }}
                                                    />
                                                    <textarea
                                                      rows={Math.max(1, (chkItem.text || '').split('\n').length)}
                                                      value={chkItem.text || ''}
                                                      onChange={(e) => {
                                                        const currentArr = Array.isArray(fieldVal)
                                                          ? [...fieldVal]
                                                          : (field.defaultItems || []).map(t => (typeof t === 'object' ? { ...t } : { text: t, completed: false }));
                                                        currentArr[chkItem.originalIndex] = {
                                                          ...(typeof currentArr[chkItem.originalIndex] === 'object' ? currentArr[chkItem.originalIndex] : { text: currentArr[chkItem.originalIndex] }),
                                                          text: e.target.value
                                                        };
                                                        setDraftTemplateValues({ ...draftTemplateValues, [field.id]: currentArr });
                                                      }}
                                                      placeholder="체크 항목 내용 입력..."
                                                      style={{
                                                        flex: 1,
                                                        border: 'none',
                                                        outline: 'none',
                                                        backgroundColor: 'transparent',
                                                        fontSize: '13px',
                                                        color: chkItem.completed ? '#94A3B8' : '#1E293B',
                                                        textDecoration: chkItem.completed ? 'line-through' : 'none',
                                                        fontFamily: 'inherit',
                                                        resize: 'none'
                                                      }}
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      });

                                      if (grp.title) {
                                        return (
                                          <div key={`edit_grp_${gIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px', border: '1px dashed #CBD5E1', padding: '10px', borderRadius: '10px', backgroundColor: '#FAFAFA' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                                              🏷️ {grp.title}
                                            </div>
                                            {renderedFields}
                                          </div>
                                        );
                                      }

                                      return <React.Fragment key={`edit_ungrp_${gIdx}`}>{renderedFields}</React.Fragment>;
                                    })}
                                  </div>
                                );
                              })()
                            )
                          ) : (
                            // Checklist item detail in edit mode
                            (() => {
                              const selectedCheckItem = currentChecklists.find(c => c.id === selectedChecklistId) || currentChecklists[0];
                              if (!selectedCheckItem) {
                                return (
                                  <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                                    좌측에서 체크리스트 항목을 선택해주세요.
                                  </div>
                                );
                              }
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingBottom: '8px',
                                    marginBottom: '10px',
                                    borderBottom: '1px solid #E2E8F0'
                                  }}>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                                      ☑️ {selectedCheckItem.text} 상세내용
                                    </span>
                                  </div>
                                  <DetailBlocksManager
                                    blocks={checklistDetailBlocks}
                                    onChangeAndSave={(newBlocks) => handleSaveChecklistDetail(selectedCheckItem.id, newBlocks)}
                                    searchQuery={searchQuery}
                                    editingBlockId={editingBlockId}
                                    setEditingBlockId={setEditingBlockId}
                                  />
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={styles.splitReadContainer}>
                    {/* Left Card: Standalone Checklist Master Card */}
                    {(!isMobile || mobileSubTab === 'main') && (
                      <div style={styles.leftPaneCard} className={printTarget === 'checklist' ? 'print-area' : 'no-print'}>
                        {/* Title Header Line with Right-aligned Controls */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '10px',
                          paddingBottom: '10px',
                          borderBottom: '1px solid #F1F5F9'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            {isMobile && (
                              <button
                                onClick={navigateBack}
                                style={styles.mobileBackBtn}
                                title="목록으로 이동"
                              >
                                <ArrowLeft size={16} />
                                <span>목록</span>
                              </button>
                            )}
                            <h1 style={{ ...styles.readTitle, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {highlightText(activeItem.title, searchQuery)}
                            </h1>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} className="no-print">
                            <button
                              onClick={handleOpenChecklistPrint}
                              style={styles.btnSecondary}
                              className="no-print"
                              title="체크리스트 인쇄"
                            >
                              <Printer size={13} color="#334155" />
                              <span>인쇄</span>
                            </button>
                            {showSavedToast && (
                              <span style={styles.toastBadge}>
                                ✓ 저장됨
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setSelectedChecklistId('__main__');
                                setIsEditMode(true);
                              }}
                              style={styles.btnPrimary}
                              title="메모 기본정보 및 템플릿 수정"
                            >
                              <Edit2 size={13} />
                              수정
                            </button>
                          </div>
                        </div>



                        {/* Input Form for new multiline checklist item */}
                        <div style={styles.checklistInputContainer} className="no-print">
                          <div style={styles.checklistInputGroup}>
                            <textarea
                              rows={2}
                              value={newChecklistText}
                              onChange={(e) => setNewChecklistText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                  e.preventDefault();
                                  handleAddChecklist();
                                }
                              }}
                              placeholder="새 체크리스트 항목 입력... (Ctrl+Enter 항목 추가)"
                              style={styles.checklistTextarea}
                            />
                            <button
                              onClick={handleAddChecklist}
                              style={{
                                ...styles.checklistAddBtn,
                                opacity: newChecklistText.trim() ? 1 : 0.6,
                                cursor: newChecklistText.trim() ? 'pointer' : 'not-allowed'
                              }}
                              disabled={!newChecklistText.trim()}
                              title="체크리스트 추가 (Ctrl+Enter)"
                            >
                              <Plus size={15} />
                              <span>추가</span>
                            </button>
                          </div>
                        </div>

                        {/* Checklist Items List */}
                        <div style={styles.checklistListContainer}>
                          {currentChecklists.length === 0 ? (
                            <div style={styles.checklistEmptyText}>
                              등록된 체크리스트 항목이 없습니다. 위 입력창에서 항목을 추가해보세요!
                            </div>
                          ) : (
                            currentChecklists.map((checkItem) => {
                              const isEditing = editingCheckId === checkItem.id;
                              const isSelected = selectedChecklistId === checkItem.id;
                              const isDragged = draggedNoteChecklistId === checkItem.id;
                              const isDragOver = dragOverNoteChecklistId === checkItem.id;
                              const canDrag = !isEditing && checkItem.id !== '__main__';

                              return (
                                <div
                                  key={checkItem.id}
                                  draggable={canDrag}
                                  onDragStart={(e) => {
                                    if (!canDrag) return;
                                    setDraggedNoteChecklistId(checkItem.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', checkItem.id);
                                  }}
                                  onDragOver={(e) => {
                                    if (!canDrag) return;
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                    if (dragOverNoteChecklistId !== checkItem.id) {
                                      setDragOverNoteChecklistId(checkItem.id);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    if (!canDrag) return;
                                    handleNoteChecklistDrop(e, checkItem.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedNoteChecklistId(null);
                                    setDragOverNoteChecklistId(null);
                                  }}
                                  onClick={() => {
                                    if (!isEditing) {
                                      setSelectedChecklistId(checkItem.id);
                                      if (isMobile) setMobileSubTab('sub');
                                    }
                                  }}
                                  style={{
                                    ...styles.checklistItemRow,
                                    backgroundColor: isSelected ? '#EFF6FF' : (checkItem.completed ? '#F8FAFC' : '#FFFFFF'),
                                    border: isDragOver
                                      ? '1.5px solid #2563EB'
                                      : isSelected
                                        ? '1.5px solid #2563EB'
                                        : isEditing
                                          ? '1.5px solid #3B82F6'
                                          : checkItem.completed
                                            ? '1px solid #E2E8F0'
                                            : '1px solid #CBD5E1',
                                    boxShadow: isDragOver
                                      ? '0 -3px 0 0 #2563EB, 0 4px 12px rgba(37, 99, 235, 0.2)'
                                      : isSelected
                                        ? '0 0 0 1px #2563EB, 0 2px 6px rgba(37, 99, 235, 0.1)'
                                        : '0 1px 2px rgba(0, 0, 0, 0.03)',
                                    opacity: isDragged ? 0.4 : 1,
                                    cursor: canDrag ? 'grab' : 'pointer'
                                  }}
                                >
                                  {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                      <textarea
                                        rows={2}
                                        value={editingCheckText}
                                        onChange={(e) => setEditingCheckText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                            e.preventDefault();
                                            handleSaveEditChecklist(checkItem.id);
                                          }
                                        }}
                                        style={styles.checklistEditTextarea}
                                        autoFocus
                                      />
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                                        <button
                                          type="button"
                                          onClick={() => setEditingCheckId(null)}
                                          style={styles.btnSmallCancel}
                                        >
                                          <X size={13} /> 취소
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveEditChecklist(checkItem.id)}
                                          style={styles.btnSmallSave}
                                        >
                                          <Check size={13} /> 저장
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      width: '100%',
                                      gap: '8px',
                                      minHeight: '26px'
                                    }}>
                                      {/* Left Row: Drag Handle + Checkbox + Pure Text */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                        {canDrag && (
                                          <span
                                            style={{
                                              cursor: 'grab',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              color: '#94A3B8',
                                              flexShrink: 0
                                            }}
                                            title="드래그하여 순서 변경"
                                          >
                                            <GripVertical size={15} />
                                          </span>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleChecklist(checkItem.id);
                                          }}
                                          style={styles.checkboxBtn}
                                          title={checkItem.completed ? '미완료로 변경' : '완료로 변경'}
                                        >
                                          {checkItem.completed ? (
                                            <CheckSquare size={18} color="#2563EB" />
                                          ) : (
                                            <Square size={18} color="#94A3B8" />
                                          )}
                                        </button>
                                        <span
                                          style={{
                                            ...styles.checkitemText,
                                            flex: 1,
                                            minWidth: 0,
                                            textDecoration: checkItem.completed ? 'line-through' : 'none',
                                            color: checkItem.completed ? '#94A3B8' : (isSelected ? '#1E40AF' : '#1E293B'),
                                            fontWeight: isSelected ? 700 : (checkItem.completed ? 400 : 500)
                                          }}
                                        >
                                          {renderWithLinks(checkItem.text)}
                                        </span>
                                      </div>

                                      {/* Right End: 3-dot Menu */}
                                      <div style={{ position: 'relative', flexShrink: 0 }} className="no-print" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={(e) => handleOpenChecklistMenu(e, checkItem.id)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            backgroundColor: openChecklistMenuId === checkItem.id ? '#E2E8F0' : 'transparent',
                                            color: openChecklistMenuId === checkItem.id ? '#2563EB' : '#64748B',
                                            cursor: 'pointer'
                                          }}
                                          title="메뉴"
                                        >
                                          <MoreVertical size={16} />
                                        </button>

                                        {openChecklistMenuId === checkItem.id && (
                                          <>
                                            <div
                                              style={{
                                                position: 'fixed',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                zIndex: 9999,
                                                backgroundColor: 'transparent'
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenChecklistMenuId(null);
                                              }}
                                            />
                                            <div
                                              style={{
                                                ...styles.checklistDropdownMenu,
                                                top: openChecklistMenuPos?.top ?? 0,
                                                right: openChecklistMenuPos?.right ?? 0
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOpenChecklistMenuId(null);
                                                  setEditingCheckId(checkItem.id);
                                                  setEditingCheckText(checkItem.text);
                                                  setEditingCheckTag(checkItem.tag || '');
                                                }}
                                                style={styles.checklistDropdownItem}
                                              >
                                                <Edit2 size={14} color="#475569" />
                                                <span>수정</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOpenChecklistMenuId(null);
                                                  const preview = checkItem.text.length > 35 ? checkItem.text.slice(0, 35) + '...' : checkItem.text;
                                                  openDeleteModal(
                                                    '체크리스트 항목 삭제',
                                                    `'${preview}' 항목을 정말 삭제하시겠습니까?`,
                                                    () => handleDeleteChecklist(checkItem.id)
                                                  );
                                                }}
                                                style={{ ...styles.checklistDropdownItem, color: '#DC2626' }}
                                              >
                                                <Trash2 size={14} color="#DC2626" />
                                                <span>삭제</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setOpenChecklistMenuId(null)}
                                                style={styles.checklistDropdownItem}
                                              >
                                                <X size={14} color="#64748B" />
                                                <span>취소</span>
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Right Card: Detail for Selected Checklist or Parent Item */}
                    {(!isMobile || mobileSubTab === 'sub') && (
                      <div style={styles.rightPaneCard} className={printTarget === 'detail' ? 'print-area' : 'no-print'}>
                        {selectedChecklistId === '__main__' && activeItem.templateId && templates.find(t => t.id === activeItem.templateId) ? (
                          // Case 1: Template Applied
                          <>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingBottom: '10px',
                              marginBottom: '12px',
                              borderBottom: '1px solid #E2E8F0'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} color="#2563EB" />
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
                                  📋 [템플릿] {templates.find(t => t.id === activeItem.templateId).title}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-print">
                                <button
                                  onClick={handleOpenDetailPrint}
                                  style={styles.btnSecondary}
                                  title="상세내용 인쇄"
                                >
                                  <Printer size={13} color="#334155" />
                                  <span>인쇄</span>
                                </button>
                                <button
                                  onClick={() => setIsEditMode(true)}
                                  style={styles.btnPrimary}
                                >
                                  <Edit2 size={13} />
                                  수정
                                </button>
                              </div>
                            </div>

                            <div style={styles.readBody}>
                              {(() => {
                                const activeTpl = templates.find(t => t.id === activeItem.templateId);
                                const values = activeItem.templateValues || {};
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ padding: '6px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1E40AF', fontWeight: 600 }}>
                                      📋 <strong>{activeTpl.title}</strong> 템플릿 적용됨
                                    </div>
                                    {groupFieldsList(activeTpl.fields).map((grp, gIdx) => {
                                      const renderedFields = grp.fields.map((field) => {
                                        const val = values[field.id];
                                        const defaultTextVal = field.placeholder ? field.placeholder.replace(/\//g, '\n') : '';
                                        const currentVal = val !== undefined ? val : defaultTextVal;

                                        if (field.type === 'phone') {
                                          return (
                                            <div key={field.id} className={isPrintFieldSelected(field.id) ? "" : "no-print"} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                  <Phone size={14} color="#10B981" />
                                                  {field.label}
                                                </span>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                  {currentVal || '(전화번호 없음)'}
                                                </span>
                                              </div>
                                              {currentVal && (
                                                <a
                                                  href={`sms:${currentVal.replace(/[^0-9]/g, '')}`}
                                                  style={{ color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, whiteSpace: 'nowrap' }}
                                                >
                                                  <MessageSquare size={12} /> SMS 전송
                                                </a>
                                              )}
                                            </div>
                                          );
                                        }


                                          if (field.type === 'datetime') {
                                            const formattedDt = currentVal ? currentVal.replace('T', ' ') : '';
                                            return (
                                              <div key={field.id} className={isPrintFieldSelected(field.id) ? "" : "no-print"} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                    <CalendarIcon size={14} color="#8B5CF6" />
                                                    {field.label}
                                                  </span>
                                                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {formattedDt || '(날짜/시간 미선택)'}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          }

                                          return (
                                            <div key={field.id} className={isPrintFieldSelected(field.id) ? "" : "no-print"} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  {field.type === 'text' && <Type size={14} color="#2563EB" />}
                                                  {field.type === 'checklist' && <CheckSquare size={14} color="#F59E0B" />}
                                                  {field.label}
                                                </span>
                                              </div>

                                              {field.type === 'text' && (
                                                <div style={{ padding: '10px 12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#0F172A', minHeight: '38px' }}>
                                                  {renderWithLinks(currentVal || '(내용 없음)', searchQuery)}
                                                </div>
                                              )}

                                              {field.type === 'checklist' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                                                  {getSortedChecklistItems(currentVal, field.defaultItems).map((chk) => (
                                                    <div
                                                      key={chk.originalIndex}
                                                      onClick={() => handleToggleInlineChecklistInReadMode(field.id, chk.originalIndex, !chk.completed)}
                                                      style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        backgroundColor: chk.completed ? '#F8FAFC' : '#FFFFFF',
                                                        border: '1px solid #E2E8F0',
                                                        transition: 'all 0.15s ease'
                                                      }}
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={Boolean(chk.completed)}
                                                        onChange={(e) => {
                                                          e.stopPropagation();
                                                          handleToggleInlineChecklistInReadMode(field.id, chk.originalIndex, e.target.checked);
                                                        }}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10B981' }}
                                                      />
                                                      <span
                                                        style={{
                                                          fontSize: '13px',
                                                          textDecoration: chk.completed ? 'line-through' : 'none',
                                                          color: chk.completed ? '#94A3B8' : '#1E293B',
                                                          fontWeight: chk.completed ? 400 : 500,
                                                          whiteSpace: 'pre-wrap',
                                                          lineHeight: 1.5,
                                                          flex: 1
                                                        }}
                                                      >
                                                        {highlightText(chk.text, searchQuery)}
                                                      </span>
                                                      {chk.completed && (
                                                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, backgroundColor: '#D1FAE5', padding: '1px 6px', borderRadius: '4px' }}>
                                                          ✓ 완료
                                                        </span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        });

                                        if (grp.title) {
                                          return (
                                            <div key={`read_grp_${gIdx}`} style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #BFDBFE', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #DBEAFE', paddingBottom: '6px' }}>
                                                <Folder size={15} color="#2563EB" /> {grp.title}
                                              </div>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {renderedFields}
                                              </div>
                                            </div>
                                          );
                                        }

                                        return <React.Fragment key={`read_ungrp_${gIdx}`}>{renderedFields}</React.Fragment>;
                                      })}
                                    </div>
                                  );
                                })()}
                            </div>
                          </>
                        ) : (
                          // Case 2: Individual Checklist Item Selected
                          (() => {
                            const selectedCheckItem = currentChecklists.find(c => c.id === selectedChecklistId) || currentChecklists[0];
                            if (!selectedCheckItem) {
                              return (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                                  좌측에서 체크리스트 항목을 선택하거나 추가해 주세요.
                                </div>
                              );
                            }

                            return (
                              <>
                                {/* Header: Selected Checklist Item Title & Status */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingBottom: '10px',
                                  marginBottom: '12px',
                                  borderBottom: '1px solid #E2E8F0',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                  position: 'sticky',
                                  top: 0,
                                  backgroundColor: '#F8FAFC',
                                  zIndex: 10,
                                  flexShrink: 0
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                    <button
                                      onClick={() => handleToggleChecklist(selectedCheckItem.id)}
                                      style={styles.checkboxBtn}
                                      title={selectedCheckItem.completed ? '미완료로 변경' : '완료로 변경'}
                                    >
                                      {selectedCheckItem.completed ? (
                                        <CheckSquare size={20} color="#2563EB" />
                                      ) : (
                                        <Square size={20} color="#94A3B8" />
                                      )}
                                    </button>
                                    <span style={{
                                      fontSize: '15px',
                                      fontWeight: 700,
                                      color: selectedCheckItem.completed ? '#94A3B8' : '#1E293B',
                                      textDecoration: selectedCheckItem.completed ? 'line-through' : 'none',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {selectedCheckItem.text}
                                    </span>
                                    {selectedCheckItem.completed && (
                                      <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, backgroundColor: '#D1FAE5', padding: '2px 6px', borderRadius: '4px' }}>
                                        ✓ 완료됨
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-print">
                                    {showSavedToast && (
                                      <span style={styles.toastBadge}>
                                        ✓ 저장됨
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={handleAddNewTextBlock}
                                      style={{
                                        ...styles.btnSecondary,
                                        color: '#1D4ED8',
                                        backgroundColor: '#EFF6FF',
                                        borderColor: '#BFDBFE',
                                        fontWeight: 600
                                      }}
                                      title="새 텍스트 박스 추가"
                                    >
                                      <Plus size={13} />
                                      <span>텍스트박스</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={handleAddNewDividerBlock}
                                      style={{
                                        ...styles.btnSecondary,
                                        color: '#475569',
                                        backgroundColor: '#F8FAFC',
                                        borderColor: '#E2E8F0',
                                        fontWeight: 600
                                      }}
                                      title="새 구분선 추가"
                                    >
                                      <Minus size={13} />
                                      <span>구분선</span>
                                    </button>

                                    <button
                                      onClick={handleOpenDetailPrint}
                                      style={styles.btnSecondary}
                                      title="상세내용 인쇄"
                                    >
                                      <Printer size={13} color="#334155" />
                                      <span>인쇄</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Detail Content: Always interactive DetailBlocksManager */}
                                <DetailBlocksManager
                                  blocks={checklistDetailBlocks}
                                  onChangeAndSave={(newBlocks) => handleSaveChecklistDetail(selectedCheckItem.id, newBlocks)}
                                  searchQuery={searchQuery}
                                  editingBlockId={editingBlockId}
                                  setEditingBlockId={setEditingBlockId}
                                />
                              </>
                            );
                          })()
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Footer for Pane 3 Detail */}
              {isMobile && renderMobileFooter(
                <div style={{
                  ...styles.mobileTabBar,
                  borderBottom: 'none',
                  borderTop: '1px solid #CBD5E1'
                }}>
                  <button
                    onClick={() => setMobileSubTab('main')}
                    style={{
                      ...styles.mobileTabBtn,
                      backgroundColor: mobileSubTab === 'main' ? '#2563EB' : '#FFFFFF',
                      color: mobileSubTab === 'main' ? '#FFFFFF' : '#475569',
                      borderColor: mobileSubTab === 'main' ? '#2563EB' : '#CBD5E1'
                    }}
                  >
                    ☑️ 체크리스트
                  </button>
                  <button
                    onClick={() => setMobileSubTab('sub')}
                    style={{
                      ...styles.mobileTabBtn,
                      backgroundColor: mobileSubTab === 'sub' ? '#2563EB' : '#FFFFFF',
                      color: mobileSubTab === 'sub' ? '#FFFFFF' : '#475569',
                      borderColor: mobileSubTab === 'sub' ? '#2563EB' : '#CBD5E1'
                    }}
                  >
                    📝 항목 상세내용
                  </button>
                </div>
              )}
            </>
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
      {isChecklistPrintModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsChecklistPrintModalOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
                <Printer size={18} color="#2563EB" />
                <span>체크리스트 인쇄 항목 선택</span>
              </div>
              <button onClick={() => setIsChecklistPrintModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
              출력할 체크리스트 항목을 선택해 주세요:
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const allObj = {};
                  currentChecklists.forEach(c => { allObj[c.id] = true; });
                  setSelectedPrintChecklistIds(allObj);
                }}
                style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={() => {
                  const noneObj = {};
                  currentChecklists.forEach(c => { noneObj[c.id] = false; });
                  setSelectedPrintChecklistIds(noneObj);
                }}
                style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
              >
                전체 해제
              </button>
              <button
                type="button"
                onClick={() => {
                  const uncompObj = {};
                  currentChecklists.forEach(c => { uncompObj[c.id] = !c.completed; });
                  setSelectedPrintChecklistIds(uncompObj);
                }}
                style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', color: '#1E40AF', cursor: 'pointer', fontWeight: 600 }}
              >
                미완료만 선택
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
              {currentChecklists.map((checkItem) => (
                <label key={checkItem.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: checkItem.completed ? '#F8FAFC' : '#FFFFFF', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedPrintChecklistIds[checkItem.id] !== false}
                    onChange={(e) => setSelectedPrintChecklistIds({ ...selectedPrintChecklistIds, [checkItem.id]: e.target.checked })}
                    style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '13px', color: checkItem.completed ? '#10B981' : '#CBD5E1', fontWeight: 700 }}>
                      {checkItem.completed ? '☑' : '☐'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: checkItem.completed ? '#64748B' : '#1E293B', textDecoration: checkItem.completed ? 'line-through' : 'none' }}>
                      {checkItem.text}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setIsChecklistPrintModalOpen(false)} style={styles.btnSecondary}>
                취소
              </button>
              <button onClick={handleConfirmChecklistPrint} style={styles.btnPrimary}>
                <Printer size={14} />
                <span>선택 항목 인쇄</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Field Print Selection Modal */}
      {isPrintModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsPrintModalOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
                <Printer size={18} color="#2563EB" />
                <span>인쇄 항목 선택</span>
              </div>
              <button onClick={() => setIsPrintModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
              출력할 템플릿 항목을 선택해 주세요:
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  const activeTpl = templates.find(t => t.id === activeItem?.templateId);
                  const allObj = {};
                  activeTpl?.fields?.forEach(f => { allObj[f.id] = true; });
                  setSelectedPrintFieldIds(allObj);
                }}
                style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={() => {
                  const activeTpl = templates.find(t => t.id === activeItem?.templateId);
                  const noneObj = {};
                  activeTpl?.fields?.forEach(f => { noneObj[f.id] = false; });
                  setSelectedPrintFieldIds(noneObj);
                }}
                style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
              >
                전체 해제
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
              {(() => {
                const activeTpl = templates.find(t => t.id === activeItem?.templateId);
                if (!activeTpl || !activeTpl.fields) return null;
                return activeTpl.fields.map(field => (
                  <label key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedPrintFieldIds[field.id] !== false}
                      onChange={(e) => setSelectedPrintFieldIds({ ...selectedPrintFieldIds, [field.id]: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                      {field.label}
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 400 }}>
                        ({field.type === 'phone' ? '전화번호' : field.type === 'datetime' ? '일시' : field.type === 'checklist' ? '체크리스트' : '텍스트'})
                      </span>
                    </span>
                  </label>
                ));
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setIsPrintModalOpen(false)} style={styles.btnSecondary}>
                취소
              </button>
              <button onClick={handleConfirmTemplatePrint} style={styles.btnPrimary}>
                <Printer size={14} />
                <span>선택 항목 인쇄</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Custom Delete Confirmation Modal */}
      {deleteModalState.isOpen && (
        <div style={styles.modalOverlay} onClick={closeDeleteModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalDangerIconWrapper}>
                  <Trash2 size={18} color="#DC2626" />
                </div>
                <h3 style={styles.modalTitle}>{deleteModalState.title || '삭제 확인'}</h3>
              </div>
              <button onClick={closeDeleteModal} style={styles.modalCloseBtn} title="닫기">
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.modalMessage}>{deleteModalState.message}</p>
            </div>

            <div style={styles.modalFooter}>
              <button type="button" onClick={closeDeleteModal} style={styles.btnModalCancel}>
                취소
              </button>
              <button
                ref={deleteConfirmBtnRef}
                type="button"
                autoFocus
                onClick={handleConfirmDelete}
                style={styles.btnModalDelete}
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Move Modal (Mobile & Desktop) */}
      {movingCategory && (
        <div style={styles.modalOverlay} onClick={() => setMovingCategory(null)}>
          <div style={{ ...styles.modalContent, maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FolderInput size={18} color="#2563EB" />
                </div>
                <h3 style={styles.modalTitle}>폴더 이동</h3>
              </div>
              <button onClick={() => setMovingCategory(null)} style={styles.modalCloseBtn} title="닫기">
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={{ ...styles.modalMessage, marginBottom: '14px' }}>
                <strong>'{movingCategory.name}'</strong> 폴더의 상위(부모) 폴더를 선택하세요:
              </p>
              <select
                value={targetMoveParentId}
                onChange={(e) => setTargetMoveParentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  outline: 'none',
                  backgroundColor: '#F8FAFC'
                }}
              >
                <option value="">[ 최상위(루트) 폴더 ]</option>
                {getHierarchicalCategoryOptions(currentScope, movingCategory.id)
                  .filter((c) => !FIXED_INBOX_IDS.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName || c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setMovingCategory(null)} style={styles.btnModalCancel}>
                취소
              </button>
              <button
                onClick={async () => {
                  try {
                    const newPid = targetMoveParentId.trim() || null;
                    await updateDoc(doc(db, 'categories', movingCategory.id), {
                      parentId: newPid
                    });
                    if (newPid) {
                      setExpandedFolders((prev) => ({ ...prev, [newPid]: true }));
                    }
                    setMovingCategory(null);
                  } catch (err) {
                    console.error('Error moving category:', err);
                  }
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Toast Notification for Mobile double back press */}
      {showExitToast && (
        <div style={styles.exitToast}>
          앱을 종료하시겠습니까? 뒤로 가기를 한 번 더 누르면 종료됩니다.
        </div>
      )}
    </div>
  );
}

// ---------------- Style Tokens & Layout CSS Objects ----------------
const styles = {
  appContainer: {
    display: 'flex',
    width: '100vw',
    height: '100dvh',
    backgroundColor: '#FAFAF8',
    overflow: 'hidden',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    position: 'relative'
  },

  mobileFooterContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #CBD5E1',
    flexShrink: 0,
    paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
    zIndex: 90
  },

  mobileFabBtn: {
    position: 'fixed',
    bottom: 'max(76px, calc(env(safe-area-inset-bottom, 0px) + 76px))',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'transform 0.15s ease, background-color 0.15s ease'
  },

  // Pane 1: Category (Pastel Blue, 280px)
  pane1: {
    height: '100%',
    backgroundColor: '#EBF3FA',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #D4E3F3'
  },
  pane1Header: {
    height: '52px',
    padding: '0 12px 0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #D4E3F3',
    backgroundColor: '#E2ECF7'
  },
  pane1Title: {
    color: '#2B5278',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.5px'
  },
  quickAddBtn: {
    backgroundColor: '#D8E6F5',
    color: '#1E3A5F',
    border: '1px solid #BFD7F2',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease'
  },
  iconBtnDark: {
    background: 'none',
    border: 'none',
    color: '#4A729A',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s, background-color 0.15s'
  },

  paneContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  },

  inlineInputRowDark: {
    padding: '4px 8px',
    marginBottom: '6px'
  },
  inputDark: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    border: '1px solid #3B82F6',
    borderRadius: '4px',
    padding: '6px 10px',
    color: '#1E293B',
    fontSize: '13px',
    outline: 'none'
  },
  inputDarkInline: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    border: '1px solid #3B82F6',
    borderRadius: '3px',
    padding: '2px 6px',
    color: '#1E293B',
    fontSize: '13px',
    outline: 'none'
  },

  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '3px',
    fontSize: '14px',
    position: 'relative'
  },
  rowLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  actionBtnDark: {
    background: 'none',
    border: 'none',
    color: '#7C95B1',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '3px'
  },
  actionBtnConfirm: {
    background: 'rgba(37, 99, 235, 0.15)',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center'
  },
  actionBtnCancel: {
    background: 'rgba(229, 115, 115, 0.2)',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center'
  },

  // Pane 2: Notes List (Light, 308px)
  pane2: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #ECEBE7'
  },
  pane2Header: {
    height: '52px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #ECEBE7',
    backgroundColor: '#FAF9F6'
  },
  pane2Title: {
    color: '#22262A',
    fontSize: '14px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  iconBtnLight: {
    background: 'none',
    border: 'none',
    color: '#3C3F42',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  mobileBackBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    fontWeight: 600,
    padding: '4px 6px',
    borderRadius: '4px'
  },

  emptyStateText: {
    color: '#A0A6B2',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '40px'
  },

  itemCard: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ECEBE7',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  itemCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1
  },
  inputLightInline: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    border: '1px solid #3F7A63',
    borderRadius: '3px',
    padding: '2px 6px',
    color: '#22262A',
    fontSize: '13px',
    outline: 'none'
  },
  actionGroupLight: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  actionBtnLight: {
    background: 'none',
    border: 'none',
    color: '#8A909A',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '3px'
  },
  itemPreview: {
    fontSize: '11px',
    color: '#7E8592',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },

  // Pane 3: Detail Workspace (Flex 1)
  pane3: {
    flex: 1,
    height: '100%',
    backgroundColor: '#FAFAF8',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  pane3Header: {
    height: '46px',
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #ECEBE7',
    backgroundColor: '#FFFFFF'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#6C727E'
  },

  btnPrimary: {
    backgroundColor: '#3F7A63',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.15s'
  },
  btnSecondary: {
    backgroundColor: '#EFEFEA',
    color: '#3C3F42',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  toastBadge: {
    backgroundColor: 'rgba(63, 122, 99, 0.12)',
    color: '#3F7A63',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600
  },

  mobileTabBar: {
    display: 'flex',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #CBD5E1',
    padding: '4px 8px',
    gap: '6px'
  },
  mobileTabBtn: {
    flex: 1,
    padding: '7px 0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },

  pane3Body: {
    flex: 1,
    overflow: 'hidden',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0
  },
  pane3Empty: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF8'
  },

  // Split Read & Edit Layouts
  splitReadContainer: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    flex: 1,
    minHeight: 0,
    alignItems: 'stretch'
  },
  leftPaneCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '14px 16px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
  },
  rightPaneCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '14px 16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column'
  },
  subNoteHeader: {
    paddingBottom: '8px',
    marginBottom: '10px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  subNoteTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1E293B',
    display: 'flex',
    alignItems: 'center'
  },
  subNoteBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#334155',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    flex: 1
  },
  subNoteEmptyText: {
    color: '#94A3B8',
    fontSize: '13px',
    lineHeight: 1.5
  },

  readTitle: {
    fontSize: '19px',
    fontWeight: 700,
    color: '#22262A',
    marginBottom: '12px',
    lineHeight: 1.3
  },
  readBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#3C3F42',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },

  splitEditContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    minHeight: 0,
    width: '100%'
  },
  splitEditFields: {
    display: 'flex',
    gap: '10px',
    flex: 1,
    minHeight: 0
  },
  editPaneMainCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
  },
  editPaneSubCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569'
  },

  headerCategorySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F1F5F9',
    padding: '3px 6px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1'
  },
  headerCategoryLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569'
  },
  headerCategorySelect: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #94A3B8',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#1E293B',
    outline: 'none',
    cursor: 'pointer'
  },

  editTitleInput: {
    width: '100%',
    fontSize: '18px',
    fontWeight: 700,
    padding: '8px 12px',
    border: '1px solid #DCE0E6',
    borderRadius: '6px',
    outline: 'none',
    color: '#22262A',
    backgroundColor: '#FFFFFF'
  },
  editBodyTextarea: {
    width: '100%',
    minHeight: '360px',
    flex: 1,
    fontSize: '14px',
    lineHeight: 1.6,
    padding: '10px 12px',
    border: '1px solid #DCE0E6',
    borderRadius: '6px',
    outline: 'none',
    color: '#22262A',
    backgroundColor: '#FFFFFF',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  editSubBodyTextarea: {
    width: '100%',
    minHeight: '360px',
    flex: 1,
    fontSize: '14px',
    lineHeight: 1.6,
    padding: '10px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    resize: 'vertical',
    fontFamily: 'inherit'
  },

  // Checklist Card Styles
  checklistHeader: {
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  checklistCountBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid #BFDBFE'
  },
  progressBarTrack: {
    height: '4px',
    backgroundColor: '#E2E8F0',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.25s ease, background-color 0.25s ease'
  },
  checklistInputGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    alignItems: 'stretch'
  },
  checklistTextarea: {
    flex: 1,
    fontSize: '12px',
    padding: '6px 10px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    backgroundColor: '#FFFFFF'
  },
  checklistAddBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '0 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0
  },
  checklistListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
    flex: 1,
    padding: '4px 6px 8px 4px'
  },
  checklistItemRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '6px',
    padding: '9px 12px',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease'
  },
  checkitemStatusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    paddingTop: '6px',
    borderTop: '1px dashed #E2E8F0',
    width: '100%',
    minHeight: '22px'
  },
  checkboxBtn: {
    background: 'none',
    border: 'none',
    padding: '2px 0 0 0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: '#2563EB',
    flexShrink: 0
  },
  checkitemText: {
    fontSize: '12.5px',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    display: 'inline'
  },
  checklistEditTextarea: {
    width: '100%',
    fontSize: '13px',
    padding: '2px 4px',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  btnSmallSave: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  },
  btnSmallCancel: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  },
  btnSmallManage: {
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease'
  },
  badgeDropdownSelect: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
    maxWidth: '130px'
  },
  checkitemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    flexShrink: 0
  },
  checklistEmptyText: {
    color: '#94A3B8',
    fontSize: '13px',
    lineHeight: 1.5,
    padding: '12px 0'
  },

  // Global Delete Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    padding: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  modalDangerIconWrapper: {
    backgroundColor: '#FEE2E2',
    borderRadius: '50%',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1E293B',
    margin: 0
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569'
  },
  modalMessage: {
    margin: 0,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap'
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #F1F5F9'
  },
  btnModalCancel: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  },
  btnModalDelete: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)',
    outline: '2px solid #EF4444',
    outlineOffset: '2px'
  },

  // Main Mode Bar Styles
  mainModeBar: {
    display: 'flex',
    padding: '8px',
    gap: '6px',
    backgroundColor: '#DCE7F3',
    borderBottom: '1px solid #C4D9EE'
  },
  mainModeTabBtn: {
    flex: 1,
    padding: '7px 0',
    borderRadius: '6px',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease'
  },

  // Checklist Schedule Option Styles
  checklistInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px'
  },
  scheduleOptionBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    flexWrap: 'wrap'
  },
  scheduleField: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FFFFFF',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #CBD5E1'
  },
  scheduleDateInput: {
    border: 'none',
    fontSize: '12px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none',
    backgroundColor: 'transparent'
  },
  scheduleTimeInput: {
    border: 'none',
    fontSize: '12px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none',
    backgroundColor: 'transparent'
  },
  allDayCheckLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer'
  },
  scheduleClearBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto'
  },
  itemScheduleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '1px 6px',
    borderRadius: '4px',
    marginTop: 0,
    border: '1px solid #BFDBFE'
  },

  exitToast: {
    position: 'fixed',
    bottom: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    color: '#FFFFFF',
    padding: '12px 22px',
    borderRadius: '24px',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    zIndex: 99999,
    pointerEvents: 'none',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(4px)'
  },

  checklistDropdownMenu: {
    position: 'fixed',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08)',
    border: '1px solid #E2E8F0',
    padding: '4px',
    zIndex: 10000,
    minWidth: '100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    whiteSpace: 'nowrap'
  },
  checklistDropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '7px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#334155',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.12s ease',
    userSelect: 'none'
  }
};
