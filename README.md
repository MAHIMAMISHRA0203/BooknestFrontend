# 📚 BookNest — Full Stack E-Commerce Bookstore Platform

> **Discover. Read. Belong.**  
> A complete microservices-based bookstore built with Spring Boot + Angular 17.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular Frontend (4200)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP via Nginx proxy
┌──────────────────────────▼──────────────────────────────────┐
│                  API Gateway (8080)                          │
│            Spring Cloud Gateway + JWT Filter                  │
└──────┬──────────┬────────┬──────┬──────┬──────┬─────────────┘
       │          │        │      │      │      │
   auth(8081) book(8082) cart(8083) order(8084) wallet(8085)
                              review(8086) notif(8087) wish(8088)
                                   │
                          Eureka Server (8761)
                                   │
                           MySQL (3306)
```

---

## 🚀 Quick Start — Local Development

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0
- Maven 3.9+

### Step 1 — Start Eureka Server
```bash
cd eureka-server
mvn spring-boot:run
# Open http://localhost:8761
```

### Step 2 — Start API Gateway
```bash
cd api-gateway
mvn spring-boot:run
```

### Step 3 — Start Microservices (any order)
```bash
# Open separate terminals for each:
cd auth-service         && mvn spring-boot:run
cd book-service         && mvn spring-boot:run
cd cart-service         && mvn spring-boot:run
cd order-service        && mvn spring-boot:run
cd wallet-service       && mvn spring-boot:run
cd review-service       && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
cd wishlist-service     && mvn spring-boot:run
```

### Step 4 — Start Angular Frontend
```bash
cd booknest-frontend
npm install
npm start
# Open http://localhost:4200
```

---

## 🐳 Docker Deployment (Full Stack)

```bash
# From project root (where docker-compose.yml lives)
docker-compose up --build

# Wait ~2 minutes for all services to start, then open:
# Frontend  → http://localhost:4200
# Gateway   → http://localhost:8080
# Eureka    → http://localhost:8761
```

### Stop everything
```bash
docker-compose down
docker-compose down -v   # also removes MySQL data
```

---

## 📡 Service Ports

| Service              | Port | Swagger UI                              |
|----------------------|------|-----------------------------------------|
| Eureka Server        | 8761 | http://localhost:8761                   |
| API Gateway          | 8080 | —                                       |
| Auth Service         | 8081 | http://localhost:8081/swagger-ui.html   |
| Book Service         | 8082 | http://localhost:8082/swagger-ui.html   |
| Cart Service         | 8083 | http://localhost:8083/swagger-ui.html   |
| Order Service        | 8084 | http://localhost:8084/swagger-ui.html   |
| Wallet Service       | 8085 | http://localhost:8085/swagger-ui.html   |
| Review Service       | 8086 | http://localhost:8086/swagger-ui.html   |
| Notification Service | 8087 | http://localhost:8087/swagger-ui.html   |
| Wishlist Service     | 8088 | http://localhost:8088/swagger-ui.html   |
| Angular Frontend     | 4200 | http://localhost:4200                   |

---

## 🔑 API Testing (via Gateway)

### Register
```http
POST http://localhost:8080/api/v1/auth/register
Content-Type: application/json

{
  "fullName": "Test User",
  "email": "test@booknest.com",
  "password": "password123",
  "mobile": "9999999999"
}
```

### Login
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@booknest.com",
  "password": "password123"
}
```

### Add a Book (Admin)
```http
POST http://localhost:8080/api/v1/books
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "genre": "Technology",
  "isbn": "978-0132350884",
  "price": 499,
  "stock": 50,
  "description": "A handbook of agile software craftsmanship"
}
```

---

## 🗄️ MySQL Databases

Each service has its own database (auto-created on first run):

| Database                  | Service              |
|---------------------------|----------------------|
| booknest_auth             | auth-service         |
| booknest_books            | book-service         |
| booknest_cart             | cart-service         |
| booknest_orders           | order-service        |
| booknest_wallet           | wallet-service       |
| booknest_reviews          | review-service       |
| booknest_notifications    | notification-service |
| booknest_wishlist         | wishlist-service     |

---

## ⚙️ Configuration

### application.yml — important settings

**All services** need:
```yaml
spring:
  application:
    name: <service-name>   # must match lb://service-name in gateway
  datasource:
    password: root         # change to your MySQL password
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

**JWT Secret** — must be identical in `auth-service` and `api-gateway`:
```yaml
jwt:
  secret: booknest-super-secret-key-minimum-256-bits-long-for-hs256-algorithm
```

---

## 👥 Default Roles

| Role     | Capabilities                                      |
|----------|---------------------------------------------------|
| CUSTOMER | Browse, cart, orders, wallet, reviews, wishlist   |
| ADMIN    | All customer rights + manage books/orders/users   |

To create an admin, register normally then update the `role` column in `booknest_auth.users` to `ADMIN`.

---

## 🛠️ Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Frontend       | Angular 17, TypeScript, SCSS            |
| Backend        | Spring Boot 3.3.6, Spring Cloud 2023.0.3|
| Service Discovery | Netflix Eureka                       |
| API Gateway    | Spring Cloud Gateway                    |
| Auth           | JWT (jjwt 0.11.5), Spring Security      |
| Database       | MySQL 8.0, Spring Data JPA              |
| Documentation  | SpringDoc OpenAPI 3 (Swagger UI)        |
| Containerization | Docker, Docker Compose               |
| Build          | Maven 3.9, Node.js / npm                |
