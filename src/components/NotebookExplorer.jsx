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
  Edit2,
  Trash2,
  Check,
  X,
  Folder,
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
  Clock,
  Tag,
  ArrowUp,
  ArrowDown,
  Settings,
  Layout,
  Phone,
  MessageSquare,
  Type,
  ExternalLink,
  Printer
} from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';

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

const FIXED_INBOX_IDS = ['inbox', 'blog_inbox', 'clipboard_inbox', 'balance_inbox', 'clip_inbox'];

const getScopeForTab = (tab) => {
  if (tab === 'blog') return 'blog';
  if (tab === 'clipboard') return 'clipboard';
  if (tab === 'balance') return 'balance';
  if (tab === 'clip') return 'clip';
  return 'explorer';
};

const getInboxIdForTab = (tab) => {
  if (tab === 'blog') return 'blog_inbox';
  if (tab === 'clipboard') return 'clipboard_inbox';
  if (tab === 'balance') return 'balance_inbox';
  if (tab === 'clip') return 'clip_inbox';
  return 'inbox';
};

const getFixedCategoryForTab = (tab) => {
  if (tab === 'blog') return BLOG_INBOX_CATEGORY;
  if (tab === 'clipboard') return CLIPBOARD_INBOX_CATEGORY;
  if (tab === 'balance') return BALANCE_INBOX_CATEGORY;
  if (tab === 'clip') return CLIP_INBOX_CATEGORY;
  return INBOX_CATEGORY;
};

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

  // Category inline editing states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  // Item inline editing states (Pane 2)
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemTitle, setEditingItemTitle] = useState('');
  const [deletingItemId, setDeletingItemId] = useState(null);

  // Detail View (Pane 3) states - Split 2-pane Layout
  const [isEditMode, setIsEditMode] = useState(false);
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
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Template Tab Dedicated Canvas States
  const [selectedTemplateIdInTab, setSelectedTemplateIdInTab] = useState(null); // templateId or 'NEW'
  const [tplDraftTitle, setTplDraftTitle] = useState('');
  const [tplDraftFields, setTplDraftFields] = useState([]);
  const [tplDraftChecklists, setTplDraftChecklists] = useState([]);
  const [tplEditorSection, setTplEditorSection] = useState('fields'); // 'fields' | 'checklists'
  const [isSavingTpl, setIsSavingTpl] = useState(false);

  // Checklist local states
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCheckDueDate, setNewCheckDueDate] = useState('');
  const [newCheckIsAllDay, setNewCheckIsAllDay] = useState(true);
  const [newCheckDueTime, setNewCheckDueTime] = useState('09:00');
  const [newCheckPriority, setNewCheckPriority] = useState('');

  const [editingCheckId, setEditingCheckId] = useState(null);
  const [editingCheckText, setEditingCheckText] = useState('');
  const [editingCheckDueDate, setEditingCheckDueDate] = useState('');
  const [editingCheckIsAllDay, setEditingCheckIsAllDay] = useState(true);
  const [editingCheckDueTime, setEditingCheckDueTime] = useState('09:00');
  const [editingCheckPriority, setEditingCheckPriority] = useState('');
  const [editingCheckTag, setEditingCheckTag] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');



  // Global Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
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
    if (deleteModalState.onConfirm) {
      try {
        await deleteModalState.onConfirm();
      } catch (err) {
        console.error('Delete execution error:', err);
      }
    }
    closeDeleteModal();
  };

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

  // Compute active item checklists (with legacy subBody fallback)
  const rawChecklists = activeItem?.checklists
    ? activeItem.checklists
    : activeItem?.subBody
      ? activeItem.subBody.split('\n').filter((l) => l.trim().length > 0).map((line, idx) => ({
          id: `legacy_${idx}`,
          text: line,
          completed: false
        }))
      : [];

  const currentChecklists = [...rawChecklists].sort((a, b) => {
    const aDone = Boolean(a.completed);
    const bDone = Boolean(b.completed);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return 0;
  });

  const completedCount = currentChecklists.filter((c) => c.completed).length;
  const totalCount = currentChecklists.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Checklist Handlers
  const handleToggleChecklist = async (checkId) => {
    if (!activeItem) return;
    const updated = currentChecklists.map((c) =>
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
      dueDate: newCheckDueDate || null,
      isAllDay: newCheckIsAllDay,
      dueTime: newCheckIsAllDay ? null : (newCheckDueTime || '09:00'),
      priority: newCheckPriority || null
    };
    const updated = [...currentChecklists, newItem];
    setNewChecklistText('');
    setNewCheckDueDate('');
    setNewCheckIsAllDay(true);
    setNewCheckDueTime('09:00');
    setNewCheckPriority('');
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding checklist:', err);
    }
  };

  const handleSaveEditChecklist = async (checkId) => {
    if (!activeItem || !editingCheckText.trim()) return;
    const finalTag = editingCheckTag === 'custom' ? customTagInput.trim() : editingCheckTag;
    const updated = currentChecklists.map((c) =>
      c.id === checkId
        ? {
            ...c,
            text: editingCheckText.trim(),
            dueDate: editingCheckDueDate || null,
            isAllDay: editingCheckIsAllDay,
            dueTime: editingCheckIsAllDay ? null : (editingCheckDueTime || '09:00'),
            priority: editingCheckPriority || null,
            tag: finalTag || null
          }
        : c
    );
    setEditingCheckId(null);
    setEditingCheckText('');
    setEditingCheckDueDate('');
    setEditingCheckIsAllDay(true);
    setEditingCheckDueTime('09:00');
    setEditingCheckPriority('');
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
    const updated = currentChecklists.filter((c) => c.id !== checkId);
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error deleting checklist:', err);
    }
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
    } else {
      setDraftTitle('');
      setDraftBody('');
      setDraftSubBody('');
      setDraftCategoryId('inbox');
      setDraftTemplateId(null);
      setDraftTemplateValues({});
      setDraftChecklists(null);
    }
    setIsEditMode(false);
  }, [selectedItemId]);

  // ESC key handler for cancelling delete modal & detail edit mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (deleteModalState.isOpen) {
          closeDeleteModal();
        } else if (isEditMode) {
          handleCancelDetailEdit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteModalState.isOpen, isEditMode, activeItem]);

  // ---------------- Category Handlers ----------------
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setIsAddingCategory(false);
      return;
    }
    try {
      const currentScope = getScopeForTab(activeMainTab);
      const newRef = doc(collection(db, 'categories'));
      await setDoc(newRef, {
        name: newCategoryName.trim(),
        order: categories.length,
        scope: currentScope,
        createdAt: serverTimestamp()
      });
      navigateToItems(newRef.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
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

  const handleDeleteCategory = async (catId) => {
    if (FIXED_INBOX_IDS.includes(catId)) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'categories', catId));
      const childItems = items.filter((item) => item.categoryId === catId);
      childItems.forEach((item) => {
        batch.delete(doc(db, 'items', item.id));
      });
      await batch.commit();

      setDeletingCategoryId(null);
      if (selectedCategoryId === catId) {
        setSelectedCategoryId(getInboxIdForTab(activeMainTab));
      }
    } catch (err) {
      console.error('Error deleting category and child items:', err);
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

  const handleAddTplFieldInCanvas = (type) => {
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
      { id: newId, type, label: defaultLabel, placeholder: defaultPlaceholder, ...extraProps }
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

  // Template Checklist Handlers
  const handleAddTplChecklistInCanvas = () => {
    setTplDraftChecklists((prev) => [
      ...prev,
      { id: `tplchk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, text: '', priority: null }
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
        defaultItems: Array.isArray(f.defaultItems) ? f.defaultItems : []
      }));

      const cleanChecklists = tplDraftChecklists.map((c) => ({
        id: c.id || `tplchk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: c.text || '',
        priority: c.priority || null
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

  const handleDeleteTemplateInTab = async (id) => {
    if (!window.confirm('정말 이 템플릿을 삭제하시겠습니까?')) return;
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
  };

  const handleSaveDetail = async () => {
    if (!selectedItemId) return;
    try {
      const finalBody = draftTemplateId ? buildTemplateCombinedBody(draftTemplateId, draftTemplateValues) : draftBody;

      const updatePayload = {
        title: draftTitle,
        body: finalBody,
        subBody: draftSubBody,
        categoryId: draftCategoryId,
        templateId: draftTemplateId || null,
        templateValues: draftTemplateValues || {},
        updatedAt: serverTimestamp()
      };

      if (draftChecklists !== null) {
        updatePayload.checklists = draftChecklists;
      }

      await updateDoc(doc(db, 'items', selectedItemId), updatePayload);
      if (draftCategoryId !== selectedCategoryId) {
        setSelectedCategoryId(draftCategoryId);
      }
      setIsEditMode(false);
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
    }
    setIsEditMode(false);
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
      {/* Top Row: 노트, 블로그, 앱개발, 캘린더 */}
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

      {/* Bottom Row: 계약, 클립, 템플릿 */}
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
                      onClick={() => setIsAddingCategory(true)}
                      style={styles.iconBtnDark}
                      title="카테고리 추가"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div style={styles.paneContent}>
                {isAddingCategory && (
                  <div style={styles.inlineInputRowDark}>
                    <input
                      autoFocus
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory();
                        if (e.key === 'Escape') setIsAddingCategory(false);
                      }}
                      onBlur={handleAddCategory}
                      placeholder="카테고리명..."
                      style={styles.inputDark}
                    />
                  </div>
                )}

                {allCategories.map((cat) => {
                  const isSelected = cat.id === selectedCategoryId;
                  const isEditing = cat.id === editingCategoryId;
                  const isDeleting = cat.id === deletingCategoryId;
                  const isFixed = cat.isFixed;
                  const count = FIXED_INBOX_IDS.includes(cat.id)
                    ? items.filter((item) => {
                        if (cat.id === 'inbox') return !item.categoryId || item.categoryId === 'inbox';
                        return item.categoryId === cat.id;
                      }).length
                    : items.filter((item) => item.categoryId === cat.id).length;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        if (!isEditing && !isDeleting) navigateToItems(cat.id);
                      }}
                      style={{
                        ...styles.catRow,
                        backgroundColor: isSelected ? '#D8E6F5' : 'transparent',
                        color: isSelected ? '#1E3A5F' : '#4A607A',
                        fontWeight: isSelected ? 600 : 400
                      }}
                    >
                      {isFixed ? (
                        <Inbox size={16} color={isSelected ? '#2563EB' : '#7C95B1'} style={{ flexShrink: 0 }} />
                      ) : (
                        <Folder size={16} color={isSelected ? '#2563EB' : '#7C95B1'} style={{ flexShrink: 0 }} />
                      )}

                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateCategoryName(cat.id);
                            if (e.key === 'Escape') setEditingCategoryId(null);
                          }}
                          onBlur={() => handleUpdateCategoryName(cat.id)}
                          style={styles.inputDarkInline}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cat.name}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: isSelected ? '#2563EB' : '#7C95B1',
                            fontWeight: isSelected ? 700 : 500,
                            flexShrink: 0
                          }}>
                            ({count})
                          </span>
                        </div>
                      )}

                      {!isFixed && (
                        <div style={styles.actionGroup}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategoryId(cat.id);
                              setEditingCategoryName(cat.name);
                            }}
                            style={styles.actionBtnDark}
                            title="이름 변경"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(
                                '카테고리 삭제',
                                `'${cat.name}' 카테고리를 삭제하시겠습니까?\n카테고리 안의 모든 메모도 함께 삭제됩니다.`,
                                () => handleDeleteCategory(cat.id)
                              );
                            }}
                            style={styles.actionBtnDark}
                            title="삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                      onClick={() => setIsAddingCategory(true)}
                      style={styles.iconBtnDark}
                      title="카테고리 추가"
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
                        {activeCategory ? activeCategory.name : '목록'}
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
                    justify: 'space-between',
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
                      {activeCategory ? activeCategory.name : '목록'} ({filteredItems.length})
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

                <div style={styles.paneContent}>
                  {filteredItems.length === 0 ? (
                    <div style={styles.emptyStateText}>
                      등록된 메모가 없습니다.
                    </div>
                  ) : (
                    filteredItems.map((item) => {
                        const isSelected = item.id === selectedItemId;
                        const isEditing = item.id === editingItemId;
                        const isDeleting = item.id === deletingItemId;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (!isEditing && !isDeleting) navigateToDetail(item.id);
                            }}
                            style={{
                              ...styles.itemCard,
                              backgroundColor: isSelected ? '#F0F7F4' : '#FFFFFF',
                              borderColor: isSelected ? '#3F7A63' : '#ECEBE7'
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
                                    {item.title || '제목 없음'}
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

                  {/* Template Canvas Section Sub-Tabs */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => setTplEditorSection('fields')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 18px',
                          border: 'none',
                          borderBottom: tplEditorSection === 'fields' ? '3px solid #2563EB' : '3px solid transparent',
                          backgroundColor: 'transparent',
                          color: tplEditorSection === 'fields' ? '#2563EB' : '#64748B',
                          fontWeight: tplEditorSection === 'fields' ? 700 : 500,
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        <Type size={16} /> 1. 상세내용 구성 ({tplDraftFields.length})
                      </button>
                      <button
                        onClick={() => setTplEditorSection('checklists')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 18px',
                          border: 'none',
                          borderBottom: tplEditorSection === 'checklists' ? '3px solid #8B5CF6' : '3px solid transparent',
                          backgroundColor: 'transparent',
                          color: tplEditorSection === 'checklists' ? '#8B5CF6' : '#64748B',
                          fontWeight: tplEditorSection === 'checklists' ? 700 : 500,
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckSquare size={16} /> 2. 체크리스트 미리 설정 ({tplDraftChecklists.length})
                      </button>
                    </div>

                    {/* Toolbar Action for Current Active Sub-Tab */}
                    {tplEditorSection === 'fields' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>요소 추가:</span>
                        <button onClick={() => handleAddTplFieldInCanvas('text')} style={{ ...styles.toolBtn, borderColor: '#1E293B', color: '#1E293B', padding: '5px 10px', fontSize: '12px' }}>
                          <Type size={13} color="#1E293B" /> 📝 텍스트
                        </button>
                        <button onClick={() => handleAddTplFieldInCanvas('phone')} style={{ ...styles.toolBtn, borderColor: '#EC4899', color: '#EC4899', padding: '5px 10px', fontSize: '12px' }}>
                          <Phone size={13} color="#EC4899" /> 📞 전화번호
                        </button>
                        <button onClick={() => handleAddTplFieldInCanvas('datetime')} style={{ ...styles.toolBtn, borderColor: '#10B981', color: '#10B981', padding: '5px 10px', fontSize: '12px' }}>
                          <CalendarIcon size={13} color="#10B981" /> 📅 날짜/시간
                        </button>
                        <button onClick={() => handleAddTplFieldInCanvas('checklist')} style={{ ...styles.toolBtn, borderColor: '#8B5CF6', color: '#8B5CF6', padding: '5px 10px', fontSize: '12px' }}>
                          <CheckSquare size={13} color="#8B5CF6" /> ☑️ 인라인 체크
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAddTplChecklistInCanvas}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #8B5CF6', backgroundColor: '#F5F3FF', color: '#7C3AED', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                      >
                        <Plus size={15} /> 체크 항목 추가
                      </button>
                    )}
                  </div>

                  {/* Canvas Main Area (Full Width Field / Checklist Editor) */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, paddingRight: '4px' }}>
                    {tplEditorSection === 'fields' ? (
                      <>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>✏️ 상세내용 입력 요소 편집</span>
                        </div>
                        {tplDraftFields.length === 0 ? (
                          <div style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '2px dashed #CBD5E1' }}>
                            <p style={{ fontSize: '16px', color: '#334155', fontWeight: 700, margin: 0 }}>
                              배치된 상세내용 요소가 없습니다.
                            </p>
                            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>
                              상단의 <strong>[요소 추가]</strong> 버튼을 클릭하여 텍스트 입력창, 전화번호 박스, 날짜/시간 박스, 인라인 체크리스트를 구성해보세요!
                            </p>
                          </div>
                        ) : (
                          tplDraftFields.map((field, idx) => {
                            const borderColor = field.type === 'phone' ? '#EC4899' : field.type === 'datetime' ? '#10B981' : field.type === 'checklist' ? '#8B5CF6' : '#1E293B';
                            const bgColor = field.type === 'phone' ? '#FDF2F8' : field.type === 'datetime' ? '#F0FDF4' : field.type === 'checklist' ? '#F5F3FF' : '#F8FAFC';

                            return (
                              <div key={field.id} style={{ backgroundColor: bgColor, border: `2px solid ${borderColor}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                                  {/* Label Input */}
                                  <div style={{ flex: 1, minWidth: '160px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: borderColor, marginBottom: '4px' }}>
                                      항목명 (Label)
                                      <span style={{ fontSize: '11px', color: borderColor, fontWeight: 600 }}>
                                        ({field.type === 'text' ? '📝 텍스트' : field.type === 'phone' ? '📞 전화번호' : field.type === 'datetime' ? '📅 날짜/시간' : '☑️ 체크리스트'})
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      value={field.label}
                                      onChange={(e) => {
                                        const updated = [...tplDraftFields];
                                        updated[idx].label = e.target.value;
                                        setTplDraftFields(updated);
                                      }}
                                      placeholder="예: 미팅 안건, 담당자 연락처, 체크 항목"
                                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${borderColor}`, fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                    />
                                  </div>

                                  {/* Placeholder/Default Value Input (non-checklist) */}
                                  {field.type !== 'checklist' && (
                                    <div style={{ flex: 1.2, minWidth: '160px' }}>
                                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: borderColor, marginBottom: '4px' }}>초기내용</label>
                                      <input
                                        type="text"
                                        value={field.placeholder || ''}
                                        onChange={(e) => {
                                          const updated = [...tplDraftFields];
                                          const val = field.type === 'phone' ? autoFormatPhoneNumber(e.target.value) : e.target.value;
                                          updated[idx].placeholder = val;
                                          setTplDraftFields(updated);
                                        }}
                                        placeholder="예: 소재지/임대료/계약기간 (/ 는 줄바꿈)"
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${borderColor}`, fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
                                      />
                                    </div>
                                  )}

                                  {/* Controls (Move Up/Down & Delete) in same line */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingBottom: '4px', marginLeft: 'auto' }}>
                                    <button disabled={idx === 0} onClick={() => handleMoveTplFieldInCanvas(idx, -1)} style={{ ...styles.iconBtn, opacity: idx === 0 ? 0.3 : 1, padding: '6px' }} title="위로 이동">
                                      <ArrowUp size={16} />
                                    </button>
                                    <button disabled={idx === tplDraftFields.length - 1} onClick={() => handleMoveTplFieldInCanvas(idx, 1)} style={{ ...styles.iconBtn, opacity: idx === tplDraftFields.length - 1 ? 0.3 : 1, padding: '6px' }} title="아래로 이동">
                                      <ArrowDown size={16} />
                                    </button>
                                    <button onClick={() => handleRemoveTplFieldInCanvas(idx)} style={{ ...styles.iconBtn, padding: '6px' }} title="요소 삭제">
                                      <Trash2 size={16} color="#EF4444" />
                                    </button>
                                  </div>
                                </div>

                                {field.type === 'checklist' && (
                                  <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: `1px dashed ${borderColor}` }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: borderColor, marginBottom: '6px' }}>기본 체크리스트 세부 요소들 배치</label>
                                    {(field.defaultItems || []).map((subItemText, subIdx) => (
                                      <div key={subIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                        <input
                                          type="text"
                                          value={subItemText}
                                          onChange={(e) => {
                                            const updated = [...tplDraftFields];
                                            if (!updated[idx].defaultItems) updated[idx].defaultItems = [];
                                            updated[idx].defaultItems[subIdx] = e.target.value;
                                            setTplDraftFields(updated);
                                          }}
                                          style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: `1px solid ${borderColor}`, fontSize: '12px', backgroundColor: '#FFFFFF' }}
                                        />
                                        <button
                                          onClick={() => {
                                            const updated = [...tplDraftFields];
                                            if (updated[idx].defaultItems) {
                                              updated[idx].defaultItems.splice(subIdx, 1);
                                            }
                                            setTplDraftFields(updated);
                                          }}
                                          style={styles.iconBtn}
                                        >
                                          <Trash2 size={14} color="#EF4444" />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const updated = [...tplDraftFields];
                                        if (!updated[idx].defaultItems) updated[idx].defaultItems = [];
                                        updated[idx].defaultItems.push(`체크 요소 ${updated[idx].defaultItems.length + 1}`);
                                        setTplDraftFields(updated);
                                      }}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', border: `1px solid ${borderColor}`, backgroundColor: '#FFFFFF', fontSize: '12px', cursor: 'pointer', marginTop: '4px', color: borderColor, fontWeight: 600 }}
                                    >
                                      <Plus size={14} /> 요소 추가
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#6D28D9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>☑️ 체크리스트 사전 미리 세팅할 항목들을 편집합니다</span>
                        </div>
                        {tplDraftChecklists.length === 0 ? (
                          <div style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#F5F3FF', borderRadius: '16px', border: '2px dashed #C4B5FD' }}>
                            <p style={{ fontSize: '16px', color: '#5B21B6', fontWeight: 700, margin: 0 }}>
                              등록된 사전 체크리스트 항목이 없습니다.
                            </p>
                            <p style={{ fontSize: '13px', color: '#7C3AED', marginTop: '8px' }}>
                              상단의 <strong>[체크 항목 추가]</strong> 버튼을 눌러 메모 적용 시 자동으로 채워질 체크 항목을 등록해보세요!
                            </p>
                          </div>
                        ) : (
                          tplDraftChecklists.map((checkItem, idx) => (
                            <div key={checkItem.id || idx} style={{ backgroundColor: '#F5F3FF', border: '2px solid #8B5CF6', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', minWidth: '24px' }}>
                                  #{idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={checkItem.text || ''}
                                  onChange={(e) => handleUpdateTplChecklistInCanvas(idx, 'text', e.target.value)}
                                  placeholder="체크리스트 항목 내용 입력..."
                                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #C4B5FD', fontSize: '14px', backgroundColor: '#FFFFFF' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <button disabled={idx === 0} onClick={() => handleMoveTplChecklistInCanvas(idx, -1)} style={{ ...styles.iconBtn, opacity: idx === 0 ? 0.3 : 1, padding: '6px' }} title="위로 이동">
                                    <ArrowUp size={16} />
                                  </button>
                                  <button disabled={idx === tplDraftChecklists.length - 1} onClick={() => handleMoveTplChecklistInCanvas(idx, 1)} style={{ ...styles.iconBtn, opacity: idx === tplDraftChecklists.length - 1 ? 0.3 : 1, padding: '6px' }} title="아래로 이동">
                                    <ArrowDown size={16} />
                                  </button>
                                  <button onClick={() => handleRemoveTplChecklistInCanvas(idx)} style={{ ...styles.iconBtn, padding: '6px' }} title="삭제">
                                    <Trash2 size={16} color="#EF4444" />
                                  </button>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                                <label style={{ fontWeight: 600, color: '#6D28D9' }}>우선순위:</label>
                                <select
                                  value={checkItem.priority || ''}
                                  onChange={(e) => handleUpdateTplChecklistInCanvas(idx, 'priority', e.target.value)}
                                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #C4B5FD', backgroundColor: '#FFFFFF', fontSize: '12px' }}
                                >
                                  <option value="">우선순위 없음</option>
                                  <option value="낮음">🟢 낮음</option>
                                  <option value="보통">🟡 보통</option>
                                  <option value="높음">🔴 높음</option>
                                  <option value="긴급">🔥 긴급</option>
                                </select>
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}
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
                        <div style={styles.editPaneMainCard} className={printTarget === 'detail' ? 'print-area' : 'no-print'}>
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
                                  {allCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
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
                                            priority: typeof c === 'object' ? (c.priority || null) : null,
                                            dueDate: typeof c === 'object' ? (c.dueDate || null) : null,
                                            isAllDay: typeof c === 'object' && c.isAllDay !== undefined ? c.isAllDay : true,
                                            dueTime: typeof c === 'object' ? (c.dueTime || '09:00') : '09:00',
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

                          {/* Dynamic Body Content: Default Textarea OR Selected Template Form */}
                          {draftTemplateId === null ? (
                            <textarea
                              value={draftBody}
                              onChange={(e) => setDraftBody(e.target.value)}
                              placeholder="메모 기본 내용을 입력하세요... (URL 및 전화번호는 자동 링크로 변환됩니다)"
                              style={styles.editBodyTextarea}
                            />
                          ) : (
                            (() => {
                              const activeTpl = templates.find(t => t.id === draftTemplateId);
                              if (!activeTpl || !activeTpl.fields || activeTpl.fields.length === 0) {
                                return (
                                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                                    선택한 템플릿 항목이 없습니다. 상단 [템플릿 설정]에서 구성 요소를 추가해 주세요.
                                  </div>
                                );
                              }

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                                  <div style={{ padding: '8px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>📋 <strong>{activeTpl.title}</strong> 템플릿 양식 편집 중</span>
                                    <button
                                      onClick={() => setDraftTemplateId(null)}
                                      style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
                                    >
                                      기본 텍스트박스로 변경
                                    </button>
                                  </div>

                                  {activeTpl.fields.map((field) => {
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
                                            {((Array.isArray(fieldVal) ? fieldVal : (field.defaultItems || []).map(t => ({ text: t, completed: false })))).map((chkItem, chkIdx, arr) => (
                                              <div key={chkIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                  type="checkbox"
                                                  checked={chkItem.completed || false}
                                                  onChange={(e) => {
                                                    const updatedArr = [...arr];
                                                    updatedArr[chkIdx] = { ...chkItem, completed: e.target.checked };
                                                    setDraftTemplateValues({ ...draftTemplateValues, [field.id]: updatedArr });
                                                  }}
                                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                />
                                                <input
                                                  type="text"
                                                  value={chkItem.text || ''}
                                                  onChange={(e) => {
                                                    const updatedArr = [...arr];
                                                    updatedArr[chkIdx] = { ...chkItem, text: e.target.value };
                                                    setDraftTemplateValues({ ...draftTemplateValues, [field.id]: updatedArr });
                                                  }}
                                                  style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', textDecoration: chkItem.completed ? 'line-through' : 'none', color: chkItem.completed ? '#94A3B8' : '#1E293B' }}
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updatedArr = arr.filter((_, i) => i !== chkIdx);
                                                    setDraftTemplateValues({ ...draftTemplateValues, [field.id]: updatedArr });
                                                  }}
                                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                                                >
                                                  <Trash2 size={13} />
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const currentArr = (Array.isArray(fieldVal) ? fieldVal : (field.defaultItems || []).map(t => ({ text: t, completed: false })));
                                                const updatedArr = [...currentArr, { text: `항목 ${currentArr.length + 1}`, completed: false }];
                                                setDraftTemplateValues({ ...draftTemplateValues, [field.id]: updatedArr });
                                              }}
                                              style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: '12px', color: '#334155', cursor: 'pointer', marginTop: '4px' }}
                                            >
                                              <Plus size={13} />
                                              항목 추가
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}

                      {(!isMobile || mobileSubTab === 'sub') && (
                                                <div style={styles.rightPaneCard} className={printTarget === 'checklist' ? 'print-area' : 'no-print'}>
                          {/* Checklist Header Bar & Print Button */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingBottom: '10px',
                            marginBottom: '12px',
                            borderBottom: '1px solid #E2E8F0'
                          }} className="no-print">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                              <ListChecks size={18} color="#2563EB" />
                              <span>체크리스트</span>
                              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                                ({completedCount}/{totalCount})
                              </span>
                            </div>
                            <button
                              onClick={handleOpenChecklistPrint}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#334155',
                                backgroundColor: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              title="체크리스트 인쇄"
                            >
                              <Printer size={14} color="#334155" />
                              <span>인쇄</span>
                            </button>
                          </div>

                          {/* Print-Only Title Header */}
                          <div className="print-only-title" style={{ display: 'none', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #333' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', margin: 0 }}>{activeItem?.title || '체크리스트'}</h2>
                            <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>체크리스트 목록 (완료 {completedCount} / 전체 {totalCount})</div>
                          </div>
                          {/* Input Form for new multiline checklist item */}
                          <div style={styles.checklistInputContainer} className="no-print">
                            <div style={styles.checklistInputGroup}>
                              <textarea
                                rows={2}
                                value={newChecklistText}
                                onChange={(e) => setNewChecklistText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.altKey || e.ctrlKey)) {
                                    e.preventDefault();
                                    handleAddChecklist();
                                  }
                                }}
                                placeholder="새 체크리스트 항목 입력... (Alt+Enter 또는 Ctrl+Enter 항목 추가)"
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
                                title="체크리스트 추가 (Alt+Enter)"
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

                                return (
                                  <div
                                    key={checkItem.id}
                                    style={{
                                      ...styles.checklistItemRow,
                                      backgroundColor: checkItem.completed ? '#F8FAFC' : '#FFFFFF',
                                      borderColor: isEditing ? '#3B82F6' : (checkItem.completed ? '#E2E8F0' : '#CBD5E1')
                                    }}
                                  >
                                    {isEditing ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                        <textarea
                                          rows={2}
                                          value={editingCheckText}
                                          onChange={(e) => setEditingCheckText(e.target.value)}
                                         onKeyDown={(e) => {
                                           if (e.key === 'Enter' && (e.altKey || e.ctrlKey)) {
                                             e.preventDefault();
                                             handleSaveEditChecklist(checkItem.id);
                                           }
                                         }}
                                          style={styles.checklistEditTextarea}
                                          autoFocus
                                        />

                                        {/* Clean 1-Line Dataview Control Bar: Date + Priority + Cancel/Save */}
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: '6px',
                                          backgroundColor: '#F8FAFC',
                                          padding: '4px 8px',
                                          borderRadius: '8px',
                                          border: '1px solid #CBD5E1',
                                          marginTop: '4px'
                                        }}>
                                          {/* Left Controls: Date Picker & Priority Dropdown */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'wrap' }}>
                                            {/* Date Picker */}
                                            <div style={styles.scheduleField}>
                                              <CalendarIcon size={13} color="#64748B" />
                                              <input
                                                type="date"
                                                value={editingCheckDueDate}
                                                onChange={(e) => setEditingCheckDueDate(e.target.value)}
                                                style={styles.scheduleDateInput}
                                              />
                                              {editingCheckDueDate && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingCheckDueDate('');
                                                    setEditingCheckIsAllDay(true);
                                                  }}
                                                  style={styles.scheduleClearBtn}
                                                  title="일정 삭제"
                                                >
                                                  <X size={12} />
                                                </button>
                                              )}
                                            </div>

                                            {/* All-Day / Time Input (Only when date is set) */}
                                            {editingCheckDueDate && (
                                              <>
                                                <label style={styles.allDayCheckLabel}>
                                                  <input
                                                    type="checkbox"
                                                    checked={editingCheckIsAllDay}
                                                    onChange={(e) => setEditingCheckIsAllDay(e.target.checked)}
                                                  />
                                                  <span>종일</span>
                                                </label>
                                                {!editingCheckIsAllDay && (
                                                  <div style={styles.scheduleField}>
                                                    <Clock size={13} color="#64748B" />
                                                    <input
                                                      type="time"
                                                      value={editingCheckDueTime}
                                                      onChange={(e) => setEditingCheckDueTime(e.target.value)}
                                                      style={styles.scheduleTimeInput}
                                                    />
                                                  </div>
                                                )}
                                              </>
                                            )}

                                            {/* Priority Dropdown */}
                                            <div style={styles.scheduleField}>
                                              <select
                                                value={editingCheckPriority || ''}
                                                onChange={(e) => setEditingCheckPriority(e.target.value)}
                                                style={{
                                                  border: 'none',
                                                  fontSize: '12px',
                                                  fontWeight: 700,
                                                  color: editingCheckPriority === 'HIGH' ? '#DC2626' : editingCheckPriority === 'MEDIUM' ? '#D97706' : editingCheckPriority === 'LOW' ? '#2563EB' : '#64748B',
                                                  backgroundColor: 'transparent',
                                                  outline: 'none',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                <option value="">우선순위 없음</option>
                                                <option value="HIGH">🚨 높음</option>
                                                <option value="MEDIUM">⚡ 보통</option>
                                                <option value="LOW">💤 낮음</option>
                                              </select>
                                            </div>
                                          </div>

                                          {/* Right Controls: Cancel & Save Buttons */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
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
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
                                        {/* Top Content Row: Checkbox + Pure Text */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                                          <button
                                            onClick={() => handleToggleChecklist(checkItem.id)}
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
                                              color: checkItem.completed ? '#94A3B8' : '#1E293B',
                                              fontWeight: checkItem.completed ? 400 : 500,
                                              paddingTop: '1px'
                                            }}
                                          >
                                            {renderWithLinks(checkItem.text)}
                                          </span>
                                        </div>

                                        {/* Bottom Status Bar: Badge + Schedule (Left), Edit + Delete (Right) */}
                                        <div style={styles.checkitemStatusBar} className="no-print">
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                                            {checkItem.dueDate && (
                                              <div style={styles.itemScheduleBadge}>
                                                {checkItem.isAllDay !== false ? (
                                                  <span>📅 {checkItem.dueDate} (종일)</span>
                                                ) : (
                                                  <span>⏰ {checkItem.dueDate} {checkItem.dueTime || '09:00'}</span>
                                                )}
                                              </div>
                                            )}

                                            {checkItem.priority && (
                                              <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                backgroundColor: checkItem.priority === 'HIGH' ? '#FEE2E2' : checkItem.priority === 'MEDIUM' ? '#FEF3C7' : '#EFF6FF',
                                                color: checkItem.priority === 'HIGH' ? '#B91C1C' : checkItem.priority === 'MEDIUM' ? '#B45309' : '#1E40AF',
                                                border: `1px solid ${checkItem.priority === 'HIGH' ? '#FCA5A5' : checkItem.priority === 'MEDIUM' ? '#FDE047' : '#BFDBFE'}`
                                              }}>
                                                {checkItem.priority === 'HIGH' ? '🚨 높음' : checkItem.priority === 'MEDIUM' ? '⚡ 보통' : '💤 낮음'}
                                              </span>
                                            )}

                                            {checkItem.tag && (() => {
                                              const tagStyle = getTagStyle(checkItem.tag);
                                              return (
                                                <span
                                                  style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    padding: '1px 6px',
                                                    borderRadius: '4px',
                                                    backgroundColor: tagStyle.bg,
                                                    color: tagStyle.color,
                                                    border: `1px solid ${tagStyle.border}`
                                                  }}
                                                >
                                                  {checkItem.tag}
                                                </span>
                                              );
                                            })()}

                                            {checkItem.dueDate && (
                                              <div style={styles.itemScheduleBadge}>
                                                {checkItem.isAllDay !== false ? (
                                                  <span>📅 {checkItem.dueDate} (종일)</span>
                                                ) : (
                                                  <span>⏰ {checkItem.dueDate} {checkItem.dueTime || '09:00'}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          <div style={styles.checkitemActions}>
                                            <button
                                              onClick={() => {
                                                setEditingCheckId(checkItem.id);
                                                setEditingCheckText(checkItem.text);
                                                setEditingCheckDueDate(checkItem.dueDate || '');
                                                setEditingCheckIsAllDay(checkItem.isAllDay !== false);
                                                setEditingCheckDueTime(checkItem.dueTime || '09:00');
                                                setEditingCheckTag(checkItem.tag || '');
                                              }}
                                              style={styles.actionBtnLight}
                                              title="수정"
                                            >
                                              <Edit2 size={13} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                const preview = checkItem.text.length > 35 ? checkItem.text.slice(0, 35) + '...' : checkItem.text;
                                                openDeleteModal(
                                                  '체크리스트 항목 삭제',
                                                  `'${preview}' 항목을 정말 삭제하시겠습니까?`,
                                                  () => handleDeleteChecklist(checkItem.id)
                                                );
                                              }}
                                              style={styles.actionBtnLight}
                                              title="삭제"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
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
                    </div>
                  </div>
                ) : (
                  <div style={styles.splitReadContainer}>
                    {/* Left Card: Primary Note Content */}
                    {(!isMobile || mobileSubTab === 'main') && (
                      <div style={styles.leftPaneCard} className={printTarget === 'detail' ? 'print-area' : 'no-print'}>
                        {/* Title Header Line with Right-aligned Edit Button */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '14px',
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
                              {activeItem.title}
                            </h1>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} className="no-print">
                            <button
                              onClick={handleOpenDetailPrint}
                              style={styles.btnSecondary}
                              className="no-print"
                              title="상세내용 인쇄"
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
                              onClick={() => setIsEditMode(true)}
                              style={styles.btnPrimary}
                            >
                              <Edit2 size={13} />
                              수정
                            </button>
                          </div>
                        </div>

                        <div style={styles.readBody}>
                          {activeItem.templateId && templates.find(t => t.id === activeItem.templateId) ? (
                            (() => {
                              const activeTpl = templates.find(t => t.id === activeItem.templateId);
                              const values = activeItem.templateValues || {};
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <div style={{ padding: '6px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1E40AF', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>📋 <strong>{activeTpl.title}</strong> 템플릿 적용됨</span>
                                  </div>
                                  {activeTpl.fields && activeTpl.fields.map((field) => {
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
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {field.type === 'text' && <Type size={14} color="#2563EB" />}
                                            {field.type === 'checklist' && <CheckSquare size={14} color="#F59E0B" />}
                                            {field.label}
                                          </span>
                                        </div>

                                        {field.type === 'text' && (
                                          <div style={{ padding: '10px 12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#0F172A', minHeight: '38px' }}>
                                            {renderWithLinks(currentVal || '(내용 없음)')}
                                          </div>
                                        )}

                                        {field.type === 'checklist' && (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                                            {(Array.isArray(currentVal) ? currentVal : (field.defaultItems || []).map(t => ({ text: t, completed: false }))).map((chk, cIdx) => (
                                              <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: chk.completed ? '#10B981' : '#CBD5E1', fontWeight: 700, fontSize: '14px' }}>
                                                  {chk.completed ? '☑' : '☐'}
                                                </span>
                                                <span style={{ fontSize: '12px', textDecoration: chk.completed ? 'line-through' : 'none', color: chk.completed ? '#94A3B8' : '#1E293B' }}>
                                                  {chk.text}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()
                          ) : (
                            renderWithLinks(activeItem.body)
                          )}
                        </div>
                      </div>
                    )}

                    {/* Right Card: Standalone Checklist Card */}
                    {(!isMobile || mobileSubTab === 'sub') && (
                                              <div style={styles.rightPaneCard} className={printTarget === 'checklist' ? 'print-area' : 'no-print'}>
                          {/* Checklist Header Bar & Print Button */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingBottom: '10px',
                            marginBottom: '12px',
                            borderBottom: '1px solid #E2E8F0'
                          }} className="no-print">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                              <ListChecks size={18} color="#2563EB" />
                              <span>체크리스트</span>
                              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                                ({completedCount}/{totalCount})
                              </span>
                            </div>
                            <button
                              onClick={() => window.print()}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#334155',
                                backgroundColor: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              title="체크리스트 인쇄"
                            >
                              <Printer size={14} color="#334155" />
                              <span>인쇄</span>
                            </button>
                          </div>

                          {/* Print-Only Title Header */}
                          <div className="print-only-title" style={{ display: 'none', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #333' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', margin: 0 }}>{activeItem?.title || '체크리스트'}</h2>
                            <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>체크리스트 목록 (완료 {completedCount} / 전체 {totalCount})</div>
                          </div>
                        {/* Input Form for new multiline checklist item */}
                        <div style={styles.checklistInputContainer} className="no-print">
                          <div style={styles.checklistInputGroup}>
                            <textarea
                              rows={2}
                              value={newChecklistText}
                              onChange={(e) => setNewChecklistText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.altKey || e.ctrlKey)) {
                                  e.preventDefault();
                                  handleAddChecklist();
                                }
                              }}
                              placeholder="새 체크리스트 항목 입력... (Alt+Enter 또는 Ctrl+Enter 항목 추가)"
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
                              title="체크리스트 추가 (Alt+Enter)"
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

                              return (
                                <div
                                  key={checkItem.id}
                                  style={{
                                    ...styles.checklistItemRow,
                                    backgroundColor: checkItem.completed ? '#F8FAFC' : '#FFFFFF',
                                    borderColor: isEditing ? '#3B82F6' : (checkItem.completed ? '#E2E8F0' : '#CBD5E1')
                                  }}
                                >
                                  {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                      <textarea
                                        rows={2}
                                        value={editingCheckText}
                                        onChange={(e) => setEditingCheckText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && (e.altKey || e.ctrlKey)) {
                                            e.preventDefault();
                                            handleSaveEditChecklist(checkItem.id);
                                          }
                                        }}
                                        style={styles.checklistEditTextarea}
                                        autoFocus
                                      />

                                      {/* 1-Line Integrated Dataview Control Bar: DUE DATE + Priority + Cancel/Save */}
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justify: 'space-between',
                                        gap: '8px',
                                        backgroundColor: '#F8FAFC',
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        flexWrap: 'wrap',
                                        marginTop: '4px'
                                      }}>
                                        {/* Left Controls: DUE DATE & Priority */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                                          {/* Date Picker */}
                                          <div style={styles.scheduleField}>
                                            <CalendarIcon size={13} color="#64748B" />
                                            <input
                                              type="date"
                                              value={editingCheckDueDate}
                                              onChange={(e) => setEditingCheckDueDate(e.target.value)}
                                              style={styles.scheduleDateInput}
                                            />
                                            {editingCheckDueDate && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingCheckDueDate('');
                                                  setEditingCheckIsAllDay(true);
                                                }}
                                                style={styles.scheduleClearBtn}
                                                title="일정 삭제"
                                              >
                                                <X size={12} />
                                              </button>
                                            )}
                                          </div>

                                          {/* All-Day / Time Input (Only when date is set) */}
                                          {editingCheckDueDate && (
                                            <>
                                              <label style={styles.allDayCheckLabel}>
                                                <input
                                                  type="checkbox"
                                                  checked={editingCheckIsAllDay}
                                                  onChange={(e) => setEditingCheckIsAllDay(e.target.checked)}
                                                />
                                                <span>종일</span>
                                              </label>
                                              {!editingCheckIsAllDay && (
                                                <div style={styles.scheduleField}>
                                                  <Clock size={13} color="#64748B" />
                                                  <input
                                                    type="time"
                                                    value={editingCheckDueTime}
                                                    onChange={(e) => setEditingCheckDueTime(e.target.value)}
                                                    style={styles.scheduleTimeInput}
                                                  />
                                                </div>
                                              )}
                                            </>
                                          )}

                                          {/* Priority Dropdown */}
                                          <div style={styles.scheduleField}>
                                            <select
                                              value={editingCheckPriority || ''}
                                              onChange={(e) => setEditingCheckPriority(e.target.value)}
                                              style={{
                                                border: 'none',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                color: editingCheckPriority === 'HIGH' ? '#DC2626' : editingCheckPriority === 'MEDIUM' ? '#D97706' : editingCheckPriority === 'LOW' ? '#2563EB' : '#64748B',
                                                backgroundColor: 'transparent',
                                                outline: 'none',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              <option value="">우선순위 없음</option>
                                              <option value="HIGH">🚨 높음</option>
                                              <option value="MEDIUM">⚡ 보통</option>
                                              <option value="LOW">💤 낮음</option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* Right Controls: Cancel & Save Buttons on SAME line */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', flexShrink: 0 }}>
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
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
                                      {/* Top Content Row: Checkbox + Pure Text */}
                                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                                        <button
                                          onClick={() => handleToggleChecklist(checkItem.id)}
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
                                            color: checkItem.completed ? '#94A3B8' : '#1E293B',
                                            fontWeight: checkItem.completed ? 400 : 500,
                                            paddingTop: '1px'
                                          }}
                                        >
                                          {renderWithLinks(checkItem.text)}
                                        </span>
                                      </div>

                                      {/* Bottom Status Bar: Badge + Schedule (Left), Edit + Delete (Right) */}
                                      <div style={styles.checkitemStatusBar} className="no-print">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                                          {checkItem.tag && (() => {
                                            const tagStyle = getTagStyle(checkItem.tag);
                                            return (
                                              <span
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  fontSize: '11px',
                                                  fontWeight: 700,
                                                  padding: '1px 6px',
                                                  borderRadius: '4px',
                                                  backgroundColor: tagStyle.bg,
                                                  color: tagStyle.color,
                                                  border: `1px solid ${tagStyle.border}`
                                                }}
                                              >
                                                {checkItem.tag}
                                              </span>
                                            );
                                          })()}

                                          {checkItem.dueDate && (
                                            <div style={styles.itemScheduleBadge}>
                                              {checkItem.isAllDay !== false ? (
                                                <span>📅 {checkItem.dueDate} (종일)</span>
                                              ) : (
                                                <span>⏰ {checkItem.dueDate} {checkItem.dueTime || '09:00'}</span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <div style={styles.checkitemActions}>
                                          <button
                                            onClick={() => {
                                              setEditingCheckId(checkItem.id);
                                              setEditingCheckText(checkItem.text);
                                              setEditingCheckDueDate(checkItem.dueDate || '');
                                              setEditingCheckIsAllDay(checkItem.isAllDay !== false);
                                              setEditingCheckDueTime(checkItem.dueTime || '09:00');
                                              setEditingCheckTag(checkItem.tag || '');
                                            }}
                                            style={styles.actionBtnLight}
                                            title="수정"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            onClick={() => {
                                              const preview = checkItem.text.length > 35 ? checkItem.text.slice(0, 35) + '...' : checkItem.text;
                                              openDeleteModal(
                                                '체크리스트 항목 삭제',
                                                `'${preview}' 항목을 정말 삭제하시겠습니까?`,
                                                () => handleDeleteChecklist(checkItem.id)
                                              );
                                            }}
                                            style={styles.actionBtnLight}
                                            title="삭제"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
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
                    📄 상세내용
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
                    ☑️ 체크리스트 {activeItem.subBody ? '•' : ''}
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
              <button onClick={closeDeleteModal} style={styles.btnModalCancel}>
                취소
              </button>
              <button onClick={handleConfirmDelete} style={styles.btnModalDelete}>
                삭제하기
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
    overflowY: 'auto',
    padding: '10px 12px'
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
    minHeight: '100%',
    alignItems: 'stretch'
  },
  leftPaneCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '14px 16px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
  },
  rightPaneCard: {
    flex: 1,
    minWidth: 0,
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
    height: '100%',
    width: '100%'
  },
  splitEditFields: {
    display: 'flex',
    gap: '10px',
    flex: 1,
    minHeight: '420px'
  },
  editPaneMainCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
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
    gap: '8px',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '2px'
  },
  checklistItemRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '6px',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid',
    transition: 'background-color 0.15s ease, border-color 0.15s ease'
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
    boxShadow: '0 1px 3px rgba(220, 38, 38, 0.3)'
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
  }
};
