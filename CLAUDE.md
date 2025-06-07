# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack construction management application with Django backend and Next.js frontend:

**Backend**: Django 5.2 REST API with WebSocket support via Django Channels, PostgreSQL database, JWT authentication
**Frontend**: Next.js 15.3.1 with App Router, shadcn/ui components, Tailwind CSS, real-time WebSocket integration

## Development Commands

### Backend (Django)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver  # http://localhost:8000
```

### Frontend (Next.js)
```bash
cd frontend/gestao_web
npm install
npm run dev  # http://localhost:3000
npm run build
npm run lint
```

## Key Django Apps

**employees**: Core HR management with Employee, Construction, Department models. Handles payment tracking (salary + allowances), construction assignments, payment status management.

**financials**: Financial operations with Material, Expense, Transaction models. Manages inventory with stock tracking, expense categorization, multiple payment methods.

**users**: User management with UserProfile extension via Django signals.

## Real-time Features

WebSocket endpoints at `/ws/employees/` and `/ws/financials/` provide real-time updates. Frontend uses custom WebSocket hooks for live dashboard updates and employee status changes.

## API Structure

Core endpoints: `/api/employees/`, `/api/financials/`, `/api/users/`
WebSocket consumers: EmployeeConsumer, FinancialConsumer
Authentication: JWT with 1-day access, 7-day refresh tokens

## Frontend Components

App Router pages for dashboard, employees, departments, expenses, materials, settings, login.
Key components: RealTimeDashboard, EmployeesList, EmployeeForm with React Hook Form + Zod validation.
UI built with shadcn/ui components and Tailwind CSS.

## Database Configuration

Uses PostgreSQL with hardcoded credentials in settings.py (development), SQLite fallback. Database migrations are in each app's migrations/ directory.

## Development Notes

- CORS currently allows all origins for development
- Debug mode enabled with detailed error reporting
- No test configurations currently implemented
- Environment variables should be used instead of hardcoded credentials