# Deployment Guide - API Prefix Configuration

## ✅ Changes Made

1. **Backend API Prefix**: All API routes now use `/api` prefix
   - Example: `http://localhost:3000/api/users/login`
   - Example: `http://localhost:3000/api/movies`

2. **Frontend API Configuration**: Updated to use `/api` prefix
   - Uses relative path `/api` in production (same origin)
   - Uses Vite proxy in development

3. **Static Files**: Images remain accessible at root level
   - Example: `http://localhost:3000/images/filename.jpg`

4. **Frontend Serving**: Backend can serve frontend build in production

## 🚀 Development Setup

### Option 1: Separate Ports (Recommended for Development)

**Backend:**
```bash
# Run backend on port 3001
PORT=3001 npm run start:dev
# Or set in .env: PORT=3001
```

**Frontend:**
```bash
# Frontend runs on port 3000 with proxy
npm run dev
# Vite will proxy /api requests to http://localhost:3001/api
```

### Option 2: Same Port (Production-like)

**Backend:**
```bash
# Run backend on port 3000
PORT=3000 npm run start:dev
```

**Frontend:**
```bash
# Update vite.config.ts proxy target to http://localhost:3000
# Or set environment variable: VITE_BACKEND_URL=http://localhost:3000
npm run dev
```

## 📦 Production / EC2 Deployment

### Step 1: Build Frontend
```bash
cd react
npm run build
# This creates react/dist folder
```

### Step 2: Build Backend
```bash
cd node
npm run build
# This creates node/dist folder
```

### Step 3: Copy Frontend Build to Backend
```bash
# On EC2, ensure react/dist is accessible from node project
# The backend will look for: node/../react/dist
# Or adjust the path in main.ts if needed
```

### Step 4: Configure Environment Variables

Create `.env` file in `node` folder:
```bash
PORT=3000
HOST=0.0.0.0
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://your-ec2-ip-or-domain:3000
```

### Step 5: Start with PM2
```bash
cd node
pm2 start dist/main.js --name backend
pm2 save
pm2 startup
```

### Step 6: Verify

- Frontend: `http://your-ec2-ip:3000`
- API Health: `http://your-ec2-ip:3000/api`
- Images: `http://your-ec2-ip:3000/images/filename.jpg`

## 🔧 API Endpoints

All API endpoints are now prefixed with `/api`:

- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/movies?page=1&limit=8`
- `POST /api/movies`
- `PATCH /api/movies/:id`
- `DELETE /api/movies/:id`
- `POST /api/upload/image`

## 📝 Frontend API Configuration

The frontend uses:
- **Development**: Vite proxy handles `/api` → backend
- **Production**: Relative path `/api` (same origin)

To override, set environment variable:
```bash
VITE_API_BASE_URL=http://your-backend-url/api
```

## ⚠️ Important Notes

1. **Static Files**: Images in `public/images` are served at root level (not under `/api`)
2. **CORS**: Update `ALLOWED_ORIGINS` in `.env` for your frontend domain
3. **Security Group**: Ensure port 3000 is open in EC2 Security Group
4. **Frontend Build Path**: Adjust `frontendDistPath` in `main.ts` if your folder structure differs

## 🐛 Troubleshooting

### API calls return 404
- Check that backend has `app.setGlobalPrefix('api')` in `main.ts`
- Verify frontend is using `/api` prefix in API calls

### Frontend not loading in production
- Check that `react/dist` folder exists and is accessible
- Verify the path in `main.ts` matches your folder structure
- Check PM2 logs: `pm2 logs backend`

### Images not loading
- Images are served from `public/images` at root level
- Check that images exist in `node/public/images`
- Verify static assets configuration in `main.ts`

