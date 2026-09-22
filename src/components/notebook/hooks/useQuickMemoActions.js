import { useEffect } from 'react';
import { collection, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { QUICK_MEMO_CATEGORY } from '../notebookConstants';

export function useQuickMemoActions({
  db,
  activeMainTab,
  setActiveMainTab,
  activeCategory,
  activeItem,
  items = [],
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
}) {
  const handleNavigateToQuickMemo = () => {
    if (activeMainTab !== 'explorer') {
      if (setActiveMainTab) setActiveMainTab('explorer');
    }
    if (navigateToItems) navigateToItems(QUICK_MEMO_CATEGORY.id);
  };

  const handleOpenQuickMemo = () => {
    if (setQuickMemoText) setQuickMemoText('');
    if (setIsQuickMemoOpen) setIsQuickMemoOpen(true);
    setTimeout(() => {
      if (quickMemoTextareaRef && quickMemoTextareaRef.current) {
        quickMemoTextareaRef.current.focus();
      }
    }, 60);
  };

  const handleCloseQuickMemo = () => {
    if (setIsQuickMemoOpen) setIsQuickMemoOpen(false);
    if (setQuickMemoText) setQuickMemoText('');
  };

  const handleSaveQuickMemo = async () => {
    const text = quickMemoText ? quickMemoText.trim() : '';
    if (!text || isSavingQuickMemo) return;

    if (setIsSavingQuickMemo) setIsSavingQuickMemo(true);
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
        if (recordWorkLocation) {
          recordWorkLocation({
            tab: 'explorer',
            catId: 'quick_memo',
            itemId: existingTodayNote.id,
            itemTitle: `퀵메모 (${todayStr})`
          });
        }
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
        if (recordWorkLocation) {
          recordWorkLocation({
            tab: 'explorer',
            catId: 'quick_memo',
            itemId: newRef.id,
            itemTitle: `퀵메모 (${todayStr})`
          });
        }
      }

      if (setIsQuickMemoOpen) setIsQuickMemoOpen(false);
      if (setQuickMemoText) setQuickMemoText('');
      if (setQuickMemoToast) setQuickMemoToast(true);
      if (quickMemoToastTimerRef && quickMemoToastTimerRef.current) clearTimeout(quickMemoToastTimerRef.current);
      if (quickMemoToastTimerRef) {
        quickMemoToastTimerRef.current = setTimeout(() => {
          if (setQuickMemoToast) setQuickMemoToast(false);
        }, 2200);
      }
    } catch (err) {
      console.error('Error saving quick memo:', err);
      alert('퀵메모 저장 중 오류가 발생했습니다.');
    } finally {
      if (setIsSavingQuickMemo) setIsSavingQuickMemo(false);
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

  return {
    handleNavigateToQuickMemo,
    handleOpenQuickMemo,
    handleCloseQuickMemo,
    handleSaveQuickMemo
  };
}
