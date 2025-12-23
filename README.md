# Kaizen Skin Editor

A professional 3D Minecraft skin editor built with React, Three.js, and Tauri.

![Kaizen Core](https://kaizencore.tech/assets/Kaizen.svg)

## Features

- **Dual View Editing**: Edit skins in both 2D texture view and real-time 3D preview
- **Professional Tools**: Pencil, eraser, fill bucket, eyedropper, line, gradient, and noise tools
- **Layer Support**: Multiple layers with opacity, blend modes, and visibility controls
- **Symmetry Modes**: Horizontal, vertical, and radial symmetry for efficient editing
- **Theme System**: 10+ customizable themes including Catppuccin variants
- **Cloud Integration**: Save and share skins with Kaizen Core account
- **Import/Export**: Load skins from files, Minecraft usernames, or the Kaizen gallery
- **Keyboard Shortcuts**: Professional workflow with customizable shortcuts

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **3D Rendering**: Three.js with React Three Fiber
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Radix UI
- **Desktop**: Tauri 2.0

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Rust (for Tauri desktop builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/KaizenCore/Kaizen-Skin-Editor.git
cd Kaizen-Skin-Editor

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Development

```bash
# Start web development server
npm run dev

# Start Tauri desktop app
npm run tauri dev
```

### Build

```bash
# Build for web
npm run build

# Build Tauri desktop app
npm run tauri build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `VITE_KAIZEN_CLIENT_ID` | OAuth client ID for Kaizen Core |
| `VITE_KAIZEN_BASE_URL` | Kaizen Core API base URL |
| `VITE_KAIZEN_REDIRECT_URI` | OAuth callback URL |
| `VITE_SKIN_API_URL` | Kaizen Skin API URL |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `P` | Pencil tool |
| `E` | Eraser tool |
| `G` | Fill bucket |
| `I` | Eyedropper |
| `L` | Line tool |
| `D` | Gradient tool |
| `N` | Noise tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+N` | New document |
| `Ctrl+O` | Import |
| `Ctrl+S` | Export |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary software owned by Kaizen Core.

## Disclaimer

Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.

---

Made with love by [Kaizen Core](https://kaizencore.tech)
