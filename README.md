# UUConnect - University Social Platform

A comprehensive social platform designed for Uttaranchal University students and faculty. UUConnect provides a centralized hub for campus communication, academic discussions, opportunity sharing, and community building.

## Features

- **Blog System**: Share experiences, achievements, and thoughts
- **Q&A Forums**: Ask seniors and get academic guidance
- **Announcements**: Official university notifications and events
- **Opportunities Board**: Internships, jobs, and freelance projects
- **Skill Sharing**: Connect with peers for skill exchange
- **Mental Health Corner**: Anonymous support and wellness resources
- **Review System**: Rate campus services and experiences
- **Complaint Management**: Submit and track feedback
- **Event Calendar**: University events and important dates
- **Admin Dashboard**: User and content management

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for state management
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **JWT** authentication
- **Bcrypt** for password hashing

### Database
- **PostgreSQL** (production)
- **In-memory storage** (development/demo)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL (for production setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uuconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open http://localhost:5000 in your browser
   - The frontend and backend run on the same port

## Database Setup

### Current Setup (In-Memory Storage)
The project currently uses **in-memory storage** for demonstration purposes. Data is reset when the server restarts.

### Production Database Setup (PostgreSQL)

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   
   # macOS with Homebrew
   brew install postgresql
   
   # Windows - Download from postgresql.org
   ```

2. **Create Database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE uuconnect;
   CREATE USER uuconnect_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE uuconnect TO uuconnect_user;
   \q
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://uuconnect_user:your_password@localhost:5432/uuconnect"
   JWT_SECRET="your-super-secret-jwt-key"
   NODE_ENV="development"
   ```

4. **Switch to Database Storage**
   In `server/index.ts`, replace the memory storage import:
   ```typescript
   // Replace this line:
   import { storage } from "./storage";
   
   // With database storage (when implemented):
   import { createDatabaseStorage } from "./database-storage";
   const storage = createDatabaseStorage();
   ```

5. **Run Database Migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Cloud Database Options

#### Neon Database (Recommended)
1. Visit [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to your `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```

#### Supabase
1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string

#### Railway
1. Visit [railway.app](https://railway.app)
2. Create PostgreSQL service
3. Copy the connection URL

## Demo Accounts

For testing purposes, use these pre-configured accounts:

### Administrator Account
- **Email**: `admin@uu.ac.in`
- **Password**: `admin123`
- **Access**: Full admin privileges, user management, content moderation

### Student Account
- **Email**: `student@uu.ac.in`
- **Password**: `student123`
- **Access**: Standard user features, content creation

## Project Structure

```
uuconnect/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utility functions
│   └── index.html
├── server/                # Express.js backend
│   ├── index.ts          # Main server file
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage layer
│   └── vite.ts           # Vite integration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Content
- `GET /api/blogs` - Get all blogs
- `POST /api/blogs` - Create new blog
- `GET /api/qna` - Get Q&A threads
- `POST /api/qna` - Create Q&A thread
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement (admin only)

### More endpoints available - see `server/routes.ts` for complete list

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | No | In-memory storage |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |
| `NODE_ENV` | Environment mode | No | development |

## Development

### Adding New Features

1. **Database Schema**: Update `shared/schema.ts`
2. **Storage Interface**: Add methods to `server/storage.ts`
3. **API Routes**: Add endpoints in `server/routes.ts`
4. **Frontend Pages**: Create components in `client/src/pages/`
5. **Navigation**: Update `client/src/components/navigation.tsx`

### Code Style
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Functional components with hooks
- Tailwind CSS for styling

## Deployment

### Replit (Recommended for Development)
1. Import project to Replit
2. Run `npm install`
3. Click "Run" button
4. Access via provided URL

### Production Deployment
1. Build the project: `npm run build`
2. Set environment variables
3. Deploy to your preferred platform (Vercel, Netlify, Railway)

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Role-based access control
- CORS protection

## Support

For issues and questions:
- Check existing issues in the repository
- Create new issue with detailed description
- Contact: dev@uu.ac.in

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

**UUConnect** - Connecting the Uttaranchal University Community