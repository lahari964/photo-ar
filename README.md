# Photo AR 📸✨

A magical WebAR (Web Augmented Reality) application that brings your physical photos to life. Built with React, Vite, and MindAR, this application allows users to point their phone camera at a printed photo and instantly watch a video seamlessly play on top of it in 3D space.

## ✨ Features

- **Instant AR Experience:** No app installation required. Works directly in the mobile browser (iOS Safari and Android Chrome).
- **Cinematic UI:** A beautiful, responsive, glassmorphism dashboard to select photo albums.
- **Progressive Web App (PWA):** Installable to the home screen for a native app-like experience and offline caching.
- **Memory Recording:** Built-in screen recording feature to capture the AR magic and download it instantly to your device.
- **Audio Control:** Toggle video audio on and off directly from the AR overlay.
- **Visual Coaching:** Intuitive UI overlays that guide users to point at the correct physical photo with visual thumbnail hints.

## 🛠 Tech Stack

- **Frontend Framework:** React 18, Vite
- **Styling:** Tailwind CSS, Framer Motion (for animations)
- **Icons:** Lucide React
- **AR Engine:** MindAR (Image Tracking), A-Frame, Three.js
- **PWA:** vite-plugin-pwa

## 🚀 Getting Started

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Adding New Photos and Videos

To add a new AR experience to the gallery, follow these steps:

1. **Prepare your media:** Have your physical photo (e.g., `my-photo.jpeg`) and the video you want to play over it (e.g., `my-video.mp4`).
2. **Compile the AR Target:**
   - Go to the [MindAR Image Target Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
   - Drop your `my-photo.jpeg` into the compiler.
   - Click **Start** and wait for it to reach 100%.
   - Click **Download** to get the `targets.mind` tracking file.
3. **Move files to the project:**
   - Rename `targets.mind` to something descriptive like `my-photo.mind`.
   - Place `my-photo.jpeg`, `my-video.mp4`, and `my-photo.mind` into the `public/` folder of this project.
4. **Update the Dashboard:**
   - Open `src/components/Dashboard.jsx`.
   - Add a new entry to the `albums` array at the top of the file:
   ```javascript
   {
     id: 'my-new-memory',
     title: 'My New Memory',
     photosCount: 1,
     coverUrl: '/my-photo.jpeg',
     targetSrc: '/my-photo.mind',
     videoSrc: '/my-video.mp4',
     isLocked: false,
   }
   ```

## 🌍 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com).
Simply import your GitHub repository into Vercel and it will automatically detect the Vite framework and configure the build settings.

> **Note:** The PWA caching size limit is configured in `vite.config.js`. If you add massive video files, they will be excluded from the offline cache. For videos larger than 10-20MB, consider using a cloud video streaming provider like Cloudinary or AWS S3 instead of local `.mp4` files.
