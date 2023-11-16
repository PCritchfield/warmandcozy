import React, { useState } from 'react';

export default function Home({ videos }) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleVideoEnd = () => {
    const nextVideoIndex = (currentVideoIndex + 1) % videos.length;
    setCurrentVideoIndex(nextVideoIndex);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <video 
            autoPlay 
            controls 
            loop={videos.length === 1}
            onEnded={handleVideoEnd}
          >
            <source src={videos[currentVideoIndex]} type='video/mp4' />
          </video>
        </div>
      </div>
    </main>
  );
}
