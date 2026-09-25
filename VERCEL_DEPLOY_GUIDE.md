# 🚀 Vercel Deployment Guide (Cricket Scorer Pro)

Aapke project ko Vercel par deploy karne ke liye **2 aasan tarike** hain. 

---

## ⚡ Important Note: Database on Vercel
Vercel serverless platform hai, jahan local file (`dev.db`) me data permanently write nahi ho sakta.
Isliye matches aur scores ko mobile/desktop par hamesha save rakhne ke liye ek **Free Cloud Database** (Neon ya Supabase) connect karna best practice hai.

---

## 🌟 Tarika 1: GitHub ke Zariye (Sabse Best & Recommended)

### Step 1: Code ko GitHub par Dalein
1. Apne computer me terminal kholein aur yeh commands run karein:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Vercel deploy"
   ```
2. [github.com](https://github.com/new) par jaakar ek naya repository banayein (e.g. `cricket-scorer`).
3. GitHub par diye gaye commands se code push kar dein:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/cricket-scorer.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Vercel par Import Karein
1. [vercel.com](https://vercel.com) par jayein aur GitHub se Login karein.
2. **"Add New..."** -> **"Project"** par click karein.
3. Apna `cricket-scorer` repository select karke **Import** karein.

### Step 3: Free Database Add Karein
1. **Option A (Vercel ke andar hi 1-Click)**:
   - Project dashboard me **Storage** tab par jayein.
   - **Create Database** -> **Postgres (Neon)** select karein.
   - Yeh automatically `DATABASE_URL` environment variable set kar dega!
2. **Option B (Neon.tech Free Database)**:
   - [neon.tech](https://neon.tech) par free account banayein aur ek database banayein.
   - Connection string copy karein.
   - Vercel me **Settings** -> **Environment Variables** me jakar:
     - `DATABASE_URL` = `postgresql://...`
     - `JWT_SECRET` = `cricket_super_secret_jwt_key_2024_secure_scoring_app`
     - `NEXTAUTH_URL` = `https://your-project.vercel.app`

### Step 4: Deploy!
- **Deploy** button dabayein! 1 minute me aapka app online ho jayega aur ek live URL mil jayega (jaise `https://cricket-scorer-pro.vercel.app`).

---

## 💻 Tarika 2: Terminal se Direct Vercel CLI (Quick Deploy)

Agar aap GitHub use nahi karna chahte aur direct terminal se deploy karna chahte hain:

1. Terminal me run karein:
   ```bash
   npx vercel
   ```
2. Vercel aapse browser me login karne ko kahega.
3. Login ke baad terminal me prompts aayenge (Enter dabate jayein):
   - Set up and deploy? **Y**
   - Which scope? **(Select your account)**
   - Link to existing project? **N**
   - Project name? **cricket-scorer**
   - In which directory? **./** (default)
4. Deploy complete hone par aapko **Live URL** mil jayega!

---

## 📱 Mobile me Kaise Chalayein?
Vercel par deploy hone ke baad:
1. Jo URL Vercel dega (e.g. `https://cricket-scorer.vercel.app`), use apne mobile ke Chrome / Safari browser me kholein.
2. **"Install App"** ya **"Add to Home Screen"** par click karein.
3. App aapke mobile ke Home screen par real app icon ke sath install ho jayegi!
