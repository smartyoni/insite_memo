import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { blocksToPlainText, parseDetailBlocks } from '../../DetailBlocks';

export function useDetailBlockActions({
  db,
  activeItem,
  baseChecklists = [],
  rawChecklists = [],
  checklistDetailBlocks = [],
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
}) {
  const handleSaveChecklistDetail = async (checkId, blocksToSave) => {
    if (recordWorkLocation) recordWorkLocation();
    const targetBlocks = blocksToSave !== undefined ? blocksToSave : checklistDetailBlocks;
    const plainText = blocksToPlainText(targetBlocks);
    if (checkId === '__main__') {
      try {
        await updateDoc(doc(db, 'items', activeItem.id), {
          body: plainText,
          detailBlocks: targetBlocks,
          updatedAt: serverTimestamp()
        });
        if (setChecklistDetailDraft) setChecklistDetailDraft(plainText);
        if (setChecklistDetailBlocks) setChecklistDetailBlocks(targetBlocks);
        if (setIsEditingChecklistDetail) setIsEditingChecklistDetail(false);
        if (setIsEditMode) setIsEditMode(false);
        if (setShowSavedToast) setShowSavedToast(true);
        if (toastTimerRef && toastTimerRef.current) clearTimeout(toastTimerRef.current);
        if (toastTimerRef) {
          toastTimerRef.current = setTimeout(() => {
            if (setShowSavedToast) setShowSavedToast(false);
          }, 1800);
        }
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
      if (setChecklistDetailDraft) setChecklistDetailDraft(plainText);
      if (setChecklistDetailBlocks) setChecklistDetailBlocks(targetBlocks);
      if (setIsEditingChecklistDetail) setIsEditingChecklistDetail(false);
      if (setIsEditMode) setIsEditMode(false);
      if (setShowSavedToast) setShowSavedToast(true);
      if (toastTimerRef && toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastTimerRef) {
        toastTimerRef.current = setTimeout(() => {
          if (setShowSavedToast) setShowSavedToast(false);
        }, 1800);
      }
    } catch (err) {
      console.error('Error saving checklist detail:', err);
    }
  };

  const handleAddNewTextBlock = () => {
    if (!selectedChecklistId) return;
    if (recordWorkLocation) recordWorkLocation();
    const newBlockId = `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newBlock = {
      id: newBlockId,
      type: 'text',
      title: '',
      content: ''
    };
    const updated = [...checklistDetailBlocks, newBlock];
    if (setChecklistDetailBlocks) setChecklistDetailBlocks(updated);
    if (setEditingBlockId) setEditingBlockId(newBlockId);
  };

  const handleAddNewChecklistBlock = () => {
    if (!selectedChecklistId) return;
    if (recordWorkLocation) recordWorkLocation();
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
    if (setChecklistDetailBlocks) setChecklistDetailBlocks(updated);
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
      if (setCopyToastText) setCopyToastText('복사할 내용이 없습니다.');
      if (copyToastTimerRef && copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      if (copyToastTimerRef) {
        copyToastTimerRef.current = setTimeout(() => {
          if (setCopyToastText) setCopyToastText('');
        }, 1800);
      }
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
      if (setCopyToastText) setCopyToastText(`✓ '${displayTitle}' 내용이 통합 복사되었습니다.`);
      if (copyToastTimerRef && copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      if (copyToastTimerRef) {
        copyToastTimerRef.current = setTimeout(() => {
          if (setCopyToastText) setCopyToastText('');
        }, 2000);
      }
    } catch (err) {
      console.error('통합 복사 실패:', err);
      if (setCopyToastText) setCopyToastText('복사에 실패했습니다.');
      if (copyToastTimerRef && copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      if (copyToastTimerRef) {
        copyToastTimerRef.current = setTimeout(() => {
          if (setCopyToastText) setCopyToastText('');
        }, 2000);
      }
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
    if (setDetailClipboard) setDetailClipboard(payload);
    try {
      localStorage.setItem('insite_memo_detail_clipboard', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save detail clipboard to localStorage:', e);
    }
    if (setCopyToastText) setCopyToastText(`✓ '${title}' 블록이 복사되었습니다. 다른 항목이나 탭에서 붙여넣기 하세요.`);
    if (copyToastTimerRef && copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    if (copyToastTimerRef) {
      copyToastTimerRef.current = setTimeout(() => {
        if (setCopyToastText) setCopyToastText('');
      }, 2500);
    }
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
    if (setDetailClipboard) setDetailClipboard(payload);
    try {
      localStorage.setItem('insite_memo_detail_clipboard', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save detail clipboard to localStorage:', e);
    }
    if (setCopyToastText) setCopyToastText(`✓ '${preview}' 항목이 복사되었습니다.`);
    if (copyToastTimerRef && copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    if (copyToastTimerRef) {
      copyToastTimerRef.current = setTimeout(() => {
        if (setCopyToastText) setCopyToastText('');
      }, 2500);
    }
  };

  const handleClearDetailClipboard = () => {
    if (setDetailClipboard) setDetailClipboard(null);
    try {
      localStorage.removeItem('insite_memo_detail_clipboard');
    } catch (e) {
      // ignore
    }
  };

  const handlePasteBlockFromClipboard = () => {
    if (!detailClipboard || detailClipboard.type !== 'block' || !selectedChecklistId) return;
    if (recordWorkLocation) recordWorkLocation();
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
    if (setChecklistDetailBlocks) setChecklistDetailBlocks(updated);
    handleSaveChecklistDetail(selectedChecklistId, updated);
    if (setCopyToastText) setCopyToastText(`✓ '${detailClipboard.title}' 블록을 붙여넣었습니다.`);
    if (copyToastTimerRef && copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    if (copyToastTimerRef) {
      copyToastTimerRef.current = setTimeout(() => {
        if (setCopyToastText) setCopyToastText('');
      }, 2200);
    }
  };

  const handlePasteItemFromClipboard = (targetBlockId) => {
    if (!detailClipboard || detailClipboard.type !== 'item' || !selectedChecklistId) return;
    if (recordWorkLocation) recordWorkLocation();
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

    if (setChecklistDetailBlocks) setChecklistDetailBlocks(updated);
    handleSaveChecklistDetail(selectedChecklistId, updated);
    if (setCopyToastText) setCopyToastText(`✓ '${detailClipboard.title}' 항목을 붙여넣었습니다.`);
    if (copyToastTimerRef && copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    if (copyToastTimerRef) {
      copyToastTimerRef.current = setTimeout(() => {
        if (setCopyToastText) setCopyToastText('');
      }, 2200);
    }
  };

  const handleOpenMoveBlockModal = (block) => {
    if (!activeItem || !block) return;
    const currentId = selectedChecklistId || '__main__';
    const candidates = rawChecklists.filter((c) => !c.isSection && c.id !== currentId);
    const defaultTarget = candidates.length > 0 ? candidates[0].id : null;

    if (setMoveBlockModalState) {
      setMoveBlockModalState({
        isOpen: true,
        sourceCheckId: currentId,
        block,
        targetCheckId: defaultTarget
      });
    }
  };

  const handleCloseMoveBlockModal = () => {
    if (setMoveBlockModalState) {
      setMoveBlockModalState({
        isOpen: false,
        sourceCheckId: null,
        block: null,
        targetCheckId: null
      });
    }
  };

  const handleExecuteMoveBlock = async () => {
    const { sourceCheckId, targetCheckId, block } = moveBlockModalState;
    if (!activeItem || !block || !targetCheckId || sourceCheckId === targetCheckId) {
      handleCloseMoveBlockModal();
      return;
    }

    try {
      // 1. 출처 블록 가져오기
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
        if (setChecklistDetailBlocks) setChecklistDetailBlocks(finalSourceBlocks);
        if (setChecklistDetailDraft) setChecklistDetailDraft(sourcePlainText);
      } else if (selectedChecklistId === targetCheckId) {
        if (setChecklistDetailBlocks) setChecklistDetailBlocks(finalTargetBlocks);
        if (setChecklistDetailDraft) setChecklistDetailDraft(targetPlainText);
      }

      if (setShowSavedToast) setShowSavedToast(true);
      if (toastTimerRef && toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastTimerRef) {
        toastTimerRef.current = setTimeout(() => {
          if (setShowSavedToast) setShowSavedToast(false);
        }, 1800);
      }

      handleCloseMoveBlockModal();
    } catch (err) {
      console.error('Error moving detail block:', err);
      alert('블록 소속 이동 중 오류가 발생했습니다: ' + err.message);
    }
  };

  return {
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
  };
}
