import React from 'react';

interface IntroBackdropProps {
  visible: boolean;
}

const HERO_POSTER =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_b7826239-e451-4e15-b42b-d6bcf9497a32.png';

export const IntroBackdrop: React.FC<IntroBackdropProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div
      id="intro-backdrop"
      className="fixed -inset-10 z-0 pointer-events-none transition-opacity duration-1000 ease-out"
      style={{
        backgroundImage: `url(${HERO_POSTER})`,
        backgroundPosition: 'center 70%',
        backgroundSize: 'cover',
        filter: 'blur(18px) saturate(1.1)',
        transform: 'scale(1.3)',
      }}
      aria-hidden="true"
    />
  );
};

