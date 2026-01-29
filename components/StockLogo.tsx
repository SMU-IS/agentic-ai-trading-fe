'use client';

import { useState } from 'react';

interface StockLogoProps {
  symbol: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export default function StockLogo({
  symbol,
  name,
  size = 'md',
  className = '',
}: StockLogoProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = SIZE_CLASSES[size];
  const LOGOKIT_API_KEY = process.env.NEXT_PUBLIC_LOGOKIT_API_KEY;

  if (imageError) {
    return (
      <div
        className={`${sizeClass} ${className} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white`}
      >
        {symbol.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={`https://img.logokit.com/ticker/${symbol.toUpperCase()}?token=${LOGOKIT_API_KEY}`}
      alt={name || symbol}
      className={`${sizeClass} ${className} rounded-full object-cover border-none bg-black p-0.2`}
      onError={() => setImageError(true)}
    />
  );
}
// https://img.logokit.com/ticker/ABNB?token=pk_frbf5278b9ee21ccd9bbae
// https://img.logokit.com/apple.com?token=pk_frbf5278b9ee21ccd9bbae
