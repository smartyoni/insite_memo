import { useState } from 'react';

export function usePrintActions({
  currentChecklists = [],
  activeItem,
  templates = []
}) {
  const [printTarget, setPrintTarget] = useState('detail');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintFieldIds, setSelectedPrintFieldIds] = useState({});
  const [isChecklistPrintModalOpen, setIsChecklistPrintModalOpen] = useState(false);
  const [selectedPrintChecklistIds, setSelectedPrintChecklistIds] = useState({});

  const handlePrint = (target) => {
    setPrintTarget(target);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleOpenChecklistPrint = () => {
    setPrintTarget('checklist');
    if (currentChecklists.length > 0) {
      const initialMap = {};
      currentChecklists.forEach((item) => {
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
    const tpl = activeItem?.templateId ? templates.find((t) => t.id === activeItem.templateId) : null;
    if (tpl && tpl.fields && tpl.fields.length > 0) {
      const initialMap = {};
      tpl.fields.forEach((f) => {
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

  return {
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
  };
}
