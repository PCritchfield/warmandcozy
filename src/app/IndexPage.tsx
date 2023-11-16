// pages/index.js
'use client'
import Home from './components/Home';

export default function IndexPage() {
  const videos = [
    'video01.mp4',
    'video02.mp4',
    // ... add more video paths here
  ];

  return <Home videos={videos} />;
}
