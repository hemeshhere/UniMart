# 🛒 UniMart
### *Campus-focused Delivery & Errand Marketplace*

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-black?style=for-the-badge&logo=react)](https://react.dev/)

**UniMart** is a peer-to-peer campus delivery system that bridges the gap between students who need errands completed and student "runners" looking to earn. The platform focuses on security, concurrency management, and a transparent order lifecycle.

---

## Key Features

* **End-to-End Lifecycle:** Full tracking from order creation to final delivery.
* **PIN-Based Verification:** Secure hand-off system requiring a unique PIN to complete orders.
* **Runner Dashboard:** Real-time task management and performance tracking (ratings/completed runs).
* **Concurrency Control:** Backend logic designed to prevent "race conditions" where multiple runners might try to accept the same order.
* **Secure Auth:** Implementation of JWT (JSON Web Tokens) for protected routes and user sessions.

---
## System Workflow

1. A user creates an order request.
2. The order becomes available for runners.
3. A runner accepts the order and the system locks it.
4. The runner picks up the item.
5. At delivery, the buyer provides the verification PIN.
6. The runner verifies the PIN to complete the order.
7. The order status updates and runner statistics are updated.

---

## Core Features

### Order Lifecycle Management
Orders move through a controlled lifecycle including creation, acceptance, pickup, and completion. Each stage ensures that both the buyer and runner have clear visibility of the order status.

### Secure Delivery Verification
Each order is associated with a verification PIN. The runner must confirm this PIN during delivery to successfully complete the order. This prevents false completion and ensures trust between users.

### Runner Task Management
Runners can view available tasks and accept errands. Once a runner accepts a task, the system locks the order to prevent multiple runners from claiming it simultaneously.

### Concurrency Protection
The system includes safeguards to ensure that only one runner can accept an order even if multiple requests occur at the same time.

### Dashboard Views
Different dashboards allow users to view relevant data:
- Buyers can see their order history and active requests.
- Runners can track their active mission and completed deliveries.

### Runner Performance Tracking
The system maintains statistics such as total completed runs and runner ratings to reflect reliability and activity.

---


## Technology Stack

- Node.js
- Express.js
- MongoDB
- JWT-based authentication

The backend follows a modular architecture separating routes, controllers, middleware, and database models.

---


## Security Considerations

- Authentication is handled using JSON Web Tokens.
- Sensitive information such as passwords is excluded from responses.
- Verification PINs are used to confirm successful deliveries.
- Race conditions during order acceptance are prevented through controlled database updates.

---

## Purpose

UniMart demonstrates how a real-world delivery system can be implemented using a backend architecture that handles authentication, task allocation, and secure verification workflows. The project focuses on building reliable backend logic for managing concurrent operations and maintaining consistent order states.

---

## License
Copyright (c) 2026 Hemesh Raj. All rights reserved.

This software and its original ideas are the exclusive property of Hemesh Raj. 
Unauthorized copying, modification, or distribution of this code, via any medium, 
is strictly prohibited. 

Permission is granted for personal, educational, and portfolio review purposes only. 
This code may not be used for commercial purposes or as part of a derivative work 
without explicit written permission from the owner.
