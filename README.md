
# 🔐 Token-Gated Crypto Price Viewer

A **Next.js 14** + **Sign-In With Ethereum (SIWE)** app that requires holding a valid **ERC-721 NFT (on Base chain)** to access a dashboard for **live & historical crypto price lookups** via CoinMarketCap API.

---

## 🚀 Features

- **Wallet-based login with SIWE**
  - Users connect their Ethereum wallet and sign a SIWE message
  - Auth handled by **NextAuth (JWT strategy)**

- **NFT Gated Dashboard**
  - Only wallets holding a valid ERC-721 NFT (Base chain) can access
  - Unauthorized wallets see an access denied message

- **Crypto Price Viewer**
  - Search prices by:
    - Amount (e.g. `0.1`)
    - Ticker (e.g. `BTC`, `ETH`, `SOL`)
    - Currency (`USD` or `EUR`)
    - Timestamp (UTC) or "Price Now"
  - Returns clean result:
    ```
    0.1 BTC = USD 6500.00 @ 2024-01-01 UTC 
    (≈ USD 65,000 / 1 BTC)
    ```
  - Expandable raw JSON from CMC API

---

## 🛠️ Tech Stack

- **Frontend**
  - [Next.js 14](https://nextjs.org/) (App Router)
  - [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - [TailwindCSS](https://tailwindcss.com/) for styling

- **Web3**
  - [wagmi](https://wagmi.sh/) hooks
  - [RainbowKit / ReOwn AppKit](https://reown.com/) for wallet UX
  - [SIWE](https://login.xyz/) for authentication

- **Authentication**
  - [NextAuth](https://next-auth.js.org/) with **Credentials Provider**
  - SIWE signature verification
  - JWT session storing wallet `address` + `chainId`

- **Backend**
  - Next.js API routes
  - [CoinMarketCap API](https://coinmarketcap.com/api/) for prices
  - Protected routes (`/api/gate`, `/api/prices/convert`)

---

## 📂 Project Structure

````

src/
├─ app/
│   ├─ api/
│   │   ├─ siwe/         # SIWE auth routes (nonce, callback, etc.)
│   │   ├─ gate/         # NFT gating check
│   │   └─ prices/       # CMC price lookup endpoints
│   ├─ layout.tsx        # App layout wrapper
│   └─ page.tsx          # Main dashboard
│
├─ components/
│   ├─ Login.tsx         # SIWE connect/sign-in/out button
│   ├─ PriceForm.tsx     # Form inputs
│   └─ PriceViewer.tsx   # Price fetch + display
│
├─ config/
│   └─ wagmi.ts          # Wagmi & ReOwn config
│
└─ provider.tsx          # Wagmi, QueryClient, NextAuth session providers

````

---

## ⚙️ Setup

1. **Clone repo & install**
   ```bash
   git clone https://github.com/your/repo.git
   cd repo
   npm install
````

2. **Create `.env.local`**

   ```ini
   NEXTAUTH_SECRET=your_random_secret_here
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_PROJECT_ID=your_reown_or_walletconnect_id
   CMC_API_KEY=your_coinmarketcap_api_key
   ```

   * Generate `NEXTAUTH_SECRET`:

     ```bash
     openssl rand -base64 32
     ```

3. **Run dev**

   ```bash
   npm run dev
   ```

4. **Open app** → [http://localhost:3000](http://localhost:3000)

---

## 🔒 NFT Gating

* The API route `/api/gate` checks if the authenticated wallet holds a specific NFT on **Base mainnet**
* Replace placeholder logic with your actual contract address & ABI

---

## 🧭 Roadmap

* ✅ Wallet login via SIWE
* ✅ NFT-based access control
* ✅ Live & historical price lookup
* ⬜ Improve UI polish (calendar/time picker, error states)
* ⬜ Deploy to Vercel or another host
* ⬜ Finalize NFT gating (contract check)

---

## 📜 License

MIT

```

---
