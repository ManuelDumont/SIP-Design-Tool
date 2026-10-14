import React from 'react';
import { VODAFONE_ZIGGO_LOGO_DATA_URL } from './vodafoneZiggoLogoData';

interface VodafoneZiggoLogoProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  alt?: string;
}

/**
 * Officieel origineel VodafoneZiggo logo, perfect geschaald en haarscherp gerenderd.
 * Ingesloten als base64 data-URL zodat export naar .png (via html-to-image) gegarandeerd 
 * zonder CORS- of laadvertraging meegenomen wordt.
 */
export function VodafoneZiggoLogo({ 
  className = 'h-7 w-auto', 
  height, 
  width,
  alt = 'VodafoneZiggo' 
}: VodafoneZiggoLogoProps) {
  return (
    <img 
      src={VODAFONE_ZIGGO_LOGO_DATA_URL}
      alt={alt}
      className={`object-contain select-none shrink-0 ${className}`}
      style={{ 
        height: height || undefined, 
        width: width || undefined 
      }}
      draggable={false}
      aria-label="VodafoneZiggo Logo"
    />
  );
}
