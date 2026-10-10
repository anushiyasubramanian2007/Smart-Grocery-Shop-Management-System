# 🛒 Smart Grocery Shop Management System (Owner Portal)

A comprehensive, full-stack grocery shop management platform and Point-of-Sale (POS) portal designed specifically for retail grocery store owners in Tamil Nadu and India. The system features an AI-driven multi-lingual **Voice Assistant** (Tamil, Tanglish, English, Hindi), automated inventory control with **Weighted Average Cost (WAC)** accounting, dynamic profit margin pricing, comprehensive POS billing with **UPI QR & Razorpay** checkout, thermal receipt printing, executive analytics, and a full **WCAG-compliant Accessibility Suite**.

---

## 🌟 Comprehensive Feature Matrix

### 1. 🎙️ Multi-Lingual AI Voice Assistant & Voice-to-Cart POS
- **Multi-Lingual Speech Processing**: Natural speech recognition for **Tamil (தமிழ்)**, **Tanglish** (Tamil in Latin script), **Indian English**, and **Hindi (हिंदी / Hinglish)**.
- **Natural Language Understanding (NLU)**: Conversational intent parsing without rigid syntax:
  - **Purchases**: *"Ponni Rice 25 kg 1300 ku vanginen"* $\rightarrow$ Records purchase of 25 kg Ponni Rice for ₹1300 and updates stock & cost.
  - **Sales**: *"Toor Dal 2 kg 155 ku viten"* $\rightarrow$ Records sale of 2 kg Toor Dal at ₹155/kg and calculates instant profit.
  - **Overhead Expenses**: *"Current bill 500 rooba kattinen"* $\rightarrow$ Categorizes and logs ₹500 Electricity expense.
  - **Stock Enquiries**: *"Urad Dal stock evlo irukku?"* $\rightarrow$ Vocalizes live stock, unit cost, and selling price.
  - **Today's Profit & Financials**: *"Innaiku laabam evlo?"* $\rightarrow$ Summarizes today's total sales, net profit, and expenses via Text-to-Speech (TTS).
  - **Voice Billing Navigation**: *"Murugan customer-ku bill podu"* $\rightarrow$ Automatically opens Customer Billing with customer name pre-filled.
- **Conversational Voice-to-Cart Ordering**: Speak full spoken paragraphs with multiple items (e.g., *"2 kg toor dal, 5 packet milk, 1 kg urad dal"*). Automatically extracts items, checks stock levels, and adds them directly to the billing cart.
- **Voice & Visual Confirmation Modal**: High-safety confirmation dialog with spoken prompt (*"I understood: Purchase 10 kg Dhal for ₹200. Do you want to save this?"*). Owners can confirm via voice (*"Yes"* / *"சரி"* / *"ஆமா"*) or button click before any database update.
- **Dialect & Spoken Number Normalization**: Parses colloquial numbers (*oru, rendu, moonu, naalu, anju, pathu, ara, mukkal, ek, do, teen*, etc.) and localized grocery terms into clean numerical data.

---

### 2. 🧾 Smart Point of Sale (POS) & Customer Billing
- **Fast-Paced Checkout Interface**: Search products instantly by Tamil or English names with category filtering and quantity steppers.
- **Real-Time Stock Underflow Prevention**: Live inventory validation that warns and blocks selling quantities exceeding available shelf stock.
- **Flexible Multi-Method Payment Processing**:
  - **Dynamic UPI QR Code**: Generates real-time UPI QR codes compatible with Google Pay, PhonePe, Paytm, and BHIM (supports both Universal and Amount-Locked QR modes).
  - **Custom Owner UPI QR Image**: Upload, preview, and display your store's static UPI QR code directly on screen.
  - **UPI Collect Request**: Enter the customer's UPI ID and send instant payment collect requests.
  - **Razorpay Standard Web Checkout**: Secure debit/credit cards, NetBanking, and UPI checkout with HMAC SHA-256 signature verification.
  - **Cash Register**: Real-time cash received input with automatic change return calculator.
  - **Customer Credit / Khata (கடன்)**: Track unpaid customer dues and credit ledger.
  - **Card POS Swipe**: Record card payments with last 4 card digits for reconciliation.
- **Thermal Receipt Printing & Invoices**:
  - Automatically generates professional, print-ready invoices with unique invoice numbers (`INV-YYYYMMDD-XXXX`), timestamps, and store details.
  - Supports standard **58mm** and **80mm ESC/POS** thermal receipt formats.
  - Bilingual receipt lines showing Tamil item names alongside English names, quantities, unit prices, and line totals.
  - One-click receipt printing and instant print dialog triggering.
- **Invoice History & Reprinting**: Search historical invoices by customer name or invoice number, review itemized breakdowns, and reprint receipts at any time.

---

### 3. 📦 Authentic Tamil Nadu Grocery Catalog & Inventory Control
- **Pre-Loaded Authentic Tamil Nadu Catalog**: Seeded with **35+ essential items** categorized across 15 standard grocery departments:
  - *DAL / பருப்பு வகைகள்* (Toor Dal, Urad Dal, Moong Dal, Chana Dal...)
  - *RICE / அரிசி வகைகள்* (Ponni Boiled Rice, Raw Rice, Idli Rice, Basmati...)
  - *MILLETS / சிறுதானியங்கள்* (Ragi, Kambu, Thinai, Samai...)
  - *FLOURS / மாவு வகைகள்* (Atta, Maida, Rice Flour, Rava...)
  - *SPICES & POWDERS / மசாலா பொருட்கள்* (Mustard, Cumin, Pepper, Sambar Powder...)
  - *OIL / எண்ணெய் வகைகள்* (Gingelly Oil, Groundnut Oil, Sunflower Oil, Coconut Oil...)
  - *SUGAR, SALT, TEA & COFFEE, HOUSEHOLD, SNACKS & DAIRY*
- **One-Click Catalog Seeding & Reset**: Easily reset or restore the complete authentic Tamil Nadu product catalog with a single click.
- **Weighted Average Purchase Cost (WAC)**:
  $$\text{New Average Cost} = \frac{(\text{Current Stock} \times \text{Current Avg Cost}) + (\text{New Quantity} \times \text{New Unit Price})}{\text{Current Stock} + \text{New Quantity}}$$
  Automatically recalculates product cost on every wholesale purchase.
- **Dynamic Selling Price Determination**:
  - Configurable profit margin per product: **Fixed Amount (₹)** or **Percentage (%)**.
  - Dynamically recalculates recommended retail price whenever new wholesale stock changes the average cost.
- **Automated Low-Stock Alerts**:
  - Identifies items where $\text{Current Stock} \le \text{Minimum Stock Threshold}$.
  - Real-time alert badges displayed in the top navigation bar, main dashboard, and product tables.
- **Flexible Metric Units**: Native support for `kg`, `gram`, `litre`, `ml`, `packet`, `piece`, `bottle`, `bunch`, `dozen`, and `pouch`.

---

### 4. 📊 Executive Dashboard & Financial Reports
- **Real-Time KPI Metric Cards**:
  - **Total Sales**: Cumulative store revenue.
  - **Net Profit**: Revenue minus Cost of Goods Sold (COGS).
  - **Total Expenses**: Operating costs and overhead expenditures.
- **Visual Trend Analytics**:
  - 7-day sales and profit overview bar chart.
  - Sales vs. Purchases comparison charts.
  - Top-selling products distribution.
- **Period Filtering**: Filter financial statements by Daily, Weekly, Monthly, or Custom date ranges.
- **Recent Transactions Log**: Real-time unified feed of recent sales, purchases, and expenses.

---

### 5. 💸 Purchases, Sales & Operating Expenses
- **Wholesale Purchases Tracker**: Log stock inbound batches with supplier names, bill numbers, purchase prices, and live WAC preview before saving.
- **Direct Sales Logger**: Record manual customer purchases with automatic stock deduction and profit calculations.
- **Overhead Expense Management**: Track store overhead across predefined categories:
  - *Electricity (TNEB)*, *Rent*, *Transport & Delivery*, *Employee Salary*, *Packaging Supplies*, *Maintenance*, and *Other*.

---

### 6. ♿ Inclusive Design & Accessibility Suite (WCAG 2.1 AA/AAA)
- **Fluid Font Scaling**: Choose between Normal (14px), Medium (16px), Large (18px), and Extra Large (20px) typography across the entire interface.
- **High-Contrast Color Themes**:
  - *Standard*: Modern sleek slate theme.
  - *High Contrast Light*: Maximum black-on-white contrast.
  - *High Contrast Dark*: Ultra-dark mode designed for low-light environments.
  - *Warm Sepia*: Eye-strain reducing warm palette.
- **Dyslexia-Friendly Typography**: One-click toggle for OpenDyslexic-styled typography.
- **Reduced Motion Mode**: Disables non-essential CSS animations and transitions for vestibular safety.
- **Tactile Audio Chimes**: Web Audio API synthesizer chimes providing sound feedback for clicks, success, errors, alerts, item deletions, and cash register actions.
- **Large Focus Rings & Click Targets**: 44px+ minimum touch targets and bold focus outlines for motor accessibility.
- **Global Keyboard Navigation**: Fully operable without a mouse using logical tab order and keyboard shortcuts.
- **Customizable Speech Synthesis**: Adjust voice speech rate (0.75x to 1.5x) and pitch (0.8x to 1.4x) with real-time test preview.
- **Screen Reader Live Announcer**: ARIA live region updates for dynamic cart changes and alerts.
- **Bilingual Interface Display Control**: Switch display mode between **Bilingual (Tamil + English)**, **Tamil Only**, or **English Only**.

---

### 7. 🔐 Authentication & Store Security
- **Owner-Only Portal**: Protected routes and restricted endpoints for single-owner operations.
- **JWT & BCrypt Authentication**: Secure hashed passwords and token-based API authentication.
- **Google OAuth 2.0 Single Sign-On (SSO)**: One-click sign-in using verified Google accounts.
- **6-Digit Google Email OTP Verification**: Backup authentication mechanism sending 6-digit verification codes to the owner's Google email (powered by Nodemailer).

---

### 8. 🔄 Hybrid Dual-Storage Architecture (100% Uptime)
- **MongoDB Atlas Cloud Database**: Primary scalable MongoDB database with full Mongoose schema modeling and ObjectIds.
- **Auto-Persistent Local Store Fallback (`store.json`)**:
  - If MongoDB is temporarily unreachable or offline, the backend automatically switches to local persistent JSON file storage.
  - Zero crashes, zero downtime, and complete feature parity.
  - Automatic two-way synchronization upon MongoDB reconnection.

---

### 9. 🧠 Smart Grocery Intelligence Suite (Decision-Support Modules)
- **📦 Smart Reorder Recommendation**:
  - Automated stock replenishment formula:
    $$\text{Recommended Order Quantity} = \max(0, \text{Target Run Demand} + \text{Safety Stock} - \text{Current Stock})$$
  - Factors in supplier lead times and safety stock buffers based on daily consumption velocity.
  - Classification: `REORDER NOW` (stock critically below safety threshold), `REORDER SOON` (stock below target run rate), or `NO REORDER REQUIRED` (stock healthy).
  - **Decision-Support Only**: One-click *"Review & Create Purchase"* pre-fills purchase quantity and supplier details in `/purchases`, ensuring the owner reviews and confirms before any purchase is recorded. Never auto-places orders.
- **⏳ Expiry & Batch FEFO Intelligence**:
  - Extends products and inbound purchases with **Batch Numbers**, **Purchase Dates**, **Expiry Dates**, and **Batch Quantities**.
  - Dynamic status classifications:
    - `SAFE`: More than 30 days remaining.
    - `EXPIRING SOON`: Between 15 and 30 days remaining.
    - `URGENT`: 14 days or fewer remaining (triggers clearance alert).
    - `EXPIRED`: Past shelf life.
  - Implements **FEFO (First Expire, First Out)** stock dispatch recommendation ordering.
  - Generates actionable commercial advice: Prioritize front-shelf placement, suggest markdown discounts (e.g., 20% discount to protect tied-up capital), bundle in combo packs, and suppress future wholesale purchase orders.
- **📉 Profit Leak & Dead Stock Detection**:
  - Analyzes inventory stagnation: Current stock, 30-day sales volume, last transaction date, sales velocity, and **days without sale**.
  - Tri-state inventory categorization: `ACTIVE`, `SLOW MOVING`, or `DEAD STOCK` (0 sales in >14 days with positive stock).
  - Calculates tied-up working capital ($\text{Current Stock} \times \text{Average Cost}$) locked in non-moving items.
  - Audits **4 major business profit leak categories**:
    1. *Dead Stock Capital Lockup*: Inventory gathering dust without turnover.
    2. *Margin Erosion / Excessive Discounts*: Items sold below target gross margin.
    3. *Wholesale Cost Spikes*: Supplier wholesale price increases compressing margins.
    4. *Disproportionate Overhead Expenses*: Utility and rent overhead exceeding 25% of gross revenue.
- **💡 What-If Business Simulator**:
  - Interactive commercial sandbox allowing owners to test pricing and purchasing decisions before enacting them in the store.
  - Inputs: Proposed Selling Price, Promotional Discount %, Proposed Wholesale Purchase Qty, and New Wholesale Cost.
  - Simulates outputs based on **microeconomic Price Elasticity of Demand** specific to Indian grocery departments (e.g., Rice: -0.65 inelastic necessity, Snacks: -1.40 elastic discretionary, Salt: -0.30 highly inelastic).
  - Compares Baseline vs. Simulated: Expected Sales Quantity, Revenue, Cost of Goods Sold (COGS), Gross Profit, and Profit Margin Delta.
  - **Strictly Read-Only Guarantee**: Operates completely in-memory. Never modifies product catalog prices, inventory levels, sales ledgers, or supplier accounts.

---

## 🔑 Default Credentials

- **Owner Web Portal**: [http://localhost:3000](http://localhost:3000) (or `http://localhost:5173`)
- **API Server**: [http://localhost:5001](http://localhost:5001)
- **Default Username**: `owner`
- **Default Password**: `admin123`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Optional: MongoDB Atlas or local `mongodb://127.0.0.1:27017/smart_grocery`. Local JSON store activates automatically if MongoDB is not detected.)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/anushiyasubramanian2007/Smart-Grocery-Shop-Management-System.git
   cd Smart-Grocery-Shop-Management-System
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration (`.env`)

Create or review `backend/.env`:
```env
PORT=5001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart_grocery?retryWrites=true&w=majority
JWT_SECRET=smart_grocery_super_secret_key_2026
DEFAULT_OWNER_USERNAME=owner
DEFAULT_OWNER_PASSWORD=admin123

# Razorpay Standard Checkout Credentials
RAZORPAY_KEY_ID=rzp_test_YourKeyId
RAZORPAY_KEY_SECRET=YourKeySecret
RAZORPAY_CONFIG_ID=config_YourConfigId

# Google Cloud OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Create or review `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Starting the Application

Open two terminal windows:

**Terminal 1 — Backend API Server**:
```bash
cd backend
node server.js
```

**Terminal 2 — Frontend Dev Server**:
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and log in with `owner` / `admin123`.

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| **Authentication** | | |
| `POST` | `/api/auth/login` | Owner username & password login (returns JWT token) |
| `POST` | `/api/auth/google` | Google OAuth 2.0 token authentication |
| `POST` | `/api/auth/google/send-code` | Send 6-digit OTP code to owner's Google email |
| `POST` | `/api/auth/google/verify-code` | Verify 6-digit OTP code and authenticate |
| `GET` | `/api/auth/profile` | Retrieve owner profile and store configuration |
| `PUT` | `/api/auth/settings` | Update store profile, UPI ID, Razorpay keys, and password |
| **Products & Inventory** | | |
| `GET` | `/api/products` | Get all inventory items |
| `GET` | `/api/products/low` | Get products below minimum stock threshold |
| `GET` | `/api/products/:id` | Get single product by ID |
| `POST` | `/api/products` | Create new product |
| `PUT` | `/api/products/:id` | Update product details |
| `DELETE` | `/api/products/:id` | Remove product from inventory |
| `POST` | `/api/products/seed-catalog` | Seed or reset authentic Tamil Nadu 35+ item catalog |
| **Purchases (Inbound Stock)** | | |
| `GET` | `/api/purchases` | Get all purchase transactions |
| `POST` | `/api/purchases` | Record purchase (recalculates Weighted Average Cost & selling price) |
| **Sales (Outbound)** | | |
| `GET` | `/api/sales` | Get all individual sales records |
| `POST` | `/api/sales` | Record manual sale (checks stock & calculates profit) |
| **Customer Orders & POS Billing** | | |
| `GET` | `/api/orders` | Get past customer invoices and receipts |
| `POST` | `/api/orders` | Create confirmed customer invoice (deducts stock, logs sales) |
| `POST` | `/api/orders/voice-parse` | Parse conversational voice order into itemized cart items |
| **Payments** | | |
| `POST` | `/api/payment/razorpay/create-order` | Create Razorpay standard checkout order with signature |
| `POST` | `/api/payment/razorpay/verify` | Verify HMAC SHA-256 payment signature |
| `POST` | `/api/payment/razorpay/test-connection` | Test Razorpay API credentials connectivity |
| **Overhead Expenses** | | |
| `GET` | `/api/expenses` | Get all logged operating expenses |
| `POST` | `/api/expenses` | Log new operating expense |
| **Financial Reports & Dashboard** | | |
| `GET` | `/api/reports/dashboard` | Dashboard summary KPIs, recent transactions, 7-day sales chart |
| `GET` | `/api/reports/analytics` | Filtered financial reports (daily, weekly, monthly) |
| **Smart Grocery Intelligence Suite (AI Decision Support)** | | |
| `GET` | `/api/intelligence/summary` | Executive intelligence summary for Dashboard (4 metric cards) |
| `GET` | `/api/intelligence/reorder-recommendations` | Smart replenishment quantities ($D + SS - S$) & lead times |
| `GET` | `/api/intelligence/expiry-alerts` | FEFO batch schedule, urgency categories & markdown advice |
| `GET` | `/api/intelligence/dead-stock` | Zero/low velocity items, days without sale & tied-up capital |
| `GET` | `/api/intelligence/profit-analysis` | 4-category profit leak detection (dead stock, discounts, costs) |
| `POST` | `/api/intelligence/what-if` | Read-only simulation using Price Elasticity of Demand |
| **Voice NLP Engine** | | |
| `POST` | `/api/voice/parse` | Parse Tamil, Tanglish, English, or Hindi voice commands |
| `POST` | `/api/voice/execute` | Execute confirmed voice transaction (Purchase, Sale, Expense) |
| **System Health** | | |
| `GET` | `/api/health` | Backend system health check |

---

## 🏗️ Project Architecture

```
MWT_project/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & fallback detection
│   ├── controllers/
│   │   ├── authController.js     # JWT & Google OAuth controller
│   │   ├── intelligenceController.js # Intelligence REST API controller
│   │   ├── orderController.js    # Invoices & POS billing
│   │   ├── paymentController.js  # Razorpay integration
│   │   ├── productController.js  # Catalog & inventory management
│   │   ├── purchaseController.js # Purchases & Weighted Average Cost
│   │   ├── reportController.js   # Analytics & KPI dashboards
│   │   ├── saleController.js     # Sales & profit calculations
│   │   └── voiceController.js    # Multi-lingual voice action handlers
│   ├── data/
│   │   ├── store.json            # Auto-persistent local JSON fallback store
│   │   └── tamilNaduCatalog.js   # 35+ item authentic Tamil Nadu grocery catalog
│   ├── models/
│   │   ├── Expense.js            # Overhead expense schema
│   │   ├── Order.js              # POS customer invoice schema
│   │   ├── Owner.js              # Owner profile, UPI & Razorpay settings
│   │   ├── Product.js            # Inventory product schema (with batch/expiry fields)
│   │   ├── Purchase.js           # Wholesale purchase schema (with batchNumber/expiryDate)
│   │   └── Sale.js               # Sales ledger schema
│   ├── routes/                   # Express REST API routes
│   │   ├── authRoutes.js
│   │   ├── intelligenceRoutes.js # /api/intelligence endpoints
│   │   ├── productRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── saleRoutes.js
│   │   └── voiceRoutes.js
│   ├── services/
│   │   ├── emailService.js           # Nodemailer OTP email sender
│   │   ├── expiryService.js          # FEFO expiry queue & discount logic
│   │   ├── intelligenceService.js    # Unified intelligence orchestrator
│   │   ├── profitAnalysisService.js  # Dead stock & 4-category profit leaks
│   │   ├── reorderService.js         # Replenishment formula: D + SS - S
│   │   ├── simulationService.js      # Microeconomic price elasticity simulator
│   │   └── storeService.js           # Core business logic & storage abstraction
│   ├── utils/
│   │   └── nlpParser.js          # Multi-lingual Tamil/Tanglish/Hindi/English NLP engine
│   └── server.js                 # Express server bootstrap
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ConfirmationModal.jsx # Voice safety confirmation dialog
    │   │   ├── Header.jsx            # Top navbar with live low-stock alerts
    │   │   ├── ProductModal.jsx      # Add/edit product modal
    │   │   └── Sidebar.jsx           # Responsive navigation sidebar (with AI badge)
    │   ├── context/
    │   │   ├── AccessibilityContext.jsx # WCAG 2.1 AA/AAA accessibility provider
    │   │   └── AuthContext.jsx       # Owner authentication provider
    │   ├── pages/
    │   │   ├── CustomerBilling.jsx   # Point of Sale (POS) & receipt printing
    │   │   ├── Dashboard.jsx         # Executive KPI dashboard + Smart Grocery Intelligence section
    │   │   ├── Expenses.jsx          # Overhead expense management
    │   │   ├── Intelligence.jsx      # Dedicated 5-tab AI Intelligence Hub
    │   │   ├── Login.jsx             # Secure owner login & Google SSO
    │   │   ├── ProductsStock.jsx     # Inventory table & catalog seeder
    │   │   ├── Purchases.jsx         # Wholesale purchases logger, batch tracking & AI reorder prefill
    │   │   ├── Reports.jsx           # Period-filtered financial statements
    │   │   ├── Sales.jsx             # Direct sales billing
    │   │   ├── Settings.jsx          # Store, payment & accessibility settings
    │   │   └── VoiceAssistant.jsx    # Pulsing microphone multi-lingual assistant
    │   ├── services/
    │   │   └── api.js                # Axios REST API client (with intelligenceAPI)
    │   ├── utils/
    │   │   ├── razorpay.js           # Razorpay standard web checkout loader
    │   │   └── speech.js             # Web Speech API recognition & TTS wrapper
    │   ├── App.jsx                   # React Router layout & shortcuts
    │   └── main.jsx                  # React application entry
    └── index.html                    # HTML shell
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Lucide React Icons, HTML5 Canvas / Audio API |
| **Styling** | Custom Vanilla CSS Design System, Responsive Flexbox/Grid, Dark/High-Contrast Modes |
| **Backend** | Node.js, Express.js (ES Modules) |
| **Databases** | MongoDB Atlas / Local MongoDB, Mongoose ORM, Persistent JSON File Fallback |
| **Speech & Audio** | Web Speech API (`webkitSpeechRecognition`, `SpeechSynthesis`), Web Audio API Synthesizer |
| **Payments** | Dynamic UPI QR (`upi://pay`), Razorpay Standard Checkout SDK |
| **Authentication** | JSON Web Tokens (JWT), BCrypt.js, Google OAuth 2.0, Nodemailer OTP |
| **Printing** | ESC/POS Thermal Receipt Layout (58mm / 80mm), CSS `@media print` |

---

## 📄 License

This project is licensed under the MIT License. Developed for smart retail operations in Tamil Nadu, India.
