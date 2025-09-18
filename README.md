<<<<<<< HEAD
# Factoring Collections Management System

A React-based web application for managing factoring collections, loans, and payments across multiple sister companies.

## Overview

This application is designed to replace Excel-based tracking with a centralized, scalable system for both factoring users and sister company users. It manages loan collections, payments, and provides comprehensive reporting across multiple business entities.

## Features

- **Dashboard**: Overview of outstanding balances, weekly collections, and remaining installments
- **Client Management**: Track and manage client information
- **Loan Management**: Create and track loans with installment schedules
- **Payment Processing**: Record and manage payments across different categories
- **Sister Company Portal**: Dedicated access for sister companies to view and confirm payments
- **Reports**: Comprehensive reporting with Excel and PDF export capabilities
- **Notifications**: Automated email and SMS notifications for payment confirmations

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Backend**: Supabase (SQL database + authentication)
- **Deployment**: GitHub Pages (configured)

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/factoring-collections.git
   cd factoring-collections
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── pages/              # Main application pages
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Deployment

This project is configured for automatic deployment to GitHub Pages. The deployment workflow is triggered on every push to the main branch.

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to your hosting service of choice.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For support and questions, please contact the development team.

---
*Last updated: $(date)*
=======
# Factoring Collections Management System

A React-based web application for managing factoring collections, loans, and payments across multiple sister companies.

## Overview

This application is designed to replace Excel-based tracking with a centralized, scalable system for both factoring users and sister company users. It manages loan collections, payments, and provides comprehensive reporting across multiple business entities.

## Features

- **Dashboard**: Overview of outstanding balances, weekly collections, and remaining installments
- **Client Management**: Track and manage client information
- **Loan Management**: Create and track loans with installment schedules
- **Payment Processing**: Record and manage payments across different categories
- **Sister Company Portal**: Dedicated access for sister companies to view and confirm payments
- **Reports**: Comprehensive reporting with Excel and PDF export capabilities
- **Notifications**: Automated email and SMS notifications for payment confirmations

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Backend**: Supabase (SQL database + authentication)
- **Deployment**: GitHub Pages (configured)

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/factoring-collections.git
   cd factoring-collections
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── pages/              # Main application pages
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Deployment

This project is configured for automatic deployment to GitHub Pages. The deployment workflow is triggered on every push to the main branch.

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to your hosting service of choice.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For support and questions, please contact the development team.

---
*Last updated: $(date)*
>>>>>>> b9e3a3a (Initial setup + GitHub Pages workflow)
