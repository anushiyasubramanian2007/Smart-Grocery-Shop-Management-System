# 🛒 Smart Grocery Shop Management System (Owner Portal)

A full-stack web-based grocery management platform designed specifically for a single grocery shop owner, featuring automated inventory control, weighted average cost accounting, dynamic selling price determination, automatic low-stock alerts, financial analytics, and a multi-lingual **Voice Assistant** supporting English, Tamil, and Tanglish.

---

## 🌟 Key Features

1. **Pixel-Perfect UI (Matching Provided Design Specs)**:
   - **Login Page**: Split card layout with custom grocery basket artwork and "Only Owner Access" badge.
   - **Dashboard**: Slate navy sidebar, 3 KPI metric cards (Total Sales, Total Profit, Total Expenses), automatic Low Stock Alerts widget, 7-day Sales Overview bar chart, and Recent Transactions table.
   - **Products / Stock**: Product inventory table with live stock levels, weighted average cost, selling prices, status pills ("Low" / "Good"), and "+ Add Product" modal.
   - **Purchases**: Purchase entry form with live Weighted Average Cost preview and Recent Purchases log.
   - **Sales**: Billing form with stock-underflow protection (prevents overselling) and profit calculations.
   - **Expenses**: Overhead logger (Electricity, Rent, Transport, Salary, Packaging, Maintenance, etc.).
   - **Reports**: Daily/Weekly/Monthly filter, 4 KPI cards, Sales vs. Purchase grouped bar chart, and Top Selling Products distribution.
   - **Voice Assistant**: Large pulsing microphone button, Web Speech API integration, multi-lingual NLP engine, and **Voice & UI Confirmation Dialog** before updating the database.
   - **Settings**: Store configuration, low-stock threshold tuning, and voice preferences.

2. **Weighted Average Purchase Cost**:
   $$\text{New Average Cost} = \frac{(\text{Current Stock} \times \text{Current Avg Cost}) + (\text{New Quantity} \times \text{New Unit Price})}{\text{Current Stock} + \text{New Quantity}}$$

3. **Dynamic Selling Price**:
   - Configurable profit margin: **Fixed amount (₹/kg)** OR **Percentage (%)**.
   - Auto-updates selling price whenever new purchases affect the average cost.

4. **Automated Low-Stock Alerts**:
   - Automatically detects items where $\text{Current Stock} \le \text{Minimum Stock}$.
   - Displays real-time alerts on the top navigation bar, dashboard, and inventory table.

5. **Voice Assistant with Tanglish / Tamil / English NLP**:
   - Understands commands such as:
     - *"Dhal 10 kilo 200 rupees ku vanginen"* $\rightarrow$ Purchase 10 kg Dhal for ₹200
     - *"Dhal 2 kilo sell panniten, kilo 25 rupees"* $\rightarrow$ Sell 2 kg Dhal at ₹25/kg
     - *"Transport ku 100 rupees expense"* $\rightarrow$ Log ₹100 Transport expense
     - *"Innaiku profit evalo?"* $\rightarrow$ Query today's profits and sales
     - *"Dhal stock evalo?"* $\rightarrow$ Query current stock level for Dhal
   - **Confirmation Step**: Speaks and displays confirmation *"I understood: Purchase 10 kg Dhal for ₹200. Do you want to save this?"*. User can respond with voice *"Yes"* / *"No"* or click the button before any database modification occurs.

---

## 🔑 Default Owner Login

- **URL**: [http://localhost:3000](http://localhost:3000)
- **Username**: `owner`
- **Password**: `admin123`

---

## 🚀 Running the System

### Prerequisites
- Node.js (v18+)
- MongoDB (optional; the application includes an automatic local persistent store fallback if MongoDB is not running locally, ensuring 100% uptime out of the box!)

### Start Both Servers

```bash
# In project root (d:\MWT_project)
npm run backend   # Starts Node/Express API on http://localhost:5000
npm run frontend  # Starts React Vite dev server on http://localhost:3000
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Owner login (returns JWT token) |
| `GET` | `/api/auth/profile` | Get current owner profile |
| `PUT` | `/api/auth/settings` | Update store settings and password |
| `GET` | `/api/products` | Get all inventory items |
| `GET` | `/api/products/low` | Get products below minimum stock threshold |
| `POST` | `/api/products` | Add new product |
| `PUT` | `/api/products/:id` | Update product details |
| `DELETE` | `/api/products/:id` | Delete product |
| `GET` | `/api/purchases` | Get all purchase transactions |
| `POST` | `/api/purchases` | Add purchase (recalculates Weighted Average Cost) |
| `GET` | `/api/sales` | Get all sales records |
| `POST` | `/api/sales` | Add sale (checks stock & computes profit) |
| `GET` | `/api/expenses` | Get all expense records |
| `POST` | `/api/expenses` | Log new expense |
| `GET` | `/api/reports/dashboard` | Dashboard KPIs, recent transactions, 7-day chart |
| `GET` | `/api/reports/analytics` | Filtered reports (daily, weekly, monthly) |
| `POST` | `/api/voice/parse` | Parse Tamil/Tanglish/English voice command |
| `POST` | `/api/voice/execute` | Execute confirmed voice transaction |
