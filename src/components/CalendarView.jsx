import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
  Edit2
} from 'lucide-react';

export default function CalendarView({
  events = [],
  categories = [],
  selectedCategoryId = 'all',
  selectedEventId = null,
  onSelectEvent,
  onOpenCreateModal,
  onEditEvent,
  onDeleteEvent,
  onNavigateToSource
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'day' | '3days' | 'month'
  const [eventContextMenu, setEventContextMenu] = useState(null); // { x, y, event }
  const touchTimerRef = useRef(null);

  // 일정 우클릭 (PC)
  const handleEventContextMenu = (e, event) => {
    e.preventDefault();
    e.stopPropagation();
    const clickX = e.clientX || 100;
    const clickY = e.clientY || 100;
    const menuWidth = 150;
    const menuHeight = 50;
    const adjustedX = (clickX + menuWidth > window.innerWidth) ? Math.max(10, window.innerWidth - menuWidth - 10) : clickX;
    const adjustedY = (clickY + menuHeight > window.innerHeight) ? Math.max(10, window.innerHeight - menuHeight - 10) : clickY;
    setEventContextMenu({
      x: adjustedX,
      y: adjustedY,
      event
    });
  };

  // 일정 모바일 롱프레스 터치 시작
  const handleEventTouchStart = (e, event) => {
    const touch = e.touches ? e.touches[0] : null;
    const x = touch ? touch.clientX : 100;
    const y = touch ? touch.clientY : 100;
    touchTimerRef.current = setTimeout(() => {
      const menuWidth = 150;
      const menuHeight = 50;
      const adjustedX = (x + menuWidth > window.innerWidth) ? Math.max(10, window.innerWidth - menuWidth - 10) : x;
      const adjustedY = (y + menuHeight > window.innerHeight) ? Math.max(10, window.innerHeight - menuHeight - 10) : y;
      setEventContextMenu({
        x: adjustedX,
        y: adjustedY,
        event
      });
    }, 500);
  };

  // 터치 종료/취소
  const handleEventTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  // 일정에서 해제 실행
  const handleReleaseEvent = (event) => {
    if (!event) return;
    setEventContextMenu(null);
    if (window.confirm(`'${event.title || '일정'}'을(를) 일정에서 해제하시겠습니까?`)) {
      if (onDeleteEvent) {
        onDeleteEvent(event.id);
      }
    }
  };

  // 날짜 유틸 함수들
  const formatDateKey = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCategoryColor = (catId) => {
    const cat = categories.find(c => c.id === catId);
    if (cat?.name === '계약') return '#16A34A';
    if (cat?.name === '잔금') return '#DC2626';
    if (cat?.name === '고객') return '#7C3AED';
    if (cat?.name === '할일') return '#3B82F6';
    return cat?.color || '#3B82F6';
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.name || '할일';
  };

  // 필터링된 이벤트
  const filteredEvents = events.filter(e => {
    if (e.isDeleted) return false;
    if (selectedCategoryId !== 'all' && e.categoryId !== selectedCategoryId) return false;
    return true;
  });

  // 이전/다음 날짜 이동
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === '3days') {
      next.setDate(next.getDate() - 3);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === '3days') {
      next.setDate(next.getDate() + 3);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 타이틀 텍스트 생성
  const getHeaderTitle = () => {
    if (viewMode === 'all') {
      const catName = selectedCategoryId === 'all' ? '전체 일정' : `${getCategoryName(selectedCategoryId)} 범주`;
      return `${catName} 목록 (${filteredEvents.length})`;
    }

    const yyyy = currentDate.getFullYear();
    const mm = currentDate.getMonth() + 1;
    const dd = currentDate.getDate();

    if (viewMode === 'month') {
      return `${yyyy}년 ${mm}월`;
    } else if (viewMode === '3days') {
      const end = new Date(currentDate);
      end.setDate(end.getDate() + 2);
      return `${yyyy}.${mm}.${dd} ~ ${end.getFullYear()}.${end.getMonth() + 1}.${end.getDate()}`;
    } else {
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      return `${yyyy}년 ${mm}월 ${dd}일 (${dayNames[currentDate.getDay()]})`;
    }
  };

  // 0. 전체 일정 목록 뷰 생성 로직
  const renderAllView = () => {
    // 날짜 최신순 정렬
    const sortedEvents = [...filteredEvents].sort((a, b) => {
      const dateA = a.startDate || '';
      const dateB = b.startDate || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      const timeA = a.isAllDay ? '00:00' : (a.startTime || '00:00');
      const timeB = b.isAllDay ? '00:00' : (b.startTime || '00:00');
      return timeB.localeCompare(timeA);
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#FFFFFF' }}>
        {/* 상단 액션 바 */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            총 {sortedEvents.length}개의 등록된 일정
          </span>
          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal(formatDateKey(new Date()))}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={13} />
            <span>새 일정 추가</span>
          </button>
        </div>

        {/* 전체 일정 리스트 */}
        <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '50px' }}>
              등록된 일정이 없습니다. 우측 상단 [+ 새 일정 추가] 버튼을 눌러 일정을 추가해 보세요.
            </div>
          ) : (
            sortedEvents.map((event) => {
              const isSelected = selectedEventId === event.id;
              const catColor = getCategoryColor(event.categoryId);
              const catName = getCategoryName(event.categoryId);

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  onContextMenu={(e) => handleEventContextMenu(e, event)}
                  onTouchStart={(e) => handleEventTouchStart(e, event)}
                  onTouchEnd={handleEventTouchEnd}
                  onTouchMove={handleEventTouchEnd}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    boxShadow: isSelected ? '0 3px 8px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title="클릭: 하위 내용 확인 | 우클릭/롱프레스: 일정에서 해제"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* 배지 + 수정 + 이동 세그먼트 탭 */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          overflow: 'hidden',
                          backgroundColor: '#FFFFFF',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          flexShrink: 0
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            backgroundColor: catColor,
                            padding: '2px 7px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1.2
                          }}
                        >
                          {catName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditEvent) onEditEvent(event);
                          }}
                          style={{
                            padding: '2px 7px',
                            backgroundColor: '#FFFFFF',
                            border: 'none',
                            borderLeft: '1px solid #CBD5E1',
                            color: '#475569',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            lineHeight: 1.2,
                            transition: 'background-color 0.12s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                          title="일정 수정하기"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToSource) onNavigateToSource(event);
                          }}
                          style={{
                            padding: '2px 7px',
                            backgroundColor: '#FFFFFF',
                            border: 'none',
                            borderLeft: '1px solid #CBD5E1',
                            color: '#2563EB',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            lineHeight: 1.2,
                            transition: 'background-color 0.12s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                          title="실제 원본 메모 위치로 이동"
                        >
                          이동
                        </button>
                      </div>

                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF', backgroundColor: '#DBEAFE', padding: '1px 6px', borderRadius: '4px' }}>
                        {event.startDate}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} color="#64748B" />
                      {event.isAllDay ? '종일' : `${event.startTime} ~ ${event.endTime}`}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {event.title}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // 1. 월간 뷰 달력 생성 로직
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    const days = [];

    // 이전 달 뒷부분 날짜
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevLastDate - i);
      days.push({ date: d, isCurrentMonth: false, dateKey: formatDateKey(d) });
    }

    // 이번 달 날짜
    for (let i = 1; i <= lastDate; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true, dateKey: formatDateKey(d) });
    }

    // 다음 달 앞부분 날짜 (6주 그리드 42개 맞춤)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, dateKey: formatDateKey(d) });
    }

    const todayKey = formatDateKey(new Date());

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 요일 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                padding: '6px 0',
                fontSize: '11px',
                fontWeight: 700,
                color: idx === 0 ? '#EF4444' : idx === 6 ? '#2563EB' : '#64748B'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 달력 날짜 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', flex: 1, overflowY: 'auto' }}>
          {days.map((item, idx) => {
            const isToday = item.dateKey === todayKey;
            const isSunday = item.date.getDay() === 0;
            const isSaturday = item.date.getDay() === 6;
            const dayEvents = filteredEvents.filter(e => e.startDate === item.dateKey);

            return (
              <div
                key={idx}
                onClick={() => onOpenCreateModal && onOpenCreateModal(item.dateKey)}
                style={{
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #F1F5F9',
                  borderBottom: '1px solid #F1F5F9',
                  backgroundColor: item.isCurrentMonth ? '#FFFFFF' : '#FAFAFA',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  minHeight: '80px',
                  overflow: 'hidden'
                }}
                title={`${item.dateKey} 클릭하여 새 일정 등록`}
              >
                {/* 날짜 숫자 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isToday ? 800 : 600,
                      color: isToday
                        ? '#FFFFFF'
                        : !item.isCurrentMonth
                        ? '#CBD5E1'
                        : isSunday
                        ? '#EF4444'
                        : isSaturday
                        ? '#2563EB'
                        : '#334155',
                      backgroundColor: isToday ? '#2563EB' : 'transparent',
                      width: isToday ? '20px' : 'auto',
                      height: isToday ? '20px' : 'auto',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {item.date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* 해당 날짜 일정 목록 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1 }}>
                  {dayEvents.slice(0, 4).map((event) => {
                    const isSelected = selectedEventId === event.id;
                    const catColor = getCategoryColor(event.categoryId);

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        onContextMenu={(e) => handleEventContextMenu(e, event)}
                        onTouchStart={(e) => handleEventTouchStart(e, event)}
                        onTouchEnd={handleEventTouchEnd}
                        onTouchMove={handleEventTouchEnd}
                        style={{
                          fontSize: '11px',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          backgroundColor: isSelected ? '#1E293B' : `${catColor}15`,
                          color: isSelected ? '#FFFFFF' : catColor,
                          borderLeft: `3px solid ${catColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: isSelected ? 700 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.1s'
                        }}
                        title={`${event.title} (${event.isAllDay ? '종일' : `${event.startTime}~${event.endTime}`})`}
                      >
                        {!event.isAllDay && event.startTime && (
                          <span style={{ fontSize: '9px', opacity: 0.85, flexShrink: 0 }}>
                            {event.startTime}
                          </span>
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {event.title}
                        </span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 4 && (
                    <span style={{ fontSize: '9px', color: '#64748B', paddingLeft: '4px' }}>
                      +{dayEvents.length - 4}개 더보기
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 2. 3일 뷰 생성 로직
  const render3DaysView = () => {
    const dates = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    const todayKey = formatDateKey(new Date());
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', height: '100%', overflowY: 'auto' }}>
        {dates.map((d, idx) => {
          const dateKey = formatDateKey(d);
          const isToday = dateKey === todayKey;
          const dayEvents = filteredEvents.filter(e => e.startDate === dateKey);

          return (
            <div
              key={dateKey}
              style={{
                borderRight: idx < 2 ? '1px solid #E2E8F0' : 'none',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                height: '100%'
              }}
            >
              {/* 일자 헤더 */}
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #E2E8F0',
                  backgroundColor: isToday ? '#EFF6FF' : '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: isToday ? '#2563EB' : '#1E293B' }}>
                    {d.getDate()}일
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                    ({dayNames[d.getDay()]})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCreateModal && onOpenCreateModal(dateKey)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '5px',
                    color: '#2563EB',
                    cursor: 'pointer',
                    padding: '3px 6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                  title="이 날짜에 새 일정 추가"
                >
                  <Plus size={12} />
                  <span>추가</span>
                </button>
              </div>

              {/* 일정 리스트 */}
              <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dayEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '12px', marginTop: '30px' }}>
                    일정이 없습니다
                  </div>
                ) : (
                  dayEvents.map((event) => {
                    const isSelected = selectedEventId === event.id;
                    const catColor = getCategoryColor(event.categoryId);
                    const catName = getCategoryName(event.categoryId);

                    return (
                      <div
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        onContextMenu={(e) => handleEventContextMenu(e, event)}
                        onTouchStart={(e) => handleEventTouchStart(e, event)}
                        onTouchEnd={handleEventTouchEnd}
                        onTouchMove={handleEventTouchEnd}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`,
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                          boxShadow: isSelected ? '0 2px 5px rgba(59, 130, 246, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        title="클릭: 하위 내용 확인 | 우클릭/롱프레스: 일정에서 해제"
                      >
                        {/* 상단 라인: [범주 배지 | 수정 | 이동] 세그먼트 탭 & 우측 [시간] */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '5px' }}>
                          {/* 배지 + 수정 + 이동 통합 세그먼트 탭 */}
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              overflow: 'hidden',
                              backgroundColor: '#FFFFFF',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                              flexShrink: 0
                            }}
                          >
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                backgroundColor: catColor,
                                padding: '2px 6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1.2
                              }}
                            >
                              {catName}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEditEvent) onEditEvent(event);
                              }}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#FFFFFF',
                                border: 'none',
                                borderLeft: '1px solid #CBD5E1',
                                color: '#475569',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                lineHeight: 1.2,
                                transition: 'background-color 0.12s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                              title="일정 수정하기"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigateToSource) onNavigateToSource(event);
                              }}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#FFFFFF',
                                border: 'none',
                                borderLeft: '1px solid #CBD5E1',
                                color: '#2563EB',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                lineHeight: 1.2,
                                transition: 'background-color 0.12s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                              title="실제 원본 메모 위치로 이동"
                            >
                              이동
                            </button>
                          </div>

                          {/* 우측 시간 표기 */}
                          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                            <Clock size={10} />
                            {event.isAllDay ? '종일' : `${event.startTime} ~ ${event.endTime}`}
                          </span>
                        </div>

                        {/* 하단 라인: 일정 제목 (가로 전체 폭 활용) */}
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', wordBreak: 'break-word', lineHeight: '1.4' }}>
                          {event.title}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 3. 일간 뷰 생성 로직
  const renderDayView = () => {
    const dateKey = formatDateKey(currentDate);
    const dayEvents = filteredEvents.filter(e => e.startDate === dateKey);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#FFFFFF' }}>
        {/* 상단 액션 바 */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            총 {dayEvents.length}개의 일정
          </span>
          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal(dateKey)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={13} />
            <span>새 일정 추가</span>
          </button>
        </div>

        {/* 일정 리스트 타임라인 */}
        <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dayEvents.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '50px' }}>
              등록된 일정이 없습니다. 우측 상단 버튼이나 달력을 클릭하여 일정을 추가해 보세요.
            </div>
          ) : (
            dayEvents.map((event) => {
              const isSelected = selectedEventId === event.id;
              const catColor = getCategoryColor(event.categoryId);
              const catName = getCategoryName(event.categoryId);

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  onContextMenu={(e) => handleEventContextMenu(e, event)}
                  onTouchStart={(e) => handleEventTouchStart(e, event)}
                  onTouchEnd={handleEventTouchEnd}
                  onTouchMove={handleEventTouchEnd}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    boxShadow: isSelected ? '0 3px 8px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title="클릭: 하위 내용 확인 | 우클릭/롱프레스: 일정에서 해제"
                >
                  {/* 상단 라인: [범주 배지 | 수정 | 이동] 세그먼트 탭 & 우측 [시간] */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        overflow: 'hidden',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        flexShrink: 0
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          backgroundColor: catColor,
                          padding: '2px 7px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1.2
                        }}
                      >
                        {catName}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditEvent) onEditEvent(event);
                        }}
                        style={{
                          padding: '2px 7px',
                          backgroundColor: '#FFFFFF',
                          border: 'none',
                          borderLeft: '1px solid #CBD5E1',
                          color: '#475569',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          lineHeight: 1.2,
                          transition: 'background-color 0.12s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                        title="일정 수정하기"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateToSource) onNavigateToSource(event);
                        }}
                        style={{
                          padding: '2px 7px',
                          backgroundColor: '#FFFFFF',
                          border: 'none',
                          borderLeft: '1px solid #CBD5E1',
                          color: '#2563EB',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          lineHeight: 1.2,
                          transition: 'background-color 0.12s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                        title="실제 원본 메모 위치로 이동"
                      >
                        이동
                      </button>
                    </div>

                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <Clock size={11} color="#64748B" />
                      {event.isAllDay ? '종일' : `${event.startTime} ~ ${event.endTime}`}
                    </span>
                  </div>

                  {/* 하단 라인: 일정 제목 */}
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {event.title}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#FFFFFF' }}>
      {/* 캘린더 상단 툴바: [네비게이션] [제목] [뷰 전환 세그먼트] */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {/* 네비게이션 & 제목 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {viewMode !== 'all' && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  padding: '5px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="이전"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleToday}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                오늘
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: '5px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="다음"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          <h2 style={{ margin: '0 0 0 8px', fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>
            {getHeaderTitle()}
          </h2>
        </div>

        {/* 뷰 모드 전환 버튼 그룹 (전체 | 일간 | 3일 | 월간) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F1F5F9',
            padding: '2px',
            borderRadius: '7px',
            border: '1px solid #E2E8F0'
          }}
        >
          {[
            { key: 'all', label: '전체' },
            { key: 'day', label: '일간' },
            { key: '3days', label: '3일' },
            { key: 'month', label: '월간' }
          ].map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setViewMode(mode.key)}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: viewMode === mode.key ? '#FFFFFF' : 'transparent',
                color: viewMode === mode.key ? '#1D4ED8' : '#64748B',
                fontWeight: viewMode === mode.key ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === mode.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 메인 컨텐츠 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {viewMode === 'all' && renderAllView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === '3days' && render3DaysView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* 일정 우클릭 / 모바일 롱프레스 컨텍스트 메뉴 */}
      {eventContextMenu && (
        <div
          onClick={() => setEventContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setEventContextMenu(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'transparent'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${eventContextMenu.y}px`,
              left: `${eventContextMenu.x}px`,
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08)',
              padding: '4px',
              minWidth: '140px',
              zIndex: 10000
            }}
          >
            <button
              type="button"
              onClick={() => {
                const targetEvent = eventContextMenu.event;
                setEventContextMenu(null);
                if (onEditEvent) onEditEvent(targetEvent);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.12s',
                marginBottom: '2px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Edit2 size={14} color="#3B82F6" />
              <span>일정 수정</span>
            </button>
            <button
              type="button"
              onClick={() => handleReleaseEvent(eventContextMenu.event)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#DC2626',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.12s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Trash2 size={14} color="#DC2626" />
              <span>일정에서 해제</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
