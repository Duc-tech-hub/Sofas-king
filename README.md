### 🛋️ Sofas King - Premium E-Commerce Solution

I developed Sofas king as a high-performance, full-stack e-commerce platform featuring a modular architecture of 70 files. This project focuses on leveraging Firebase for real-time synchronization and high-speed local persistence to deliver a seamless user experience.

---

### Project Demo
### Video:
> https://www.youtube.com/watch?v=b0VkqCjfRXE
### Link website:
> https://public-gamma-brown.vercel.app/
### Link dev.to post:
> https://dev.to/duc_minh_5efc9fed22cc63ea/how-i-built-a-secure-72-module-e-commerce-platform-with-firebase-at-age-14-3mbd
---

### AI-Powered Development (AI Collaboration)
I effectively leveraged Generative AI (Gemini) as a core part of my development workflow to build and refine this project:

* Code Generation: I worked with AI to write and structure complex JavaScript modules and Firebase integration logic.
* Smart Debugging: I used AI to identify, analyze, and fix critical bugs, especially regarding asynchronous data flows and race conditions.
* Logic Refactoring: AI helped me optimize Firestore queries and local storage synchronization for better performance.
* Security Auditing: AI assisted in drafting and testing the Firestore Security Rules to ensure data integrity.

### Social Good & Community Impact

* Supporting Local Artisans: I designed this platform to be lightweight and easy to deploy, specifically aiming to help local furniture makers who lack technical resources.
* Reducing Digital Barriers: By optimizing for high-speed performance and offline resilience, the app remains functional in areas with unstable internet.
* Promoting Transparent Commerce: Real-time tracking systems foster trust between sellers and buyers.
* Educational Open-Source: Structured to serve as a learning resource for full-stack development.

### Key Features

### Customer Experience
* Smart Shopping Cart: Optimized using firestore cloud.
* High-quality design: Fully responsive on all devices.
* Secure Transactional Flow: Multi-step checkout with Google Re-authentication.
* Order Tracking: Real-time updates via Firestore listeners.

### Administrative Control
* Live Dashboard: Real-time monitoring of orders, users, and comments.
* Access Management: Instant account locking to mitigate fraud.
* Business Logic Automation: Automated data migration process.

---

### Technologies Used

* Frontend: HTML5, CSS3, JavaScript.
* BaaS: Firebase (Auth, Firestore).
* Security: Firebase Security Rules.
* Storage: LocalStorage API.

---

### System Architecture & Data Flow

### 1. Client-Side Persistence
Zero lag by capturing interactions in LocalStorage first.

### 2. Event-Driven Real-time Sync
Admin actions reflect on Client UI instantly via Firestore listeners.

### 3. Instant History Logging
Transactions record immediately upon purchase for transparency.

graph TD
subgraph "Client Side"
A[User] -->|Add| B(LocalStorage)
B -->|Checkout| C{Auth}
C -->D[Firestore]
end

### 🧠 Technical Deep Dive

#### 1. Managing Complexity
I adopted an ES6 Module architecture to isolate functionality across 70 files.

#### 2. Balancing Real-time vs Efficiency
Hybrid fetching strategy: onSnapshot for order tracking, and standard fetch for admin tasks.

#### 3. Customer-Centric Data
Purchase records commit instantly to ensure transparency.

---

### Project Structure

* html: html files
* js: js files.
* css: Custom Bootstrap.
* img: nessescary image files.

---

### Security Standards & Firebase Rules

1. Data Isolated.
2. Role-Based Access.
3. Void State Protocol.

---

### 🌟 Community Recognition

* Sandeep Vashishtha (GitHub Star).
* Rhythm Pahwa (Fullstack Expert).

## Developed by duck.sssop0356@gmail.com
## I am a 14-year-old developer passionate about building secure web solutions.
