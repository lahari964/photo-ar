# Photo AR App Design Spec

## Concept
A WebAR React application that recognizes a specific target photo and overlays a video directly on top of it, creating a magical "living photo album" experience.

## Target Audience & Usage
Mobile users scanning physical photo albums.

## UX & Visual Design
- **Style:** Glassmorphism (Mobile-first)
- **UI Structure:**
  - Full-screen camera background.
  - Frosted glass Top Bar showing app name and status ("Scanning...").
  - Frosted glass Bottom Dashboard providing instructions and a "View Gallery" button.
- **Interactions:**
  - Auto-play video when target is recognized.
  - Pause video when target is lost.
  - Smooth UI overlay above the AR tracking layer.

## Architecture
- **Framework:** React + Vite
- **Styling:** Tailwind CSS (utility classes for glassmorphism `backdrop-blur`)
- **AR Engine:** MindAR.js + A-Frame
- **Component Breakdown:**
  - `App.jsx`: Main container, handles UI overlay and states.
  - `ARViewer.jsx`: Dedicated component to mount the A-Frame `<a-scene>`, manage camera permissions, and handle MindAR target events.

## Data & Assets
- **Target File:** `/target.mind` (Mock: MindAR default target)
- **Video File:** `/mock-video.mp4` (Mock: sample MP4)

## Implementation Notes
- Use `absolute inset-0 z-0` for the AR viewer.
- Use `absolute inset-0 z-10 pointer-events-none` for the UI overlay.
- Ensure buttons inside the UI overlay have `pointer-events-auto` so they are clickable over the camera feed.
- Ensure camera permissions are handled smoothly by A-Frame on iOS/Android.
