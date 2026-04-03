# Ever Work - Design Specification Document

## 1. Overview

### Project Summary
**Ever Work** is a premium, emotionally resonant time-tracking Progressive Web Application designed for individuals juggling multiple jobs. The app combines precise time tracking with motivational features, creating an experience that feels like "a hug and a high-five" - celebratory, warm, and empowering.

### Target Audience
- Freelancers managing multiple clients
- Side-hustlers balancing day jobs with passion projects
- Gig workers tracking various income streams
- Anyone who wants to feel proud of their work hours

### Language
English (US)

### Website Type
Single Page Application (SPA) Progressive Web App (PWA)
- Mobile-first responsive design
- Native app-like experience
- Works offline
- Installable on home screen

### Philosophy
"Every pixel should feel like a hug and a high-five" - The design celebrates effort, acknowledges hard work, and makes users feel proud of their accomplishments.

---

## 2. Page Manifest (CRITICAL)

| Page ID | Page Name | File Name | Is Entry | SubAgent Notes |
|---------|-----------|-----------|----------|----------------|
| dashboard | Dashboard | dashboard.html | **YES** | Main entry point. Contains: Header, Hero Progress Circle, Active Timer Banner, Job Grid (2-col), Timeline, FAB. Most complex view with multiple sections. |
| timer | Active Timer | timer.html | NO | Full-screen overlay view. Giant digital clock (72-96px), job info, earnings counter, slide-to-stop. Requires breathing animation and precise timer logic. |
| jobs | Job Management | jobs.html | NO | Job list with cards, add/edit/archive actions. Bottom sheet modal for forms. Swipe gestures for archive. |
| calendar | Analytics Calendar | calendar.html | NO | Monthly heatmap, day breakdown, weekly summary, personal records. Data visualization heavy. |
| settings | App Settings | settings.html | NO | Configuration forms, data export/import, easter egg. Simple form-based layout. |

### View Navigation Pattern
- All views are rendered within the same SPA container
- URL hash routing: `#dashboard`, `#timer`, `#jobs`, `#calendar`, `#settings`
- Bottom navigation bar persists across all views (except timer full-screen)
- Smooth transitions between views (300ms)

---

## 3. Global Design System

### 3.1 Color Palette

#### Primary Colors
```css
--primary-gradient: linear-gradient(135deg, #FF9A56 0%, #FF6B6B 100%);
--primary-start: #FF9A56;
--primary-end: #FF6B6B;
--primary-soft: rgba(255, 154, 86, 0.1);
--primary-glow: rgba(255, 107, 107, 0.3);
```

#### Background Colors
```css
--bg-primary: #0F0F13;
--bg-secondary: #1A1A1F;
--bg-tertiary: #25252B;
--bg-card: rgba(255, 255, 255, 0.03);
--bg-card-hover: rgba(255, 255, 255, 0.06);
```

#### Accent Colors
```css
--gold: #FFD700;
--gold-soft: rgba(255, 215, 0, 0.15);
--success: #4ADE80;
--success-soft: rgba(74, 222, 128, 0.15);
--warning: #FBBF24;
--error: #F87171;
--info: #60A5FA;
```

#### Text Colors
```css
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.5);
--text-muted: rgba(255, 255, 255, 0.35);
```

#### Glassmorphism
```css
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-bg-strong: rgba(255, 255, 255, 0.08);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-border-strong: rgba(255, 255, 255, 0.15);
--glass-blur: blur(20px);
--glass-blur-strong: blur(30px);
```

#### Job Gradient Colors (8 Premium Options)
```css
--gradient-sunset: linear-gradient(135deg, #FF9A56 0%, #FF6B6B 100%);
--gradient-ocean: linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%);
--gradient-forest: linear-gradient(135deg, #43E97B 0%, #38F9D7 100%);
--gradient-berry: linear-gradient(135deg, #FA709A 0%, #FEE140 100%);
--gradient-midnight: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
--gradient-citrus: linear-gradient(135deg, #F093FB 0%, #F5576C 100%);
--gradient-sky: linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%);
--gradient-fire: linear-gradient(135deg, #FF5858 0%, #F09819 100%);
```

#### Heatmap Colors (GitHub-style)
```css
--heatmap-0: rgba(255, 255, 255, 0.05);
--heatmap-1: rgba(255, 154, 86, 0.25);
--heatmap-2: rgba(255, 154, 86, 0.45);
--heatmap-3: rgba(255, 154, 86, 0.65);
--heatmap-4: rgba(255, 154, 86, 0.85);
--heatmap-5: #FF9A56;
```

### 3.2 Typography

#### Font Families
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
```

#### Font Sizes
```css
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 32px;
--text-4xl: 40px;
--text-5xl: 48px;
--text-6xl: 64px;
--text-7xl: 72px;   /* Mobile timer */
--text-8xl: 96px;   /* Desktop timer */
```

#### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Line Heights
```css
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

#### Letter Spacing
```css
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.02em;
--tracking-timer: 0.05em;  /* For monospace timer */
```

### 3.3 Spacing System

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

#### Layout Spacing
```css
--page-padding-x: 20px;
--page-padding-y: 24px;
--section-gap: 32px;
--card-padding: 20px;
--card-gap: 16px;
--max-width: 480px;  /* Mobile-first max width */
```

### 3.4 Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

### 3.5 Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 40px rgba(255, 107, 107, 0.3);
--shadow-gold: 0 0 30px rgba(255, 215, 0, 0.25);
```

### 3.6 Animation Defaults

#### Timing Functions
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

#### Durations
```css
--duration-instant: 100ms;
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-medium: 300ms;
--duration-slow: 500ms;
--duration-slower: 800ms;
```

#### Stagger Delays
```css
--stagger-fast: 30ms;
--stagger-normal: 50ms;
--stagger-slow: 80ms;
```

### 3.7 Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal: 300;
--z-popover: 400;
--z-toast: 500;
--z-confetti: 600;
```

---

## 4. Shared Component Styles

### 4.1 Buttons

#### Primary Button (FAB - Floating Action Button)
```css
.fab-primary {
  width: 80px;
  height: 80px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #FF9A56 0%, #FF6B6B 100%);
  box-shadow: 0 8px 32px rgba(255, 107, 107, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.fab-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 40px rgba(255, 107, 107, 0.5);
}
.fab-primary:active {
  transform: scale(0.95);
}
```

#### Secondary Button
```css
.btn-secondary {
  padding: 14px 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.15);
}
.btn-secondary:active {
  transform: scale(0.98);
}
```

#### Icon Button
```css
.btn-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
}
.btn-icon:active {
  transform: scale(0.95);
}
```

### 4.2 Cards

#### Job Card
```css
.job-card {
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.job-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}
.job-card.active {
  border-color: rgba(255, 154, 86, 0.5);
  box-shadow: 0 0 20px rgba(255, 154, 86, 0.15);
}
```

#### Stats Card
```css
.stats-card {
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}
```

### 4.3 Modal / Bottom Sheet

```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  background: #1A1A1F;
  border-radius: 24px 24px 0 0;
  padding: 24px;
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.bottom-sheet.open {
  transform: translateY(0);
}
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.bottom-sheet-overlay.open {
  opacity: 1;
}
```

### 4.4 Progress Circle

```css
.progress-circle {
  width: 200px;
  height: 200px;
}
.progress-circle-track {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 12;
  fill: none;
}
.progress-circle-fill {
  stroke: url(#gradient);
  stroke-width: 12;
  fill: none;
  stroke-linecap: round;
  stroke-dasharray: 565.48;  /* 2 * PI * 90 */
  stroke-dashoffset: 565.48;
  transition: stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
  transform: rotate(-90deg);
  transform-origin: center;
}
```

### 4.5 Form Inputs

```css
.input-field {
  width: 100%;
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  font-size: 16px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.input-field:focus {
  outline: none;
  border-color: rgba(255, 154, 86, 0.5);
  background: rgba(255, 255, 255, 0.08);
}
.input-field::placeholder {
  color: rgba(255, 255, 255, 0.35);
}
```

### 4.6 Bottom Navigation

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  height: 80px;
  background: rgba(26, 26, 31, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: 20px;  /* Safe area */
}
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.bottom-nav-item.active {
  color: #FF9A56;
}
.bottom-nav-item svg {
  width: 24px;
  height: 24px;
}
.bottom-nav-item span {
  font-size: 11px;
  font-weight: 500;
}
```

---

## 5. Page Specifications

### 5.1 Dashboard View (`#dashboard`)

#### Purpose
Main entry point and overview of today's work. Displays progress, active jobs, and recent activity.

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Header (Date + Settings)            │  height: 60px
├─────────────────────────────────────┤
│ Hero: "Today's Hustle" Progress     │  height: 280px
│ Circle with hours and goal          │
├─────────────────────────────────────┤
│ Active Timer Banner (conditional)   │  height: 72px
├─────────────────────────────────────┤
│ Section: "Your Jobs"                │
│ Grid: 2 columns of job cards        │  auto height
├─────────────────────────────────────┤
│ Section: "Today's Timeline"         │
│ Vertical list of sessions           │  auto height
├─────────────────────────────────────┤
│ Padding for FAB                     │  height: 100px
├─────────────────────────────────────┤
│ Floating Action Button (FAB)        │  fixed bottom-right
├─────────────────────────────────────┤
│ Bottom Navigation                   │  fixed bottom
└─────────────────────────────────────┘
```

#### Header Section
- **Height**: 60px
- **Padding**: 20px horizontal
- **Left**: Date display "Monday, Jan 15" (16px, font-weight: 500, color: text-secondary)
- **Right**: Settings icon button (Lucide: `settings`)

#### Hero Section - Today's Progress Circle
- **Container**: Centered, padding: 32px 20px
- **Progress Circle**:
  - Size: 200px x 200px
  - Track: rgba(255, 255, 255, 0.1), stroke-width: 12
  - Fill: primary-gradient, stroke-width: 12, stroke-linecap: round
  - Animation: stroke-dashoffset transition 600ms ease
- **Center Content**:
  - Hours: "6.5" (48px, font-weight: 700, color: text-primary)
  - Label: "hours today" (14px, color: text-tertiary)
  - Goal: "/ 8h goal" (14px, color: text-muted)
- **Below Circle**:
  - Encouragement quote (14px, italic, color: text-secondary, max-width: 280px, centered)
  - Examples: "You're crushing it!", "Every minute counts!", "Proud of your hustle!"

#### Active Timer Banner (Conditional)
- **Display**: Only when timer is running
- **Height**: 72px
- **Background**: rgba(255, 154, 86, 0.1)
- **Border**: 1px solid rgba(255, 154, 86, 0.2)
- **Border-radius**: 16px
- **Margin**: 0 20px
- **Content**:
  - Left: Job icon + name (16px, font-weight: 600)
  - Right: Live timer display (20px, font-mono, color: primary-start)
- **Animation**: Subtle pulse glow (box-shadow animation, 2s infinite)

#### Job Grid Section
- **Section Title**: "Your Jobs" (20px, font-weight: 600, margin-bottom: 16px)
- **Grid**: 2 columns, gap: 16px
- **Job Card Content**:
  - Top row: Icon (32px container) + Menu button (Lucide: `more-vertical`)
  - Job name (16px, font-weight: 600, max 2 lines)
  - Today's hours (14px, color: text-secondary)
  - Mini sparkline SVG (40px width, 20px height)
- **Empty State**: "No jobs yet. Add your first!" with illustration

#### Timeline Section
- **Section Title**: "Today's Timeline" (20px, font-weight: 600)
- **List**: Vertical stack, gap: 12px
- **Timeline Item**:
  - Left: Color dot (12px circle) + vertical line connector
  - Middle: Job name (16px), Time range (14px, text-secondary)
  - Right: Duration (14px, font-mono)
- **Empty State**: "No sessions yet today. Start tracking!"

#### Floating Action Button (FAB)
- **Position**: Fixed, bottom: 100px, right: 20px
- **Size**: 80px x 80px
- **Style**: Primary gradient, shadow-glow
- **Icon**: Lucide `play` (32px) when idle, `briefcase` when active
- **Animation**: Idle - subtle bounce (scale 1.0 → 1.05, 2s infinite)

#### Animations
- Page load: Staggered fade-in (50ms delay per section)
- Progress circle: Animate from 0 to current value (800ms)
- Job cards: Fade-in + translateY(20px → 0), stagger 50ms
- FAB: Continuous subtle pulse when idle

---

### 5.2 Timer View (`#timer`)

#### Purpose
Full-screen immersive timer experience. Activated when user starts tracking time.

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Close Button (X)                    │  top: 20px, right: 20px
├─────────────────────────────────────┤
│                                     │
│     [Job Icon - 64px]               │
│     Job Name                        │
│                                     │
│     ┌─────────────────────────┐     │
│     │   02:34:18              │     │  72-96px
│     └─────────────────────────┘     │
│                                     │
│     +$45.67 earned                  │  rolling counter
│                                     │
│                                     │
│     ┌─────────────────────────┐     │
│     │  SLIDE TO STOP          │     │  slide control
│     └─────────────────────────┘     │
│                                     │
│                                     │
│     Started at 9:15 AM              │
│                                     │
└─────────────────────────────────────┘
```

#### Background
- **Base**: bg-primary (#0F0F13)
- **Breathing Animation**: Radial gradient that pulses
  - Center: rgba(255, 154, 86, 0.08)
  - Animation: scale 1.0 → 1.1, opacity 0.5 → 0.8, 4s infinite ease-in-out

#### Close Button
- **Position**: Absolute, top: 20px, right: 20px
- **Style**: btn-icon (44px)
- **Icon**: Lucide `x`

#### Job Info
- **Icon**: 64px container with job's gradient background
- **Name**: 24px, font-weight: 600, centered
- **Spacing**: margin-top: 60px

#### Timer Display
- **Font**: font-mono, tabular-nums
- **Size**: 72px (mobile), 96px (desktop)
- **Format**: HH:MM:SS
- **Color**: text-primary
- **Letter-spacing**: 0.05em
- **Animation**: None (static updates for performance)

#### Earnings Counter
- **Prefix**: "+" in gold color
- **Amount**: Rolling counter animation on change
- **Font**: 24px, font-mono
- **Label**: "earned" (14px, text-tertiary)
- **Display**: Only if job has hourlyRate

#### Slide-to-Stop Control
- **Container**: width: 280px, height: 60px
- **Background**: rgba(255, 255, 255, 0.05)
- **Border**: 1px solid rgba(255, 255, 255, 0.1)
- **Border-radius**: 30px
- **Track Text**: "SLIDE TO STOP" (14px, text-tertiary, centered)
- **Handle**: 
  - Size: 52px x 52px
  - Background: linear-gradient(135deg, #FF6B6B 0%, #FF4757 100%)
  - Border-radius: 26px
  - Icon: Lucide `square` (20px)
  - Position: left: 4px (start), left: 224px (end)
- **Interaction**: 
  - Drag handle from left to right
  - Threshold: 80% to trigger stop
  - Spring back if not reached
  - Haptic feedback on success (if supported)

#### Start Time Display
- **Text**: "Started at 9:15 AM"
- **Font**: 14px, text-tertiary
- **Position**: Bottom of screen, margin-bottom: 40px

#### Animations
- Background: Breathing radial gradient (4s infinite)
- Earnings: Rolling counter on each cent change
- Slide handle: Follows touch/mouse with spring physics
- Exit: Fade out + scale down (300ms)

---

### 5.3 Jobs View (`#jobs`)

#### Purpose
Manage all jobs - add, edit, archive. Primary interface for job organization.

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Header: "Your Jobs"                 │
│ [Back] Your Jobs        [+]         │
├─────────────────────────────────────┤
│                                     │
│ ┌───────────────────────────────┐   │
│ │ [Icon] Job Name           >   │   │ Job Card
│ │ 4.5h today  $25/hr            │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ [Icon] Another Job        >   │   │
│ │ 2.0h today                    │   │
│ └───────────────────────────────┘   │
│                                     │
│         ... more jobs ...           │
│                                     │
├─────────────────────────────────────┤
│ Bottom Navigation                   │
└─────────────────────────────────────┘
```

#### Header
- **Left**: Back arrow (Lucide: `arrow-left`) - returns to dashboard
- **Title**: "Your Jobs" (20px, font-weight: 600)
- **Right**: Add button (Lucide: `plus`) - opens bottom sheet

#### Job List
- **Layout**: Vertical stack, gap: 12px
- **Padding**: 20px horizontal
- **Job Card**:
  - Padding: 20px
  - Background: bg-card
  - Border: 1px solid glass-border
  - Border-radius: 16px
  - Layout: Flex row
    - Left: Icon (48px, gradient background, border-radius: 12px)
    - Middle: 
      - Job name (18px, font-weight: 600)
      - Meta row: Today's hours + hourly rate (if set)
    - Right: Chevron (Lucide: `chevron-right`)
  - Swipe left: Reveal archive action

#### Swipe Actions
- **Threshold**: 100px swipe left
- **Archive Button**: 
  - Width: 80px
  - Background: rgba(248, 113, 113, 0.2)
  - Icon: Lucide `archive`
  - Text: "Archive"
  - Color: error

#### Add/Edit Bottom Sheet
- **Height**: 85vh (auto on desktop)
- **Content**:
  - Handle bar (40px width, 4px height, centered)
  - Title: "Add Job" or "Edit Job" (24px, font-weight: 600)
  - Form fields:
    1. Job Name (text input, max 30 chars, required)
    2. Color picker (8 gradient options, grid 4x2)
    3. Hourly Rate (number input, optional)
    4. Icon picker (Lucide icons, horizontal scroll)
  - Actions:
    - Primary: "Save Job" (full width)
    - Secondary: "Cancel" (text button)
    - Danger (edit only): "Archive Job"

#### Color Picker Grid
- **Layout**: 4 columns, 2 rows
- **Item**: 56px x 56px, border-radius: 12px
- **Selected**: 3px white border, scale: 1.05
- **Options**:
  1. Sunset (orange-red)
  2. Ocean (blue-cyan)
  3. Forest (green-teal)
  4. Berry (pink-yellow)
  5. Midnight (purple)
  6. Citrus (magenta-pink)
  7. Sky (light blue)
  8. Fire (red-orange)

#### Icon Picker
- **Layout**: Horizontal scroll
- **Item**: 48px x 48px, border-radius: 12px
- **Selected**: bg-card-strong border
- **Options**: briefcase, code, palette, pen-tool, camera, music, book-open, coffee, truck, wrench, heart, star, zap, globe, dollar-sign

#### Animations
- List items: Staggered entrance (50ms)
- Bottom sheet: Slide up from bottom (300ms ease-out)
- Swipe reveal: Smooth translateX with spring
- Archive: Card slides out left + fade (400ms)

---

### 5.4 Calendar View (`#calendar`)

#### Purpose
Analytics and historical data visualization. Monthly heatmap and detailed breakdowns.

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Header: "Your Progress"             │
├─────────────────────────────────────┤
│ Month Navigator                     │
│ [<] January 2024              [>]   │
├─────────────────────────────────────┤
│                                     │
│  M   T   W   T   F   S   S          │
│  ○   ○   ○   ○   ○   ○   ○          │
│  ○   ●   ◐   ○   ○   ○   ○          │ Heatmap
│  ○   ○   ○   ◕   ○   ○   ○          │
│  ...                                │
│                                     │
├─────────────────────────────────────┤
│ Selected Day Breakdown              │
│ Jan 15 - 8.5 hours                  │
│ ├─ Design Work: 5h                  │
│ └─ Consulting: 3.5h                 │
├─────────────────────────────────────┤
│ Weekly Summary                      │
│ This week: 42.5h (+12% vs last)     │
├─────────────────────────────────────┤
│ Personal Records                    │
│ Longest day: 12h                    │
│ Best week: 56h                      │
│ Current streak: 5 days              │
├─────────────────────────────────────┤
│ Bottom Navigation                   │
└─────────────────────────────────────┘
```

#### Month Navigator
- **Layout**: Flex row, space-between
- **Arrows**: btn-icon with Lucide `chevron-left` / `chevron-right`
- **Month/Year**: 20px, font-weight: 600, centered

#### Heatmap Grid
- **Layout**: CSS Grid, 7 columns (days)
- **Day Labels**: M T W T F S S (12px, text-tertiary, uppercase)
- **Day Cells**:
  - Size: 40px x 40px (mobile), 48px x 48px (desktop)
  - Border-radius: 8px
  - Background: Based on hours (heatmap scale)
  - Text: Day number (12px), only if has data
  - Today: 2px white border
- **Heatmap Scale**:
  - 0h: --heatmap-0
  - 1-2h: --heatmap-1
  - 3-4h: --heatmap-2
  - 5-6h: --heatmap-3
  - 7-8h: --heatmap-4
  - 8h+: --heatmap-5

#### Day Breakdown (Selected)
- **Header**: Full date (18px, font-weight: 600)
- **Total**: "X hours total" (16px, text-secondary)
- **Session List**:
  - Each session: Job color dot + job name + duration
  - Background: bg-card
  - Padding: 16px
  - Border-radius: 12px

#### Weekly Summary
- **Title**: "Weekly Summary" (18px, font-weight: 600)
- **This Week**: Large number (32px, font-weight: 700)
- **Comparison**: 
  - Green arrow up + "% vs last week" if positive
  - Red arrow down if negative
  - Gray "Same as last week" if equal
- **Mini bar chart**: 7 bars for each day

#### Personal Records
- **Title**: "Personal Records" (18px, font-weight: 600)
- **Cards** (3-column grid):
  1. Longest Day: "12h" + "Longest Day" label
  2. Best Week: "56h" + "Best Week" label
  3. Streak: "5 days" + "Current Streak" label
- **Style**: Stats card with gold accent for records

#### Animations
- Heatmap: Fade in with stagger (20ms per cell)
- Day selection: Smooth background transition (200ms)
- Weekly bars: Grow from bottom (400ms stagger)

---

### 5.5 Settings View (`#settings`)

#### Purpose
App configuration, data management, and hidden features.

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Header: "Settings"                  │
├─────────────────────────────────────┤
│                                     │
│ Goals                               │
│ ┌───────────────────────────────┐   │
│ │ Daily Hour Goal           8h >│   │
│ └───────────────────────────────┘   │
│                                     │
│ Preferences                         │
│ ┌───────────────────────────────┐   │
│ │ Default Job             None >│   │
│ │ Currency                  $ > │   │
│ └───────────────────────────────┘   │
│                                     │
│ Data                                │
│ ┌───────────────────────────────┐   │
│ │ Export Data                   │   │
│ │ Import Data                   │   │
│ └───────────────────────────────┘   │
│                                     │
│ About                               │
│ ┌───────────────────────────────┐   │
│ │ Version 1.0.0                 │   │
│ │ Made with [heart] for you     │   │
│ └───────────────────────────────┘   │
│                                     │
│ [Hidden: Easter egg input]          │
│                                     │
├─────────────────────────────────────┤
│ Bottom Navigation                   │
└─────────────────────────────────────┘
```

#### Section Headers
- **Style**: 12px, uppercase, letter-spacing: 0.1em, color: text-tertiary
- **Margin**: 24px top, 12px bottom

#### Settings Items
- **Layout**: Flex row, space-between
- **Padding**: 16px 20px
- **Background**: bg-card
- **Border**: 1px solid glass-border
- **Border-radius**: 12px
- **Label**: 16px, font-weight: 500
- **Value**: 16px, text-secondary
- **Chevron**: Lucide `chevron-right` (text-muted)

#### Daily Hour Goal Modal
- **Input**: Number picker (1-16 hours)
- **Default**: 8
- **Display**: "8 hours"

#### Data Export/Import
- **Export**: Triggers JSON download
- **Import**: File picker for JSON
- **Success**: Toast notification

#### Easter Egg
- **Trigger**: Tap "Version" 5 times
- **Input**: Text field appears
- **Message**: "Enter your personal mantra"
- **Display**: Shows custom message on dashboard

#### Animations
- List items: Subtle hover lift
- Modals: Fade in + scale (200ms)

---

## 6. Technical Requirements

### 6.1 CDN Dependencies

```html
<!-- Tailwind CSS v4 -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Lucide Icons -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

<!-- Dexie.js (IndexedDB wrapper) -->
<script src="https://unpkg.com/dexie@3.2.4/dist/dexie.min.js"></script>

<!-- Inter Font -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- JetBrains Mono (for timer) -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 6.2 PWA Requirements

```html
<!-- Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme Color -->
<meta name="theme-color" content="#0F0F13">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">

<!-- Viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### 6.3 Service Worker

```javascript
// sw.js
const CACHE_NAME = 'ever-work-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(response => response || fetch(e.request)));
});
```

### 6.4 Storage Architecture

#### IndexedDB (Dexie.js)
```javascript
const db = new Dexie('EverWorkDB');
db.version(1).stores({
  jobs: 'id, name, createdAt',
  sessions: 'id, jobId, startTime, endTime, date',
  achievements: 'id, unlockedAt',
  settings: 'key'
});
```

#### LocalStorage (Active Timer State)
```javascript
// For crash recovery
localStorage.setItem('activeTimer', JSON.stringify({
  jobId: '...',
  startTime: '...',
  lastUpdate: '...'
}));
```

### 6.5 Timer Implementation

```javascript
// Use requestAnimationFrame for precision
let startTime = Date.now();
let elapsed = 0;

function updateTimer() {
  const now = Date.now();
  elapsed = now - startTime;
  displayTimer(elapsed);
  requestAnimationFrame(updateTimer);
}

// Background handling
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Save state to localStorage
  } else {
    // Recalculate elapsed time
  }
});
```

---

## 7. Image Requirements

### 7.1 Search Keywords

No custom images required - the app uses:
- Lucide icons exclusively
- CSS gradients for all visual elements
- SVG for sparklines and charts

### 7.2 App Icons (PWA)

**Search Keywords for App Icon Base:**
- "minimalist clock icon"
- "time tracking app icon"
- "productivity app logo"
- "hourglass modern icon"
- "stopwatch gradient icon"

**Required Sizes:**
- 192x192px (manifest)
- 512x512px (manifest)
- 180x180px (Apple touch)
- 32x32px (favicon)

---

## 8. Navigation Structure

### 8.1 Bottom Navigation Items

| Icon | Label | Target | Active When |
|------|-------|--------|-------------|
| `layout-dashboard` | Home | #dashboard | dashboard |
| `briefcase` | Jobs | #jobs | jobs |
| `calendar` | Calendar | #calendar | calendar |
| `settings` | Settings | #settings | settings |

### 8.2 Internal Navigation

| From | Action | To |
|------|--------|-----|
| Dashboard | Tap job card | Timer (start) |
| Dashboard | Tap FAB | Timer (continue or start) |
| Dashboard | Tap active banner | Timer |
| Timer | Slide to stop | Dashboard |
| Timer | Tap X | Dashboard |
| Jobs | Tap + | Bottom sheet (add job) |
| Jobs | Tap job card | Bottom sheet (edit job) |
| Calendar | Tap heatmap day | Day breakdown |
| Settings | Tap goal | Modal (edit goal) |

---

## 9. Achievement System

### 9.1 Badge Definitions

| Badge ID | Name | Icon | Unlock Condition |
|----------|------|------|------------------|
| first-step | First Step | `footprints` | Log first session |
| week-warrior | Week Warrior | `flame` | 7-day streak |
| century-club | Century Club | `trophy` | 100 total hours |
| night-owl | Night Owl | `moon` | Work past midnight |
| early-bird | Early Bird | `sun` | Start before 6am |
| goal-crusher | Goal Crusher | `target` | Exceed daily goal by 50% |

### 9.2 Badge Display

- **Size**: 64px x 64px
- **Locked**: Grayscale, 30% opacity
- **Unlocked**: Full color, subtle glow
- **Animation**: Scale bounce on unlock + confetti

---

## 10. Confetti System

### 10.1 Trigger Events
- Achievement unlock
- Milestone reached (10, 50, 100 hours)
- Daily goal exceeded
- Streak milestone (7, 30, 100 days)

### 10.2 Configuration
```javascript
{
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#FF9A56', '#FF6B6B', '#FFD700', '#4ADE80', '#60A5FA'],
  disableForReducedMotion: true
}
```

---

## 11. Responsive Breakpoints

```css
/* Mobile First */
/* Default: 320px+ */

/* Small tablets */
@media (min-width: 480px) {
  --max-width: 480px;
}

/* Tablets */
@media (min-width: 768px) {
  --timer-size: 96px;
  --job-grid-columns: 3;
}

/* Desktop */
@media (min-width: 1024px) {
  --max-width: 600px;
  --job-grid-columns: 3;
}
```

---

## 12. Accessibility

### 12.1 Requirements
- All interactive elements: min 44px touch target
- Color contrast: WCAG AA minimum
- Reduced motion support
- Screen reader labels for all icons
- Focus indicators visible

### 12.2 Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 13. File Structure

```
/output/
├── Design.md (this file)
├── index.html (SPA entry)
├── css/
│   └── styles.css
├── js/
│   ├── app.js (main)
│   ├── db.js (Dexie/IndexedDB)
│   ├── timer.js (timer engine)
│   ├── views/
│   │   ├── dashboard.js
│   │   ├── timer.js
│   │   ├── jobs.js
│   │   ├── calendar.js
│   │   └── settings.js
│   └── components/
│       ├── bottom-nav.js
│       ├── job-card.js
│       ├── progress-circle.js
│       └── confetti.js
├── icons/
│   ├── icon-192x192.png
│   └── icon-512x512.png
└── manifest.json
```

---

*Document Version: 1.0*
*Created for: Ever Work PWA*
*Design Philosophy: "Every pixel should feel like a hug and a high-five"*
