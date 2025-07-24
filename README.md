# 🌟 Tradoxus Backend

Backend services powering the Tradoxus Trading Learning Platform - an interactive educational platform designed to empower learners with comprehensive knowledge and practical skills in crypto trading.

## 🎯 Overview

This repository contains the backend services that handle the core functionality of the Tradoxus platform, including:

- User management and authentication
- Performance analytics
- Blockchain integration with Stellar
- **Trading operations and market data**
- API services for frontend application

## 🛠 Technical Stack

- **Language:** Node.js/TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma
- **Blockchain Integration:** Stellar SDK
- **Authentication:** JWT, OAuth2
- **Testing:** Jest, Supertest
- **Documentation:** Swagger/OpenAPI
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions

## 🚀 Getting Started

### Prerequisites

- Docker
- Docker Compose
- Node.js (for local development)

### Environment Setup

The application requires the following environment variables:

- `NODE_ENV`: Environment (development/production)
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_USERNAME`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_NAME`: PostgreSQL database name
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `TRADING_EXCHANGE_API_KEY`: Exchange API key for trading operations
- `TRADING_EXCHANGE_SECRET`: Exchange API secret
- `TRADING_EXCHANGE_SANDBOX`: Enable sandbox mode (true/false)
- `TRADING_DEFAULT_SYMBOLS`: Default trading symbols (comma-separated)
- `TRADING_ORDER_TIMEOUT`: Order timeout in milliseconds

These are already configured in the `docker-compose.yml` file.

## Running with Docker Compose

1. Clone the repository:

```bash
git clone https://github.com/tradoxus/tradoxus-backend.git

```

2. Build and start the containers:

```bash
docker compose up --build
```

This will start four services:

- Backend API (port 4001)
- PostgreSQL database (port 5434)
- Redis cache (port 6381)
- pgAdmin (port 5050)

3. To run in detached mode:

```bash
docker compose up -d
```

4. To stop the services:

```bash
docker compose down
```

## Service Ports

- Backend API: `http://localhost:4001`
- PostgreSQL: `localhost:5434`
- Redis: `localhost:6381`
- pgAdmin: `http://localhost:5050`

### Accessing pgAdmin

- Default login credentials:
  - Email: `admin@admin.com`
  - Password: `admin`
- To connect to the PostgreSQL database:
  1. Add a new server in pgAdmin
  2. Use the following connection details:
     - Host: `postgres`
     - Port: `5432`
     - Database: `tradoxus`
     - Username: `postgres`
     - Password: `postgres`

## Data Persistence

The application uses Docker volumes to persist data:

- PostgreSQL data is stored in the `postgres-data` volume
- Redis data is stored in the `redis-data` volume

## Development

For local development without Docker:

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

## Building the Docker Image

To build the Docker image manually:

```bash
docker build -t traduxus-backend .
```

## Troubleshooting

1. If you encounter port conflicts, modify the port mappings in `docker-compose.yml`
2. To view logs:

```bash
docker compose logs -f
```

3. To reset the database:

```bash
docker compose down -v
docker compose up --build
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

### Trading Operations

- Order management (buy/sell orders)
- Real-time market data and ticker information
- Order book data for trading pairs
- User order history and status tracking
- Mock trading environment for learning
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

## 🔌 Trading API Endpoints

The following trading endpoints have been added to support trading operations:

### Orders

#### Create Order
```http
POST /trading/orders
Content-Type: application/json

{
  "symbol": "BTC/USD",
  "type": "buy",
  "amount": 0.1,
  "price": 45000,
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order_1234567890_abc123def",
    "symbol": "BTC/USD",
    "type": "buy",
    "amount": 0.1,
    "price": 45000,
    "status": "pending",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get User Orders
```http
GET /trading/orders/user/:userId?status=pending&symbol=BTC/USD&limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "order_1",
      "symbol": "BTC/USD",
      "type": "buy",
      "amount": 0.1,
      "price": 45000,
      "status": "filled",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "filledAmount": 0.1,
      "filledPrice": 44950
    }
  ]
}
```

### Market Data

#### Get Market Ticker
```http
GET /trading/market/ticker
```

**Response:**
```json
{
  "success": true,
  "message": "Market data retrieved successfully",
  "data": [
    {
      "symbol": "BTC/USD",
      "price": 45250.50,
      "change24h": 1250.30,
      "changePercent24h": 2.84,
      "volume24h": 1234567890,
      "high24h": 46000,
      "low24h": 43800,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Order Book
```http
GET /trading/market/orderbook/:symbol?depth=20
```

**Response:**
```json
{
  "success": true,
  "message": "Orderbook retrieved successfully",
  "data": {
    "symbol": "BTC/USD",
    "bids": [
      {
        "price": 45000,
        "amount": 2.5,
        "total": 2.5
      }
    ],
    "asks": [
      {
        "price": 45010,
        "amount": 1.8,
        "total": 1.8
      }
    ],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Testing the Trading API

To test the trading endpoints locally:

1. Start the application:
```bash
docker-compose up
```

2. Test the endpoints using curl or Postman:
```bash
# Get market ticker
curl http://localhost:4001/trading/market/ticker

# Get order book for BTC/USD
curl http://localhost:4001/trading/market/orderbook/BTC/USD

# Create a new order
curl -X POST http://localhost:4001/trading/orders \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USD",
    "type": "buy",
    "amount": 0.1,
    "price": 45000,
    "userId": "123e4567-e89b-12d3-a456-426614174000"
  }'

# Get user orders
curl http://localhost:4001/trading/orders/user/123e4567-e89b-12d3-a456-426614174000
```

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
