<div align="center">

# 🛡️ GateX-KSE
### Ultra-Premium Visitor Intelligence & Security Platform

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://gatex-kse.vercel.app/)

**[🚀 Live Demo](https://gatex-kse.vercel.app)**

</div>

---

## 🏛️ Project Overview

**GateX-KSE** is an Ultra-Premium Visitor Intelligence & Security Platform built specifically for the **Keystone School of Engineering, Pune**. Designed to replace outdated manual logbooks, this enterprise-grade solution introduces cryptographic QR verification, highly secure multi-tier authentication, and a stunning 3D interactive portal. It serves as a comprehensive Command Center for institutional security, blending high-end aesthetics with rigid access control.

---

## 🚀 Key Features

*   **🔐 Elite Auth:** Secure, multi-role authentication system (`ADMIN`, `SECURITY`, `VISITOR`) powered by Supabase Auth with strict Row Level Security (RLS) policies.
*   **🏢 Command Center:** A comprehensive Admin Dashboard to seamlessly authorize entry requests, monitor campus traffic, and analyze visitor data in real-time.
*   **🛡️ Security Hub for Gate A/B:** Terminal-grade security interface deployed at multiple gates. Designed for security personnel to execute lightning-fast verifications.
*   **📲 QR Engine:** Cryptographic QR code generation and high-speed scanning pipeline. Ensures passes are tamper-proof and tightly bound to specific time windows.
*   **📋 Audit System:** Immutable logging engine that records every entry and exit scan (including the personnel involved, timestamp, and specific gate).
*   **🌌 3D Portal:** A visually breathtaking, hardware-accelerated WebGL landing experience built with React Three Fiber, Framer Motion, and GSAP.

---

## 🧱 Tech Stack & Architecture

GateX-KSE follows a modern, full-stack Next.js architecture, leveraging edge capabilities and a robust PostgreSQL backend.

### Frontend
*   **Framework:** Next.js 15 (App Router), React 19
*   **Styling & UI:** Tailwind CSS v4, custom Glassmorphism components, Shadcn UI
*   **Animations & 3D:** React Three Fiber, Drei, Framer Motion, GSAP
*   **State & Validation:** Zod

### Backend & Database
*   **BaaS:** Supabase
*   **Database:** PostgreSQL (with advanced RLS and automated triggers)
*   **Authentication:** Supabase Auth with server-side middleware

### 📂 Directory Structure

```text
gatex-kse/
├── src/
│   ├── app/
│   │   ├── admin/          # 🏢 Command Center UI
│   │   ├── auth/           # 🔐 Login & Registration
│   │   ├── security/       # 🛡️ Gate Security Hub (QR Scanner)
│   │   ├── visitor/        # 🎫 Visitor Pass Request Flow
│   │   ├── api/            # ⚙️ Next.js Serverless Routes
│   │   └── page.tsx        # 🌌 3D Landing Portal
│   ├── components/
│   │   ├── stitch/         # ✨ Premium Custom UI Components (Neon, Glassmorphism)
│   │   ├── ui/             # 🧩 Base UI Elements
│   │   └── Hero3D.tsx      # 🧊 React Three Fiber Scene
│   └── lib/                # 🛠️ Utilities (Supabase client, Validation)
├── supabase/
│   └── schema.sql          # 🗄️ Database Schema, RLS Policies, Triggers
└── public/                 # 🖼️ Static Assets
```

---

## ⚙️ Local & Supabase Setup

Follow these steps to deploy GateX-KSE locally.

### 1. Clone & Install
```bash
git clone https://github.com/abhi666-max/GateX-KSE.git
cd GateX-KSE
npm install
```

### 2. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository and execute the entire script. This will automatically:
   * Create the `users`, `visitors`, `passes`, and `logs` tables.
   * Enable Row Level Security (RLS) across all tables.
   * Configure specific access policies (e.g., Admins can approve visitors, Security can insert logs).
   * Set up an automated trigger (`handle_new_user()`) to map Supabase Auth users to the `public.users` table with a default `VISITOR` role.
4. Go to **Authentication** settings and configure your preferred sign-in providers (Email/Password).

**Promoting Users:**
By default, new users are assigned the `VISITOR` role. To grant elevated access, run this command in your Supabase SQL Editor:
```sql
UPDATE public.users SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
UPDATE public.users SET role = 'SECURITY' WHERE email = 'your-security@email.com';
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to interact with the platform.

---

## 🇮🇳 Institutional Context

GateX-KSE is designed with strict compliance and operational efficiency for Indian educational institutions. It features robust **Multi-Gate verification**, allowing traffic to be distributed seamlessly across different campus access points (e.g., Gate A, Gate B). 

The identity verification system is explicitly calibrated for Indian ID Proofs, fully supporting the input and validation of:
*   **Aadhaar**
*   **PAN**
*   **Student ID / College ID**
*   Driving License & Passport

> **Note:** The platform automatically limits pass validity to specific time windows, ensuring maximum premises security.

---

### 👨‍💻 Developed By
**Abhijeet Kangane (@Abhi666-max)**
* 💼 [LinkedIn](https://www.linkedin.com/in/abhijeet-kangane-0578b2395/)
* 🐙 [GitHub](https://github.com/abhi666-max)
* 🐦 [X (Twitter)](https://x.com/abhijeet_037)
* 📸 [Instagram](https://www.instagram.com/abhijeet.037/)
