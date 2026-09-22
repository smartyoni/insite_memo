import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

export function useCalendarData({
  db,
  currentUser,
  items = [],
  categories = [],
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
}) {
  const DEFAULT_CAL_CATEGORIES = React.useMemo(() => [
    { id: 'cat_todo', name: '할일', color: '#3B82F6', isDefault: true, order: 0 }
  ], []);

  const [isCalendarMode, setIsCalendarMode] = useState(false);
  const DEFAULT_CALENDAR_CATEGORY = { id: 'cat_todo', name: '할일', color: '#3B82F6', isDefault: true, order: 0 };
  const [calendarCategories, setCalendarCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('insite_calendar_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasTodo = parsed.some((c) => c.id === 'cat_todo' && !c.isDeleted);
          let rawList;
          if (hasTodo) {
            const todo = parsed.find((c) => c.id === 'cat_todo');
            const others = parsed.filter((c) => c.id !== 'cat_todo' && !c.isDeleted);
            rawList = [{ ...DEFAULT_CALENDAR_CATEGORY, ...todo, isDefault: true }, ...others];
          } else {
            rawList = [DEFAULT_CALENDAR_CATEGORY, ...parsed.filter((c) => !c.isDeleted)];
          }
          return rawList.map((c) => {
            if (c.name === '계약') return { ...c, color: '#16A34A' };
            if (c.name === '잔금') return { ...c, color: '#DC2626' };
            if (c.name === '고객') return { ...c, color: '#7C3AED' };
            if (c.name === '할일') return { ...c, color: '#3B82F6' };
            return c;
          });
        }
      }
    } catch {}
    return [DEFAULT_CALENDAR_CATEGORY];
  });
  const [selectedCalendarCategoryId, setSelectedCalendarCategoryId] = useState('all');
  const [calendarEvents, setCalendarEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('insite_calendar_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [selectedCalendarEventId, setSelectedCalendarEventId] = useState(null);
  const [createEventModalState, setCreateEventModalState] = useState({
    isOpen: false,
    initialTitle: '',
    initialBlocks: [],
    date: '',
    sourceMemo: null
  });
  const [calendarReturnContext, setCalendarReturnContext] = useState(null); // { categoryId, eventId }

  // Firestore 캘린더 범주 실시간 동기화
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'calendar_categories'), orderBy('order', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let list = [];
        if (!snapshot.empty) {
          list = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((c) => !c.isDeleted);
        }
        // 전체일정 바로 아래에 '할일' 고정 보장
        const hasDefault = list.some((c) => c.id === 'cat_todo');
        let finalList;
        if (hasDefault) {
          const todo = list.find((c) => c.id === 'cat_todo');
          const others = list.filter((c) => c.id !== 'cat_todo');
          finalList = [{ ...DEFAULT_CALENDAR_CATEGORY, ...todo, isDefault: true }, ...others];
        } else {
          finalList = [DEFAULT_CALENDAR_CATEGORY, ...list];
          // Firestore에 'cat_todo' 기본 문서 자동 생성 보존
          setDoc(doc(db, 'calendar_categories', 'cat_todo'), DEFAULT_CALENDAR_CATEGORY).catch(() => {});
        }

        // '계약'(#16A34A), '잔금'(#DC2626), '고객'(#7C3AED) 색상 자동 마이그레이션
        finalList = finalList.map((c) => {
          let expectedColor = null;
          if (c.name === '계약') expectedColor = '#16A34A';
          else if (c.name === '잔금') expectedColor = '#DC2626';
          else if (c.name === '고객') expectedColor = '#7C3AED';
          else if (c.name === '할일') expectedColor = '#3B82F6';

          if (expectedColor && c.color !== expectedColor) {
            if (c.id && !c.id.startsWith('temp_')) {
              updateDoc(doc(db, 'calendar_categories', c.id), { color: expectedColor }).catch(() => {});
            }
            return { ...c, color: expectedColor };
          }
          return c;
        });

        setCalendarCategories(finalList);
        localStorage.setItem('insite_calendar_categories', JSON.stringify(finalList));
      }, (err) => console.warn('calendar_categories onSnapshot error:', err));
      return () => unsubscribe();
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser]);

  // Firestore 캘린더 일정 실시간 동기화
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'calendar_events'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let list = [];
        if (!snapshot.empty) {
          list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        setCalendarEvents(list);
        localStorage.setItem('insite_calendar_events', JSON.stringify(list));
      }, (err) => console.warn('calendar_events onSnapshot error:', err));
      return () => unsubscribe();
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser]);

  // 범주 추가
  const handleAddCalendarCategory = async (newCat) => {
    let catToSave = { ...newCat };
    if (catToSave.name === '계약') catToSave.color = '#16A34A';
    else if (catToSave.name === '잔금') catToSave.color = '#DC2626';
    else if (catToSave.name === '고객') catToSave.color = '#7C3AED';
    else if (catToSave.name === '할일') catToSave.color = '#3B82F6';

    const next = [...calendarCategories, catToSave];
    setCalendarCategories(next);
    localStorage.setItem('insite_calendar_categories', JSON.stringify(next));
    if (currentUser) {
      try {
        await setDoc(doc(db, 'calendar_categories', catToSave.id), catToSave);
      } catch (err) {
        console.error('Save calendar category failed:', err);
      }
    }
  };

  // 범주 수정
  const handleUpdateCalendarCategory = async (catId, updates) => {
    const finalUpdates = { ...updates };
    if (finalUpdates.name === '계약') finalUpdates.color = '#16A34A';
    else if (finalUpdates.name === '잔금') finalUpdates.color = '#DC2626';
    else if (finalUpdates.name === '고객') finalUpdates.color = '#7C3AED';
    else if (finalUpdates.name === '할일') finalUpdates.color = '#3B82F6';

    const next = calendarCategories.map((c) => (c.id === catId ? { ...c, ...finalUpdates } : c));
    setCalendarCategories(next);
    localStorage.setItem('insite_calendar_categories', JSON.stringify(next));
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'calendar_categories', catId), finalUpdates);
      } catch (err) {
        console.error('Update calendar category failed:', err);
      }
    }
  };

  // 범주 삭제 (소프트 삭제 지침 준수)
  const handleDeleteCalendarCategory = async (catId) => {
    const next = calendarCategories.map((c) => (c.id === catId ? { ...c, isDeleted: true } : c));
    setCalendarCategories(next);
    localStorage.setItem('insite_calendar_categories', JSON.stringify(next));
    if (selectedCalendarCategoryId === catId) {
      setSelectedCalendarCategoryId('all');
    }
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'calendar_categories', catId), { isDeleted: true, deletedAt: serverTimestamp() });
      } catch (err) {
        console.error('Delete calendar category failed:', err);
      }
    }
  };

  // 일정 저장 / 수정 (원본 메모/체크리스트와 양방향 동기화)
  const handleSaveCalendarEvent = async (eventData) => {
    const exists = calendarEvents.some((e) => e.id === eventData.id);
    let next;
    if (exists) {
      next = calendarEvents.map((e) => (e.id === eventData.id ? eventData : e));
    } else {
      next = [eventData, ...calendarEvents];
    }
    setCalendarEvents(next);
    localStorage.setItem('insite_calendar_events', JSON.stringify(next));
    setSelectedCalendarEventId(eventData.id);

    // 원본 메모/체크리스트 제목 동기화 (sourceMemo 존재 시)
    if (eventData.sourceMemo?.itemId) {
      const { itemId, checklistId } = eventData.sourceMemo;
      const targetItem = items.find((i) => i.id === itemId);
      if (targetItem) {
        if (checklistId) {
          // 1. 체크리스트 항목 제목 변경
          const updatedChecklists = (targetItem.checklists || []).map((c) =>
            c.id === checklistId ? { ...c, text: eventData.title } : c
          );
          setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, checklists: updatedChecklists } : i))
          );
          if (activeItem?.id === itemId) {
            setActiveItem((prev) => ({ ...prev, checklists: updatedChecklists }));
          }
          if (currentUser) {
            try {
              await updateDoc(doc(db, 'items', itemId), {
                checklists: updatedChecklists,
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.error('Sync to source checklist title failed:', err);
            }
          }
        } else {
          // 2. 메모 제목 변경
          setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, title: eventData.title } : i))
          );
          if (activeItem?.id === itemId) {
            setActiveItem((prev) => ({ ...prev, title: eventData.title }));
          }
          if (currentUser) {
            try {
              await updateDoc(doc(db, 'items', itemId), {
                title: eventData.title,
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.error('Sync to source memo title failed:', err);
            }
          }
        }
      }
    }

    if (currentUser) {
      try {
        await setDoc(doc(db, 'calendar_events', eventData.id), eventData);
      } catch (err) {
        console.error('Save calendar event failed:', err);
      }
    }
  };

  // 일정 하위 블록 수정 (3열 우측 패널 연동 + 원본 체크리스트/메모 본문 블록 실시간 동기화)
  const handleSaveCalendarEventBlocks = async (eventId, newBlocks) => {
    let targetEvent = calendarEvents.find((e) => e.id === eventId);
    if (!targetEvent) return;

    // 1. 캘린더 이벤트 상태 및 로컬 스토리지 즉시 업데이트
    const next = calendarEvents.map((e) => (e.id === eventId ? { ...e, blocks: newBlocks } : e));
    setCalendarEvents(next);
    localStorage.setItem('insite_calendar_events', JSON.stringify(next));

    // 2. 원본 메모 및 체크리스트 대상 찾기 (1순위: sourceMemo, 2순위: 제목/체크리스트 매칭)
    let targetItem = null;
    let targetChecklistId = null;

    // 2-1. sourceMemo로 먼저 조회
    if (targetEvent.sourceMemo?.itemId) {
      targetItem = items.find((i) => i.id === targetEvent.sourceMemo.itemId && !i.isDeleted) || null;
      targetChecklistId = targetEvent.sourceMemo.checklistId || null;
    }

    // 2-2. sourceMemo가 없거나 매칭되지 않은 경우 (과거 등록된 일정 등) -> 텍스트 매칭으로 원본 추적
    const cleanTitle = (targetEvent.title || '').trim();
    if (!targetItem && cleanTitle.length > 0) {
      // 체크리스트 항목 텍스트와 일치하는지 먼저 탐색
      for (const it of items) {
        if (it.isDeleted) continue;
        const matchedCheck = (it.checklists || []).find((c) => (c.text || '').trim() === cleanTitle);
        if (matchedCheck) {
          targetItem = it;
          targetChecklistId = matchedCheck.id;
          break;
        }
      }

      // 체크리스트에 없으면 메모 제목과 일치하는지 탐색
      if (!targetItem) {
        targetItem = items.find((it) => !it.isDeleted && (it.title || '').trim() === cleanTitle) || null;
      }

      // 추적된 원본 정보를 해당 일정에 영구 저장 (앞으로 즉시 매칭)
      if (targetItem) {
        const autoSourceMemo = {
          itemId: targetItem.id,
          categoryId: targetItem.categoryId || null,
          checklistId: targetChecklistId || null
        };
        targetEvent = { ...targetEvent, sourceMemo: autoSourceMemo, blocks: newBlocks };
        setCalendarEvents((prev) => prev.map((e) => (e.id === eventId ? targetEvent : e)));
        localStorage.setItem(
          'insite_calendar_events',
          JSON.stringify(calendarEvents.map((e) => (e.id === eventId ? targetEvent : e)))
        );
      }
    }

    // 3. 원본(체크리스트 또는 메모 본문)에 실시간 양방향 반영
    if (targetItem) {
      const plainText = blocksToPlainText(newBlocks);

      if (targetChecklistId) {
        // [A. 체크리스트 항목의 하위 블록 동기화]
        const updatedChecklists = (targetItem.checklists || []).map((c) =>
          c.id === targetChecklistId ? { ...c, detail: plainText, detailBlocks: newBlocks } : c
        );

        setItems((prev) =>
          prev.map((i) => (i.id === targetItem.id ? { ...i, checklists: updatedChecklists } : i))
        );

        if (activeItem?.id === targetItem.id) {
          setActiveItem((prev) => ({ ...prev, checklists: updatedChecklists }));
          if (selectedChecklistId === targetChecklistId) {
            setChecklistDetailBlocks(newBlocks);
            setChecklistDetailDraft(plainText);
          }
        }

        if (currentUser) {
          try {
            await updateDoc(doc(db, 'items', targetItem.id), {
              checklists: updatedChecklists,
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            console.error('Sync to source checklist detailBlocks failed:', err);
          }
        }
      } else {
        // [B. 메모 본문 블록 동기화]
        setItems((prev) =>
          prev.map((i) => (i.id === targetItem.id ? { ...i, body: plainText, detailBlocks: newBlocks } : i))
        );

        if (activeItem?.id === targetItem.id) {
          setActiveItem((prev) => ({ ...prev, body: plainText, detailBlocks: newBlocks }));
          setChecklistDetailBlocks(newBlocks);
          setChecklistDetailDraft(plainText);
        }

        if (currentUser) {
          try {
            await updateDoc(doc(db, 'items', targetItem.id), {
              body: plainText,
              detailBlocks: newBlocks,
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            console.error('Sync to source memo body/detailBlocks failed:', err);
          }
        }
      }
    }

    // 4. Firestore 캘린더 이벤트 문서 업데이트
    if (currentUser) {
      try {
        const updatePayload = { blocks: newBlocks };
        if (targetEvent?.sourceMemo) {
          updatePayload.sourceMemo = targetEvent.sourceMemo;
        }
        await updateDoc(doc(db, 'calendar_events', eventId), updatePayload);
      } catch (err) {
        console.error('Update calendar event blocks failed:', err);
      }
    }
  };

  // 일정 삭제 (소프트 삭제 지침 준수)
  const handleDeleteCalendarEvent = async (eventId) => {
    const next = calendarEvents.map((e) => (e.id === eventId ? { ...e, isDeleted: true } : e));
    setCalendarEvents(next);
    localStorage.setItem('insite_calendar_events', JSON.stringify(next));
    if (selectedCalendarEventId === eventId) {
      setSelectedCalendarEventId(null);
    }
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'calendar_events', eventId), { isDeleted: true, deletedAt: serverTimestamp() });
      } catch (err) {
        console.error('Delete calendar event failed:', err);
      }
    }
  };

  // 캘린더 일정에서 실제 원본 메모 위치로 이동
  const handleNavigateToEventSource = (event) => {
    if (!event) return;

    let targetItem = null;
    let targetChecklistId = null;

    // 1. sourceMemo 필드가 있는 경우 우선 매칭 (1순위 정확 매칭)
    if (event.sourceMemo?.itemId) {
      targetItem = items.find((i) => i.id === event.sourceMemo.itemId && !i.isDeleted);
      targetChecklistId = event.sourceMemo.checklistId || null;
    }

    const cleanEventTitle = (event.title || '').trim();

    // 2. 제목 완전 일치 or 체크리스트 텍스트 완전 일치
    if (!targetItem && cleanEventTitle.length > 0) {
      targetItem = items.find((i) => {
        if (i.isDeleted) return false;
        const itemTitle = (i.title || '').trim();
        if (itemTitle.length > 0 && itemTitle === cleanEventTitle) return true;
        if (Array.isArray(i.checklists) && i.checklists.some((c) => (c.text || '').trim() === cleanEventTitle)) {
          return true;
        }
        return false;
      });

      if (targetItem && Array.isArray(targetItem.checklists)) {
        const matched = targetItem.checklists.find((c) => (c.text || '').trim() === cleanEventTitle);
        if (matched) {
          targetChecklistId = matched.id;
        }
      }
    }

    // 3. 체크리스트 또는 블록 내용 일치 탐색 (최소 3자 이상 검증)
    if (!targetItem && cleanEventTitle.length >= 3) {
      targetItem = items.find((i) => {
        if (i.isDeleted) return false;

        // 체크리스트 부분/포함 일치
        if (Array.isArray(i.checklists)) {
          const matchCheck = i.checklists.find((c) => {
            const checkText = (c.text || '').trim();
            return checkText.length >= 3 && (checkText === cleanEventTitle || checkText.includes(cleanEventTitle) || cleanEventTitle.includes(checkText));
          });
          if (matchCheck) {
            targetChecklistId = matchCheck.id;
            return true;
          }
        }

        // 디테일 블록 텍스트 일치
        if (Array.isArray(i.blocks)) {
          const matchBlock = i.blocks.find((b) => {
            const bTitle = (b.title || '').trim();
            const bVal = (b.value || '').trim();
            return (bTitle.length >= 3 && (bTitle === cleanEventTitle || bTitle.includes(cleanEventTitle) || cleanEventTitle.includes(bTitle))) ||
                   (bVal.length >= 3 && (bVal === cleanEventTitle || bVal.includes(cleanEventTitle) || cleanEventTitle.includes(bVal)));
          });
          if (matchBlock) return true;
        }

        // 메모 본문 일치
        if (i.body && i.body.trim().includes(cleanEventTitle)) return true;
        if (i.subBody && i.subBody.trim().includes(cleanEventTitle)) return true;

        return false;
      });
    }

    // 4. 메모 제목 일치 (비율 40% 이상 및 최소 4자 이상 비교로 짧은 단어 오탐색 방지)
    if (!targetItem && cleanEventTitle.length >= 3) {
      targetItem = items.find((i) => {
        if (i.isDeleted) return false;
        const itemTitle = (i.title || '').trim();
        if (itemTitle.length >= 3 && (cleanEventTitle.includes(itemTitle) || itemTitle.includes(cleanEventTitle))) {
          const ratio = Math.min(itemTitle.length, cleanEventTitle.length) / Math.max(itemTitle.length, cleanEventTitle.length);
          if (ratio >= 0.4 || itemTitle.length >= 5) return true;
        }
        return false;
      });
    }

    // 원본 메모를 찾지 못한 경우: 퀵메모로 잘못 이동하지 않고 정확한 안내 제공
    if (!targetItem) {
      alert(`'${cleanEventTitle || '선택한 일정'}'은(는) 캘린더에서 직접 생성되었거나, 연결된 원본 메모를 찾을 수 없습니다.`);
      return;
    }

    // 복귀를 위해 현재 캘린더 화면 상태를 기억
    setCalendarReturnContext({
      categoryId: selectedCalendarCategoryId,
      eventId: event.id,
      prevMainTab: activeMainTab
    });

    // 해당 메모가 속한 카테고리 및 탭(Scope) 찾기
    const targetCat = categories.find((c) => c.id === targetItem.categoryId);
    const targetScope = targetCat?.scope || 'explorer';
    const matchedTab = (mainTabs || []).find((t) => getScopeForTab(t.id) === targetScope);
    const destTab = matchedTab ? matchedTab.id : (targetScope === 'explorer' ? 'explorer' : targetScope);

    // 해당 카테고리 그룹이 접혀있다면 펼치기
    if (targetCat?.groupId) {
      setCollapsedCategoryGroups((prev) => ({ ...prev, [targetCat.groupId]: false }));
    }
    // 해당 아이템 그룹이 접혀있다면 펼치기
    if (targetItem.groupId) {
      setCollapsedItemGroups((prev) => ({ ...prev, [targetItem.groupId]: false }));
    }

    // 캘린더 모드 종료하고 정확한 탭과 카테고리, 메모 위치로 전환
    setIsCalendarMode(false);
    setActiveMainTab(destTab);
    setSelectedCategoryId(targetItem.categoryId);
    setSelectedItemId(targetItem.id);

    if (targetChecklistId) {
      setSelectedChecklistId(targetChecklistId);
      if (isMobile) {
        setMobileSubTab('sub');
      }
    }

    if (isMobile) {
      setMobileView('detail');
    }
  };

  // 실제 원본 메모 화면에서 다시 캘린더로 복귀
  const handleReturnToCalendar = () => {
    setIsCalendarMode(true);
    if (calendarReturnContext?.categoryId) {
      setSelectedCalendarCategoryId(calendarReturnContext.categoryId);
    }
    if (calendarReturnContext?.eventId) {
      setSelectedCalendarEventId(calendarReturnContext.eventId);
    }
    if (isMobile) {
      setMobileView('detail');
    }
  };

  // 원본 메모/체크리스트 내용 수정 시 연동된 캘린더 일정명 실시간 동기화
  const syncCalendarEventTitle = async ({ itemId, checklistId = null, oldText = '', newText = '' }) => {
    if (!newText || !newText.trim()) return;
    const trimmedNew = newText.trim();
    const trimmedOld = (oldText || '').trim();

    // 동기화 대상 일정 탐색
    const targetEvents = calendarEvents.filter((e) => {
      if (e.isDeleted) return false;

      // 1. sourceMemo 기반 매칭 (가장 정확)
      if (e.sourceMemo?.itemId === itemId) {
        if (checklistId) {
          if (e.sourceMemo?.checklistId === checklistId) return true;
        } else {
          // 메모 제목인 경우 checklistId가 없는 일정 매칭
          if (!e.sourceMemo?.checklistId) return true;
        }
      }

      // 2. 과거 일정 매칭: 이전 텍스트와 일정 제목이 완전 일치하는 경우
      if (trimmedOld && e.title && e.title.trim() === trimmedOld) {
        return true;
      }

      return false;
    });

    if (targetEvents.length === 0) return;

    const targetEventIds = new Set(targetEvents.map((e) => e.id));
    const nextEvents = calendarEvents.map((e) => {
      if (targetEventIds.has(e.id)) {
        return {
          ...e,
          title: trimmedNew,
          sourceMemo: e.sourceMemo || {
            itemId,
            checklistId: checklistId || null
          }
        };
      }
      return e;
    });

    setCalendarEvents(nextEvents);
    localStorage.setItem('insite_calendar_events', JSON.stringify(nextEvents));

    // Firestore 일괄 업데이트
    if (currentUser) {
      try {
        const batch = writeBatch(db);
        targetEvents.forEach((e) => {
          const docRef = doc(db, 'calendar_events', e.id);
          batch.update(docRef, {
            title: trimmedNew,
            sourceMemo: e.sourceMemo || {
              itemId,
              checklistId: checklistId || null
            },
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      } catch (err) {
        console.error('Error syncing calendar event title:', err);
      }
    }
  };

  // 상세화면 좌측 블록/체크리스트에서 우클릭/롱프레스 시 모달 오픈
  const handleOpenCreateEventFromBlock = (data) => {
    setCreateEventModalState({
      isOpen: true,
      initialTitle: data?.title || '',
      initialBlocks: Array.isArray(data?.blocks) ? data.blocks : [],
      date: data?.date || '',
      sourceMemo: data?.sourceMemo || (selectedItemId ? {
        itemId: selectedItemId,
        categoryId: selectedCategoryId,
        checklistId: selectedChecklistId || null
      } : null),
      initialEvent: null
    });
  };

  // 캘린더 일정 수정 모달 오픈
  const handleOpenEditEventModal = (event) => {
    if (!event) return;
    setCreateEventModalState({
      isOpen: true,
      initialTitle: event.title || '',
      initialBlocks: Array.isArray(event.blocks) ? event.blocks : [],
      date: event.startDate || '',
      sourceMemo: event.sourceMemo || null,
      initialEvent: event
    });
  };


  return {
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
  };
}
