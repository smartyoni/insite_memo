export const styles = {
  appContainer: {
    display: 'flex',
    width: '100vw',
    height: '100dvh',
    backgroundColor: '#FAFAF8',
    overflow: 'hidden',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    position: 'relative'
  },

  mobileFooterContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #CBD5E1',
    flexShrink: 0,
    paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
    zIndex: 90
  },

  mobileFabBtn: {
    position: 'fixed',
    bottom: 'max(76px, calc(env(safe-area-inset-bottom, 0px) + 76px))',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'transform 0.15s ease, background-color 0.15s ease'
  },

  // Pane 1: Category (Pastel Blue, 280px)
  pane1: {
    height: '100%',
    backgroundColor: '#EBF3FA',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #D4E3F3'
  },
  pane1Header: {
    height: '52px',
    padding: '0 12px 0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #D4E3F3',
    backgroundColor: '#E2ECF7'
  },
  pane1Title: {
    color: '#2B5278',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.5px'
  },
  quickAddBtn: {
    backgroundColor: '#D8E6F5',
    color: '#1E3A5F',
    border: '1px solid #BFD7F2',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease'
  },
  iconBtnDark: {
    background: 'none',
    border: 'none',
    color: '#4A729A',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s, background-color 0.15s'
  },

  paneContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  },

  inlineInputRowDark: {
    padding: '4px 8px',
    marginBottom: '6px'
  },
  inputDark: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    border: '1px solid #3B82F6',
    borderRadius: '4px',
    padding: '6px 10px',
    color: '#1E293B',
    fontSize: '13px',
    outline: 'none'
  },
  inputDarkInline: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    border: '1px solid #3B82F6',
    borderRadius: '3px',
    padding: '2px 6px',
    color: '#1E293B',
    fontSize: '13px',
    outline: 'none'
  },

  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '3px',
    fontSize: '14px',
    position: 'relative'
  },
  rowLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  actionBtnDark: {
    background: 'none',
    border: 'none',
    color: '#7C95B1',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '3px'
  },
  actionBtnConfirm: {
    background: 'rgba(37, 99, 235, 0.15)',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center'
  },
  actionBtnCancel: {
    background: 'rgba(229, 115, 115, 0.2)',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center'
  },

  // Pane 2: Notes List (Light, 308px)
  pane2: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #ECEBE7'
  },
  pane2Header: {
    height: '52px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #ECEBE7',
    backgroundColor: '#FAF9F6'
  },
  pane2Title: {
    color: '#22262A',
    fontSize: '14px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  iconBtnLight: {
    background: 'none',
    border: 'none',
    color: '#3C3F42',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  mobileBackBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    fontWeight: 600,
    padding: '4px 6px',
    borderRadius: '4px'
  },

  emptyStateText: {
    color: '#A0A6B2',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '40px'
  },

  itemCard: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ECEBE7',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  itemCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: 600,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: 1.45,
    flex: 1
  },
  inputLightInline: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    border: '1px solid #3F7A63',
    borderRadius: '3px',
    padding: '2px 6px',
    color: '#22262A',
    fontSize: '13px',
    outline: 'none'
  },
  actionGroupLight: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  actionBtnLight: {
    background: 'none',
    border: 'none',
    color: '#8A909A',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '3px'
  },
  itemPreview: {
    fontSize: '11px',
    color: '#7E8592',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },

  // Pane 3: Detail Workspace (Flex 1)
  pane3: {
    flex: 1,
    height: '100%',
    backgroundColor: '#FAFAF8',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  pane3Header: {
    height: '46px',
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #ECEBE7',
    backgroundColor: '#FFFFFF'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#6C727E'
  },

  btnPrimary: {
    backgroundColor: '#3F7A63',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.15s'
  },
  btnSecondary: {
    backgroundColor: '#EFEFEA',
    color: '#3C3F42',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  toastBadge: {
    backgroundColor: 'rgba(63, 122, 99, 0.12)',
    color: '#3F7A63',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600
  },

  mobileTabBar: {
    display: 'flex',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #CBD5E1',
    padding: '4px 8px',
    gap: '6px'
  },
  mobileTabBtn: {
    flex: 1,
    padding: '7px 0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },

  pane3Body: {
    flex: 1,
    overflow: 'hidden',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0
  },
  pane3Empty: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF8'
  },

  // Split Read & Edit Layouts
  splitReadContainer: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    flex: 1,
    minHeight: 0,
    alignItems: 'stretch'
  },
  leftPaneCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 0',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
  },
  rightPaneCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '10px 0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column'
  },
  subNoteHeader: {
    paddingBottom: '8px',
    marginBottom: '10px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  subNoteTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1E293B',
    display: 'flex',
    alignItems: 'center'
  },
  subNoteBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#334155',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    flex: 1
  },
  subNoteEmptyText: {
    color: '#94A3B8',
    fontSize: '13px',
    lineHeight: 1.5
  },

  readTitle: {
    fontSize: '19px',
    fontWeight: 700,
    color: '#22262A',
    marginBottom: '12px',
    lineHeight: 1.3
  },
  readBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#3C3F42',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },

  splitEditContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    minHeight: 0,
    width: '100%'
  },
  splitEditFields: {
    display: 'flex',
    gap: '10px',
    flex: 1,
    minHeight: 0
  },
  editPaneMainCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
  },
  editPaneSubCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569'
  },

  headerCategorySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F1F5F9',
    padding: '3px 6px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1'
  },
  headerCategoryLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569'
  },
  headerCategorySelect: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #94A3B8',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#1E293B',
    outline: 'none',
    cursor: 'pointer'
  },

  editTitleInput: {
    width: '100%',
    fontSize: '18px',
    fontWeight: 700,
    padding: '8px 12px',
    border: '1px solid #DCE0E6',
    borderRadius: '6px',
    outline: 'none',
    color: '#22262A',
    backgroundColor: '#FFFFFF'
  },
  editBodyTextarea: {
    width: '100%',
    minHeight: '360px',
    flex: 1,
    fontSize: '14px',
    lineHeight: 1.6,
    padding: '10px 12px',
    border: '1px solid #DCE0E6',
    borderRadius: '6px',
    outline: 'none',
    color: '#22262A',
    backgroundColor: '#FFFFFF',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  editSubBodyTextarea: {
    width: '100%',
    minHeight: '360px',
    flex: 1,
    fontSize: '14px',
    lineHeight: 1.6,
    padding: '10px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    resize: 'vertical',
    fontFamily: 'inherit'
  },

  // Checklist Card Styles
  checklistHeader: {
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  checklistCountBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid #BFDBFE'
  },
  progressBarTrack: {
    height: '4px',
    backgroundColor: '#E2E8F0',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.25s ease, background-color 0.25s ease'
  },
  checklistInputGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    alignItems: 'stretch'
  },
  checklistTextarea: {
    flex: 1,
    fontSize: '12px',
    padding: '6px 10px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    backgroundColor: '#FFFFFF'
  },
  checklistAddBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '0 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0
  },
  checklistListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
    flex: 1,
    padding: '4px 0 8px 0'
  },
  checklistItemRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '3px',
    padding: '3px 6px',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease'
  },
  checkitemStatusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4px',
    paddingTop: '4px',
    borderTop: '1px dashed #E2E8F0',
    width: '100%',
    minHeight: '20px'
  },
  checkboxBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: '#2563EB',
    flexShrink: 0
  },
  checkitemText: {
    fontSize: '12.5px',
    lineHeight: 1.35,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    display: 'inline'
  },
  checklistEditTextarea: {
    width: '100%',
    fontSize: '13px',
    padding: '2px 4px',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  btnSmallSave: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  },
  btnSmallCancel: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  },
  btnSmallManage: {
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease'
  },
  badgeDropdownSelect: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
    maxWidth: '130px'
  },
  checkitemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    flexShrink: 0
  },
  checklistEmptyText: {
    color: '#94A3B8',
    fontSize: '13px',
    lineHeight: 1.5,
    padding: '12px 0'
  },

  // Global Delete Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    padding: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  modalDangerIconWrapper: {
    backgroundColor: '#FEE2E2',
    borderRadius: '50%',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1E293B',
    margin: 0
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569'
  },
  modalMessage: {
    margin: 0,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap'
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #F1F5F9'
  },
  btnModalCancel: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  },
  btnModalDelete: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)',
    outline: '2px solid #EF4444',
    outlineOffset: '2px'
  },

  // Main Mode Bar Styles
  mainModeBar: {
    display: 'flex',
    padding: '8px',
    gap: '6px',
    backgroundColor: '#DCE7F3',
    borderBottom: '1px solid #C4D9EE'
  },
  mainModeTabBtn: {
    flex: 1,
    padding: '7px 0',
    borderRadius: '6px',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease'
  },

  // Checklist Schedule Option Styles
  checklistInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px'
  },
  scheduleOptionBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    flexWrap: 'wrap'
  },
  scheduleField: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FFFFFF',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #CBD5E1'
  },
  scheduleDateInput: {
    border: 'none',
    fontSize: '12px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none',
    backgroundColor: 'transparent'
  },
  scheduleTimeInput: {
    border: 'none',
    fontSize: '12px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none',
    backgroundColor: 'transparent'
  },
  allDayCheckLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer'
  },
  scheduleClearBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto'
  },
  itemScheduleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '1px 6px',
    borderRadius: '4px',
    marginTop: 0,
    border: '1px solid #BFDBFE'
  },

  exitToast: {
    position: 'fixed',
    bottom: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    color: '#FFFFFF',
    padding: '12px 22px',
    borderRadius: '24px',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    zIndex: 99999,
    pointerEvents: 'none',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(4px)'
  },

  checklistDropdownMenu: {
    position: 'fixed',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08)',
    border: '1px solid #E2E8F0',
    padding: '4px',
    zIndex: 10000,
    minWidth: '100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    whiteSpace: 'nowrap'
  },
  checklistDropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '7px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#334155',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.12s ease',
    userSelect: 'none'
  }
};
