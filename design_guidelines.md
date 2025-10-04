# CineSync Design Guidelines

## Design Approach
**Reference-Based: Discord + Google Meet Fusion** - Drawing from Discord's social engagement patterns and Google Meet's professional video conferencing UI, creating a premium cinematic streaming experience.

## Core Design Principles
- **Cinematic Immersion**: Deep, rich darks that let content shine
- **Premium Precision**: Polished, professional-grade interactions
- **Social Energy**: Vibrant accent colors for engagement moments
- **Seamless Sync**: Visual feedback for real-time collaboration

## Color System

### Dark Mode Palette (Primary)
- **Base Background**: 15 5% 6% (Rich cinematic black)
- **Surface**: 240 3% 11% (Elevated panels)
- **Surface Elevated**: 240 4% 15% (Modals, dropdowns)
- **Border**: 240 6% 20% (Subtle separation)
- **Border Hover**: 240 8% 28% (Interactive states)

### Accent Colors
- **Primary Magenta**: 338 100% 65% (CTAs, active states)
- **Secondary Cyan**: 186 100% 50% (Links, secondary actions)
- **Success Green**: 142 76% 45% (Online status, confirmations)
- **Warning Orange**: 25 95% 53% (Alerts, notifications)
- **Error Red**: 0 84% 60% (Errors, destructive actions)

### Text Hierarchy
- **Primary Text**: 0 0% 98% (Main content)
- **Secondary Text**: 240 5% 64% (Supporting text)
- **Muted Text**: 240 4% 46% (Timestamps, metadata)
- **Disabled**: 240 5% 34% (Inactive elements)

## Typography

### Font Families
- **Display/Headings**: "Poppins", system-ui, sans-serif (Bold 700, Semibold 600)
- **Body/Interface**: "Inter", system-ui, sans-serif (Regular 400, Medium 500)

### Type Scale
- **Hero**: text-6xl to text-7xl, font-bold, leading-tight
- **H1**: text-4xl to text-5xl, font-semibold
- **H2**: text-3xl, font-semibold
- **H3**: text-2xl, font-semibold
- **Body Large**: text-lg, font-medium
- **Body**: text-base
- **Small**: text-sm
- **Micro**: text-xs (timestamps, metadata)

## Layout System

### Spacing Scale
Primary units: **2, 4, 6, 8, 12, 16, 24, 32** (Tailwind units)
- Micro spacing: 2-4 (tight elements)
- Component padding: 4-8 (cards, buttons)
- Section spacing: 12-24 (between major sections)
- Page margins: 16-32 (container padding)

### Grid & Breakpoints
- Mobile: Full-width, single column
- Tablet (md:): 2-column layouts for features
- Desktop (lg:): 3-column grids, split layouts
- Wide (xl:): Max-width 1400px container

### Layout Patterns
- **Dashboard**: Sidebar (280px) + Main content (flex-1)
- **Room Screen**: Video center (60%) + Sidebar (40%)
- **Landing**: Full-width sections with max-w-7xl containers

## Component Library

### Navigation
- **Sidebar**: Fixed left, dark surface (240 3% 11%), 280px width, subtle glow on active items with magenta left border (4px)
- **Top Bar**: Backdrop blur, floating glassmorphism effect, height 72px

### Buttons
- **Primary**: Rounded-2xl, magenta gradient, bold shadow, scale-105 on hover
- **Secondary**: Outline-2, cyan border, ghost background, hover fill
- **Ghost**: Transparent, hover surface color, subtle transition
- **Icon Buttons**: Circular (h-10 w-10), centered icon, hover scale-110

### Cards
- **Room Cards**: Aspect-video, dark surface, hover lift (shadow-2xl), rounded-xl, overflow-hidden for image thumbnails
- **User Cards**: Circular avatar (h-12 w-12), online status dot (absolute, bottom-0, right-0, h-3 w-3, ring-2)
- **Feature Cards**: p-6 to p-8, icon at top, gradient border on hover

### Forms
- **Input Fields**: h-12, px-4, rounded-xl, border focus:magenta glow (ring-2 ring-magenta/50)
- **Text Areas**: min-h-32, resize-none
- **Labels**: text-sm, font-medium, mb-2, secondary text color

### Video Components
- **Video Tiles**: Aspect-video, rounded-lg, overflow-hidden, relative positioning for name overlay
- **Name Overlay**: Absolute bottom-2 left-2, backdrop-blur, px-3 py-1, rounded-full, text-xs
- **Screen Share View**: Full-width center, aspect-video, border-2 cyan glow when active

### Chat Interface
- **Message Bubbles**: rounded-2xl, px-4 py-2, max-w-md, self (user) vs received (other) alignment
- **User Messages**: ml-auto, magenta/10 background
- **Other Messages**: surface background
- **Input**: Sticky bottom, backdrop-blur, h-14, rounded-full, emoji picker button right

### Modals & Overlays
- **Modal Backdrop**: backdrop-blur-md, bg-black/60
- **Modal Container**: max-w-2xl, rounded-3xl, surface elevated, p-8, shadow-2xl
- **Glassmorphism Effects**: bg-white/5, backdrop-blur-xl, border border-white/10

## Animations

### Transitions (Framer Motion)
- **Page Transitions**: Fade in + slide up (y: 20), duration 0.4s
- **Modal Entry**: Scale 0.95 to 1, opacity 0 to 1, spring animation
- **Hover States**: Scale 1.02 to 1.05, duration 0.2s, ease-out
- **Video Tile Entry**: Stagger children 0.1s, fade + slide

### Micro-Interactions
- **Button Press**: Scale 0.98 on click
- **Chat Reactions**: Pop animation (scale 0 to 1.2 to 1), bounce
- **Status Indicators**: Pulse animation for active state
- **Typing Indicator**: Dot bounce sequence (stagger 0.2s)

## Screen-Specific Guidelines

### Landing Page
- **Hero**: Full viewport (90vh), cinematic gradient overlay (magenta to cyan radial), centered content, large CTA buttons, floating animated elements (particles or orbs)
- **Features Section**: 3-column grid (lg:), icon-driven cards, hover lift effects
- **How It Works**: Alternating 2-column layout with visuals
- **Testimonials**: Horizontal scroll (md: grid), avatar + quote cards
- **CTA Section**: Full-width, gradient background, centered messaging

### Dashboard
- **My Rooms**: Grid (2-3 cols), thumbnail cards with live participant count badge
- **Friends List**: Vertical list, online status prominent, quick invite buttons
- **Quick Actions**: Floating action button (fixed bottom-right), magenta, icon + text on hover expand

### Room Screen
- **Player Area**: Central focus, aspect-16/9, controls overlay on hover
- **Video Grid**: Right sidebar (lg:) or bottom sheet (mobile), 2x2 grid for up to 4 users, scroll for more
- **Chat Panel**: Slide-in from right, can minimize to icon
- **Controls Bar**: Bottom, backdrop-blur, glassmorphism, play/pause, volume, screen-share, settings

### Profile Settings
- **Tabs**: Horizontal (md: vertical sidebar), active tab magenta underline
- **Avatar Upload**: Circular dropzone, hover overlay, crop modal
- **Connected Services**: Service cards with connect/disconnect toggle, service brand colors

## Images

### Hero Section
Large cinematic background image showing diverse people enjoying movies together on devices, with subtle gradient overlay (magenta/cyan tint at 40% opacity). Image should convey collaboration and entertainment.

### Feature Showcases
- Screen sharing demonstration (laptop sharing to mobile devices)
- Video grid mockup showing 4-6 participants
- Chat interface with emoji reactions visible
- Synchronized playback across devices illustration

### Room Thumbnails
Movie poster or streaming service thumbnail placeholders (aspect-video), with gradient overlay for text readability.

## Accessibility
- Minimum contrast ratio 4.5:1 for all text
- Focus indicators: 2px magenta ring with offset
- Reduced motion: Disable animations, keep transitions under 0.3s
- Keyboard navigation: Clear focus states, logical tab order
- Screen reader: Proper ARIA labels for all interactive elements