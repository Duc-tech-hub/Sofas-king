# 🛋️ Sofas King - Premium E-Commerce Solution

Sofas King is a high-performance, full-stack e-commerce platform built with a modular architecture. The project focuses on maximizing processing speed through Groq AI, securing the ecosystem with Vercel Middleware, and elevating the visual experience with 3D UI components.

## 🔗 Project Links
* *Website:* https://public-gamma-brown.vercel.app/
* *Demo Video:* https://youtu.be/KDoMIuZI0E4
* *Technical Post:* Dev.to Article

## 🚀 Technical Upgrades

### 1. AI Integration & Content Moderation
* *Groq AI Engine:* Integrated Groq AI to handle natural language processing with high-speed execution and higher rate limits, ensuring near-instant responses.
* *Automated Moderation:* Leverages Groq AI to scan and moderate comment content automatically before it reaches the backend, maintaining a healthy community environment.

### 2. Backend & Middleware Security
* *Vercel Edge Middleware:* Implemented a middleware layer running on Vercel’s Edge Network to intercept and validate requests before they hit the backend.
* *Security Layer:* Secured critical operations such as username changes and comment posting via server-side verification.
* *Custom API Rate Limiting:* Built a robust rate-limiting system for comments, profile updates, and AI requests to prevent spam and DDoS attacks.

### 3. Advanced UI/UX
* *3D Design Integration:* Upgraded the user interface with 3D design elements, providing a modern, immersive, and tactile feel for furniture products.
* *Responsive Architecture:* Optimized 3D assets to ensure smooth performance across all devices and screen sizes.

## ✨ Core Features

### Customer Experience
* *Smart Shopping Cart:* Optimized data synchronization using Firestore Cloud.
* *Secure Transactional Flow:* Multi-step checkout process featuring Google Re-authentication.
* *Real-time Tracking:* Instant order status updates powered by Firestore listeners.

### Administrative Control
* *Live Dashboard:* Real-time monitoring of orders, user activity, and community comments.
* *Access Management:* Instant account locking capabilities to mitigate fraudulent behavior.

## 🛠️ Technologies Used
* *Frontend:* HTML5, CSS3, JavaScript (ES6+), 3D Design components.
* *Backend & Middleware:* Vercel Serverless Functions, Edge Middleware.
* *AI:* Groq AI Cloud API.
* *BaaS:* Firebase (Authentication, Firestore).
* *Security:* API Rate Limiter, Firebase Security Rules.

## 📐 System Architecture & Data Flow

*Client Request:* User interacts with the 3D interface.

*Middleware Validation:* Vercel Middleware checks permissions and Rate Limits.

*AI Processing:* Groq AI validates content integrity (for comments/usernames).

*Database Sync:* The backend confirms the request and commits data to Firestore.

### Flow Logic:
User Interface (3D) --> Vercel Middleware (Rate Limits) --> Groq AI (Moderation) --> Backend/Firestore

## 📁 Project Structure
* `html/`: Static page structures.
* `js/`: Modular logic system (70+ files) integrating Groq APIs and Middleware.
* `css/`: Custom Bootstrap styling and 3D component CSS.
* `img/`: Image assets and 3D model resources.

---
*Developed by:* [duck.sssop0356@gmail.com]
*I am a 14-year-old developer passionate about building secure and high-performance web solutions.*
