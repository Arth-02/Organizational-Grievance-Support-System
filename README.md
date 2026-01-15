# OrgX - Organizational Management System

OrgX is a comprehensive SaaS platform designed to streamline organizational workflows, grievance handling, project management, and team collaboration. It empowers organizations of all sizes to manage their operations efficiently through a unified dashboard.

## 🚀 Key Features

### 🏢 Organization Management
- **Multi-tenant Architecture**: Secure isolation of organization data.
- **Role-Based Access Control (RBAC)**: Granular permissions for Super Admins, Admins, Employees, and support staff.
- **Department Management**: Create and manage customizable departments structure.

### 📝 Grievance Redressal System
- **Ticket Management**: Create, track, and resolve grievances.
- **View Modes**: Switch between Kanban board and Table views for grievance tracking.
- **Priority & Status Tracking**: Customizable workflows for different types of issues.

### 📊 Project & Task Management
- **Kanban Boards**: Interactive drag-and-drop boards for project tasks.
- **Task Tracking**: detailed task creation with priorities, types (Task, Bug, Story), and assignments.
- **Sprints**: Manage project lifecycles effectively.

### 💳 Billing & Subscriptions
- **Stripe Integration**: Secure payment processing.
- **Subscription Plans**: Professional and Enterprise tiers with varying limits.
- **Usage Tracking**: Monitor resource usage (users, storage, projects) with automated email alerts.
- **Invoicing**: Automated invoice generation (PDF) and email delivery.

### 🔔 Notifications & Communication
- **Real-time Updates**: Socket.io integration for instant notifications.
- **Email Notifications**: Professional HTML email templates for OTPs, invoices, alerts, and approvals.
- **Audit Logs**: Comprehensive tracking of critical system actions.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: TailwindCSS, Shadcn/UI
- **State Management**: Redux Toolkit, React Query
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod Validation
- **Drag & Drop**: @hello-pangea/dnd
- **Visuals**: Lucide React, Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io
- **Payment**: Stripe
- **Email**: Nodemailer
- **PDF Generation**: PDFKit
- **Validation**: Joi
- **Logging**: Morgan

## ⚙️ Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local or Atlas URL)
- Stripe Account (for payments)
- Mail Server (SMTP) credentials

## 📦 Installation

Clone the repository:
```bash
git clone https://github.com/your-username/orgx.git
cd orgx
```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory (see Environment Variables).
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/orgx
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
EMAIL_FROM=noreply@orgx.com

# Admin Setup
SUPER_ADMIN_EMAIL=admin@orgx.com
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📜 Scripts

### Backend
- `npm run dev`: Start server in development mode with Nodemon.
- `npm start`: Start server in production mode.
- `npm run seed:plans`: Seed the database with initial subscription plans.
- `npm test`: Run Jest tests.

### Frontend
- `npm run dev`: Start Vite development server.
- `npm run build`: Build for production.
- `npm run preview`: Preview production build.
- `npm run lint`: Run ESLint.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the ISC License.