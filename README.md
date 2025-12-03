# GATED_PRICES (Terminal V1)

**Institutional Grade. Open Access. Real-Time.**

A Neo-Brutalist crypto price checker built on **Next.js 16**, **Tailwind v4**, and **Wagmi**. Designed for speed, aesthetics, and performance.

![App Screenshot](https://via.placeholder.com/800x400/000000/CCFF00?text=GATED_PRICES_PREVIEW)

## ⚡ Features

*   **Neo-Brutalist Design:** High-contrast "Dark Degen" aesthetic with neon accents (`#CCFF00`, `#FF00FF`), hard shadows, and raw borders.
*   **Real-Time Prices:** Fetches live data from the **CoinGecko API**.
*   **Smart Caching:** Server-side in-memory caching (60s TTL) protects API rate limits while serving thousands of users.
*   **Motion Effects:** Interactive marquee ticker and micro-animations.
*   **Wallet Connection:** Integrated **RainbowKit** + **Wagmi** for wallet connectivity (Base Network).
*   **Token Gating (Optional):** Built-in architecture to restrict features based on NFT ownership (currently relaxed for public access).
*   **Secure Auth:** SIWE (Sign-In with Ethereum) via **NextAuth.js**.

## 🛠️ Tech Stack

*   **Framework:** Next.js 16 (App Router)
*   **Styling:** Tailwind CSS v4.1
*   **Web3:** Wagmi, Viem, RainbowKit
*   **Auth:** NextAuth.js, SIWE
*   **Data:** CoinGecko API
*   **Font:** Space Grotesk

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/token-gated-price-checker.git
cd token-gated-price-checker
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```bash
cp env.local.example .env.local
```

Fill in your keys:
```env
# App
NEXT_PUBLIC_APP_NAME="GATED_PRICES"
NEXT_PUBLIC_PROJECT_ID="your_walletconnect_id"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_generated_secret"

# Blockchain
NEXT_PUBLIC_ALCHEMY_HTTP_URL="https://base-mainnet.g.alchemy.com/v2/your_key"

# CoinGecko (Optional for free tier)
CG_API_KEY="your_coingecko_key"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🛡️ Architecture

### Caching Strategy
To prevent hitting CoinGecko's rate limits (30 calls/min), we implement a **server-side cache**:
*   **TTL:** 60 seconds.
*   **Mechanism:** In-memory `Map` in `src/lib/cache.ts`.
*   **Benefit:** Multiple users requesting `BTC` within the same minute trigger only **one** external API call.

### Access Control
*   **Public:** The main `PriceViewer` is open to all users.
*   **Gated (Optional):** The `GateGuard` component can wrap any section to require a specific NFT on Base.

## 🎨 Design System

*   **Font:** Space Grotesk
*   **Primary Color:** Neon Lime (`#CCFF00`)
*   **Secondary Color:** Magenta (`#FF00FF`)
*   **Background:** Deep Black (`#000000`) with subtle grid.

---

**GATED_PRICES © 2025**
