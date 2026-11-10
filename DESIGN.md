# Design System: Python Quest

Visual identity, token architecture, and component specifications for the **Python Quest** educational game platform.

---

## 1. Visual Theme & Atmosphere

A futuristic dark-mode cyber-terminal blending retro-arcade board game mechanics with modern developer HUD glassmorphism. Deep space canvas surfaces (`#090c12`) feature subtle ambient neon gradients in Python Blue (`#306998`) and Python Solar Yellow (`#FFD43B`), layered beneath a 40px cybernetic grid and frosted glass containers (`backdrop-filter: blur(14px)`).

---

## 2. Color Palette & Roles

### Primary Foundation
- **Deep Void Canvas (`#090c12`)**: Root application background, deep dark canvas tone.
- **Surface Elevation (`#111722`)**: Structural layout panels, headers, and footer containers.
- **Glass Card Surface (`rgba(18, 25, 38, 0.90)`)**: Workspace cards, floating dialogs, and HUD panels.
- **Subtle Outline (`rgba(255, 255, 255, 0.08)`)**: Hairline dividers and card borders.
- **Active Focus Border (`rgba(75, 139, 190, 0.50)`)**: Interactive focus rings and highlighted cards.

### Accent & Interactive
- **Python Classic Blue (`#306998`)**: Primary brand base, player movement paths, action indicators.
- **Python Light Blue (`#4B8BBE`)**: High-contrast interactive hover states, active button highlights.
- **Python Neon Glow (`rgba(75, 139, 190, 0.40)`)**: Ambient glow behind active controls and avatar halos.
- **Python Solar Yellow (`#FFD43B`)**: Energy counters, dice value displays, victory and achievement highlights.
- **Python Solar Glow (`rgba(255, 212, 59, 0.40)`)**: Dynamic glow for turn actions, dice roll pulses, and D6 energy.
- **Cyber Cyan (`#06b6d4`)**: Online multiplayer telemetry, network pings, and common challenge cards.

### Typography & Hierarchy
- **High-Contrast Text (`#f8fafc`)**: Primary headings, modal titles, and active player labels.
- **Body Text (`#f1f5f9`)**: Instructions, default copy, and general UI descriptions.
- **Muted Metadata (`#94a3b8`)**: Secondary captions, section tags, and helper hints.
- **Dimmed Text (`#64748b`)**: Inactive states, breadcrumbs, and disabled elements.

### Functional States
- **Success & Energy (`#10b981`)**: Step validation, energy quota fulfilled, correct code execution (Glow: `rgba(16, 185, 129, 0.35)`).
- **Warning & Hazard (`#f59e0b`)**: Turn timer warnings, medium-risk challenges, and shortcut approaches.
- **Danger & Bug Trap (`#ef4444`)**: Syntax compilation errors, trap penalties, bug recedes (Glow: `rgba(239, 68, 68, 0.35)`).
- **Epic Rarity (`#a855f7`)**: Rare cards and advanced tactical programming block badges.

---

## 3. Typography Rules

### UI Typography: **Outfit**
- **Display & Modal Titles**: `font-weight: 800-900`, `1.8rem - 2.5rem`, letter-spacing `0.5px`, often paired with yellow/white gradient text clipping.
- **Panel Headings**: `font-weight: 700`, `1.1rem - 1.4rem`, `#ffffff`.
- **Body UI**: `font-weight: 400-500`, `0.95rem - 1.0rem`, line-height `1.5`, `#f1f5f9`.
- **Section Tags & Badges**: `font-weight: 700`, `0.68rem - 0.75rem`, uppercase, letter-spacing `0.5px`, `#94a3b8`.

### Code & Telemetry: **JetBrains Mono**
- **Terminal & Compiled Python**: `font-weight: 400`, `0.85rem - 0.92rem`, monospace formatting with syntax color highlighting.
- **Dice & Step Energy Readouts**: `font-weight: 700`, `1.2rem - 2.0rem`, high-legibility telemetry.

---

## 4. Component Stylings

- **Buttons**:
  - *Primary Action*: High-contrast gradient with Python Blue (`#306998` ➔ `#4B8BBE`) or Solar Yellow (`#FFD43B`), `12px` (`--radius-md`) border radius, bold typography, elevated on hover with neon box-shadow (`0 0 20px var(--py-blue-glow)`).
  - *Ghost / Outlined*: `1px` subtle outline (`var(--border-subtle)`), transparent dark background, transitioning to cyan border on hover.
  - *Micro Action (`.btn-xs`)*: `padding: 3px 8px`, `0.72rem` font size for compact utility operations (e.g. "Limpar", "Ajuda").
- **Cards & HUD Workspaces**:
  - Surface: `var(--bg-dark-card)` (`rgba(18, 25, 38, 0.90)`), backdrop blur `14px`, `18px` (`--radius-lg`) border radius, `1px` border `rgba(255, 255, 255, 0.08)`, and ambient shadow `0 10px 30px rgba(0, 0, 0, 0.45)`.
- **Block Programming Workspace**:
  - Modular connected block pills (`[Personagem] ➔ [Ação] ➔ [Número]`).
  - Distinct categorical color accents (Movement Blue, Tactical Purple, Numeric Cyan).
  - Validation feedback: Turns neon green when step sum matches dice energy; pulses red on overflow or syntax invalidation.
- **Tactical Holographic 3D Cards**:
  - Perspective-transformed cards with subtle tilting (`transform: rotateY(...)`).
  - Tiered metallic borders: Common (Cyan), Rare (Purple `#a855f7`), Epic (Gold `#FFD43B`).
  - Shimmer overlay gradient on hover.
- **Game Board (64 Tiles)**:
  - Serpentine track alternating across 8 rows of 8 columns.
  - Distinct tile typologies: Normal (`#1e293b`), Shortcut (`⚡ #10b981`), Bug Trap (`🐛 #ef4444`), Challenge (`❓ #3b82f6`), Meta (`🏆 #FFD43B`).

---

## 5. Layout Principles

- **Grid Baseline**: Built on a fluid `4px` / `8px` spacing scale with `12px`, `16px`, `24px`, and `32px` standard spacing tokens.
- **Header Dock**: Sticky header (`padding: 12px 24px`, max-width `1600px`, `z-index: 100`) containing game brand, live player stats, sound toggle, and menu return.
- **Dual-Pane Arena**:
  - *Left Pane / Board*: Expansive interactive canvas holding the 64-tile quest trail and avatar tokens.
  - *Right Pane / Command Deck*: Compact control tower containing Dice Roller, Block Programming Workspace, Live Python Terminal, and Multiplayer Status.
- **Responsive Stacking**: On screens `< 1024px`, side deck stacks beneath the board; touch targets maintain a minimum dimension of `44px x 44px`.

---

## 6. Design System Notes for Stitch Generation

- **Atmosphere Keywords**: Cyberpunk terminal, dark mode, frosted glassmorphism, Python neon blue and solar yellow, 3D holographic cards, serpentine board game HUD.
- **Component Prompts**:
  - `Frosted dark glassmorphic control deck with Outfit headings, JetBrains Mono terminal, and Python Blue (#306998) neon accent glows.`
  - `3D holographic collectible challenge modal displaying three tactical card tiers (Common, Rare, Epic) with glowing borders and risk-reward badges.`
  - `Visual block code editor panel with drag-and-drop syntax chips connecting character, action, and numeric tokens with live compiler feedback.`
