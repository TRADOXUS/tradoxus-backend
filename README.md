# 🌟 Tradoxus Backend

Backend services powering the Tradoxus Trading Learning Platform - an interactive educational platform designed to empower learners with comprehensive knowledge and practical skills in crypto trading.

## 🎯 Overview

This repository contains the backend services that handle the core functionality of the Tradoxus platform, including:
- User management and authentication
- Performance analytics
- Blockchain integration with Stellar
- API services for frontend applications

## 🛠 Technical Stack

- **Language:** Node.js/TypeScript
- **Framework:** Express.js/NestJS
- **Database:** PostgreSQL with Prisma 
- **Blockchain Integration:** Stellar SDK
- **Authentication:** JWT, OAuth2
- **Testing:** Jest, Supertest
- **Documentation:** Swagger/OpenAPI
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- Docker and Docker Compose (optional)
- Stellar account (for blockchain integration)

### Installation

1. Clone the repository
```bash
git clone https://github.com/tradoxus/tradoxus-backend.git
cd tradoxus-backend
```

2. Install dependencies
```bash
npm install
```

3. Configure your environment
```bash
cp .env.example .env
# Edit .env with your database and Stellar network details
```

4. Run database migrations
```bash
npm run migration:run
```

5. Start the development server
```bash
npm run start:dev
```

### Docker Setup

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

## 📚 Project Structure

```
src/
├── config/                 # Configuration files and environment setup
├── controllers/            # API route controllers
├── dtos/                   # Data Transfer Objects
├── entities/               # Database entities/models
├── exceptions/             # Custom exception handlers
├── interfaces/             # TypeScript interfaces
├── middlewares/            # Express/NestJS middlewares
├── migrations/             # Database migrations
├── modules/                # Feature modules
│   ├── auth/               # Authentication and authorization
│   ├── users/              # User management
│   ├── trading/            # Trading simulation logic
│   ├── performance/        # Performance tracking and analytics
│   ├── blockchain/         # Stellar blockchain integration
│   └── rewards/            # NFT and points system
├── repositories/           # Data access layer
├── services/               # Business logic layer
├── utils/                  # Utility functions
├── validators/             # Input validation
├── app.module.ts           # Main application module
├── app.controller.ts       # Main application controller
├── app.service.ts          # Main application service
└── main.ts                 # Application entry point
```

## 🧩 Core Features

### User Management
- Registration and authentication
- Profile management and progress tracking
- Role-based access control
- Social login integration

### Trading Simulation Engine
- Real-time market data integration
- Paper trading with realistic market conditions
- Position management (open, close, modify)
- Risk management tools and calculators
- Custom scenarios for educational purposes

### Performance Analytics
- Real-time performance metrics
- Historical performance data
- Advanced analytics and insights
- Leaderboards and social comparison
- Learning progress tracking

### Blockchain Integration
- Stellar account integration
- Transaction processing
- Smart contract interaction
- NFT minting for achievements
- Token-based reward system

### API Services
- RESTful API with OpenAPI documentation
- WebSocket support for real-time updates
- Rate limiting and security measures
- Comprehensive error handling

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Check test coverage
npm run test:cov
```

## 📈 API Documentation

API documentation is available at `/api/docs` when running the development server. This provides interactive Swagger documentation for all endpoints.

## 🔐 Security Features

- JWT-based authentication
- Rate limiting
- CORS protection
- Input validation
- SQL injection protection
- XSS protection
- CSRF protection
- Helmet security headers

## 🚀 Deployment

### Staging Environment
```bash
npm run deploy:staging
```


### CI/CD Pipeline

The repository includes GitHub Actions workflows for:
- Linting and testing on pull requests
- Automatic deployment to staging when merging to develop
- Manual approval and deployment to production when merging to main

## 📊 Monitoring and Logging

- Integrated Winston logger
- Prometheus metrics
- Health check endpoints
- Error tracking integration

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Submit a pull request
5. Wait for CI checks and code review

### Code Style
We follow the Airbnb JavaScript Style Guide. Run linting before submitting:
```bash
npm run lint
```

## 📞 Contact


---

Built with ❤️ by the Tradoxus Team
