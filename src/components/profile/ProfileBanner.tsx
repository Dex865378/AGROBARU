import React, { useState } from 'react';

interface ProfileBannerProps {
  src?: string | null;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Portada de perfil sin recortes ni zoom.
 *
 * La imagen completa se muestra con `object-contain`. Detrás se pinta una
 * copia desenfocada que rellena el espacio sobrante para que el banner no
 * tenga franjas negras. Las imágenes horizontales ocupan todo el ancho y las
 * verticales se limitan en altura para no romper el perfil.
 */
export const ProfileBanner: React.FC<ProfileBannerProps> = ({
  src,
  alt,
  className = '',
  children,
}) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string | undefined>(undefined);

  if (!src) {
    return (
      <div className={`relative overflow-hidden bg-[#0A0A0A] ${className}`}>
        <div className="h-40 w-full bg-[radial-gradient(circle_at_20%_20%,#15803D_0%,transparent_45%),radial-gradient(circle_at_80%_30%,#7C3AED_0%,transparent_40%),linear-gradient(135deg,#0A0A0A,#111714)]" />
        {children}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#0A0A0A] ${
        isPortrait ? 'h-44 sm:h-60' : 'max-h-[600px]'
      } ${className}`}
      style={!isPortrait && aspectRatio ? { aspectRatio } : undefined}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
        style={{ backgroundImage: `url("${src}")` }}
      />
      <img
        src={src}
        alt={alt}
        onLoad={(event) => {
          const image = event.currentTarget;
          const portrait = image.naturalHeight > image.naturalWidth;
          setIsPortrait(portrait);
          setAspectRatio(
            portrait ? undefined : `${image.naturalWidth} / ${image.naturalHeight}`,
          );
        }}
        className="absolute inset-0 z-10 h-full w-full object-contain"
      />
      {children}
    </div>
  );
};
