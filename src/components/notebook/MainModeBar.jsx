import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { QUICK_MEMO_CATEGORY } from './notebookConstants';
import { styles } from './notebookStyles';

export const UserBar = React.memo(function UserBar({
  currentUser,
  onLogout,
  setIsTabSettingModalOpen,
  customStyle = {}
}) {
  if (!currentUser) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 8px',
        backgroundColor: '#F1F5F9',
        borderRadius: '6px',
        border: '1px solid #E2E8F0',
        fontSize: '11px',
        color: '#475569',
        boxSizing: 'border-box',
        ...customStyle
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 600, color: '#1E293B' }}>
          관리자 ({currentUser.email ? `${currentUser.email.slice(0, 3)}***@${currentUser.email.split('@')[1] || ''}` : '인증됨'})
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setIsTabSettingModalOpen(true)}
          style={{
            padding: '2px 7px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            flexShrink: 0
          }}
          title="메인탭 순서 변경 및 이름 설정"
        >
          <Settings size={11} />
          <span>설정</span>
        </button>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            style={{
              padding: '2px 7px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#64748B',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="로그아웃"
          >
            로그아웃
          </button>
        )}
      </div>
    </div>
  );
});

export const MainModeBar = React.memo(function MainModeBar({
  isMobile,
  isCalendarMode,
  setIsCalendarMode,
  activeMainTab,
  setActiveMainTab,
  setMobileView,
  handleOpenQuickMemo,
  showUserBar = true,
  currentUser,
  onLogout,
  setIsTabSettingModalOpen,
  mainTabs = [],
  draggedTabIndex,
  dragOverTabIndex,
  handleTabDragStart,
  handleTabDragOver,
  handleTabDrop,
  handleTabDragEnd,
  handleTabTouchStart,
  handleTabTouchEnd,
  setEditingTab,
  setEditingTabInput,
  handleTabSwitch,
  previousWorkTarget,
  handleReturnPrevious,
  handleNavigateToQuickMemo,
  handleCategoryContextMenu,
  selectedCategoryId
}) {
    // 모바일 캘린더 모드일 때는 화면 공간 확보를 위해 3줄 메인탭과 프로필 바를 숨기고 1줄 슬림 네비게이션만 표시
    if (isMobile && (isCalendarMode || activeMainTab === 'calendar')) {
      return (
        <div style={{
          ...styles.mainModeBar,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          borderBottom: 'none',
          borderTop: '1px solid #CBD5E1',
          backgroundColor: '#F8FAFC',
          padding: '6px 8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
            <button
              type="button"
              onClick={() => {
                setIsCalendarMode(false);
                if (activeMainTab === 'calendar') {
                  setActiveMainTab('explorer');
                }
                setMobileView('items');
              }}
              style={{
                flex: 1.2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '7px 4px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #93C5FD',
                borderRadius: '6px',
                color: '#1D4ED8',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.1)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title="메모장 화면으로 돌아가기"
            >
              <ArrowLeft size={14} />
              <span>메모장</span>
            </button>
            <button
              type="button"
              onClick={handleOpenQuickMemo}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 4px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE047',
                borderRadius: '6px',
                color: '#B45309',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(245, 158, 11, 0.15)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title="퀵메모 작성 모달 열기 (단축키: Alt+Q)"
            >
              <span>퀵메모</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCalendarMode(false);
                if (activeMainTab === 'calendar') {
                  setActiveMainTab('explorer');
                }
                setMobileView('items');
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 4px',
                backgroundColor: '#DBEAFE',
                border: '1px solid #2563EB',
                borderRadius: '6px',
                color: '#1D4ED8',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title="캘린더 모드 닫기 (메모장으로 복귀)"
            >
              <span>📅 캘린더</span>
            </button>
          </div>
        </div>
      );
    }

    return (
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
      {/* User Profile & Logout Bar */}
      {showUserBar && <UserBar currentUser={currentUser} onLogout={onLogout} setIsTabSettingModalOpen={setIsTabSettingModalOpen} />}

      {/* Function Segmented Tabs (3 Rows x 5 Columns, Total 15 Tabs) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '4px',
          backgroundColor: '#F1F5F9',
          borderRadius: '9px',
          border: '1px solid #CBD5E1',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Row 1 (1단: 파스텔 스카이블루) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          width: '100%',
          backgroundColor: '#F0F7FF',
          padding: '2px',
          borderRadius: '7px',
          border: '1px solid #DBEAFE'
        }}>
          {mainTabs.slice(0, 5).map((tab, idx) => {
            const index = idx;
            const isActive = activeMainTab === tab.id;
            const isMeTab = tab.id === 'explorer';
            const isDragging = draggedTabIndex === index;
            const isOver = dragOverTabIndex === index;

            return (
              <button
                key={tab.id}
                type="button"
                draggable
                onDragStart={(e) => handleTabDragStart(e, index)}
                onDragOver={(e) => handleTabDragOver(e, index)}
                onDrop={(e) => handleTabDrop(e, index)}
                onDragEnd={handleTabDragEnd}
                onTouchStart={() => handleTabTouchStart(tab)}
                onTouchEnd={handleTabTouchEnd}
                onTouchMove={handleTabTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setEditingTab(tab);
                  setEditingTabInput(tab.label);
                }}
                onClick={() => handleTabSwitch(tab.id)}
                title={`${tab.label} (드래그: 순서 이동, 우클릭/길게 누름: 이름 변경)`}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 700,
                  border: isOver ? '2px dashed #2563EB' : 'none',
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isMeTab
                    ? (isActive ? '#15803D' : '#16A34A')
                    : (isActive ? '#1D4ED8' : '#334155'),
                  boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  opacity: isDragging ? 0.4 : 1,
                  userSelect: 'none'
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1단과 2단 사이 구분선 */}
        <div style={{ height: '1px', backgroundColor: '#CBD5E1', margin: '0 2px', opacity: 0.8 }} />

        {/* Row 2 (2단: 파스텔 세이지민트) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          width: '100%',
          backgroundColor: '#F0FDF4',
          padding: '2px',
          borderRadius: '7px',
          border: '1px solid #DCFCE7'
        }}>
          {mainTabs.slice(5, 10).map((tab, idx) => {
            const index = 5 + idx;
            const isActive = activeMainTab === tab.id;
            const isMeTab = tab.id === 'explorer';
            const isDragging = draggedTabIndex === index;
            const isOver = dragOverTabIndex === index;

            return (
              <button
                key={tab.id}
                type="button"
                draggable
                onDragStart={(e) => handleTabDragStart(e, index)}
                onDragOver={(e) => handleTabDragOver(e, index)}
                onDrop={(e) => handleTabDrop(e, index)}
                onDragEnd={handleTabDragEnd}
                onTouchStart={() => handleTabTouchStart(tab)}
                onTouchEnd={handleTabTouchEnd}
                onTouchMove={handleTabTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setEditingTab(tab);
                  setEditingTabInput(tab.label);
                }}
                onClick={() => handleTabSwitch(tab.id)}
                title={`${tab.label} (드래그: 순서 이동, 우클릭/길게 누름: 이름 변경)`}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 700,
                  border: isOver ? '2px dashed #16A34A' : 'none',
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isMeTab
                    ? (isActive ? '#15803D' : '#16A34A')
                    : (isActive ? '#15803D' : '#166534'),
                  boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  opacity: isDragging ? 0.4 : 1,
                  userSelect: 'none'
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2단과 3단 사이 구분선 */}
        <div style={{ height: '1px', backgroundColor: '#CBD5E1', margin: '0 2px', opacity: 0.8 }} />

        {/* Row 3 (3단: 파스텔 라벤더) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          width: '100%',
          backgroundColor: '#FAF5FF',
          padding: '2px',
          borderRadius: '7px',
          border: '1px solid #F3E8FF'
        }}>
          {mainTabs.slice(10, 15).map((tab, idx) => {
            const index = 10 + idx;
            const isActive = activeMainTab === tab.id;
            const isMeTab = tab.id === 'explorer';
            const isDragging = draggedTabIndex === index;
            const isOver = dragOverTabIndex === index;

            return (
              <button
                key={tab.id}
                type="button"
                draggable
                onDragStart={(e) => handleTabDragStart(e, index)}
                onDragOver={(e) => handleTabDragOver(e, index)}
                onDrop={(e) => handleTabDrop(e, index)}
                onDragEnd={handleTabDragEnd}
                onTouchStart={() => handleTabTouchStart(tab)}
                onTouchEnd={handleTabTouchEnd}
                onTouchMove={handleTabTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setEditingTab(tab);
                  setEditingTabInput(tab.label);
                }}
                onClick={() => handleTabSwitch(tab.id)}
                title={`${tab.label} (드래그: 순서 이동, 우클릭/길게 누름: 이름 변경)`}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 700,
                  border: isOver ? '2px dashed #9333EA' : 'none',
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isMeTab
                    ? (isActive ? '#15803D' : '#16A34A')
                    : (isActive ? '#7E22CE' : '#6B21A8'),
                  boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  opacity: isDragging ? 0.4 : 1,
                  userSelect: 'none'
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Memo Action Buttons: [이전] [퀵메모이동] [퀵메모] */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', marginTop: '2px' }}>
        <button
          type="button"
          disabled={!previousWorkTarget}
          onClick={handleReturnPrevious}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 2px',
            backgroundColor: previousWorkTarget ? '#FEF3C7' : '#F1F5F9',
            border: `1px solid ${previousWorkTarget ? '#F59E0B' : '#E2E8F0'}`,
            borderRadius: '6px',
            color: previousWorkTarget ? '#92400E' : '#94A3B8',
            fontSize: '12px',
            fontWeight: previousWorkTarget ? 700 : 500,
            cursor: previousWorkTarget ? 'pointer' : 'not-allowed',
            opacity: previousWorkTarget ? 1 : 0.6,
            boxShadow: previousWorkTarget ? '0 1px 2px rgba(245, 158, 11, 0.15)' : 'none',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
          title={previousWorkTarget ? `이전 작업 위치로 이동: ${previousWorkTarget.itemTitle || '메모'}` : '이전 작업 위치 없음'}
        >
          <span>이전</span>
        </button>
        <button
          type="button"
          onClick={handleNavigateToQuickMemo}
          onContextMenu={(e) => handleCategoryContextMenu(e, { id: 'quick_memo', name: '퀵메모', scope: 'explorer' })}
          style={{
            flex: 1.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 2px',
            backgroundColor: (activeMainTab === 'explorer' && selectedCategoryId === QUICK_MEMO_CATEGORY.id) ? '#FDE68A' : '#FEF3C7',
            border: `1px solid ${(activeMainTab === 'explorer' && selectedCategoryId === QUICK_MEMO_CATEGORY.id) ? '#F59E0B' : '#FDE047'}`,
            borderRadius: '6px',
            color: '#B45309',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(245, 158, 11, 0.15)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
          title="퀵메모 카테고리(목록)로 이동 (우클릭: 주소 복사)"
        >
          <span>퀵메모이동</span>
        </button>
        <button
          type="button"
          onClick={handleOpenQuickMemo}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 2px',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE047',
            borderRadius: '6px',
            color: '#B45309',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(245, 158, 11, 0.15)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
          title="퀵메모 작성 모달 열기 (단축키: Alt+Q)"
        >
          <span>퀵메모</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsCalendarMode((prev) => {
              const next = !prev;
              if (next && isMobile) {
                setMobileView('items');
              }
              return next;
            });
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 2px',
            backgroundColor: isCalendarMode ? '#DBEAFE' : '#EFF6FF',
            border: `1px solid ${isCalendarMode ? '#2563EB' : '#BFDBFE'}`,
            borderRadius: '6px',
            color: isCalendarMode ? '#1D4ED8' : '#2563EB',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: isCalendarMode ? '0 1px 3px rgba(37, 99, 235, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
          title="캘린더 모드 열기 / 닫기"
        >
          <span>📅 캘린더</span>
        </button>
      </div>
    </div>
  );
});
