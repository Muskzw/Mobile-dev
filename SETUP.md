# Setup Instructions

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- OpenAI API key (for AI features)
- SMTP credentials (for email sending)
- Docker and Docker Compose (optional, for easier setup)

## Quick Start with Docker (Recommended)

The easiest way to run the backend and database is using Docker.

1. Make sure you have Docker Desktop installed and running.
2. Run the following command in the root directory:
```bash
docker-compose up --build
```
3. This will start:
   - PostgreSQL database on port 5432
   - Backend API on port 5000

You can now proceed to the **Web Frontend Setup** section.

## Manual Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=quotation_maker
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

OPENAI_API_KEY=your_openai_api_key_here

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

FRONTEND_URL=http://localhost:3000
```

4. Create the database:
```bash
createdb quotation_maker
```

5. Start the backend server:
```bash
npm run dev
```

The backend will automatically create all necessary database tables on first run.

## Web Frontend Setup

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The web app will be available at http://localhost:3000

## Mobile App Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. For iOS:
```bash
npm run ios
```

4. For Android:
```bash
npm run android
```

5. For web (development):
```bash
npm run web
```

## First Time Setup

1. Register a new account at http://localhost:3000/register
2. Complete the Business Profile Setup wizard
3. Add your first client
4. Create your first quotation or invoice

## Features

### AI Features
- **Document Writer**: AI generates professional descriptions
- **Price Estimator**: AI suggests competitive pricing
- **Auto-Fill**: Extract items from purchase requests
- **Smart Insights**: Analytics and recommendations

### Document Management
- Create quotations, invoices, receipts, delivery notes
- Export to PDF
- Send via email or WhatsApp
- Duplicate and edit documents
- Track document status

### Multi-Company Support
- Manage multiple business profiles
- Switch between companies easily
- Separate data per company

### Mobile App
- Full functionality on mobile
- Offline mode (syncs when online)
- Push notifications
- Native mobile experience

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `createdb quotation_maker`

### Email Not Sending
- Verify SMTP credentials
- For Gmail, use an App Password (not your regular password)
- Check firewall settings

### AI Features Not Working
- Verify OpenAI API key is set
- Check API key has sufficient credits
- Review API rate limits

### Mobile App Issues
- Ensure Expo CLI is installed: `npm install -g expo-cli`
- Clear cache: `expo start -c`
- Check network connectivity for API calls

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Build: `npm run build`
3. Start: `npm start`
4. Use PM2 or similar for process management

### Web Frontend
1. Build: `npm run build`
2. Deploy `dist` folder to hosting service (Vercel, Netlify, etc.)
3. Update API URL in production

### Mobile App
1. Build for production: `expo build:android` or `expo build:ios`
2. Submit to app stores
3. Update API URL in `src/api/client.ts`

## Support

For issues or questions, please check the documentation or create an issue in the repository.

