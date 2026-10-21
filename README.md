# HUDA HOMES (`hudahomes1`)

Architectural marble and natural stone handicrafts showcase website with a full Owner Admin Portal, Bulk Product Uploader, Cloud Firestore synchronization, and interactive zoomable product inspection.

## Features

- **8 Signature Product Categories**: Console Table, Lander, Side Tables, Dining Tables, Fireplace, Pedistal, Washbasin, and Other Beautiful Handicrafts.
- **Product Showcase & Details Page**:
  - Displays strictly **Product Name**, **Quantity**, and **Material** outside the photograph (zero text overlays on product images).
  - Supports **Edge-to-Edge Showcase (Auto)** and **Original Aspect Ratio** display modes per product.
  - Full-screen interactive zoomable (`100%`–`400%`) and pannable Lightbox on the Product Details page.
- **Owner Admin Dashboard**:
  - Protected via server-validated Admin PIN/Password and Firebase Google Owner Authentication.
  - **Single Product Upload & Edit** and **Category-Based Bulk Upload** (Steps 1–4) with multi-photo grouping.
  - Persistent server catalog storage (`data/catalog-store.json`) and real-time Cloud Firestore sync.
- **Direct Studio Contact**:
  - WhatsApp (`https://wa.me/918058694217`) and Phone (`tel:+918058694217`) links configured with Indian international format (`+91 80586 94217`).

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pushing to GitHub (`hudahomes1`)

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit: HUDA HOMES website & admin portal"
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/hudahomes1.git
git push -u origin main
```
