# TransactionsPage Filter Enhancements Design

## Context

The `/transactions` page already has functional search and filters. This design enhances two specific filters:
1. **Category Filter**: Replace single dropdown with cascade picker
2. **Date Range Filter**: Replace unclear date inputs with adaptive presets + calendar

## Problem Statement

### Category Filter Issues
- Current: Single flat dropdown with all categories (parents and children mixed)
- User must scroll through all categories to find subcategories
- No visual hierarchy between parent categories and subcategories
- Shows categories with zero transactions, cluttering the list

### Date Range Issues
- Current: Two bare `<input type="date">` fields labeled "Desde" / "Hasta"
- No quick presets for common ranges (this week, this month, last 30 days)
- Poor mobile UX - native date pickers vary by device
- No visual indication of selected range

## Design

### Category Filter: Cascade Picker

**Behavior:**
1. User clicks category filter → opens picker
2. First view: List of parent categories (categories with `parentId === null`)
3. User selects parent → shows subcategories of that parent
4. User selects subcategory → picker closes, filter applied
5. If parent has no subcategories, selecting it applies filter directly

**Data Requirements:**
- Backend must return `transactionCount` per category (already exists from Form UX task)
- Frontend filters out categories where `transactionCount === 0`
- Display format: `{name} ({transactionCount})`

**Visual Design:**
- Parent list shows right chevron if has subcategories
- Subcategory list shows back button to return to parents
- Selected state indicated with checkmark
- Count badge shown in muted text

**Responsive:**
- Mobile: Full-screen Sheet with same cascade behavior
- Desktop: Popover with fixed width (280px)

### Date Range Filter: Hybrid Adaptive

**Mobile UX:**
1. Single button trigger showing current selection (e.g., "Este mes" or "Feb 15 - Feb 27")
2. Tap opens full-screen Sheet
3. Sheet contains:
   - Preset chips at top: "Esta semana", "Este mes", "Últimos 30 días", "Todo"
   - Divider
   - 2-month vertical calendar (react-day-picker mode="range")
4. Selecting preset closes sheet, applies filter
5. Selecting custom range shows dates, "Aplicar" button appears at bottom

**Desktop UX:**
1. Inline preset chips: "Esta semana", "Este mes", "Últimos 30 días"
2. "Personalizado" button opens Popover
3. Popover contains side-by-side 2-month calendars
4. Selecting range updates filter immediately, closes popover

**Preset Logic:**
| Preset | startDate | endDate |
|--------|-----------|---------|
| Esta semana | Monday of current week | Today |
| Este mes | 1st of current month | Today |
| Últimos 30 días | Today - 29 days | Today |
| Todo | undefined | undefined |

**State Management:**
- Add `datePreset: 'week' | 'month' | '30days' | 'custom' | 'all'` to filter state
- When preset selected: calculate dates, set preset
- When custom range selected: set dates, set preset to 'custom'
- Display logic: if preset !== 'custom', show preset label; else show date range

## Components to Create/Modify

### New Components
1. `CategoryCascadePicker.tsx` - Cascade picker with parent/subcategory navigation
2. `DateRangeFilter.tsx` - Adaptive date range component
3. `DateRangePresets.tsx` - Preset chips component (reusable)

### Modified Components
1. `TransactionsPage.tsx` - Replace current category Select and date inputs
2. `useTransactionsPage.ts` - Add datePreset state

### Reused Components
- `ResponsivePopover` - Already exists from Form UX task
- `Calendar` - Already exists from Form UX task

## API Changes

None required. Backend already supports all filter params. `transactionCount` is already returned by `listCategories`.

## Testing Plan

1. **Category Picker**
   - Verify parent categories shown first
   - Verify subcategories shown on parent click
   - Verify back navigation works
   - Verify categories with 0 transactions are hidden
   - Verify filter applies correctly

2. **Date Range Filter**
   - Verify presets calculate correct dates
   - Verify custom range selection works
   - Verify URL query params sync (if implemented)
   - Verify mobile sheet behavior
   - Verify desktop popover behavior

## Out of Scope

- URL query param sync for filters (future enhancement)
- Amount min/max filters (already functional)
- Product filter (already functional as dropdown)
- Type filter (already functional as dropdown)
