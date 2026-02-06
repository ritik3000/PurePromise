# PurePromise Backend Service

The Node.js backend service for PurePromise - an AI-powered pre-wedding photo generation platform for couples.

## Features

- AI Image Generation
- Model Training
- S3 Image Storage
- Clerk Authentication
- Webhook Handlers

## Tech Stack

- Node.js with TypeScript
- Express.js
- Prisma ORM
- FalAI Client
- S3 Storage
- Clerk Authentication

## Environment Variables

Create a `.env` file:

```bash
# AI Service
FAL_KEY=your_fal_ai_key

# Storage
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
BUCKET_NAME=your_bucket_name
ENDPOINT=your_s3_endpoint

# Authentication
AUTH_JWT_KEY=your_jwt_key
CLERK_JWT_PUBLIC_KEY=your_clerk_public_key
SIGNING_SECRET=your_clerk_webhook_signing_secret

# URLs
WEBHOOK_BASE_URL=your_webhook_base_url
FRONTEND_URL=your_frontend_url
```

## Development

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Start production server
bun start
```

The server will be available at `http://localhost:8080`.

## API Endpoints

### Authentication

- `POST /api/webhook/clerk` - Clerk webhook handler

### Image Generation

- `POST /ai/training` - Train new AI model
- `POST /ai/generate` - Generate images
- `POST /pack/generate` - Generate images from pack
- `GET /image/bulk` - Get generated images

### Models

- `GET /models` - Get available models
- `GET /pre-signed-url` - Get S3 upload URL

## Project Structure

```
apps/backend/
├── routes/              # API route handlers
├── services/           # Business logic
├── models/             # AI model integrations
├── middleware/         # Express middleware
└── types/             # TypeScript types
```

## Key Components

- `index.ts` - Main application entry
- `middleware.ts` - Authentication middleware
- `models/FalAIModel.ts` - FalAI integration
- `routes/webhook.routes.ts` - Webhook handlers


## License

This project is licensed under the MIT License - see the LICENSE file for details.
