import React from 'react';
import { Fraction, MixedNumber } from '../types';

interface FractionDisplayProps {
  fraction?: Fraction;
  mixed?: MixedNumber;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const FractionDisplay: React.FC<FractionDisplayProps> = ({ fraction, mixed, className = '', size = 'md' }) => {
  const textSize = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  }[size];

  const borderSize = {
    sm: 'border-t',
    md: 'border-t-2',
    lg: 'border-t-4',
    xl: 'border-t-4',
  }[size];

  if (mixed) {
    return (
      <div className={`flex items-center font-bold font-sans ${className} ${textSize}`}>
        <span className="mr-2">{mixed.whole}</span>
        <div className="flex flex-col items-center">
          <span>{mixed.fraction.num}</span>
          <div className={`w-full ${borderSize} border-current opacity-80 my-0.5`}></div>
          <span>{mixed.fraction.den}</span>
        </div>
      </div>
    );
  }

  if (fraction) {
    return (
      <div className={`flex flex-col items-center font-bold font-sans ${className} ${textSize} inline-flex align-middle`}>
        <span>{fraction.num}</span>
        <div className={`w-full ${borderSize} border-current opacity-80 my-0.5`}></div>
        <span>{fraction.den}</span>
      </div>
    );
  }

  return null;
};
