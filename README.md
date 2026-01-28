# Smart POS System

A modern, full-stack Point of Sale (POS) system built with React and Fastify. Features real-time inventory management, sales tracking, comprehensive reporting, and multi-user authentication with role-based access control.

![Smart POS](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Features

### Core POS Functionality
- **Quick Sales Processing**: Intuitive POS interface with barcode scanner support
- **Product Search**: Real-time search with debounced queries for performance
- **Cart Management**: Add/remove items, adjust quantities, clear cart
- **Stock Validation**: Real-time stock checking before sale completion
- **Receipt Printing**: Automatic receipt generation with print functionality

### Inventory Management
- **Product Management**: Full CRUD operations for products
- **Category Organization**: Organize products by categories
- **Stock Tracking**: Real-time inventory levels and alerts
- **Low Stock Warnings**: Visual indicators for items needing restock
- **Stock Adjustments**: Track stock movements with reasons

### Sales & Reporting
- **Sales Dashboard**: Key metrics and performance indicators
- **Sales Trends**: Visual charts for 7/30/90 day periods
- **Top Products**: Identify best-selling items
- **Transaction History**: Complete sales records with search/filter
- **Revenue Analytics**: Track daily, weekly, monthly revenue

### Security & Access Control
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin, Manager, and Cashier roles
- **Protected Routes**: Frontend route protection by role
- **Password Security**: Bcrypt hashing for passwords
- **Session Management**: Automatic logout on token expiry

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Sidebar Navigation**: Clean, intuitive navigation system
- **Toast Notifications**: User-friendly success/error messages
- **Error Boundaries**: Graceful error handling with fallback UI
- **Loading States**: Consistent loading indicators across pages
- **Keyboard Shortcuts**: Quick actions for power users

## Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **React Router v6** - Client-side routing
- **Vite 5.4** - Lightning-fast build tool with HMR
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Elegant toast notifications
- **CSS3** - Custom styling with responsive design

### Backend
- **Fastify 3.x** - Fast and low-overhead web framework
- **Prisma ORM** - Type-safe database access
- **SQLite** - Lightweight, file-based database
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing

### Development Tools
- **Node.js 18+** - JavaScript runtime
- **npm** - Package manager
- **Git** - Version control

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.x or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

Check your versions:
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be 8.x or higher
```

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smart-pos.git
cd smart-pos
```

### 2. Install Backend Dependencies
```bash
cd app-server
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../app-ui
npm install
```

### 4. Set Up Database
```bash
cd ../app-server

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database with sample data
npx prisma db seed
```

The seed data creates:
- **Admin User**: username: `admin`, password: `admin123`
- **Manager User**: username: `manager`, password: `manager123`
- **Cashier User**: username: `cashier`, password: `cashier123`
- Sample products, categories, and suppliers

## Configuration

### Backend Configuration (.env)

Create `app-server/.env` file (copy from `.env.example`):

```env
# Database
DATABASE_URL="file:./prisma/pos.db"

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server
PORT=3001
NODE_ENV="development"
```

**Important**: Generate a secure JWT secret for production:
```bash
# Using OpenSSL (Linux/Mac)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Frontend Configuration (.env)

Create `app-ui/.env` file (copy from `.env.example`):

```env
# Backend API URL
VITE_API_URL="http://localhost:3001"

# App Configuration
VITE_APP_TITLE="Smart POS System"
VITE_NODE_ENV="development"
```

## Running the Application

### Development Mode

**Option 1: Run Both Servers Separately**

Terminal 1 (Backend):
```bash
cd app-server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd app-ui
npm run dev
```

**Option 2: Use Concurrent (if configured)**
```bash
npm run dev  # From project root
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

### Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Manager | manager | manager123 |
| Cashier | cashier | cashier123 |

**[!] Security Warning**: Change these default passwords in production!

## User Roles

### [ADMIN] Admin (Full Access)
- All Manager and Cashier permissions
- User management (create, edit, delete users)
- System settings configuration
- Database backup/restore
- Delete categories and products

### [MANAGER] Manager (Management Access)
- All Cashier permissions
- Product management (create, edit products)
- Category management (create, edit categories)
- Inventory adjustments
- View all reports and analytics
- Manage suppliers

### [CASHIER] Cashier (POS Access)
- Process sales transactions
- View product catalog
- Basic inventory viewing
- Print receipts
- View own sales history

## Project Structure

```
smart-pos/
├── app-server/                 # Backend application
│   ├── prisma/                 # Database schema and migrations
│   │   ├── schema.prisma       # Prisma schema definition
│   │   ├── seed.js             # Database seed script
│   │   └── migrations/         # Database migration files
│   ├── routes/                 # API route handlers
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── products.js         # Product CRUD operations
│   │   ├── categories.js       # Category management
│   │   ├── sales.js            # Sales processing
│   │   ├── inventory.js        # Inventory operations
│   │   ├── dashboard.js        # Dashboard analytics
│   │   └── settings.js         # Settings management
│   ├── middleware/             # Custom middleware
│   │   └── auth.js             # JWT authentication middleware
│   ├── utils/                  # Utility functions
│   │   └── auth.js             # Authentication utilities
│   ├── index.js                # Server entry point
│   ├── package.json            # Backend dependencies
│   └── .env.example            # Environment variables template
│
├── app-ui/                     # Frontend application
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   ├── Navigation.jsx  # Sidebar navigation
│   │   │   ├── ProductModal.jsx # Product form modal
│   │   │   ├── PaymentModal.jsx # Payment processing modal
│   │   │   ├── Receipt.jsx     # Receipt component
│   │   │   ├── StockModal.jsx  # Stock adjustment modal
│   │   │   └── ErrorBoundary.jsx # Error boundary wrapper
│   │   ├── pages/              # Page components
│   │   │   ├── POSScreen.jsx   # Main POS interface
│   │   │   ├── ProductsPage.jsx # Product management
│   │   │   ├── CategoriesPage.jsx # Category management
│   │   │   ├── InventoryPage.jsx # Inventory tracking
│   │   │   ├── DashboardPage.jsx # Analytics dashboard
│   │   │   ├── ReportsPage.jsx # Sales reports
│   │   │   ├── SettingsPage.jsx # System settings
│   │   │   └── LoginPage.jsx   # Login page
│   │   ├── context/            # React context providers
│   │   │   └── AuthContext.jsx # Authentication context
│   │   ├── utils/              # Utility functions
│   │   │   ├── api.js          # API fetch wrapper
│   │   │   └── toast.js        # Toast notification helpers
│   │   ├── styles/             # CSS stylesheets
│   │   ├── App.jsx             # Root component
│   │   ├── main.jsx            # Application entry point
│   │   └── index.css           # Global styles
│   ├── public/                 # Static assets
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.js          # Vite configuration
│   └── .env.example            # Environment variables template
│
├── IMPLEMENTATION-PHASES.md    # Development roadmap
├── ROADMAP.md                  # Future features
├── UX-COMPARISON.md            # UX design decisions
└── README.md                   # This file
```

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | User login | No |
| POST | `/auth/register` | Register new user (Admin only) | Yes |
| GET | `/products` | List all products | Yes |
| POST | `/products` | Create product | Yes (Admin/Manager) |
| PUT | `/products/:id` | Update product | Yes (Admin/Manager) |
| DELETE | `/products/:id` | Delete product | Yes (Admin) |
| GET | `/categories` | List categories | Yes |
| POST | `/categories` | Create category | Yes (Admin/Manager) |
| POST | `/sales` | Process sale | Yes |
| GET | `/sales` | List sales | Yes |
| GET | `/inventory/summary` | Inventory summary | Yes |
| POST | `/inventory/adjust` | Adjust stock | Yes (Manager/Admin) |
| GET | `/dashboard/stats` | Dashboard statistics | Yes |
| GET | `/settings` | Get settings | Yes |
| PUT | `/settings` | Update settings | Yes (Admin) |

For detailed API documentation, see the inline JSDoc comments in route files.

## Testing

### Manual Testing

Refer to the testing documentation:
- `TESTING-PHASE-6-7.md` - Categories, discounts, receipts

### Running the Seed Data
```bash
cd app-server
npx prisma db seed
```

This creates sample data for testing all features.

## Deployment

### Production Build

**Backend:**
```bash
cd app-server
npm run build  # If you have a build script
```

**Frontend:**
```bash
cd app-ui
npm run build
```

The build output will be in `app-ui/dist/`.

### Environment Variables

Ensure you set production environment variables:

**Backend (.env):**
- Generate a **strong** JWT_SECRET
- Set `NODE_ENV="production"`
- Configure production database URL if not using SQLite

**Frontend (.env):**
- Set `VITE_API_URL` to your production API URL
- Set `VITE_NODE_ENV="production"`

### Deployment Options

1. **Traditional Hosting**
   - Backend: Any Node.js hosting (Heroku, DigitalOcean, AWS EC2)
   - Frontend: Static hosting (Netlify, Vercel, AWS S3 + CloudFront)

2. **Docker** (Recommended)
   - Create Dockerfile for backend
   - Serve frontend build as static files via Fastify or Nginx
   - Use docker-compose for easy deployment

3. **VPS/Dedicated Server**
   - Use PM2 or systemd for process management
   - Nginx as reverse proxy
   - Set up SSL with Let's Encrypt

### Database Considerations

For production, consider migrating from SQLite to PostgreSQL or MySQL:
1. Update `DATABASE_URL` in `.env`
2. Run `npx prisma migrate deploy`
3. Adjust Prisma schema if needed for provider-specific features

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Follow existing code formatting
- Add comments for complex logic
- Update README if adding new features
- Test thoroughly before submitting

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- Built with care using React and Fastify
- Icons by [Lucide](https://lucide.dev/)
- Inspired by modern POS systems

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: support@smartpos.example.com

---

**Made by the Smart POS Team**
