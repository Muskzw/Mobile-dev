# AI-Powered Business Quotation & Invoice Maker

A modern, scalable Web and Mobile Application for creating professional quotations, invoices, and business documents with AI-powered enhancements.

## Features

- 🔐 **Authentication & Onboarding** - Secure signup with business profile setup
- 📊 **Dashboard** - Analytics, document management, and AI recommendations
- 📄 **Document Generator** - Quotations, Invoices, Receipts, Delivery Notes
- 🤖 **AI-Powered Features** - Document writer, price estimator, auto-fill, smart insights
- 👥 **Client Management** - Complete client profiles and history
- 🏢 **Multi-Company Support** - Manage multiple business profiles
- 📱 **Mobile App** - Full functionality with offline mode
- 📧 **Email/WhatsApp Integration** - Send documents directly
- 🎨 **Customization** - Brand colors, logos, templates

## Tech Stack

- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Web Frontend**: React + TypeScript + Tailwind CSS
- **Mobile**: React Native + TypeScript
- **AI**: OpenAI API
- **PDF**: jsPDF / pdfkit
- **Authentication**: JWT

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

```bash
# Install all dependencies
npm run install:all

# Set up environment variables (see .env.example files in each directory)
```

### Running the Application

```bash
# Backend API
npm run dev:backend

# Web Frontend
npm run dev:web

# Mobile App
npm run dev:mobile
```

## Project Structure

```
├── backend/          # Express API server
├── web/             # React web application
├── mobile/          # React Native mobile app
└── shared/          # Shared types and utilities
```

## Environment Variables

See `.env.example` files in each directory for required environment variables.

## License

MIT

