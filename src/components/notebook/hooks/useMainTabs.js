import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import {
  DEFAULT_MAIN_TABS,
  MAIN_TABS_STORAGE_KEY,
  getStoredMainTabs
} from '../notebookConstants';

export function useMainTabs(db) {
  const [mainTabs, setMainTabs] = useState(getStoredMainTabs);
  const [draggedTabIndex, setDraggedTabIndex] = useState(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState(null);
  const [editingTab, setEditingTab] = useState(null);
  const [editingTabInput, setEditingTabInput] = useState('');
  const [isTabSettingModalOpen, setIsTabSettingModalOpen] = useState(false);

  const tabLongPressTimerRef = useRef(null);

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
    if (!db) return;
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
  }, [db]);

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
    }
  };

  return {
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
  };
}
