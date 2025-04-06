import React from 'react';
import { SvgXml } from 'react-native-svg';
import solarIcons from '@iconify-json/solar/icons.json';
import { useTheme } from '../../theme/ThemeProvider';

// Custom SVG for notes-bold icon with details
const notesBoldSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m2.755 14.716l.517 1.932c.604 2.255.907 3.383 1.592 4.114a4 4 0 0 0 2.01 1.16c.976.228 2.104-.074 4.36-.678c2.254-.604 3.382-.906 4.113-1.591q.091-.086.176-.176a9 9 0 0 1-1.014-.15c-.696-.138-1.523-.36-2.501-.622l-.107-.029l-.025-.006c-1.064-.286-1.953-.524-2.663-.78c-.747-.27-1.425-.603-2.002-1.143a5.5 5.5 0 0 1-1.596-2.765c-.18-.769-.128-1.523.012-2.304c.134-.749.374-1.647.662-2.722l.535-1.994l.018-.07c-1.92.517-2.931.823-3.605 1.454a4 4 0 0 0-1.161 2.012c-.228.975.074 2.103.679 4.358"/><path fill="currentColor" fill-rule="evenodd" d="m20.83 10.715l-.518 1.932c-.605 2.255-.907 3.383-1.592 4.114a4 4 0 0 1-2.01 1.161q-.145.034-.295.052c-.915.113-2.032-.186-4.064-.73c-2.255-.605-3.383-.907-4.114-1.592a4 4 0 0 1-1.161-2.011c-.228-.976.074-2.103.679-4.358l.517-1.932l.244-.905c.455-1.666.761-2.583 1.348-3.21a4 4 0 0 1 2.01-1.16c.976-.228 2.104.074 4.36.679c2.254.604 3.382.906 4.113 1.59a4 4 0 0 1 1.161 2.012c.228.976-.075 2.103-.679 4.358m-9.778-.91a.75.75 0 0 1 .919-.53l4.83 1.295a.75.75 0 1 1-.389 1.448l-4.83-1.294a.75.75 0 0 1-.53-.918m-.776 2.898a.75.75 0 0 1 .918-.53l2.898.777a.75.75 0 1 1-.388 1.448l-2.898-.776a.75.75 0 0 1-.53-.919" clip-rule="evenodd"/></svg>`;

// Custom SVG for circleOutline icon (empty circle)
const circleOutlineSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

// Custom SVG for volume-loud icon
const volumeLoudSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M14 14.7582S15 12.915 15 12c0-.9344-1-2.76816-1-2.76816m3.1271 8.2487S18.5 14.4453 18.5 12c0-2.44534-2.3729-5.48144-2.3729-5.48144M2.5 9.5c0-1.10457.89543-2 2-2h1.83791L11 3v18l-4.66209-4.5H4.5c-1.10457 0-2-.8954-2-2z"/></svg>`;

// Custom SVG for userRound icon
const userRoundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15c-3.866 0-7 1.79-7 4v1h14v-1c0-2.21-3.134-4-7-4z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;

// Custom SVG for flame icon (Replaced with user-provided Framework7 SVG)
const flameBoldSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 56 56"><path fill="currentColor" d="M8.125 37.398c0 9.516 7.781 16.243 18.75 16.243c12.445 0 21-8.04 21-21.258c0-20.625-18.094-30.024-31.289-30.024c-2.086 0-3.117 1.032-3.117 2.227c0 .96.515 1.758 1.289 2.86c1.875 2.577 5.062 6.327 5.062 11.038c0 .399-.023.797-.07 1.22c-1.312-2.462-3.633-4.196-6.445-4.196c-.797 0-1.219.469-1.219 1.148c0 .82.187 1.407.187 3.961c0 4.899-4.148 8.203-4.148 16.781m19.219 9.657c-4.688 0-7.805-2.836-7.805-7.055c0-4.43 3.14-6 3.563-8.86c.023-.234.187-.304.351-.14c1.172 1.008 1.899 2.273 2.461 3.727c.117.257.305.28.422.07c1.289-2.25 1.523-5.602 1.219-9.82c-.047-.235.117-.352.328-.258c5.555 2.531 8.39 8.039 8.39 12.984c0 4.969-2.93 9.352-8.93 9.352"/></svg>`;

// Extract icon data from the Solar icon set
const extractIconData = (iconName: string, variant: 'linear' | 'bold'): string | null => {
  // Special case for notes-bold
  if (iconName === 'notes' && variant === 'bold') {
    return notesBoldSvg;
  }
  
  // Special case for circleOutline
  if (iconName === 'circleOutline') {
    return circleOutlineSvg;
  }

  // Special case for volume-loud
  if (iconName === 'volumeLoud') {
    return volumeLoudSvg;
  }
  
  // Special case for userRound
  if (iconName === 'userRound') {
    return userRoundSvg;
  }
  
  // Special case for flame (now using flameBoldSvg)
  if (iconName === 'flame') {
    return flameBoldSvg;
  }

  // Map our icon names to Solar icon names
  const solarIconMap: Record<string, Record<string, string>> = {
    calendar: {
      linear: 'calendar-linear',
      bold: 'calendar-bold',
    },
    book: {
      linear: 'book-linear',
      bold: 'book-bold',
    },
    user: {
      linear: 'user-linear',
      bold: 'user-bold',
    },
    notes: {
      linear: 'notes-linear',
      bold: 'notes-bold', // This won't be used due to special case above
    },
    note: {
      linear: 'note-linear',
      bold: 'note-bold',
    },
    medalRibbon: {
      linear: 'medal-ribbon-linear',
      bold: 'medal-ribbon-bold',
    },
    academicCap: {
      linear: 'square-academic-cap-linear',
      bold: 'square-academic-cap-bold',
    },
    checkmark: {
      linear: 'check-linear',
      bold: 'check-circle-bold',
    },
    radio: {
      linear: 'circle-linear',
      bold: 'circle-bold',
    },
    checkCircleBold: {
      linear: 'check-circle-bold',
      bold: 'check-circle-bold',
    },
    altArrowRightLinear: {
      linear: 'alt-arrow-right-linear',
      bold: 'alt-arrow-right-bold',
    },
    volumeLoud: {
      linear: 'volume-loud-linear',
      bold: 'volume-loud-bold',
    },
    userRound: {
      linear: 'user-rounded-linear',
      bold: 'user-rounded-bold',
    },
    undoLeftRound: {
      linear: 'undo-left-round-linear',
      bold: 'undo-left-round-bold',
    },
    close: {
      linear: 'close-circle-linear',
      bold: 'close-circle-bold',
    },
    // circleOutline is handled by the special case above
  };

  // Get the Solar icon name
  const solarIconName = solarIconMap[iconName]?.[variant];
  if (!solarIconName) return null;

  // Try to find the icon in the Solar icon set
  const iconData = (solarIcons as any)?.icons?.[solarIconName]?.body;
  if (!iconData) return null;

  // Create a complete SVG string with the icon data
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${iconData}</svg>`;
};

export type IconName = 
  | 'calendar'
  | 'book'
  | 'user'
  | 'notes'
  | 'note'
  | 'medalRibbon'
  | 'academicCap'
  | 'checkmark'
  | 'radio'
  | 'checkCircleBold'
  | 'circleOutline'
  | 'altArrowRightLinear'
  | 'volumeLoud'
  | 'userRound'
  | 'undoLeftRound'
  | 'close'
  | 'flame';

export type IconVariant =
  | 'linear'
  | 'bold';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  variant?: IconVariant;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color, variant = 'linear' }) => {
  const { colors } = useTheme();
  // Use theme color as default if no color is provided
  const iconColor = color || colors.text.primary;
  
  // Get SVG content from Solar icon set
  const svgContent = extractIconData(name, variant);
  
  if (!svgContent) {
    console.warn(`Icon "${name}" with variant "${variant}" not found in Solar icon set`);
    return null;
  }

  // Replace 'currentColor' with the provided color
  const formattedSvg = svgContent.replace(/currentColor/g, iconColor);

  return (
    <SvgXml xml={formattedSvg} width={size} height={size} />
  );
};

export default Icon; 