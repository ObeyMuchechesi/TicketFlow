# Component Testing

<cite>
**Referenced Files in This Document**
- [Button.js](file://components/ui/Button.js)
- [Card.js](file://components/ui/Card.js)
- [Input.js](file://components/ui/Input.js)
- [Badge.js](file://components/ui/Badge.js)
- [Progress.js](file://components/ui/Progress.js)
- [Skeleton.js](file://components/ui/Skeleton.js)
- [Toast.js](file://components/ui/Toast.js)
- [StepIndicator.js](file://components/ui/StepIndicator.js)
- [CountdownTimer.js](file://components/ui/CountdownTimer.js)
- [index.js](file://components/ui/index.js)
- [Layout.js](file://components/Layout.js)
- [AdminLayout.js](file://components/AdminLayout.js)
- [package.json](file://package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document provides a comprehensive guide to testing TicketFlow’s UI components using Jest and React Testing Library. It covers prop validation, event handling simulation, state management, conditional rendering, accessibility verification, snapshot strategies, component composition patterns, and responsive design testing. The focus is on the Button, Card, Input, Badge, and layout components (Layout and AdminLayout), along with other supporting UI primitives such as Progress, Skeleton, Toast, StepIndicator, and CountdownTimer.

## Project Structure
TicketFlow organizes UI primitives under components/ui with a central index for exports. Layouts live at the root of components. There are no existing test files in the repository; this guide shows how to structure tests alongside the components.

```mermaid
graph TB
subgraph "UI Primitives"
B["Button.js"]
C["Card.js"]
I["Input.js"]
D["Badge.js"]
P["Progress.js"]
S["Skeleton.js"]
T["Toast.js"]
SI["StepIndicator.js"]
CT["CountdownTimer.js"]
IDX["index.js"]
end
subgraph "Layouts"
L["Layout.js"]
AL["AdminLayout.js"]
end
IDX --> B
IDX --> C
IDX --> D
IDX --> I
IDX --> P
IDX --> S
IDX --> T
IDX --> SI
IDX --> CT
```

**Diagram sources**
- [index.js:1-10](file://components/ui/index.js#L1-L10)
- [Button.js:1-74](file://components/ui/Button.js#L1-L74)
- [Card.js:1-33](file://components/ui/Card.js#L1-L33)
- [Input.js:1-49](file://components/ui/Input.js#L1-L49)
- [Badge.js:1-30](file://components/ui/Badge.js#L1-L30)
- [Progress.js:1-39](file://components/ui/Progress.js#L1-L39)
- [Skeleton.js:1-48](file://components/ui/Skeleton.js#L1-L48)
- [Toast.js:1-84](file://components/ui/Toast.js#L1-L84)
- [StepIndicator.js:1-24](file://components/ui/StepIndicator.js#L1-L24)
- [CountdownTimer.js:1-109](file://components/ui/CountdownTimer.js#L1-L109)

**Section sources**
- [index.js:1-10](file://components/ui/index.js#L1-L10)
- [package.json:1-24](file://package.json#L1-L24)

## Core Components
This section outlines the key props, behaviors, and testing considerations for each core UI primitive.

- Button
  - Props: children, variant, size, onClick, disabled, loading, className, style, type, fullWidth, ...rest
  - Behaviors: renders a native button, applies classes based on variant/size, disables when loading or disabled, shows spinner when loading, supports mouseDown for visual ripple via CSS variables
  - Test focus: click handlers, disabled/loading states, class application, aria attributes if added, full-width behavior

- Card
  - Props: children, className, style, hoverable, glass, lift, accent, onClick, ...rest
  - Behaviors: renders a div with conditional classes based on glass/lift/accent; pointer cursor when onClick provided
  - Test focus: conditional classes, click propagation, custom styles and className merging

- Input
  - Props: label, error, helper, className, style, wrapperStyle, id, ...rest
  - Behaviors: renders label, input with error styling and aria-invalid, helper text or error message below
  - Test focus: label association via htmlFor/id, error vs helper visibility, aria-invalid attribute, forwarded props

- Badge
  - Props: children, variant, className, style, icon, ...rest
  - Behaviors: renders span with variant-based class; optional icon slot
  - Test focus: variant mapping to classes, icon rendering, content projection

- Progress
  - Props: value, max, color, showLabel, className, style, height
  - Behaviors: clamps percentage between 0–100, updates bar width, optionally shows label with value/max and percentage
  - Test focus: percentage calculation, label visibility, style/class merging

- Skeleton
  - Props: variant, width, height, className, style, count
  - Behaviors: renders one or multiple skeletons; sets default dimensions per variant; applies variant-specific classes
  - Test focus: count rendering, variant defaults, style/class merging

- Toast (Provider + hook)
  - Provides showToast, success, error, warning, info, remove
  - Renders toast list with roles and accessible labels; auto-dismiss by duration
  - Test focus: context availability, toast lifecycle, role/aria attributes, removal after duration

- StepIndicator
  - Props: steps array, currentStep number
  - Behaviors: marks steps as done/active; renders labels and connectors
  - Test focus: step states, labels, connector presence

- CountdownTimer
  - Props: target date string, compact, label, accent, onExpire
  - Behaviors: computes time parts, updates every second, calls onExpire when expired, renders different layouts based on compact
  - Test focus: timer updates, expiration callback, compact vs expanded rendering

**Section sources**
- [Button.js:1-74](file://components/ui/Button.js#L1-L74)
- [Card.js:1-33](file://components/ui/Card.js#L1-L33)
- [Input.js:1-49](file://components/ui/Input.js#L1-L49)
- [Badge.js:1-30](file://components/ui/Badge.js#L1-L30)
- [Progress.js:1-39](file://components/ui/Progress.js#L1-L39)
- [Skeleton.js:1-48](file://components/ui/Skeleton.js#L1-L48)
- [Toast.js:1-84](file://components/ui/Toast.js#L1-L84)
- [StepIndicator.js:1-24](file://components/ui/StepIndicator.js#L1-L24)
- [CountdownTimer.js:1-109](file://components/ui/CountdownTimer.js#L1-L109)

## Architecture Overview
The UI layer is composed of small, focused primitives that can be combined into higher-level pages and layouts. Layouts manage global concerns like navigation, theme switching, and authentication gating.

```mermaid
graph TB
App["App Pages"] --> L["Layout.js"]
App --> AL["AdminLayout.js"]
L --> B["Button.js"]
L --> C["Card.js"]
L --> I["Input.js"]
L --> D["Badge.js"]
L --> P["Progress.js"]
L --> S["Skeleton.js"]
L --> T["Toast.js"]
L --> SI["StepIndicator.js"]
L --> CT["CountdownTimer.js"]
AL --> B
AL --> C
AL --> I
AL --> D
AL --> P
AL --> S
AL --> T
AL --> SI
AL --> CT
```

**Diagram sources**
- [Layout.js:1-281](file://components/Layout.js#L1-L281)
- [AdminLayout.js:1-194](file://components/AdminLayout.js#L1-L194)
- [index.js:1-10](file://components/ui/index.js#L1-L10)

## Detailed Component Analysis

### Button Component Testing
Key aspects to verify:
- Prop-driven classes: variant and size map to specific CSS classes
- Disabled and loading states: disabled attribute applied when either prop is true; spinner visible only when loading
- Event handling: onClick invoked on click; mouseDown handler sets CSS variables for ripple effect
- Accessibility: ensure semantic button element and proper type attribute

```mermaid
flowchart TD
Start(["Render Button"]) --> ComputeClasses["Compute classes from variant/size/className"]
ComputeClasses --> ApplyProps["Apply disabled/loading props"]
ApplyProps --> RenderChildren{"loading?"}
RenderChildren --> |Yes| ShowSpinner["Render spinner"]
RenderChildren --> |No| ShowContent["Render children"]
ShowSpinner --> End(["Mount"])
ShowContent --> End
```

**Diagram sources**
- [Button.js:18-73](file://components/ui/Button.js#L18-L73)

Testing checklist:
- Verify rendered tag is a button with correct type
- Assert classes include expected variant and size tokens
- Confirm disabled attribute when disabled or loading
- Simulate click and assert onClick called once
- Simulate mouseDown and assert CSS variables set on ref element
- Snapshot render for default and variant variations

**Section sources**
- [Button.js:1-74](file://components/ui/Button.js#L1-L74)

### Card Component Testing
Key aspects to verify:
- Conditional classes based on glass, lift, accent
- Pointer cursor when onClick provided
- Forwarding rest props and merging styles

```mermaid
flowchart TD
Start(["Render Card"]) --> BuildClasses["Build classes from glass/lift/accent/className"]
BuildClasses --> SetCursor{"onClick provided?"}
SetCursor --> |Yes| CursorPointer["Set cursor pointer"]
SetCursor --> |No| NoCursor["No cursor override"]
CursorPointer --> Mount["Mount div with children"]
NoCursor --> Mount
```

**Diagram sources**
- [Card.js:1-32](file://components/ui/Card.js#L1-L32)

Testing checklist:
- Assert presence of base card class and conditional modifiers
- Check cursor style when onClick exists
- Validate style merging and className concatenation
- Click simulation to ensure onClick fires

**Section sources**
- [Card.js:1-33](file://components/ui/Card.js#L1-L33)

### Input Component Testing
Key aspects to verify:
- Label association via htmlFor/id
- Error vs helper text visibility
- aria-invalid attribute when error present
- Forwarded props to input element

```mermaid
flowchart TD
Start(["Render Input"]) --> HasLabel{"label provided?"}
HasLabel --> |Yes| RenderLabel["Render label with htmlFor=id"]
HasLabel --> |No| SkipLabel["Skip label"]
RenderLabel --> RenderInput["Render input with id and classes"]
SkipLabel --> RenderInput
RenderInput --> HasError{"error provided?"}
HasError --> |Yes| ShowError["Show error message and aria-invalid=true"]
HasError --> |No| HasHelper{"helper provided?"}
HasHelper --> |Yes| ShowHelper["Show helper text"]
HasHelper --> |No| NoText["No text below"]
ShowError --> End(["Mount"])
ShowHelper --> End
NoText --> End
```

**Diagram sources**
- [Input.js:1-48](file://components/ui/Input.js#L1-L48)

Testing checklist:
- Assert label exists and htmlFor matches input id
- When error is set, verify error paragraph and aria-invalid
- When helper is set without error, verify helper paragraph
- Ensure input receives forwarded props (e.g., placeholder, name)

**Section sources**
- [Input.js:1-49](file://components/ui/Input.js#L1-L49)

### Badge Component Testing
Key aspects to verify:
- Variant-to-class mapping
- Optional icon slot
- Content projection

```mermaid
flowchart TD
Start(["Render Badge"]) --> MapVariant["Map variant to class"]
MapVariant --> RenderSpan["Render span with classes"]
RenderSpan --> HasIcon{"icon provided?"}
HasIcon --> |Yes| WrapIcon["Wrap icon in span"]
HasIcon --> |No| NoIcon["No icon wrapper"]
WrapIcon --> AppendChildren["Append children"]
NoIcon --> AppendChildren
AppendChildren --> End(["Mount"])
```

**Diagram sources**
- [Badge.js:1-29](file://components/ui/Badge.js#L1-L29)

Testing checklist:
- Assert variant class presence
- Verify icon slot renders when provided
- Snapshot for different variants and content

**Section sources**
- [Badge.js:1-30](file://components/ui/Badge.js#L1-L30)

### Progress Component Testing
Key aspects to verify:
- Percentage clamping between 0 and 100
- Bar width reflects percentage
- Label visibility toggled by showLabel

```mermaid
flowchart TD
Start(["Render Progress"]) --> Clamp["Clamp value/max to 0-100%"]
Clamp --> SetWidth["Set bar width to percentage"]
SetWidth --> ShowLabel{"showLabel?"}
ShowLabel --> |Yes| RenderLabel["Render value/max and percentage"]
ShowLabel --> |No| SkipLabel["Skip label"]
RenderLabel --> End(["Mount"])
SkipLabel --> End
```

**Diagram sources**
- [Progress.js:1-38](file://components/ui/Progress.js#L1-L38)

Testing checklist:
- Assert bar width style equals computed percentage
- Verify label content when showLabel is true
- Test edge cases: value < 0, value > max

**Section sources**
- [Progress.js:1-39](file://components/ui/Progress.js#L1-L39)

### Skeleton Component Testing
Key aspects to verify:
- Default dimensions per variant
- Multiple skeleton rendering via count
- Style and class merging

```mermaid
flowchart TD
Start(["Render Skeleton"]) --> CountCheck{"count > 1?"}
CountCheck --> |Yes| RenderMultiple["Render multiple Skeleton recursively"]
CountCheck --> |No| RenderSingle["Render single skeleton with variant defaults"]
RenderMultiple --> End(["Mount"])
RenderSingle --> End
```

**Diagram sources**
- [Skeleton.js:1-47](file://components/ui/Skeleton.js#L1-L47)

Testing checklist:
- Assert default minHeight and borderRadius per variant
- Verify count renders multiple items
- Validate style and className merging

**Section sources**
- [Skeleton.js:1-48](file://components/ui/Skeleton.js#L1-L48)

### Toast Provider and Hook Testing
Key aspects to verify:
- Context availability and error when used outside provider
- Toast lifecycle: add, auto-remove after duration, manual remove
- Roles and accessible labels for screen readers

```mermaid
sequenceDiagram
participant Test as "Test"
participant Provider as "ToastProvider"
participant Hook as "useToast"
participant DOM as "DOM"
Test->>Provider : Render with children
Provider-->>DOM : Render container with role="region"
Test->>Hook : Call showToast({title,message,duration})
Provider->>Provider : Add toast with unique id
Provider->>DOM : Render toast with role/status/alert
Provider->>Provider : Schedule remove after duration
Test->>Provider : Call remove(id)
Provider->>DOM : Mark exiting and remove after animation
```

**Diagram sources**
- [Toast.js:1-84](file://components/ui/Toast.js#L1-L84)

Testing checklist:
- Assert container has role and aria-label
- Verify toasts appear with correct variant classes and roles
- Auto-dismiss after duration; manual dismiss works
- Error thrown when useToast used outside provider

**Section sources**
- [Toast.js:1-84](file://components/ui/Toast.js#L1-L84)

### StepIndicator Component Testing
Key aspects to verify:
- Step states: done, active, default
- Labels and connector lines

```mermaid
flowchart TD
Start(["Render StepIndicator"]) --> IterateSteps["Iterate steps with index i"]
IterateSteps --> DetermineState{"i < currentStep ?"}
DetermineState --> |Yes| StateDone["Mark state 'done'"]
DetermineState --> |No| IsCurrent{"i === currentStep ?"}
IsCurrent --> |Yes| StateActive["Mark state 'active'"]
IsCurrent --> |No| StateDefault["No state"]
StateDone --> RenderStep["Render dot and label"]
StateActive --> RenderStep
StateDefault --> RenderStep
RenderStep --> AddConnector{"i < steps.length - 1 ?"}
AddConnector --> |Yes| AddLine["Add connector line"]
AddConnector --> |No| End(["Mount"])
AddLine --> End
```

**Diagram sources**
- [StepIndicator.js:1-23](file://components/ui/StepIndicator.js#L1-L23)

Testing checklist:
- Assert step dots show checkmark for done steps
- Active step highlights appropriately
- Connector lines present between steps

**Section sources**
- [StepIndicator.js:1-24](file://components/ui/StepIndicator.js#L1-L24)

### CountdownTimer Component Testing
Key aspects to verify:
- Time computation and interval updates
- Expiration callback invocation
- Compact vs expanded rendering

```mermaid
sequenceDiagram
participant Test as "Test"
participant Timer as "CountdownTimer"
participant Clock as "setInterval"
Test->>Timer : Render with target date
Timer->>Timer : compute(target) -> initial time
Timer->>Clock : setInterval every 1s
Clock-->>Timer : Update time each tick
Timer->>Timer : If time null, call onExpire()
Test->>Timer : Assert displayed values and layout
```

**Diagram sources**
- [CountdownTimer.js:1-109](file://components/ui/CountdownTimer.js#L1-L109)

Testing checklist:
- Mock Date.now or use timers to control time progression
- Verify countdown values update correctly
- Assert onExpire called when time expires
- Snapshot compact and expanded modes

**Section sources**
- [CountdownTimer.js:1-109](file://components/ui/CountdownTimer.js#L1-L109)

### Layout Components Testing

#### Layout
Responsibilities:
- Head metadata
- Navigation with mobile menu toggle
- Theme switcher persisted to localStorage
- Scroll detection affecting nav appearance

```mermaid
flowchart TD
Start(["Mount Layout"]) --> InitTheme["Load saved theme from localStorage"]
InitTheme --> ApplyTheme["Set data-theme on documentElement"]
ApplyTheme --> ScrollListener["Attach scroll listener"]
ScrollListener --> ToggleNavClass{"scrollY > 20?"}
ToggleNavClass --> |Yes| NavScrolled["Add scrolled class"]
ToggleNavClass --> |No| NavDefault["Remove scrolled class"]
NavScrolled --> RenderMain["Render main with children"]
NavDefault --> RenderMain
```

**Diagram sources**
- [Layout.js:1-281](file://components/Layout.js#L1-L281)

Testing checklist:
- Assert head tags contain title and description
- Verify theme persistence and data-theme attribute
- Simulate scroll events and assert nav class changes
- Mobile menu toggle visibility and interactions

**Section sources**
- [Layout.js:1-281](file://components/Layout.js#L1-L281)

#### AdminLayout
Responsibilities:
- Authentication check via API
- Sidebar navigation with active state
- Logout action and redirection

```mermaid
sequenceDiagram
participant Test as "Test"
participant Admin as "AdminLayout"
participant API as "/api/auth/me"
participant Router as "next/router"
Test->>Admin : Render AdminLayout
Admin->>API : fetch('/api/auth/me')
API-->>Admin : { user }
Admin->>Router : Redirect if unauthorized
Admin->>Admin : Render sidebar with active links
Test->>Admin : Click Sign Out
Admin->>API : POST '/api/auth/logout'
Admin->>Router : Push to login
```

**Diagram sources**
- [AdminLayout.js:1-194](file://components/AdminLayout.js#L1-L194)

Testing checklist:
- Mock fetch and router to simulate auth flows
- Assert redirect behavior for unauthorized users
- Verify sidebar active link highlighting
- Logout triggers API call and navigation

**Section sources**
- [AdminLayout.js:1-194](file://components/AdminLayout.js#L1-L194)

## Dependency Analysis
Components primarily depend on React APIs and Next.js router where applicable. The UI index re-exports primitives for consistent imports.

```mermaid
graph LR
IDX["ui/index.js"] --> B["Button.js"]
IDX --> C["Card.js"]
IDX --> I["Input.js"]
IDX --> D["Badge.js"]
IDX --> P["Progress.js"]
IDX --> S["Skeleton.js"]
IDX --> T["Toast.js"]
IDX --> SI["StepIndicator.js"]
IDX --> CT["CountdownTimer.js"]
L["Layout.js"] --> B
L --> C
L --> I
L --> D
L --> P
L --> S
L --> T
L --> SI
L --> CT
AL["AdminLayout.js"] --> B
AL --> C
AL --> I
AL --> D
AL --> P
AL --> S
AL --> T
AL --> SI
AL --> CT
```

**Diagram sources**
- [index.js:1-10](file://components/ui/index.js#L1-L10)
- [Layout.js:1-281](file://components/Layout.js#L1-L281)
- [AdminLayout.js:1-194](file://components/AdminLayout.js#L1-L194)

**Section sources**
- [index.js:1-10](file://components/ui/index.js#L1-L10)

## Performance Considerations
- Prefer functional assertions over snapshots for dynamic content (e.g., countdown values).
- Use jest.useFakeTimers() to control time-sensitive components like CountdownTimer.
- Avoid heavy snapshot usage for components with frequent state changes; prefer targeted queries and assertions.
- Debounce scroll listeners in tests if necessary; mock window scroll events efficiently.
- Keep test fixtures minimal; reuse shared mocks for fetch and router.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing dependencies: Ensure Jest and React Testing Library are installed; configure setup files for Next.js environment if needed.
- Router mocking: next/router must be mocked to avoid hydration errors in tests.
- Fetch mocking: Use jest.fn() or MSW to mock API calls for AdminLayout authentication checks.
- Timers: For CountdownTimer, advance timers manually to avoid long-running tests.
- Context errors: Wrap components using useToast within ToastProvider in tests.

**Section sources**
- [AdminLayout.js:17-28](file://components/AdminLayout.js#L17-L28)
- [Toast.js:79-83](file://components/ui/Toast.js#L79-L83)
- [CountdownTimer.js:24-32](file://components/ui/CountdownTimer.js#L24-L32)

## Conclusion
By following the testing strategies outlined here, you can build robust, maintainable tests for TicketFlow’s UI components. Focus on prop validation, event simulation, state transitions, accessibility, and composition patterns. Use snapshots judiciously and prioritize deterministic assertions for reliability across environments.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Recommended Test Setup
- Install Jest and React Testing Library
- Configure Next.js testing utilities if required
- Create a setup file to mock next/router and fetch
- Organize tests alongside components (e.g., Button.test.js)

[No sources needed since this section provides general guidance]