# Backend API Server for Databricks Integration

This Express.js server provides a REST API for the React frontend to connect to Databricks SQL Warehouse.

## Why a Backend Server?

The `@databricks/sql` package is a Node.js library that:

- Cannot run in the browser (requires Node.js native modules)
- Needs server-side environment for security (credentials should never be in frontend code)
- Requires proper connection pooling and error handling

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `env.example` to `.env`:

```bash
cp env.example .env
```

Edit `.env` with your actual Databricks credentials:

```env
PORT=3000

DATABRICKS_HOST=e2-demo-field-eng.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/862f1d757f0424f7
DATABRICKS_TABLE=main.default.property_graph_entity_edges

DATABRICKS_CLIENT_ID=your-actual-client-id
DATABRICKS_CLIENT_SECRET=your-actual-client-secret
```

### 3. Start the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will start on http://localhost:3000

## API Endpoints

### GET /api/graph

Fetch all graph data from Databricks.

**Response:**

```json
{
  "nodes": [
    {
      "id": "person_001",
      "label": "John Doe",
      "type": "Person",
      "properties": { "age": 30 },
      "status": "existing"
    }
  ],
  "edges": [
    {
      "id": "edge_0_person_001_company_001",
      "source": "person_001",
      "target": "company_001",
      "relationshipType": "WORKS_AT",
      "properties": {},
      "status": "existing"
    }
  ]
}
```

### POST /api/graph

Write new nodes and edges to Databricks.

**Request Body:**

```json
{
  "nodes": [...],
  "edges": [...]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully wrote 2 nodes and 3 edges to graph table",
  "jobId": "job_1234567890_abc123",
  "writtenNodes": 2,
  "writtenEdges": 3
}
```

### GET /api/job/:jobId

Check the status of a write job.

**Response:**

```json
{
  "jobId": "job_1234567890_abc123",
  "status": "SUCCESS",
  "message": "Write operation completed successfully"
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "databricks": {
    "configured": true,
    "host": "e2-demo-field-eng.cloud.databricks.com",
    "table": "main.default.property_graph_entity_edges"
  }
}
```

## Connecting the Frontend

To use this backend with your React frontend:

1. Make sure the backend server is running on port 3000

2. In the frontend project root, create or update `.env`:

   ```env
   VITE_USE_BACKEND_API=true
   VITE_API_URL=http://localhost:3000/api
   ```

3. Restart your frontend dev server:

   ```bash
   npm run dev
   ```

4. Navigate to the Graph Visualization page - it will now fetch data from the backend!

## Architecture

```
React Frontend (Browser)
        ↓ HTTP Requests
Express Backend (Node.js)
        ↓ @databricks/sql
Databricks SQL Warehouse
        ↓ Query
property_graph_entity_edges table
```

## Security Best Practices

✅ **DO:**

- Keep `.env` file out of version control (already in .gitignore)
- Use environment variables for all credentials
- Add authentication/authorization for production
- Use HTTPS in production
- Implement rate limiting
- Add request validation

❌ **DON'T:**

- Commit credentials to git
- Expose credentials in frontend code
- Allow unauthenticated access in production
- Skip input validation

## Production Deployment

For production, consider:

1. **Deploy to a cloud service:**
   - AWS (ECS, Lambda)
   - Azure (App Service)
   - Google Cloud (Cloud Run)
   - Heroku
   - Railway

2. **Set environment variables** in your deployment platform

3. **Enable CORS properly:**

   ```javascript
   app.use(
     cors({
       origin: 'https://your-frontend-domain.com',
     })
   );
   ```

4. **Add authentication:**
   - API keys
   - OAuth 2.0
   - JWT tokens

5. **Monitor and log:**
   - Request logs
   - Error tracking (Sentry)
   - Performance monitoring

## Troubleshooting

### "Module not found: @databricks/sql"

**Solution:** Run `npm install` in the backend directory

### "Connection refused" from frontend

**Checks:**

1. Is the backend server running?
2. Is it running on port 3000?
3. Check CORS configuration
4. Verify VITE_API_URL in frontend .env

### "Failed to connect to Databricks"

**Checks:**

1. Are credentials correct in backend/.env?
2. Is the SQL warehouse running?
3. Does the service principal have permissions?
4. Is the network accessible?

### "Cannot find table"

**Solution:** Verify DATABRICKS_TABLE environment variable matches your actual table name

## Development Tips

**Test the health endpoint:**

```bash
curl http://localhost:3000/health
```

**Test fetching graph data:**

```bash
curl http://localhost:3000/api/graph
```

**View server logs:**
The server logs all requests and Databricks operations to the console.

## Files

- `server.js` - Main Express server with all API endpoints
- `package.json` - Node.js dependencies and scripts
- `env.example` - Environment variable template
- `README.md` - This file

---

**Need help?** Check the main project's `DATABRICKS_INTEGRATION.md` for more details.
