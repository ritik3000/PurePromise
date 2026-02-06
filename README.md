# PurePromise - AI Pre-Wedding Photo Platform

PurePromise is a powerful AI platform that lets you generate stunning pre-wedding photos of couples. Built with cutting-edge technology, it enables couples to create beautiful AI-generated pre-wedding memories and train personalized models on their own image datasets. Whether you're planning your wedding and want unique pre-wedding photos or looking to create romantic couple portraits, PurePromise provides an intuitive interface and robust capabilities for AI-powered pre-wedding photo generation.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js with TypeScript
- **Authentication**: Clerk
- **Package Management**: Bun
- **Monorepo Management**: Turborepo

## Project Structure

### Apps and Packages

- `web`: Next.js frontend application
- `backend`: Node.js backend service
- `@repo/ui`: Shared React component library
- `@repo/typescript-config`: Shared TypeScript configurations
- `@repo/eslint-config`: Shared ESLint configurations

## Getting Started

### Prerequisites

- Bun (for local development)
- Clerk Account (for authentication)

### Environment Setup

1. **Create environment files** using the provided examples:

```bash
# Backend (apps/backend)
cp apps/backend/.env.example apps/backend/.env

# Frontend (apps/web)
cp apps/web/.env.example apps/web/.env.local

# Then edit both new files and fill in real values.
```


### Local Development

```bash
# Install dependencies
bun install

# Run development servers
bun run dev

# Build all packages
bun run build
```

## Features

- AI-powered image generation
- User authentication and authorization
- Image gallery with preview
- Download generated images
- Responsive design

## Environment Files Overview

- `apps/backend/.env.example`: Example config for the Node backend (Fal key, S3, Clerk, webhooks, etc.).
- `apps/web/.env.example`: Example config for the Next.js frontend (Clerk publishable key, backend URL, S3 public URL).
- For local development, copy these to `.env` / `.env.local` as shown above and customize with your own secrets and URLs.

## Development Commands

```bash
# Run frontend only
bun run start:web

# Run backend only
bun run start:backend

# Run both frontend and backend
bun run dev
```


## Project Structure

```
.
├── apps
│   ├── web/                 # Next.js frontend
│   └── backend/            # Node.js backend
├── packages
│   ├── ui/                 # Shared UI components
│   ├── typescript-config/  # Shared TS config
│   └── eslint-config/     # Shared ESLint config
└── package.json
```

