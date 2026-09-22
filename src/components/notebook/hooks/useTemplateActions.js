import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { blocksToPlainText } from '../../DetailBlocks';

export function useTemplateActions({
  db,
  templates = [],
  items = [],
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
}) {
  // Helper to construct combined body text from template fields
  const buildTemplateCombinedBody = (tplId, tplVals) => {
    if (!tplId) return draftBody;
    const targetTpl = templates.find(t => t.id === tplId);
    if (!targetTpl || !targetTpl.fields) return draftBody;

    return targetTpl.fields.map((f) => {
      const val = tplVals ? tplVals[f.id] : null;
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
    setSelectedTemplateIdInTab(tpl?.id || null);
  };

  const handleCreateNewTemplateInTab = () => {
    setSelectedTemplateIdInTab('NEW');
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
          }
        } catch (err) {
          console.error('템플릿 삭제 오류:', err);
          alert('템플릿 삭제에 실패했습니다.');
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
        if (setDraftChecklists) setDraftChecklists(finalChecklists);
        if (setDraftBody) setDraftBody(finalBody);
        if (finalDetailBlocks.length > 0 && setChecklistDetailBlocks) {
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

        if (setItems) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === activeItem.id ? { ...item, ...updatePayload } : item
            )
          );
        }
      }

      // 3. 네비게이션 포커스 설정
      if (finalChecklists.length > 0) {
        const targetIndex = (mode === 'append' && activeItem?.checklists?.length)
          ? activeItem.checklists.length
          : 0;
        const firstTarget = finalChecklists[targetIndex] || finalChecklists[0];
        if (setSelectedChecklistId) setSelectedChecklistId(firstTarget?.id || '__main__');
        if (setChecklistDetailBlocks) {
          if (firstTarget && Array.isArray(firstTarget.detailBlocks) && firstTarget.detailBlocks.length > 0) {
            setChecklistDetailBlocks(firstTarget.detailBlocks);
          } else {
            setChecklistDetailBlocks([]);
          }
        }
      }

      if (setShowTemplate2Modal) setShowTemplate2Modal(false);
      if (setShowSavedToast) setShowSavedToast(true);
      if (toastTimerRef && toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastTimerRef) {
        toastTimerRef.current = setTimeout(() => {
          if (setShowSavedToast) setShowSavedToast(false);
        }, 1800);
      }
    } catch (err) {
      console.error('템플릿 적용 오류:', err);
      alert('템플릿을 적용하지 못했습니다.');
    }
  };

  return {
    buildTemplateCombinedBody,
    handleSelectTemplateInTab,
    handleCreateNewTemplateInTab,
    handleDeleteTemplateInTab,
    cloneTemplateData,
    handleApplyTemplate2ToItem
  };
}
