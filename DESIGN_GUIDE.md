# Arsenal Design System Guide

A comprehensive design guide for creating products with a similar UI and style to Arsenal. This guide captures the core design principles, patterns, and implementation details that define Arsenal's distinctive visual language.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Layout & Spacing](#layout--spacing)
5. [Component Patterns](#component-patterns)
6. [Visual Effects](#visual-effects)
7. [Animation Principles](#animation-principles)
8. [Interactive Patterns](#interactive-patterns)
9. [Responsive Design](#responsive-design)
10. [Implementation Guide](#implementation-guide)
11. [Design Tokens Reference](#design-tokens-reference)

---

## Design Philosophy

### Core Principles

**Brutalist Minimalism with Digital Precision**

Arsenal's design language is built on these foundational principles:

1. **High Contrast Foundation**: Pure black backgrounds (#000000) with white text create maximum readability and visual impact
2. **Minimal but Bold**: Small border radius (2-4px), generous spacing, and bold typography create a stark, modern aesthetic
3. **Vibrant Accents**: Strategic use of bright accent colors (blue, teal, purple, orange, pink, yellow, green, red) for interactive elements and visual hierarchy
4. **Geometric Playfulness**: Consistent use of geometric shapes (circles, squares, rounded squares, blobs) for icons, badges, and visual elements
5. **Smooth Motion**: All animations feel intentional and performant, never decorative
6. **Layered Depth**: Parallax effects, backdrop blur, and subtle shadows create dimension without clutter
7. **Consistent Assignment**: Hash-based color and shape assignment ensures visual consistency across the application

### Design Values

- **Clarity over decoration**: Every visual element serves a purpose
- **Performance first**: Animations are GPU-accelerated and optimized
- **Accessibility built-in**: High contrast ratios, visible focus states, motion preferences respected
- **Systematic consistency**: Design tokens and utility functions ensure uniformity

---

## Color System

### Base Palette

The foundation is a monochrome black and white system with carefully controlled opacity levels:

```css
/* Primary Colors */
--background: #000000;                    /* Pure black background */
--surface: rgba(0, 0, 0, 0.6);          /* Semi-transparent black overlays */
--surface2: rgba(0, 0, 0, 0.35);        /* Lighter overlay variant */
--text-primary: #FFFFFF;                 /* Pure white text */
--text-secondary: rgba(255, 255, 255, 0.85);
--text-tertiary: rgba(255, 255, 255, 0.60);
--text-muted: rgba(255, 255, 255, 0.45);

/* Borders */
--border-default: rgba(255, 255, 255, 0.15);
--border-subtle: rgba(255, 255, 255, 0.10);
--border-hover: rgba(255, 255, 255, 0.25);
```

### Accent Colors

Vibrant colors used strategically for tags, icons, badges, status indicators, and interactive elements:

```css
--blue: #3B82F6;
--teal: #14B8A6;
--purple: #A855F7;
--orange: #F97316;
--pink: #EC4899;
--yellow: #EAB308;    /* Slightly darker for white text readability */
--green: #22C55E;
--red: #EF4444;
```

### Status Colors

Semantic colors for system feedback:

```css
--status-success: #22C55E;
--status-warning: #F97316;
--status-danger: #EF4444;
--status-info: #3B82F6;
```

### Color Assignment Strategy

**Hash-Based Consistency**: Use hash functions to assign colors consistently based on string values (e.g., user names, category names, tags). This ensures the same string always gets the same color.

```javascript
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getColorForString(str, accentColors) {
  const hash = hashString(str);
  return accentColors[hash % accentColors.length];
}
```

**Usage Guidelines:**
- Apply accent colors to geometric shapes (circles, squares, rounded squares, blobs)
- Always use white text/icons on accent-colored backgrounds for maximum contrast
- Use accent colors sparingly - they should draw attention, not overwhelm
- Reserve status colors for system feedback (success, error, warning messages)

---

## Typography

### Font Stack

```css
font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Why Space Grotesk?**
- Modern geometric sans-serif
- Excellent readability at all sizes
- Tight letter spacing works well with the brutalist aesthetic
- Variable weight support for flexibility

### Typography Scale

```css
/* Font Sizes */
--font-size-xs: 13px;      /* line-height: 1.5 */
--font-size-sm: 15px;      /* line-height: 1.5 */
--font-size-base: 17px;    /* line-height: 1.6 */
--font-size-lg: 19px;      /* line-height: 1.6 */
--font-size-xl: 22px;      /* line-height: 1.5 */
--font-size-2xl: 26px;     /* line-height: 1.4 */
--font-size-3xl: 32px;     /* line-height: 1.3 */
--font-size-4xl: 40px;     /* line-height: 1.2 */
--font-size-5xl: 50px;     /* line-height: 1.1 */
--font-size-6xl: 62px;     /* line-height: 1.0 */
```

### Letter Spacing (Tracking)

```css
--tracking-tight: -0.025em;   /* Headings, buttons */
--tracking-normal: 0em;       /* Body text */
--tracking-wide: 0.08em;      /* Uppercase labels, metadata */
```

### Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-bold: 700;
```

### Typography Hierarchy

1. **Headings**: Bold weight, tight tracking (-0.025em), high contrast (white)
2. **Body Text**: Regular weight, normal tracking, 85% opacity white
3. **Secondary Text**: Regular weight, 60% opacity white
4. **Metadata/Labels**: Small size (xs-sm), uppercase, wide tracking (0.08em), 60% opacity

### Typography Rules

- **Font Smoothing**: Always use `-webkit-font-smoothing: antialiased` for crisp rendering
- **Base Font Size**: 17px (1.0625rem) - slightly larger than standard for better readability
- **Line Height**: 1.6 for body text, tighter (1.2-1.3) for headings
- **Uppercase Labels**: Use for metadata, tags, small labels with wide tracking

---

## Layout & Spacing

### Container System

```css
--container-max-width: 1440px;
--page-padding-mobile: 20px;
--page-padding-tablet: 40px;
--page-padding-desktop: 80px;
```

### Grid System

```css
--spacing-grid-xs: 8px;
--spacing-grid-sm: 16px;
--spacing-grid-md: 32px;
--spacing-grid-lg: 48px;
```

### Border Radius (Minimal)

```css
--radius-xs: 2px;
--radius-sm: 2px;
--radius-md: 3px;
--radius-lg: 4px;
--radius-card: 16px;      /* Cards use larger radius for softer feel */
--radius-pill: 9999px;    /* Fully rounded for pills/badges */
```

### Layout Principles

1. **Generous White Space**: Negative space is black - use it liberally
2. **Centered Content**: Max-width containers centered on page
3. **Responsive Padding**: Scales with viewport size
4. **Minimal Border Radius**: Almost square, but not harsh (2-4px default)
5. **Consistent Grid**: Use spacing tokens for all gaps and padding

---

## Component Patterns

### Buttons

#### Primary Button (White on Black)

```css
/* Base Styles */
background: #FFFFFF;
color: #000000;
padding: 12px 32px;
border-radius: 12px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.08em;
transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover State */
transform: scale(1.05);
opacity: 0.9;
box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);

/* Active State */
transform: scale(0.98);
```

**Implementation Pattern:**
- White background with black text creates maximum contrast
- Uppercase text with wide tracking for bold appearance
- Subtle scale on hover (1.05x) for tactile feedback
- Smooth transitions (400ms) for polished feel

#### Secondary Button (Outlined)

```css
/* Base Styles */
background: transparent;
color: #FFFFFF;
border: 2px solid rgba(255, 255, 255, 0.2);
padding: 12px 32px;
border-radius: 12px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.08em;
transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover State */
transform: scale(1.05);
border-color: rgba(255, 255, 255, 1);
color: #FFFFFF;
```

**Advanced Hover Effects:**
- **Slide-in Background**: Black background slides in from right, text changes to white
- **Shine Effect**: Gradient overlay sweeps across button (1.5s infinite loop)
- **Icon Rotation**: Arrow/icons rotate 45° on hover

### Cards

```css
/* Base Styles */
background: var(--surface);
border: 1px solid var(--border-default);
border-radius: 16px;
padding: 32px;
transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
overflow: hidden;

/* Hover State (if clickable) */
transform: scale(1.015);
background: var(--surface2);
border-color: var(--border-hover);
box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
```

**Card Structure:**
- Subtle gradient background (from background to surface2)
- Border with low opacity (15%) that increases on hover (25%)
- Optional top highlight bar that fades in on hover
- Content section with consistent padding
- Image sections with rounded top corners
- Badges/icons positioned on borders (negative positioning)

### Navigation Pills

```css
/* Inactive State */
background: transparent;
color: rgba(255, 255, 255, 0.85);
padding: 8px 16px;
border-radius: var(--radius-sm);
font-size: 15px;
font-weight: 400;
transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover State (inactive) */
color: #FFFFFF;
background: rgba(255, 255, 255, 0.02);
transform: scale(1.05);

/* Active State */
background: rgba(255, 255, 255, 0.05);
color: #FFFFFF;
font-weight: 500;
border-bottom: 1px solid var(--text-primary);
```

**Alternative Active State (Colored):**
```css
/* Active State with Accent Color */
background: [vibrant color from accent palette];
color: #FFFFFF;
padding: 8px 16px;
border-radius: 9999px;  /* Fully rounded */
font-weight: bold;
transform: scale(1.1) translateY(-2px);
box-shadow: 0 8px 20px [color]40;
/* Optional: Pulsing radial gradient overlay */
```

### Tabs

```css
/* Container */
display: flex;
gap: 8px;
padding: 8px;
background: var(--surface);
border-radius: var(--radius-lg);
border: 1px solid var(--border-default);

/* Tab - Inactive */
background: transparent;
color: var(--text-secondary);
padding: 8px 16px;
border-radius: var(--radius-md);
font-size: 15px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.08em;
transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);

/* Tab - Active */
background: var(--text-primary);
color: var(--bg);
```

### Input Fields

```css
/* Base Styles */
background: var(--surface);
border: 1px solid var(--border-default);
border-radius: var(--radius-md);
padding: 12px 16px;
color: var(--text-primary);
font-size: var(--font-size-base);
font-family: var(--font-sans);
transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);

/* Focus State */
border-color: var(--border-hover);
outline: 2px solid var(--text-primary);
outline-offset: 2px;

/* Error State */
border-color: var(--status-danger);
```

### Badges & Tags

Use geometric shapes with accent colors:

```css
/* Badge Container */
display: inline-flex;
align-items: center;
justify-content: center;
padding: 4px 12px;
border-radius: [shape-based: circle/square/roundedSquare/blob];
background: [accent color from hash];
color: #FFFFFF;
font-size: 13px;
font-weight: 500;
box-shadow: 0 0 20px [color]80;
transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover State */
transform: scale(1.1);
```

**Shape Assignment:**
- Use hash-based function to assign shapes consistently
- Shapes: circle (9999px), square (8px), roundedSquare (16px), blob (24px)
- White icons/text inside colored shapes

---

## Visual Effects

### Backdrop Blur

```css
/* Blur Levels */
--blur-sm: 8px;
--blur-md: 12px;
--blur-lg: 16px;

/* Usage */
background: rgba(0, 0, 0, 0.6);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
```

**Use Cases:**
- Navigation bars
- Modal overlays
- Floating panels
- Context menus

### Glow Effects

```css
/* Subtle Glow */
box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);

/* Medium Glow */
box-shadow: 0 0 30px rgba(255, 255, 255, 0.15);

/* Strong Glow */
box-shadow: 0 0 50px rgba(255, 255, 255, 0.2);

/* Colored Glow (for accent elements) */
box-shadow: 0 8px 20px [accent-color]40;
```

### Sharp Shadows (Brutalist Style)

```css
/* Sharp Shadow - Small */
box-shadow: 4px 4px 0 rgba(255, 255, 255, 0.1);

/* Sharp Shadow - Medium */
box-shadow: 8px 8px 0 rgba(255, 255, 255, 0.1);

/* Sharp Shadow - Large */
box-shadow: 12px 12px 0 rgba(255, 255, 255, 0.1);
```

### Card Lift Shadow

```css
box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
```

---

## Animation Principles

### Timing Functions

```css
/* Smooth, Natural (Default) */
cubic-bezier(0.4, 0, 0.2, 1)

/* Bouncy (for interactive elements) */
cubic-bezier(0.34, 1.56, 0.64, 1)

/* Ease Out */
ease-out
```

### Duration Guidelines

```css
/* Micro-interactions */
--duration-micro: 250ms;        /* Hover states, active states */

/* Transitions */
--duration-transition: 400ms;    /* Color changes, border changes */

/* Entrance animations */
--duration-enter: 700ms;        /* Page load, scroll into view */

/* Complex animations */
1000-2000ms;                    /* Page transitions, major state changes */
```

### Stagger Pattern

For lists and grids, stagger entrance animations:

```javascript
const delay = 500 + index * 120; // ms
const duration = 700; // ms
const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';
```

### Performance Optimizations

```css
/* Force GPU acceleration */
transform: translateZ(0);
will-change: transform;

/* Optimize animations */
/* Use requestAnimationFrame for continuous animations */
/* Throttle scroll handlers */
/* Cache getBoundingClientRect calls */
/* Reduce animation frequency on mobile */
```

### Entrance Animations

#### Fade In
```css
opacity: 0 → 1;
duration: 1000ms;
easing: ease-out;
```

#### Slide Up
```css
opacity: 0 → 1;
transform: translateY(20px) → translateY(0);
duration: 600ms;
easing: cubic-bezier(0.4, 0, 0.2, 1);
```

#### Scale In
```css
opacity: 0 → 1;
transform: scale(0.98) → scale(1);
duration: 600ms;
easing: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Interactive Patterns

### Hover States

**Scale**: 1.05-1.1x (subtle, not jarring)
**Color**: Increase opacity (e.g., 0.85 → 1.0)
**Border**: Increase opacity (e.g., 0.15 → 0.25 or 1.0)
**Shadow**: Add or intensify glow
**Transform**: Translate slightly (translateY(-2px) for lift effect)

### Link Hover Effects

```css
/* Standard Link */
color: rgba(255, 255, 255, 0.8);
transition: all 300ms ease;

/* Hover State */
color: #FFFFFF;
transform: translateX(4px);  /* Subtle right shift */
```

### Button Hover Effects

#### Slide-in Background
- Black background slides in from right
- Original text fades out
- New text ("Let's Go →") fades in
- Duration: 500ms

#### Shine Effect
- Gradient overlay sweeps across button
- Skewed rectangle animates from left to right
- Opacity: 40%
- Duration: 1.5s, infinite loop

### Card Hover Effects

```css
/* Subtle scale */
transform: scale(1.015);

/* Border intensifies */
border-color: var(--border-hover);

/* Shadow deepens */
box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);

/* Optional: Image scales within card */
.card-image {
  transform: scale(1.05);
}

/* Optional: Badges/icons scale */
.card-badge {
  transform: scale(1.1);
}
```

### Focus States

```css
/* Visible focus indicators */
outline: 2px solid var(--text-primary);
outline-offset: 2px;
```

**Accessibility**: Always provide visible focus states for keyboard navigation.

---

## Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
```

### Mobile Adaptations

1. **Typography**: Slightly smaller font sizes (reduce by 1-2px)
2. **Spacing**: Reduced padding (mobile: 20px vs desktop: 80px)
3. **Grid**: Single column, stack vertically
4. **Animations**: Reduced complexity, fewer particles
5. **Navigation**: Hamburger menu, full-width mobile menu
6. **Images**: Higher scale factor to prevent border visibility

### Image Optimization

- Use `<picture>` with WebP sources
- Provide multiple sizes with `srcSet`
- Lazy load below-fold images
- Use `loading="eager"` for above-fold critical images

---

## Implementation Guide

### CSS Variables Setup

```css
:root {
  /* Colors */
  --bg: #000000;
  --surface: rgba(0, 0, 0, 0.6);
  --surface2: rgba(0, 0, 0, 0.35);
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.85);
  --text-tertiary: rgba(255, 255, 255, 0.60);
  --border-default: rgba(255, 255, 255, 0.15);
  --border-hover: rgba(255, 255, 255, 0.25);
  
  /* Typography */
  --font-sans: 'Space Grotesk', system-ui, sans-serif;
  --font-size-base: 17px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --tracking-tight: -0.025em;
  --tracking-wide: 0.08em;
  
  /* Spacing */
  --spacing-grid-xs: 8px;
  --spacing-grid-sm: 16px;
  --spacing-grid-md: 32px;
  --spacing-grid-lg: 48px;
  
  /* Border Radius */
  --radius-xs: 2px;
  --radius-sm: 2px;
  --radius-md: 3px;
  --radius-lg: 4px;
  --radius-card: 16px;
  --radius-pill: 9999px;
  
  /* Motion */
  --duration-micro: 250ms;
  --duration-transition: 400ms;
  --duration-enter: 700ms;
  --easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Utility Functions

```javascript
// Color assignment
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getColorForString(str, accentColors) {
  const hash = hashString(str);
  return accentColors[hash % accentColors.length];
}

// Shape assignment
function getShapeForString(str) {
  const shapes = ['circle', 'square', 'roundedSquare', 'blob'];
  const hash = hashString(str);
  return shapes[hash % shapes.length];
}

function getShapeRadius(shape) {
  switch (shape) {
    case 'circle': return '9999px';
    case 'square': return '8px';
    case 'roundedSquare': return '16px';
    case 'blob': return '24px';
    default: return '3px';
  }
}
```

### Component Structure

```jsx
// Example: Button Component
function Button({ variant = 'primary', children, ...props }) {
  const baseStyles = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'all var(--duration-transition) var(--easing-smooth)',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
  };

  if (variant === 'primary') {
    return (
      <button
        style={{
          ...baseStyles,
          backgroundColor: 'var(--text-primary)',
          color: 'var(--bg)',
          padding: '12px 32px',
          borderRadius: '12px',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.opacity = '1';
        }}
        {...props}
      >
        {children}
      </button>
    );
  }

  // Secondary variant...
}
```

### Theme System Architecture

For a flexible theme system:

1. **Define Theme Schema**: Use Zod or TypeScript for type safety
2. **Store Theme Config**: JSON structure with tokens, components, features
3. **Apply to CSS Variables**: Transform theme config to CSS variables on `:root`
4. **Component Usage**: Components reference CSS variables, not hardcoded values
5. **Dynamic Updates**: Update CSS variables when theme changes

---

## Design Tokens Reference

### Complete Token List

```json
{
  "colors": {
    "background": "#000000",
    "surface": "rgba(0, 0, 0, 0.6)",
    "surface2": "rgba(0, 0, 0, 0.35)",
    "text": {
      "primary": "#FFFFFF",
      "secondary": "rgba(255, 255, 255, 0.85)",
      "tertiary": "rgba(255, 255, 255, 0.60)",
      "muted": "rgba(255, 255, 255, 0.45)"
    },
    "border": {
      "default": "rgba(255, 255, 255, 0.15)",
      "subtle": "rgba(255, 255, 255, 0.10)",
      "hover": "rgba(255, 255, 255, 0.25)"
    },
    "status": {
      "success": "#22C55E",
      "warning": "#F97316",
      "danger": "#EF4444",
      "info": "#3B82F6"
    },
    "accents": [
      "#3B82F6", "#14B8A6", "#A855F7", "#F97316",
      "#EC4899", "#EAB308", "#22C55E", "#EF4444"
    ]
  },
  "typography": {
    "fontFamily": {
      "sans": "Space Grotesk, system-ui, sans-serif",
      "mono": "ui-monospace, SFMono-Regular, Menlo, monospace"
    },
    "baseFontPx": 17,
    "tracking": {
      "tight": "-0.025em",
      "normal": "0em",
      "wide": "0.08em"
    },
    "sizesPx": {
      "xs": 13, "sm": 15, "base": 17, "lg": 19,
      "xl": 22, "2xl": 26, "3xl": 32, "4xl": 40,
      "5xl": 50, "6xl": 62
    },
    "lineHeight": {
      "body": 1.6,
      "heading": 1.2
    },
    "weight": {
      "regular": 400,
      "medium": 500,
      "bold": 700
    }
  },
  "radiiPx": {
    "xs": 2, "sm": 2, "md": 3, "lg": 4,
    "card": 16, "pill": 9999
  },
  "spacingPx": {
    "gridXs": 8, "gridSm": 16, "gridMd": 32, "gridLg": 48,
    "pagePadMobile": 20, "pagePadTablet": 40, "pagePadDesktop": 80
  },
  "container": {
    "maxWidthPx": 1440
  },
  "blurPx": {
    "sm": 8, "md": 12, "lg": 16
  },
  "motion": {
    "easing": {
      "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      "bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      "out": "ease-out"
    },
    "durationMs": {
      "micro": 250,
      "transition": 400,
      "enter": 700
    },
    "staggerMs": 120
  }
}
```

---

## Common Patterns

### Hero Section

- Large centered headline (5xl-6xl)
- Subheading with 85% opacity
- Stats row with colored geometric icons
- Two CTA buttons (primary white, secondary outlined)
- Optional: Layered background images with parallax

### Content Grid

- 3-column grid (responsive: 1 col mobile, 2 tablet, 3 desktop)
- Cards with images, badges, platform icons
- Staggered entrance animations (120ms delay per item)
- Hover scale and shadow effects

### Navigation

- Fixed top bar with backdrop blur
- Logo on left
- Navigation pills on right (desktop)
- Active state: colored background, scale, glow
- Mobile: hamburger menu, full-width mobile menu

### Forms

- Input fields with subtle borders
- Labels with uppercase, wide tracking
- Error states with red borders
- Focus states with white outline
- Submit button (primary white)

### Modals

- Backdrop blur overlay
- Centered card with border
- Close button (X icon) in top right
- Smooth fade-in animation (700ms)
- Click outside to close

---

## Accessibility Considerations

### Contrast

- White on black: WCAG AAA compliant (21:1)
- Ensure accent colors meet contrast when used with text
- Yellow (#EAB308) is darker for white text readability

### Focus States

```css
/* Visible focus indicators */
outline: 2px solid var(--text-primary);
outline-offset: 2px;
```

### Motion

- Respect `prefers-reduced-motion` media query
- Provide static fallbacks for animations
- Don't rely solely on motion for information

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order should be logical
- Focus indicators must be visible

---

## Key Takeaways

1. **Contrast is King**: Pure black and white foundation with vibrant accents
2. **Minimal but Bold**: Small border radius, generous spacing, bold typography
3. **Smooth Motion**: All animations feel intentional and performant
4. **Layered Depth**: Parallax, backdrop blur, and shadows create dimension
5. **Consistent Colors**: Hash-based assignment ensures visual consistency
6. **Geometric Shapes**: Circles, squares, rounded squares add playful brutality
7. **Performance First**: GPU acceleration, throttling, mobile optimizations
8. **Accessibility**: High contrast, visible focus states, motion preferences

---

## Adapting to Your Product

This design system is intentionally flexible. To adapt it to your product:

1. **Keep the Foundation**: Maintain the black/white base and high contrast principles
2. **Customize Accents**: Choose accent colors that fit your brand (but keep them vibrant)
3. **Adjust Typography**: You can use a different font, but maintain the tight tracking and size scale
4. **Modify Components**: Adapt button styles, card layouts, etc. to your needs while keeping the core patterns
5. **Scale Spacing**: Adjust spacing tokens based on your content density needs
6. **Add Your Patterns**: Create new component patterns following the same principles

The key is maintaining the **brutalist minimalism with digital precision** philosophy while adapting the specifics to your product's needs.

---

*This guide is based on Arsenal's design system. Use it as a foundation and adapt it to create products with a similar aesthetic and feel.*
