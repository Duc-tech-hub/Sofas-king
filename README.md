 # 🛋️ Sofa King - Premium E-Commerce Solution

I developed Sofa Luxe as a high-performance, full-stack e-commerce platform featuring a modular architecture of **70 files**. This project focuses on leveraging Firebase for real-time synchronization and high-speed local persistence to deliver a seamless user experience.

---

 ## Project Demo
### Video:
> **https://youtu.be/2ij2Bb9h8tY**
### Link website:
> **https://sofas-king.web.app**
---
## AI-Powered Development (AI Collaboration) I effectively leveraged Generative AI (Gemini) as a core part of my development workflow to build and refine this project:

* **Code Generation:** I worked with AI to write and structure complex JavaScript modules and Firebase integration logic.

* **Smart Debugging:** I used AI to identify, analyze, and fix critical bugs, especially regarding asynchronous data flows and race conditions.

* **Logic Refactoring:** AI helped me optimize Firestore queries and local storage synchronization for better performance.

* **Security Auditing:** AI assisted in drafting and testing the Firestore Security Rules to ensure data integrity.
  
## Social Good & Community Impact

Behind the code of Sofa King is a vision to empower small businesses and promote sustainable commerce practices:

* **Supporting Local Artisans:** I designed this platform to be lightweight and easy to deploy, specifically aiming to help local furniture makers who lack the technical resources to transition from traditional markets to a professional digital storefront.

* **Reducing Digital Barriers:** By optimizing the platform for high-speed performance and offline resilience (via LocalStorage), the application remains functional even for users in areas with unstable internet connections, ensuring equal access to digital services.

* **Promoting Transparent Commerce:** The real-time feedback and order tracking systems are built to foster trust between sellers and buyers, reducing fraud and creating a safer online environment for the local community.

* **Educational Open-Source:** I have structured this project with a modular architecture and detailed documentation to serve as a learning resource for other young students interested in full-stack development with Firebase.

 ## Key Features
    
 ### Customer Experience
* **Smart Shopping Cart:** I optimized the cart using **LocalStorage** for sub-millisecond persistence and offline resilience.
* **High-quality design:** All web pages of this website is designed to responsive, user can use it on all devices.
* **Secure Transactional Flow:** I integrated a multi-step checkout with **Google Re-authentication** to ensure high-level security.
* **Order Tracking:** Customers receive real-time updates on shipping status via Firestore listeners.

 ### Administrative Control
* **Live Dashboard:** I built a management interface powered by Firestore `onSnapshot` for real-time monitoring of orders, users, and comments.
* **Access Management:** I designed an instant account locking mechanism to mitigate fraudulent activities.
* **Business Logic Automation:** I automated the data migration process from pending requests to official order records.

---

 ## Technologies Used

* **Frontend:** HTML5, CSS3 (Bootstrap 5), JavaScript (ES6 Modules).
* **Backend as a Service (BaaS):** Firebase.
* **Authentication:** Firebase Auth (Identity management & Google Auth).
* **Database:** Cloud Firestore (Real-time NoSQL).
* **Security:** Firebase Security Rules (Server-side validation).
* **Storage:** LocalStorage API for client-side state management.

---

 ## System Architecture & Data Flow

I designed the system using a **Modular Data Architecture** to minimize server overhead:



 ### 1. Client-Side Persistence (Cart Logic)
I ensure zero lag by capturing user interactions in **LocalStorage** first. This maintains session persistence even if the browser is closed before checkout.

 ### 2. Event-Driven Real-time Sync
By utilizing Firestore's listener capabilities, I made sure that any administrative action is reflected on the Customer’s UI instantly without requiring a page reload.

 ### 3. Instant History Logging
Unlike traditional systems, my platform records transactions into the User's History immediately upon purchase. This ensures customers have an instant record of their transaction, while the Administrative Dashboard handles the backend status updates (Packing/Delivered) in real-time.
graph TD
    subgraph "Client Side (Frontend)"
        A[User/Customer] -->|Add to Cart| B(LocalStorage)
        B -->|Checkout| C{Firebase Auth}
        C -->|Authenticated| D[Firestore SDK]
    end

    subgraph "Security Layer"
        D -->|Request Data| E{Firestore Security Rules}
        E -->|Check isAdmin| F[Whitelisted Emails]
        E -->|Check Owner| G[Resource Data]
    end

    subgraph "Backend (Firebase)"
        E -->|Allow| H[(Cloud Firestore)]
        H -->|onSnapshot| A
    end

    subgraph "Admin Side"
        I[Admin Panel] -->|Manage Orders| H
        I -->|Block User| H
        I -->|Delete Comments| H
    end

### 🧠 Technical Deep Dive: The Engineering Behind Sofa King
Building a production-ready platform as a solo developer required more than just coding; it required architectural foresight. Here is how I solved the core engineering challenges:

#### 1. Managing Complexity in a 70-File Modular System
Moving away from a monolithic structure, I adopted an ES6 Module-based architecture. Each functionality (Auth, Cart, Admin, Security) is isolated into its own module. * The Challenge: Ensuring customers receive instant updates on their order fulfillment status (e.g., "Pending" to "Delivered") across 25+ distinct HTML pages without requiring manual browser refreshes (F5). * I implemented an Event-Driven Real-time Synchronization pattern using Firestore onSnapshot as the single source of truth. By bypassing traditional polling, the system "pushes" status changes from the Admin Dashboard directly to the Client UI in real-time. I integrated this with LocalStorage to persist the active Order ID, ensuring that even if a user closes their browser, the live tracking session resumes immediately upon re-entry.

#### 2. Balancing Real-time Sync vs. Resource Efficiency
While Firestore offers onSnapshot, using it everywhere is expensive and can lead to performance bottlenecks. * The Strategy: I used a Hybrid Data Fetching approach. Critical business flows like Order Tracking utilize real-time listeners for instant feedback. For administrative actions (like Account Locking or Comment Deletion), I chose a Standard Fetch-and-Refresh flow to ensure data integrity and reduce long-lived connection overhead.

#### 3. Customer-Centric Data Persistence
I implemented a logic where the purchase record is committed to the database the moment a transaction occurs. My reasoning is that a purchase is a finalized action from the user's perspective; therefore, it should be reflected in their "Buying History" immediately, regardless of the delivery status. The Admin Panel then acts as a secondary layer to verify and update these existing records, ensuring transparency and trust between the buyer and the seller.
###### 📖 Read the full technical breakdown and architecture deep-dive on https://dev.to/duc_minh_5efc9fed22cc63ea/how-i-built-a-secure-72-module-e-commerce-platform-with-firebasej-at-age-14-3mbd
---

 ## Project Structure

* **html**: 25 functional pages covering storefront, user profiles, and management.
* **js**:
    * **Security.js**: The central gatekeeper I built for session validation.
    * **Adminpanel-part1-4.js**: Modularized administration logic for easier maintenance.
    * **cart.js & pay.js**: My core transaction and total calculation engine.
    * **Other functions***: There are 10 file javascript more linked with html to increase more functions, increase user experience.
* **css**: Customized Bootstrap components for a premium aesthetic.
---

 ## Security Standards & Firebase Rules

I implemented strict server-side validation via **Firebase Security Rules** to ensure:
1.  **Data Isolation:** Users can only access their own order history.
2.  **Role-Based Access (RBAC):** Access to management paths is strictly restricted to my whitelisted administrator emails.
3.  **Integrity:** I blocked direct database manipulation from the client for sensitive data fields.
4. **The White-Out Protocol**: The entire UI is rendered in a "Void State" (100% opacity/blur) at the CSS level before any logic executes.

 ## My firestore example rules
 ```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && 
        request.auth.token.email in [
          'duck.sssop0356@gmail.com', 
          'sangntp.stommy@mindx.net.vn', 
          'wormholevn@gmail.com'
        ];
    }
    function isNotDisabled() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.is_disabled != true;
    }
    match /all_orders/{orderId} {
      allow read: if request.auth != null && (isAdmin() || (request.auth.token.email == resource.data.customerEmail && isNotDisabled()));
      allow create: if isNotDisabled(); 
      allow update, delete: if isAdmin();
    }

    match /users/{userId} {
      allow read, write: if isAdmin();
      allow get: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null; 
    }

    match /comments/{commentId} {
      allow read: if isNotDisabled(); 
      allow create: if isNotDisabled();
      allow delete: if isAdmin();
    }

    match /history/{email} {
      allow read, write: if isAdmin();
      match /{allSubcollections=**} {
        allow read: if request.auth != null && (isAdmin() || (request.auth.token.email == email && isNotDisabled()));
        allow write: if isAdmin();
      }
    }
    
    match /{path=**}/admin_verify/{statusDoc} { allow read: if isAdmin(); }
    match /{path=**}/pending_orders/{orderDoc} { allow read: if isAdmin(); }
  }
}
```

 ## Setup & Installation

 ### 1. Firebase Configuration Update the API credentials in js firebase-config.js with your own project keys.

 ### 2. Firestore Indexing I require a Composite Index for the admin_verify collection where is_waiting == true to enable advanced administrative queries.

 ### 3. Local Environment This project relies on ES6 Modules. I recommend running it via a local server (e.g., VS Code Live Server) to avoid CORS issues.
 
 ### Deployment Note: This project is structured for local modular development. For Firebase Hosting production, paths should be adjusted to be root-relative.


**Developed by duck.sssop0356@gmail.com I am a 14-year-old developer passionate about building scalable and secure web solutions.**




