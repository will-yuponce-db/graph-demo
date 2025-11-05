# Databricks Graph Visualization

A modern graph visualization application built with React, Vite, TypeScript, and Material-UI. Connects to Databricks SQL Warehouse to visualize property graph data stored in tabular format.

## 🚀 Features

- ⚡ **Vite** - Lightning-fast HMR and optimized builds
- ⚛️ **React 18** - Latest React with TypeScript
- 🎨 **Material-UI (MUI)** - Beautiful, accessible components
- 🌓 **Dark Mode** - Seamless light/dark theme switching
- 📱 **Responsive** - Mobile-first design with drawer navigation
- 🧭 **React Router** - Client-side routing
- 💅 **Emotion** - Powerful CSS-in-JS styling
- 📦 **TypeScript** - Type-safe code for better DX
- 🔗 **Databricks Integration** - Direct connection to Databricks SQL Warehouse
- 📊 **Interactive Graph Visualization** - Powered by react-force-graph-2d

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
- Databricks SQL Warehouse with access credentials
- Service Principal with permissions to query the graph table

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables (optional):

**For Demo Mode (Default):** The application works out-of-the-box with mock data. No configuration needed!

**For Databricks Connection:** The Databricks SQL driver requires a Node.js backend. See the `backend/` directory for setup instructions.

To enable backend mode, create a `.env` file in the frontend root directory:

```env
VITE_USE_BACKEND_API=true
VITE_API_URL=http://localhost:3000/api
```

Then set up and run the backend server (see `backend/README.md`):

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your Databricks credentials
npm start
```

**Architecture:**

```
Frontend (React/Vite) → Backend (Express/Node.js) → Databricks SQL Warehouse
```

**Fallback Behavior:** If the backend is not available, the application automatically uses mock data. This ensures the demo works seamlessly!

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to [http://localhost:5173](http://localhost:5173)

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
- **Graph Visualization (`/graph`)** - Interactive graph visualization connected to Databricks
- **Dashboard (`/dashboard`)** - Example dashboard with statistics, charts, and data displays
- **Forms (`/forms`)** - Comprehensive form examples with various MUI input components
- **About (`/about`)** - Project information and technology stack

## 📊 Databricks Table Schema

The application expects a table with the following schema for property graph data:

```sql
CREATE TABLE main.default.property_graph_entity_edges (
  node_start_id STRING,
  node_start_key STRING,
  relationship STRING,
  node_end_id STRING,
  node_end_key STRING,
  node_start_properties STRING,  -- JSON string
  node_end_properties STRING     -- JSON string
);
```

### Data Format

Each row represents an edge (relationship) in the graph:

- **node_start_id** - Unique identifier for the source node
- **node_start_key** - Display label for the source node
- **relationship** - Type of relationship (e.g., "WORKS_AT", "MANAGES")
- **node_end_id** - Unique identifier for the target node
- **node_end_key** - Display label for the target node
- **node_start_properties** - JSON string containing source node properties (including `type`, `label`, etc.)
- **node_end_properties** - JSON string containing target node properties

Example row:

```json
{
  "node_start_id": "person_001",
  "node_start_key": "John Doe",
  "relationship": "WORKS_AT",
  "node_end_id": "company_001",
  "node_end_key": "Acme Corp",
  "node_start_properties": "{\"type\": \"Person\", \"age\": 30}",
  "node_end_properties": "{\"type\": \"Company\", \"industry\": \"Technology\"}"
}
```

## 🎯 Graph Visualization Features

- **Interactive Exploration** - Click, drag, and zoom to explore the graph
- **Node Filtering** - Filter by node types (Person, Company, Product, etc.)
- **Relationship Filtering** - Show/hide specific relationship types
- **Change Tracking** - Distinguish between existing and proposed changes
- **Write Back to Databricks** - Save approved changes back to the table
- **Real-time Refresh** - Reload data from Databricks with the refresh button
- **Automatic Fallback** - Uses mock data when Databricks is unavailable (perfect for demos!)
- **Responsive Design** - Works on desktop and mobile devices
- **Dark/Light Mode** - Automatic theme switching

## 🔄 Data Source Modes

The application intelligently handles different data source scenarios:

### 1. Demo Mode (Default)

- **When:** `VITE_USE_BACKEND_API` is not set or `false`
- **Behavior:** Uses realistic mock data
- **Best for:** Development, demonstrations, testing UI changes
- **Setup:** None required - works out of the box!

### 2. Backend Connected Mode

- **When:** `VITE_USE_BACKEND_API=true` and backend server is running
- **Behavior:** Fetches live data from Databricks via backend API
- **Best for:** Production use, real data visualization
- **Setup:** Requires backend server (see `backend/README.md`)

### 3. Fallback Mode

- **When:** Backend mode enabled but connection fails
- **Behavior:** Automatically falls back to mock data
- **Best for:** Resilient demos, handling connectivity issues

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
