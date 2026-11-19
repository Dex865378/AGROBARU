import React, { useState, useEffect } from 'react';
import {
  createInitialsAvatarDataUri,
  getCropImageByName,
  resolveAvatarUrl,
  resolveProductImage,
} from '@/lib/imageFallbacks';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'product' | 'avatar';
  cropHint?: string;
  nameHint?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  fallbackType = 'product',
  cropHint,
  nameHint,
  onError,
  ...props
}) => {
  const computeInitialSrc = () => {
    if (fallbackType === 'avatar') {
      return resolveAvatarUrl(src, nameHint || alt);
    }
    return resolveProductImage(src, cropHint || alt);
  };

  const computeHardFallback = () => {
    if (fallbackType === 'avatar') {
      return createInitialsAvatarDataUri(nameHint || alt);
    }
    return getCropImageByName(cropHint || alt);
  };

  const [imgSrc, setImgSrc] = useState<string>(computeInitialSrc);

  useEffect(() => {
    setImgSrc(computeInitialSrc());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, fallbackType, cropHint, nameHint, alt]);

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={(e) => {
        const hardFallback = computeHardFallback();
        if (imgSrc !== hardFallback) {
          setImgSrc(hardFallback);
        }
        onError?.(e);
      }}
    />
  );
};
