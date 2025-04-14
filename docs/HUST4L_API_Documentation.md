# 📘 HUST4L API Documentation

Welcome to the official API documentation for **HUST4L**.  
This API follows RESTful principles and provides a complete set of endpoints to manage authentication, users, content, SEO, services, and more.

## API Endpoints

### Categories
- `GET /category` - Get all categories with pagination
- `POST /category` - Create a new category
- `GET /category/:slug` - Get category by slug
- `PATCH /category/:id` - Update category
- `DELETE /category/:id` - Delete category

### Blogs
- `GET /blog` - Get all blogs with pagination and filters
- `POST /blog` - Create a new blog
- `GET /blog/:slug` - Get blog by slug
- `PATCH /blog/:id/status` - Update blog status
- `DELETE /blog/:id` - Delete blog

### Services
- `GET /service` - Get all services with pagination
- `POST /service` - Create a new service
- `GET /service/:slug` - Get service by slug
- `GET /service/:id` - Get service by ID
- `PATCH /service/:id` - Update service
- `DELETE /service/:id` - Delete service

### FAQs
- `GET /faq` - Get all FAQs with pagination
- `POST /faq` - Create a new FAQ
- `GET /faq/:id` - Get FAQ by ID
- `PATCH /faq/:id` - Update FAQ
- `DELETE /faq/:id` - Delete FAQ

### SEO
- `GET /seo` - Get all SEO entries
- `POST /seo` - Create a new SEO entry
- `GET /seo/:slug` - Get SEO by slug
- `PATCH /seo/:id` - Update SEO entry
- `DELETE /seo/:id` - Delete SEO entry

### Pricings
- `GET /pricing` - Get all pricing plans with pagination
- `POST /pricing` - Create a new pricing plan
- `GET /pricing/:slug` - Get pricing by slug
- `GET /pricing/:id` - Get pricing by ID
- `PATCH /pricing/:id` - Update pricing
- `DELETE /pricing/:id` - Delete pricing

### Contact
- `GET /contact` - Get all contacts with pagination
- `POST /contact` - Create a new contact
- `GET /contact/:id` - Get contact by ID
- `PATCH /contact/:id` - Update contact status
- `DELETE /contact/:id` - Delete contact

### User Management
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile
- `PATCH /auth/profile` - Update user profile
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - User logout

Each endpoint supports:
- Pagination where applicable
- Authentication & Authorization
- Redis caching
- Input validation
- Error handling

## 🩺 Health Check

| Method | Endpoint        | Description         |
| ------ | --------------- | ------------------- |
| GET    | `/health-check` | Check system status |

## ⚙️ Developer Notes

- JWT/cookie authentication required
- JSON responses
- Standard REST status codes

> ⚠️ All unauthorized access is logged. DevOps is watching. 😈

# HUST4L API Documentation

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Blog Category](#blog-category)
- [Blog](#blog)
- [Logs](#logs)
- [Service](#service)
- [Contact](#contact)
- [SEO](#seo)
- [FAQ](#faq)
- [Pricing](#pricing)
- [Health Check](#health-check)

## Authentication

### Endpoints

| **Method** | **Endpoint**       | **Description**                             | **Example Request**                                                                                                                                                          | **Example Response**                                                                            |
| ---------- | ------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| GET        | `/me`              | Get the currently authenticated user's info | Header: `api-key: {{token}}`, URL: `{{domain}}users/me`                                                                                                                      | Success (200): `{"status": "success", "message": "User retrieved successfully", "user": {...}}` |
| GET        | `/app-info`        | Get app-level metadata                      | Header: `api-key: {{api-key}}`, URL: `{{domain}}`                                                                                                                            | Success (200): `{"name": "HUST4L", "host": "localhost", "port": 8080}`                          |
| POST       | `/login`           | Log in a user and receive token/session     | Header: `api-key: {{token}}`, Body: `{"username": "adminhust4l", "password": "Hoang@2003"}`, URL: `{{domain}}public/auth/login`                                              | Success (200): `{"status": "success", "message": "Login successful", "userInfo": {...}}`        |
| POST       | `/update-password` | Change user password                        | Header: `api-key: {{token}}`, Body: `{"currentPassword": "Hoang2003", "newPassword": "Hoang@2003", "confirmPassword": "Hoang@2003"}`, URL: `{{domain}}users/update-password` | Success (200): `{"status": "success", "message": "Verification code sent to your email"}`       |
| POST       | `/verify-code`     | Verify OTP code (email, 2FA, etc.)          | Header: `api-key: {{token}}`, Body: `{"code": "45F8C2"}`, URL: `{{domain}}users/verify-code`                                                                                 | Success (200): `{"status": "success", "message": "Password updated successfully"}`              |
| POST       | `/logout`          | Log out the current session                 | Header: `api-key: {{token}}`, URL: `{{domain}}public/auth/logout`                                                                                                            | Success (200): `{"status": "success", "message": "Logout successful"}`                          |

## Users

### Endpoints

| **Method** | **Endpoint**         | **Description**                | **Example Request**                                                                                                  | **Example Response**                                                                            |
| ---------- | -------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| POST       | `/users/manager`     | Create a new manager           | Header: `api-key: {{token}}`, Body: `{"name": "valc", "username": "protam113", ...}`, URL: `{{domain}}users/manager` | Success (200): `{"status": "success", "message": "User retrieved successfully", "user": {...}}` |
| GET        | `/users`             | List all users (e.g., by role) | Header: `api-key: {{token}}`, URL: `{{domain}}users?role=manager`                                                    | Success (200): `{"result": [{...}], "pagination": {...}}`                                       |
| GET        | `/users/statistic`   | Get user statistics            | Header: `api-key: {{token}}`, URL: `{{domain}}users/statistic`                                                       | Success (200): `{"totalUsers": 6, "admin": 1, "manager": 5}`                                    |
| DELETE     | `/users/manager/:id` | Delete a manager by ID         | Header: `api-key: {{api-key}}`, URL: `{{domain}}users/manager/bb9e81be-020b-...`                                     | Success (200): `{"status": "success", "message": "Manager deleted successfully"}`               |

## Blog Category

### Endpoints

| **Method** | **Endpoint**      | **Description**             | **Example Request**                                                                          | **Example Response**                                                                            |
| ---------- | ----------------- | --------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| POST       | `/category`       | Create a blog category      | Header: `api-key: {{token}}`, Body: `{"name": "Marketing SEO"}`, URL: `{{domain}}category`   | Success (200): `{"status": "success", "result": {"_id": "...", "name": "test", "slug": "..."}}` |
| GET        | `/category`       | Get all blog categories     | Header: `api-key: {{token}}`, URL: `{{domain}}category`                                      | Success (200): `{"results": [{...}], "page_total": 1, "total": 1}`                              |
| GET        | `/category/:slug` | Get a blog category by slug | Header: `api-key: {{token}}`, URL: `{{domain}}category/agency-marketivcl-...`                | Success (200): `{"status": "success", "result": {...}}`                                         |
| DELETE     | `/category/:id`   | Delete a blog category      | Header: `api-key: {{api-key}}`, URL: `{{domain}}category/1e84b44e-0b62-...`                  | Success (200): `{"message": "BLogCategory deleted successfully"}`                               |
| PATCH      | `/category/:id`   | Update a blog category      | Header: `api-key: {{api-key}}`, Body: `{"name": "Agency vá"}`, URL: `{{domain}}category/:id` | Success (200): `{"_id": "...", "name": "Agency vá", "slug": "..."}`                             |

## Blog

### Endpoints

| **Method** | **Endpoint**  | **Description**         | **Example Request**                                                                          | **Example Response**                                                          |
| ---------- | ------------- | ----------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| POST       | `/blog`       | Create a blog post      | Header: `api-key: {{api-key}}`, Body: `{"title": "tesst 1w2 1", ...}`, URL: `{{domain}}blog` | Success (200): `{"title": "test 1", "slug": "...", "content": "normal", ...}` |
| GET        | `/blog`       | Get all blog posts      | Header: `api-key: {{api-key}}`, URL: `{{domain}}blog?status=hide`                            | Success (200): `{"results": [{...}], "pagination": {...}}`                    |
| GET        | `/blog/:slug` | Get a blog post by slug | Header: `api-key: {{api-key}}`, URL: `{{domain}}blog/tesst-xoas-1-...`                       | Success (200): `{"status": "success", "result": {...}}`                       |
| DELETE     | `/blog/:id`   | Delete a blog post      | No header, URL: `{{domain}}blog/:id`                                                         | Success (200): `{"message": "Blog deleted successfully"}`                     |
| PATCH      | `/blog/:id`   | Update a blog post      | Header: `api-key: {{api-key}}`, Body: `{"name": "test 2 update"}`, URL: `{{domain}}blog/:id` | Success (200): Updated blog details                                           |

## Logs

### Endpoints

| **Method** | **Endpoint**                  | **Description**                 | **Example Request**                                                       | **Example Response**                                               |
| ---------- | ----------------------------- | ------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| GET        | `/logs`                       | Get system or user action logs  | Header: `api-key: {{token}}`, URL: `{{domain}}logs?type=CATEGORY_UPDATED` | Success (200): `{"results": [{...}], "page_total": 2, "total": 2}` |
| GET        | `/logs/latest-user-statistic` | Get latest user statistics logs | Header: `api-key: {{token}}`, URL: `{{domain}}logs/latest-user-statistic` | Success (200): Similar to `/logs` response structure               |

## Service

### Endpoints

| **Method** | **Endpoint** | **Description**  | **Example Request**                                                                              | **Example Response**                                                                |
| ---------- | ------------ | ---------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| POST       | `/service`   | Create a service | Header: `api-key: {{api-key}}`, Body: `{"title": "tesst xoas 1", ...}`, URL: `{{domain}}service` | Success (200): `{"title": "tesst xoas 1", "slug": "...", "content": "normal", ...}` |
| GET        | `/service`   | Get all services | Header: `api-key: {{api-key}}`, URL: `{{domain}}service?status=hide`                             | Success (200): `{"result": [{...}], "pagination": {...}}`                           |

## Contact

### Endpoints

| **Method** | **Endpoint**   | **Description**                  | **Example Request**                                                                                    | **Example Response**                                                        |
| ---------- | -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| POST       | `/contact`     | Create a contact form submission | Header: `api-key: {{token}}`, Body: `{"name": "Hoang", "email": "...", ...}`, URL: `{{domain}}contact` | Success (200): `{"message": "Contact created successfully", "data": {...}}` |
| GET        | `/contact`     | Get all contact submissions      | Header: `api-key: {{api-key}}`, URL: `{{domain}}contact?status=approved`                               | Success (200): `{"results": [{...}], "pagination": {...}}`                  |
| DELETE     | `/contact/:id` | Delete a contact submission      | Header: `api-key: {{api-key}}`, URL: `{{domain}}contact/fcd8d1dd-0eb3-...`                             | Success (200): `{"message": "Contact deleted successfully"}`                |
| PATCH      | `/contact/:id` | Update contact status            | Header: `api-key: {{api-key}}`, Body: `{"status": "approved"}`, URL: `{{domain}}contact/:id`           | Success (200): Updated contact details                                      |

## SEO

### Endpoints

| **Method** | **Endpoint** | **Description**     | **Example Request**                                                                                    | **Example Response**                                                                      |
| ---------- | ------------ | ------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| GET        | `/seo`       | Get SEO metadata    | Header: `api-key: {{api-key}}`, URL: `{{domain}}seo`                                                   | Success (200): `{"_id": "...", "site_title": "Hust4L®", "site_description": "...", ...}` |
| PATCH      | `/seo`       | Update SEO metadata | Header: `api-key: {{api-key}}`, Body: `{"keywords": ["digital marketing", ...]}`, URL: `{{domain}}seo` | Success (200): Updated SEO details                                                        |

## FAQ

### Endpoints

| **Method** | **Endpoint** | **Description** | **Example Request**                                                                                             | **Example Response**                                                      |
| ---------- | ------------ | --------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| POST       | `/faqs`      | Create a FAQ    | Header: `api-key: {{token}}`, Body: `{"question": "toi sao ?", "answer": "toi la lenf"}`, URL: `{{domain}}faqs` | Success (200): `{"question": "...", "answer": "...", "user": {...}, ...}` |
| GET        | `/faqs`      | Get all FAQs    | Header: `api-key: {{api-key}}`, URL: `{{domain}}faqs?status=hide`                                               | Success (200): `{"result": [{...}], "pagination": {...}}`                 |

## Pricing

### Endpoints

| **Method** | **Endpoint** | **Description**       | **Example Request**                                                                                           | **Example Response**                                                                 |
| ---------- | ------------ | --------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| POST       | `/pricing`   | Create a pricing plan | Header: `api-key: {{api-key}}`, Body: `{"title": "ád2", "description": "...", ...}`, URL: `{{domain}}pricing` | Success (200): `{"title": "Premium Plan", "slug": "...", "description": "...", ...}` |
| GET        | `/pricing`   | Get all pricing plans | Header: `api-key: {{api-key}}`, URL: `{{domain}}pricing?status=show`                                          | Success (200): `{"results": [{...}], "pagination": {...}}`                           |

## Health Check

### Endpoints

| **Method** | **Endpoint**    | **Description**     | **Example Request**          | **Example Response**                                                                         |
| ---------- | --------------- | ------------------- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| GET        | `/health-check` | Check system status | No specific example provided | No specific example provided, but typically returns server status (e.g., 200 if operational) |

### Notes:

- All endpoints requiring authentication use a `api-key` header with a JWT or session token.
- Responses are in JSON format, with standard HTTP status codes (e.g., 200 for success, 401 for unauthorized, 404 for not found).
- Some endpoints include query parameters (e.g., `status`, `role`) for filtering or pagination.
- Examples show both successful and error responses (e.g., unauthorized, rate limit exceeded, not found).
- The documentation emphasizes security, with warnings about logging unauthorized attempts and requiring admin/superuser roles for certain operations.
