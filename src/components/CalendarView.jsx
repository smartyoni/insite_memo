import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  ListTodo
} from 'lucide-react';

export default function CalendarView({
  events = [],
  categories = [],
  selectedCategoryId = 'all',
  selectedEventId = null,
  onSelectEvent,
  onOpenCreateModal,
  onDeleteEvent
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'day' | '3days' | 'month'

  // 날짜 유틸 함수들
  const formatDateKey = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCategoryColor = (catId) => {
    const cat = categories.find(c => c.id === catId);
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
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`,
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                          boxShadow: isSelected ? '0 2px 5px rgba(59, 130, 246, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#FFFFFF',
                              backgroundColor: catColor,
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {catName}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} />
                            {event.isAllDay ? '종일' : `${event.startTime} ~ ${event.endTime}`}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', wordBreak: 'break-word' }}>
                          {event.title}
                        </div>
                        {Array.isArray(event.blocks) && event.blocks.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ListTodo size={11} />
                            <span>하위 항목 {event.blocks.length}개 포함</span>
                          </div>
                        )}
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
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1.5px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          backgroundColor: catColor,
                          padding: '2px 8px',
                          borderRadius: '5px'
                        }}
                      >
                        {catName}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} color="#64748B" />
                        {event.isAllDay ? '종일' : `${event.startTime} ~ ${event.endTime}`}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                    {event.title}
                  </div>

                  {Array.isArray(event.blocks) && event.blocks.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                      <ListTodo size={13} />
                      <span>하위 내용(체크리스트 등) {event.blocks.length}개 포함됨</span>
                    </div>
                  )}
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

          <h2 style={{ margin: '0 0 0 8px', fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>
            {getHeaderTitle()}
          </h2>
        </div>

        {/* 뷰 모드 전환 버튼 그룹 (일간 | 3일 | 월간) */}
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
        {viewMode === 'month' && renderMonthView()}
        {viewMode === '3days' && render3DaysView()}
        {viewMode === 'day' && renderDayView()}
      </div>
    </div>
  );
}
