# Interactive Graph Editor - Setup & Quick Start

## ✅ Current Status

Your backend server is now running! You should see:

- ✓ Backend running on `http://localhost:3000`
- ✓ SQLite database created and seeded with 19 nodes and 21 edges
- ✓ Ready to accept connections from frontend

## 🚀 Quick Start (2 Steps)

### Step 1: Refresh Your Browser

The frontend should now connect automatically. If you see the "Connection Error", just **refresh your browser page**.

### Step 2: Start Creating!

You can now:

1. **Create Nodes**: Drag node types from the left palette onto the canvas
2. **Create Edges**: Click "Create Edge" button, then click two nodes to connect them
3. **Edit Items**: Click on any node to edit its properties
4. **Save Changes**: Click "Save to Database" button in the top right

---

## 📖 Detailed Instructions

### Creating Your First Node

1. Look at the **left sidebar** - you'll see a "Node Palette" with 4 node types:
   - 👤 **Person** (blue)
   - 🏢 **Company** (purple)
   - 📦 **Product** (orange)
   - 📍 **Location** (red)

2. **Drag** any node type button and **drop** it onto the canvas

3. Fill in the form:
   - **Label**: Give your node a name (e.g., "John Smith")
   - **Type**: Already selected based on what you dragged
   - **Properties**: Add any custom fields (e.g., "email: john@example.com")

4. Click **Create**

5. The node appears on the canvas with a **green border** (meaning it's new/unsaved)

### Creating Your First Edge

1. Click the **"Create Edge"** button in the left sidebar

2. The cursor changes to a **crosshair** ✚

3. Click a **source node** (it will glow green)

4. Click a **target node**

5. Fill in the relationship form:
   - **Relationship Type**: Choose from dropdown (WORKS_AT, MANAGES, etc.)
   - **Properties**: Add custom fields if needed

6. Click **Create**

7. A **green dashed line** appears connecting the nodes

### Saving to Database

1. After creating nodes/edges, the **"Save to Database"** button shows:

   ```
   Save to Database (X nodes, Y edges)
   ```

2. Click it and confirm

3. Your changes are saved to SQLite (and Databricks if configured)

4. The green items turn blue (now "existing" status)

---

## 🎮 Interactive Features

### Keyboard Shortcuts

- **Delete/Backspace**: Delete selected NEW node or edge
- **Escape**: Cancel edge creation mode

### Graph Controls (Right Sidebar)

- **Show Proposed Changes**: Toggle to hide/show new items
- **Node Type Filters**: Show only specific node types
- **Relationship Filters**: Show only specific relationships
- **Reset View**: Clear all filters

### Node Colors

- 🔵 **Blue**: Existing nodes (from database)
- 🟢 **Green**: New nodes (not yet saved)
- 🟣 **Purple**: Companies
- 🟠 **Orange**: Products
- 🔴 **Red**: Locations

---

## 🛠️ Backend Management

### If You Need to Restart the Backend

```bash
# Stop the current server (press Ctrl+C in the terminal where it's running)
# Then:
cd backend
npm start
```

Or use the helper script:

```bash
./start-backend.sh
```

### Reseed the Database

If you want to reset to the original data:

```bash
cd backend
npm run reseed
```

This will:

1. Drop all tables
2. Recreate the schema
3. Insert the original 19 nodes and 21 edges

### Check Backend Health

Visit: http://localhost:3000/health

You should see:

```json
{
  "status": "ok",
  "database": {
    "type": "SQLite",
    "nodeCount": 19,
    "edgeCount": 21
  },
  "databricks": {
    "configured": false,
    "host": "...",
    "table": "..."
  }
}
```

---

## 📦 Database Location

Your SQLite database is stored at:

```
backend/db/graph.db
```

You can:

- Back it up by copying this file
- Inspect it with SQLite tools
- Delete it to start fresh (then run `npm run seed`)

---

## 🔗 Databricks Integration (Optional)

To sync data to Databricks:

1. Edit `backend/.env`:

   ```env
   DATABRICKS_CLIENT_ID=your-client-id
   DATABRICKS_CLIENT_SECRET=your-client-secret
   ```

2. Restart the backend

3. When you save changes, they'll sync to both SQLite and Databricks

**Note:** If Databricks fails, data still saves to SQLite (fallback behavior)

---

## 🐛 Troubleshooting

### "Connection Error: Failed to fetch"

**Solution:**

1. Check if backend is running: Visit http://localhost:3000/health
2. If not, start it: `cd backend && npm start`
3. Refresh your browser

### "No graph data available"

**Solution:**

1. The database might be empty
2. Run: `cd backend && npm run seed`
3. Restart backend: `npm start`
4. Refresh browser

### Backend won't start

**Error:** Port 3000 already in use

**Solution:**

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

Then update frontend `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### Changes disappear after refresh

This is normal! Until you click **"Save to Database"**, your changes only exist in browser memory.

Always click the save button to persist changes.

---

## 📚 More Documentation

- **Interactive Editor Guide**: See `INTERACTIVE_EDITOR_GUIDE.md` for comprehensive feature documentation
- **Databricks Integration**: See `DATABRICKS_INTEGRATION.md` for Databricks-specific setup

---

## 🎉 You're All Set!

Your interactive graph editor is ready to use. Try:

1. Creating a new person node
2. Connecting them to an existing company
3. Saving to the database
4. Refreshing to see your data persist

Happy graphing! 🚀
