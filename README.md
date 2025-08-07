# Callify - Backend Repository

This is the backend repository for Callify, an AI-powered phone automation platform. This project uses Firebase Cloud Functions, Firestore, and integrates with OpenAI and Bland.ai APIs.

## Project Structure

```
callify-backend/
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── functions/           # Firebase Cloud Functions
│   ├── src/             # Source code
│   │   ├── api/         # API routes
│   │   │   ├── call.ts           # Call API endpoints
│   │   │   ├── contact.ts        # Contact form endpoints
│   │   │   └── websiteAnalysis.ts # Website analysis endpoints
│   │   ├── services/    # Service modules
│   │   │   ├── blandService.ts    # Bland.ai integration
│   │   │   ├── emailService.ts    # Email sending service
│   │   │   ├── openaiService.ts   # OpenAI integration
│   │   │   └── scheduledTasks.ts  # Scheduled cleanup tasks
│   │   ├── utils/       # Utility functions
│   │   │   └── rateLimit.ts       # Rate limiting middleware
│   │   └── index.ts     # Main entry point
│   ├── package.json     # Node.js dependencies
│   └── tsconfig.json    # TypeScript configuration
└── package.json         # Root package.json
```

## Features

- **Website Analysis**: Analyzes company websites using OpenAI to generate call prompts
- **Call Automation**: Integrates with Bland.ai to make automated phone calls
- **Rate Limiting**: Limits users to 3 calls per day to prevent abuse
- **Contact Form**: Processes contact form submissions and sends email notifications
- **Scheduled Tasks**: Automatically cleans up old data to maintain database efficiency

## API Endpoints

### Website Analysis
- `POST /website-analysis`: Analyzes a website URL and generates a call prompt

### Call Management
- `POST /call`: Initiates a call using Bland.ai API
- `GET /call/:callId`: Gets the status of a call

### Contact Form
- `POST /contact`: Handles contact form submissions

## Environment Variables

The following environment variables need to be set:

```
OPENAI_API_KEY=your_openai_api_key
BLAND_API_KEY=your_bland_api_key
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=Callify <noreply@callify.example.com>
```

## Deployment

This backend is designed to be deployed to Fly.io as a separate service from the frontend.

## Integration with Frontend

The frontend repository is available at: https://github.com/RobertVelaIII/Front-end-Voice-Automation-.git

The frontend communicates with this backend via API calls to enable the complete Callify workflow:
1. User enters company website → Backend analyzes site with OpenAI
2. User enters name and phone → Backend initiates call with Bland.ai
