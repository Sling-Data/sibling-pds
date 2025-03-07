# Sibling Frontend

A modern React application for connecting siblings and managing their interactions.

## Tech Stack

- **React 18.2.0** - A JavaScript library for building user interfaces
- **TypeScript 4.9.5** - Adds static typing to JavaScript
- **React Router 6.20.0** - For client-side routing
- **Jest & React Testing Library** - For unit and integration testing
- **CSS Modules** - For component-scoped styling

## Features

- User registration and profile management
- Detailed data input form for user preferences
- Profile page with editable user information
- Service connections (Gmail, Plaid)
- Privacy settings management
- Responsive design for mobile and desktop
- Form validation and error handling
- Protected routes with authentication

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the frontend directory with:
   ```
   REACT_APP_API_URL=http://localhost:3000
   ```

### Development

```bash
# Start development server
npm start

# Run tests
npm test

# Run tests once
npm run test-once

# Build for production
npm run build:frontend
```

## Project Structure

```
src/
├── components/        # React components
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── styles/           # CSS stylesheets
├── __tests__/        # Test files
└── index.tsx         # Application entry point
```

## Testing

The project uses Jest and React Testing Library for testing. Tests are located in the `__tests__` directory and can be run with:

```bash
npm test
```

## Building for Production

To create a production build:

```bash
npm run build:frontend
```

This will create an optimized build in the `build` directory.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write or update tests
4. Submit a pull request

## Learn More

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Router Documentation](https://reactrouter.com/)
- [Testing Library Documentation](https://testing-library.com/)
