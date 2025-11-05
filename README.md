# React + Vite + MUI Boilerplate

A modern, production-ready React boilerplate built with Vite, TypeScript, and Material-UI. Features responsive navigation, dark/light mode theming, and comprehensive examples of common UI patterns.

## 🚀 Features

- ⚡ **Vite** - Lightning-fast HMR and optimized builds
- ⚛️ **React 18** - Latest React with TypeScript
- 🎨 **Material-UI (MUI)** - Beautiful, accessible components
- 🌓 **Dark Mode** - Seamless light/dark theme switching
- 📱 **Responsive** - Mobile-first design with drawer navigation
- 🧭 **React Router** - Client-side routing
- 💅 **Emotion** - Powerful CSS-in-JS styling
- 📦 **TypeScript** - Type-safe code for better DX

## 📂 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.tsx      # Main layout with AppBar and Drawer
│   └── ThemeToggle.tsx # Dark/light mode toggle button
├── contexts/           # React contexts
│   └── ThemeContext.tsx # Theme provider with mode switching
├── pages/              # Page components
│   ├── Home.tsx        # Landing page with hero section
│   ├── Dashboard.tsx   # Dashboard with stats and charts
│   ├── Forms.tsx       # Form examples with various inputs
│   └── About.tsx       # About page with project info
├── theme/              # Theme configuration
│   └── theme.ts        # Light/dark theme definitions
├── App.tsx             # Root component with routing
└── main.tsx            # Application entry point
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser to [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📄 Available Pages

- **Home (`/`)** - Landing page with hero section and feature cards
- **Dashboard (`/dashboard`)** - Example dashboard with statistics, charts, and data displays
- **Forms (`/forms`)** - Comprehensive form examples with various MUI input components
- **About (`/about`)** - Project information and technology stack

## 🎨 Customization

### Theme

Edit `src/theme/theme.ts` to customize colors, typography, and component styles:

```typescript
// Customize primary color
primary: {
  main: '#1976d2',  // Your brand color
  light: '#42a5f5',
  dark: '#1565c0',
}
```

### Navigation

Modify the menu items in `src/components/Layout.tsx`:

```typescript
const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  // Add your custom routes here
];
```

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Add navigation item in `src/components/Layout.tsx`

## 📦 Dependencies

### Core

- react: ^18.3.1
- react-dom: ^18.3.1
- react-router-dom: ^7.0.2
- typescript: ^5.6.2
- vite: ^6.0.5

### UI & Styling

- @mui/material: ^6.3.1
- @mui/icons-material: ^6.3.1
- @emotion/react: ^11.14.0
- @emotion/styled: ^11.14.0

## 🤝 Contributing

This is a boilerplate template - feel free to customize it for your needs!

## 📝 License

MIT - Use this boilerplate however you'd like!

## 🛠️ Code Quality

This project includes automated code quality tools:

- **ESLint** - Linting for TypeScript and React
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks
- **lint-staged** - Run linters on staged files only

All code is automatically linted and formatted before each commit. See [DEVELOPMENT.md](DEVELOPMENT.md) for more details.

## 🎯 Next Steps

- Add your business logic
- Integrate with your backend API
- Add state management (Redux, Zustand, etc.)
- Set up testing (Vitest, React Testing Library)
- Add more pages and features
- Customize the theme to match your brand

---

Built with ❤️ using React, Vite, and Material-UI
