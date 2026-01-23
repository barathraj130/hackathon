# 🚀 System Synthesis Deployment Guide

This guide details how to host your application in the cloud (Vercel + Railway + Supabase) to support **200+ simultaneous participants** without lag.

## 1. 🗄️ Database: Cloud Storage (Supabase)
Instead of storing data on your local computer, use a Cloud PostgreSQL instance.
1. Create a free project at [Supabase.com](https://supabase.com).
2. Go to **Project Settings > Database**.
3. Copy the **Connection String** (Transaction mode, Port 6543 or Session mode).
4. You will use this as your `DATABASE_URL`.

## 2. 📡 Backend Logic & Synthesis Engine (Railway)
Railway is recommended for the Backend and PPT Service because it supports Docker and long-running Python processes better than Vercel.
1. Connect your GitHub repository to [Railway.app](https://railway.app).
2. Deploy the **Backend** service:
   - Set Environment Variables:
     - `DATABASE_URL`: (Your Supabase URL)
     - `JWT_SECRET`: (Any secure string)
     - `PYTHON_SERVICE_URL`: (The URL Railway gives your PPT service)
3. Deploy the **PPT Service**:
   - Railway will detect the Dockerfile and deploy it.
   - It will automatically serve the `.pptx` files from the cloud.

## 3. 🏢 Interface (Vercel)
Vercel is perfect for the Frontend (Next.js).
1. Connect your Github repo to [Vercel.com](https://vercel.com).
2. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: (Your Railway Backend URL + `/v1`)
   - `NEXT_PUBLIC_WS_URL`: (Your Railway Backend URL)
   - `NEXT_PUBLIC_PPT_URL`: (Your Railway PPT Service URL)

## ⚡ Performance: Handling 200 participants
The system is now architected for scale:
- **Zero Local Dependency**: All synchronization happens via the Cloud Database.
- **Async Synthesis**: The PPT Engine uses a **Thread Pool** system. This allows it to process multiple presentation requests simultaneously without blocking the system for others.
- **Stateless Auth**: Using JWT (Json Web Tokens) ensures the server doesn't get "heavy" even with hundreds of active sessions.
- **Concurrent DB**: Cloud PostgreSQL handles 200+ concurrent connections effortlessly.

## 🛠️ Infrastructure Checks
Before going live, ensure your Railway services are set to **at least 1GB RAM** to handle the high-intensity slide generation for all teams at once.
