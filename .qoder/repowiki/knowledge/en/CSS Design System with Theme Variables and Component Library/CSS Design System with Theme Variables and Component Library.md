---
kind: frontend_style
name: CSS Design System with Theme Variables and Component Library
category: frontend_style
scope:
    - '**'
source_files:
    - pages/styles/global.css
    - components/ui/index.js
    - components/ui/Button.js
    - components/ui/Card.js
    - pages/_app.js
---

The TicketFlow application uses a custom CSS design system built on CSS custom properties (variables) and class-based styling, without any CSS-in-JS or utility-first frameworks like Tailwind. The styling approach centers around a comprehensive global stylesheet that defines design tokens, multiple themes, and reusable component classes.

**Design Token Architecture**: The system is built on CSS custom properties defined in `:root` including typography (`--font-primary`, `--font-secondary`, `--font-mono`), spacing (8px-based scale from `--space-1` to `--space-16`), border radius (`--radius-sm` through `--radius-2xl`), shadows (`--shadow-sm` through `--shadow-2xl`), transitions, and z-index scales. These tokens are theme-aware and applied across all components.

**Multi-Theme Support**: Five distinct themes are implemented via `[data-theme]` selectors: 'dark-concert' (default), 'midnight-blue', 'royal-purple', 'emerald', and 'elegant-white'. Each theme redefines background colors, text colors, accent palettes, gradients, and borders while maintaining consistent token structure. Themes can be switched dynamically at runtime.

**Component Class System**: A comprehensive set of BEM-like CSS classes provides consistent UI patterns:
- Base components: `.tf-btn` (with variants `.tf-btn-primary`, `.tf-btn-secondary`, `.tf-btn-ghost`), `.tf-card`, `.tf-input`, `.tf-badge`
- Layout components: `.tf-nav`, `.tf-hero`, `.tf-section`
- Specialized components: `.tf-event-card`, `.tf-search`, glassmorphism utilities (`.glass`, `.glass-card`)
- Animation utilities: Predefined keyframes and animation classes like `.animate-fade-in-up`, `.stagger-children`

**React Component Integration**: The `components/ui/` directory contains React components that map to CSS classes through props. Components like Button.js use variant/size prop mappings to apply appropriate CSS classes (e.g., `VARIANTS = { primary: 'tf-btn-primary', secondary: 'tf-btn-secondary' }`). Components support composition through className props and style overrides.

**Global Styling Strategy**: The main stylesheet `pages/styles/global.css` (1849+ lines) serves as the single source of truth for all styling, imported once in `_app.js`. It includes CSS resets, base styles, animations, and all component styles. The file imports Google Fonts (Inter, Plus Jakarta Sans, Manrope) and defines extensive animation keyframes for consistent motion design.

**No External CSS Frameworks**: The project has no Tailwind, Bootstrap, or other CSS frameworks in dependencies. All styling is custom-written CSS with modern features like CSS variables, backdrop-filter for glassmorphism effects, and CSS grid/flexbox layouts.