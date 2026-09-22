import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  X,
  Layout,
  Database,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  HardDrive,
  Download,
  Upload
} from 'lucide-react';
import { db } from '../../../firebase';
import {
  getLatestCloudBackupInfo,
  saveCloudBackup,
  fetchLatestCloudBackupData,
  applyRestoreData,
  downloadBackupFile,
  readBackupFile,
  getPreRestoreSafeguard
} from '../../../utils/backupService';
import { DEFAULT_MAIN_TABS } from '../notebookConstants';

export default function SettingsBackupModal({
  isOpen,
  onClose,
  mainTabs,
  onSaveMainTabs,
  items,
  categories,
  categoryGroups,
  templates,
  templates2,
  setShowSavedToast
}) {
  const [settingActiveTab, setSettingActiveTab] = useState('tabs');
  const [backupStatusMessage, setBackupStatusMessage] = useState(null);
  const [cloudBackupInfo, setCloudBackupInfo] = useState(null);
  const [hasPreRestoreSafeguard, setHasPreRestoreSafeguard] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);

  const backupFileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const refreshCloudBackupInfo = async () => {
    try {
      const info = await getLatestCloudBackupInfo(db);
      setCloudBackupInfo(info);
      setHasPreRestoreSafeguard(!!getPreRestoreSafeguard());
    } catch (err) {
      console.error('Backup info load error:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshCloudBackupInfo();
      setBackupStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const moveTab = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= mainTabs.length) return;
    const next = [...mainTabs];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    onSaveMainTabs(next);
  };

  const handleResetMainTabs = () => {
    if (window.confirm('메인탭 순서와 이름을 초기 기본값으로 되돌리시겠습니까?')) {
      onSaveMainTabs(DEFAULT_MAIN_TABS);
      onClose();
    }
  };

  // 1. 최신 백업 생성 (덮어쓰기)
  const handleSaveCloudBackup = async () => {
    try {
      setIsBackupLoading(true);
      setBackupStatusMessage(null);
      const res = await saveCloudBackup(db, {
        items,
        categories,
        categoryGroups,
        templates,
        templates2
      });
      setCloudBackupInfo(res);
      setBackupStatusMessage({
        type: 'success',
        text: `최신 백업이 클라우드에 안전하게 저장되었습니다! (메모 ${res.summary.itemsCount}개, 카테고리 ${res.summary.categoriesCount}개)`
      });
    } catch (err) {
      console.error('Save backup error:', err);
      setBackupStatusMessage({
        type: 'error',
        text: `백업 저장 실패: ${err.message}`
      });
    } finally {
      setIsBackupLoading(false);
    }
  };

  // 2. 최신 백업으로 복원
  const handleRestoreCloudBackup = async () => {
    if (!cloudBackupInfo) return;
    const dateStr = cloudBackupInfo.updatedAt
      ? new Date(cloudBackupInfo.updatedAt).toLocaleString()
      : '알 수 없음';
    const msg = `[최신 백업 복원 확인]\n\n• 백업 시점: ${dateStr}\n• 메모: ${cloudBackupInfo.summary.itemsCount}개\n• 카테고리: ${cloudBackupInfo.summary.categoriesCount}개\n\n해당 시점의 백업 데이터로 앱을 복원하시겠습니까?\n(안전을 위해 복원 직전 현재 상태가 임시 세이프가드로 자동 보관됩니다.)`;

    if (!window.confirm(msg)) return;

    try {
      setIsRestoreLoading(true);
      setRestoreProgress(0);
      setBackupStatusMessage(null);

      const payload = await fetchLatestCloudBackupData(db);
      await applyRestoreData(
        db,
        payload,
        { items, categories, categoryGroups, templates, templates2 },
        (progress) => setRestoreProgress(progress)
      );

      setHasPreRestoreSafeguard(true);
      setBackupStatusMessage({
        type: 'success',
        text: `성공적으로 복원되었습니다! (${dateStr} 시점)`
      });
    } catch (err) {
      console.error('Restore error:', err);
      setBackupStatusMessage({
        type: 'error',
        text: `복원 중 오류 발생: ${err.message}`
      });
    } finally {
      setIsRestoreLoading(false);
      setRestoreProgress(0);
    }
  };

  // 3. 복원 언두(Undo) - 복원 직전 원래 상태로 되돌리기
  const handleUndoRestore = async () => {
    const safeguard = getPreRestoreSafeguard();
    if (!safeguard) {
      alert('되돌릴 직전 복구 데이터가 없습니다.');
      return;
    }

    if (!window.confirm('복원 직전의 원래 상태로 다시 되돌리시겠습니까?')) return;

    try {
      setIsRestoreLoading(true);
      setRestoreProgress(0);
      setBackupStatusMessage(null);

      await applyRestoreData(
        db,
        safeguard,
        null,
        (progress) => setRestoreProgress(progress)
      );

      setBackupStatusMessage({
        type: 'success',
        text: '복원 직전 상태로 안전하게 되돌렸습니다.'
      });
    } catch (err) {
      console.error('Undo error:', err);
      setBackupStatusMessage({
        type: 'error',
        text: `되돌리기 실패: ${err.message}`
      });
    } finally {
      setIsRestoreLoading(false);
      setRestoreProgress(0);
    }
  };

  // 4. JSON 파일 다운로드
  const handleDownloadBackupFile = () => {
    try {
      downloadBackupFile({ items, categories, categoryGroups, templates, templates2 });
      setBackupStatusMessage({
        type: 'success',
        text: 'JSON 백업 파일이 다운로드되었습니다.'
      });
    } catch (err) {
      setBackupStatusMessage({
        type: 'error',
        text: `파일 다운로드 실패: ${err.message}`
      });
    }
  };

  // 5. JSON 파일 업로드 복원
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const payload = await readBackupFile(file);
      const itemsCnt = payload.summary?.itemsCount ?? payload.data?.items?.length ?? 0;
      const catCnt = payload.summary?.categoriesCount ?? payload.data?.categories?.length ?? 0;
      const dateStr = payload.exportedAt ? new Date(payload.exportedAt).toLocaleString() : '알 수 없음';

      const msg = `[선택한 백업 파일로 복원]\n\n• 파일명: ${file.name}\n• 백업 생성일: ${dateStr}\n• 메모: ${itemsCnt}개 / 카테고리: ${catCnt}개\n\n이 백업 파일의 데이터로 앱을 복원하시겠습니까?\n(복원 직전 현재 상태가 임시 세이프가드로 자동 보관됩니다.)`;
      if (!window.confirm(msg)) {
        if (backupFileInputRef.current) backupFileInputRef.current.value = '';
        return;
      }

      setIsRestoreLoading(true);
      setRestoreProgress(0);
      setBackupStatusMessage(null);

      await applyRestoreData(
        db,
        payload,
        { items, categories, categoryGroups, templates, templates2 },
        (progress) => setRestoreProgress(progress)
      );

      setHasPreRestoreSafeguard(true);
      setBackupStatusMessage({
        type: 'success',
        text: `파일(${file.name})에서 성공적으로 복원되었습니다!`
      });
    } catch (err) {
      console.error('File restore error:', err);
      setBackupStatusMessage({
        type: 'error',
        text: `파일 복원 실패: ${err.message}`
      });
    } finally {
      setIsRestoreLoading(false);
      setRestoreProgress(0);
      if (backupFileInputRef.current) backupFileInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '440px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="#2563EB" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>설정 및 데이터 관리</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setSettingActiveTab('tabs');
              setBackupStatusMessage(null);
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: '13px',
              fontWeight: settingActiveTab === 'tabs' ? 700 : 500,
              color: settingActiveTab === 'tabs' ? '#2563EB' : '#64748B',
              borderBottom: settingActiveTab === 'tabs' ? '2px solid #2563EB' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Layout size={14} />
            <span>메인탭 설정</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSettingActiveTab('backup');
              refreshCloudBackupInfo();
              setBackupStatusMessage(null);
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: '13px',
              fontWeight: settingActiveTab === 'backup' ? 700 : 500,
              color: settingActiveTab === 'backup' ? '#2563EB' : '#64748B',
              borderBottom: settingActiveTab === 'backup' ? '2px solid #2563EB' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Database size={14} />
            <span>데이터 백업 & 복원</span>
          </button>
        </div>

        {/* Tab 1: Main Tabs Setting */}
        {settingActiveTab === 'tabs' && (
          <>
            {/* Guide Text */}
            <div style={{ padding: '10px 18px', backgroundColor: '#EFF6FF', borderBottom: '1px solid #DBEAFE', fontSize: '12px', color: '#1E40AF', lineHeight: '1.4' }}>
              💡 화살표(▲/▼)로 탭 순서를 변경하고, 입력창에서 이름을 직접 수정할 수 있습니다. 메인 화면에서도 마우스로 끌어다 놓아 순서를 변경할 수 있습니다.
            </div>

            {/* Tab List */}
            <div style={{ padding: '12px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxHeight: '360px' }}>
              {mainTabs.map((tab, idx) => (
                <div
                  key={tab.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', width: '20px', textAlign: 'center' }}>
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={tab.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newTabs = mainTabs.map((t, i) => i === idx ? { ...t, label: val } : t);
                      onSaveMainTabs(newTabs);
                    }}
                    placeholder="탭 이름"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      color: '#1E293B'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveTab(idx, -1)}
                      title="위로 이동"
                      style={{
                        padding: '5px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '4px',
                        backgroundColor: idx === 0 ? '#F1F5F9' : '#FFFFFF',
                        color: idx === 0 ? '#CBD5E1' : '#475569',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === mainTabs.length - 1}
                      onClick={() => moveTab(idx, 1)}
                      title="아래로 이동"
                      style={{
                        padding: '5px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '4px',
                        backgroundColor: idx === mainTabs.length - 1 ? '#F1F5F9' : '#FFFFFF',
                        color: idx === mainTabs.length - 1 ? '#CBD5E1' : '#475569',
                        cursor: idx === mainTabs.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer for Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC'
              }}
            >
              <button
                type="button"
                onClick={handleResetMainTabs}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid #EF4444',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={13} />
                <span>기본값 초기화</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveMainTabs(mainTabs);
                  onClose();
                  if (typeof setShowSavedToast === 'function') {
                    setShowSavedToast(true);
                    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                    toastTimerRef.current = setTimeout(() => setShowSavedToast(false), 1800);
                  }
                }}
                style={{
                  padding: '7px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                동기화 완료
              </button>
            </div>
          </>
        )}

        {/* Tab 2: Backup & Restore */}
        {settingActiveTab === 'backup' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
            {/* Status Toast Message */}
            {backupStatusMessage && (
              <div
                style={{
                  padding: '10px 18px',
                  backgroundColor: backupStatusMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  borderBottom: `1px solid ${backupStatusMessage.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                  fontSize: '12px',
                  color: backupStatusMessage.type === 'success' ? '#15803D' : '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {backupStatusMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span style={{ flex: 1 }}>{backupStatusMessage.text}</span>
              </div>
            )}

            {/* Content Container */}
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Latest Backup Status Card */}
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                    <Database size={15} color="#2563EB" />
                    <span>최신 클라우드 백업본</span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      backgroundColor: cloudBackupInfo ? '#DCFCE7' : '#F1F5F9',
                      color: cloudBackupInfo ? '#15803D' : '#64748B'
                    }}
                  >
                    {cloudBackupInfo ? '백업 보관 중' : '백업 없음'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                  <div>
                    <strong>• 마지막 백업:</strong>{' '}
                    {cloudBackupInfo?.updatedAt ? new Date(cloudBackupInfo.updatedAt).toLocaleString() : '아직 저장된 백업이 없습니다.'}
                  </div>
                  {cloudBackupInfo?.summary && (
                    <div style={{ color: '#64748B', marginTop: '2px' }}>
                      • 메모 {cloudBackupInfo.summary.itemsCount}개 · 카테고리 {cloudBackupInfo.summary.categoriesCount}개 · 서재 {cloudBackupInfo.summary.categoryGroupsCount}개 · 서식 {(cloudBackupInfo.summary.templatesCount || 0) + (cloudBackupInfo.summary.templates2Count || 0)}개
                      {cloudBackupInfo.sizeBytes ? ` (${(cloudBackupInfo.sizeBytes / 1024).toFixed(1)} KB)` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Restore Progress Bar if active */}
              {isRestoreLoading && (
                <div style={{ padding: '10px 14px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#1D4ED8', marginBottom: '6px' }}>
                    <span>데이터 복원 적용 중...</span>
                    <span>{restoreProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#DBEAFE', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${restoreProgress}%`,
                        height: '100%',
                        backgroundColor: '#2563EB',
                        transition: 'width 0.2s ease'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Primary Actions: Save & Restore */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Save Backup Button */}
                <button
                  type="button"
                  disabled={isBackupLoading || isRestoreLoading}
                  onClick={handleSaveCloudBackup}
                  style={{
                    padding: '11px 16px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isBackupLoading || isRestoreLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    opacity: isBackupLoading ? 0.7 : 1
                  }}
                >
                  <RefreshCw size={15} className={isBackupLoading ? 'animate-spin' : ''} />
                  <span>{isBackupLoading ? '최신 백업 저장 중...' : '지금 최신 상태로 백업 업데이트 (덮어쓰기)'}</span>
                </button>

                {/* Restore Backup Button */}
                <button
                  type="button"
                  disabled={!cloudBackupInfo || isBackupLoading || isRestoreLoading}
                  onClick={handleRestoreCloudBackup}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#FFFFFF',
                    color: !cloudBackupInfo ? '#94A3B8' : '#D97706',
                    border: `1px solid ${!cloudBackupInfo ? '#E2E8F0' : '#FCD34D'}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: !cloudBackupInfo || isBackupLoading || isRestoreLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <RotateCcw size={15} />
                  <span>최신 백업 데이터로 복원하기</span>
                </button>

                {/* Undo Restore Button (If available) */}
                {hasPreRestoreSafeguard && (
                  <button
                    type="button"
                    disabled={isRestoreLoading}
                    onClick={handleUndoRestore}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      border: '1px dashed #F59E0B',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isRestoreLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShieldCheck size={14} />
                    <span>복원 직전 원래 상태로 되돌리기 (실행 취소)</span>
                  </button>
                )}
              </div>

              {/* Secondary Features: JSON File Export / Import */}
              <div
                style={{
                  marginTop: '4px',
                  padding: '12px 14px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  backgroundColor: '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HardDrive size={14} color="#64748B" />
                  <span>내 PC/기기 파일 백업 (JSON 파일)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleDownloadBackupFile}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Download size={13} color="#2563EB" />
                    <span>JSON 다운로드</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => backupFileInputRef.current?.click()}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Upload size={13} color="#059669" />
                    <span>파일에서 복원</span>
                  </button>

                  {/* Hidden File Input */}
                  <input
                    ref={backupFileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                  />
                </div>
              </div>
            </div>

            {/* Footer for Backup Tab */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '12px 18px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                marginTop: 'auto'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 18px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
