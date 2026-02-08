# PurePromise Web Frontend

The Next.js frontend application for PurePromise - an AI-powered couple photo generation platform.

## Features

- AI Image Generation
- Real-time Image Preview
- Beautiful Image Gallery
- Responsive Design
- Authentication with Clerk

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Clerk Authentication

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Clerk Account

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### Development

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build

# Start production server
bun start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
apps/web/
├── app/                   # App Router pages
├── components/           # React components
├── lib/                  # Utility functions
├── styles/              # Global styles
├── types/               # TypeScript types
└── public/              # Static assets
```

## Key Components

- `app/page.tsx` - Homepage
- `app/dashboard/page.tsx` - User Dashboard
- `components/Camera.tsx` - Image Generation UI
- `components/Gallery.tsx` - Image Gallery
- `components/ui/` - Shared UI Components


## API Integration

The frontend communicates with the backend API at `NEXT_PUBLIC_BACKEND_URL`. Key endpoints:

- `/api/generate` - Generate new images
- `/api/images` - Fetch user's images
- `/api/pack` - Manage credit packs
