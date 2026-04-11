# GateX-KSE 🛡️

> **Ultra-Premium Visitor Intelligence & Security Platform** — Built for the Keystone School of Engineering, Pune

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%2B%20Auth-blueviolet?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🚀 Live Demo

Deployed on Vercel → [gatex-kse.vercel.app](https://gatex-kse.vercel.app)

---

## 📸 Features

| Module | Description |
|---|---|
| 🔐 **Elite Auth** | Role-based Subabase Auth — Secure Host, Security, and Admin Portals |
| 📊 **Command Center** | Live stats, risk analytics, and real-time visitor approval terminal |
| 🛡️ **Security Hub** | Gate-specific (Gate A/B) QR verification system with duplicate prevention |
| ⚡ **QR Engine** | Cryptographic pass generation with automated TTL and instant status updates |
| 🖨️ **Audit System** | Single-click CSV data exports for institutional compliance and reporting |
| 🌌 **3D Portal** | Cinematic React Three Fiber landing experience to wow campus visitors |

---

## 🧱 Tech Stack

### Frontend
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS 4.0** + premium OKLCH glassmorphism design system
- **React Three Fiber** — Immersive 3D hero section with particle physics
- **Framer Motion** — Spring-physics micro-animations

### Backend / Security
- **Supabase Authentication** — Multi-role management (Admin, Security, User)
- **PostgreSQL (Supabase)** — Real-time database with Row Level Security (RLS)
- **Zod & Server Actions** — Mathematical validation of all visitor entry data

---

## 🗂️ Project Structure

```
gatex-kse/
├── app/
│   ├── page.tsx              # Cinematic landing page
│   ├── auth/login/           # Auth gateway
│   ├── visitor/request/      # Entry request form
│   ├── visitor/status/       # Live pass tracking & QR
│   ├── admin/                # Management dashboard
│   ├── security/             # Gate verification terminal
│   └── api/                  # Secure server-side mutations
├── components/
│   ├── stitch/               # Premium Design System (GlassCard, etc.)
│   └── Hero3D.tsx            # 3D Portal Logic
├── lib/
│   ├── supabase.ts           # Browser client
│   └── supabase-server.ts    # Service Role admin client
└── types/
    └── database.ts           # Full PostgreSQL schemas
```

---

## ⚙️ Setup & Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/gatex-kse.git
cd gatex-kse

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔥 Supabase Setup

1. Go to [Supabase Dashboard](https://supabase.com/)
2. Create project: `GateX-KSE-Production`
3. **Database Schema:** Open the **SQL Editor** in Supabase and run the code from [supabase/schema.sql](./supabase/schema.sql) to build your tables and role logic.
4. **Auth Setup:** Go to `Authentication -> Users` and add your first account (`admin@gatex-kse.io`).
5. **Permissions:** Ensure **RLS Policies** are enabled (already included in the SQL script).
6. Add your config to `.env.local`

---

## 🇮🇳 Institutional Context

- Custom-built for **Keystone School of Engineering, Pune**.
- Supports **Multi-Gate verification** (Gate A & Gate B logic).
- Identity verification calibrated for **Indian ID Proofs** (Aadhar, PAN, Student ID).
- Designed to handle high-volume student and event traffic.

---

## 📦 Deployment (Vercel)

```bash
# Set environment variables in Vercel Dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY

npm run build   # Verify elite build
vercel          # Deploy
```

---

## 👨💻 Built With

- **Design:** Engineered by **Abhijeet Kangane**
- **Architecture:** Next.js 15 Serverless + Supabase Global Backend
- **Animations:** Custom Framer Motion + R3Fiber WebGL Engine
- **Safety:** Hardened RLS policies with cryptographic pass integrity checks

