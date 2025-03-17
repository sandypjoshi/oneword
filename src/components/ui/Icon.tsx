import React from 'react';
import { SvgXml } from 'react-native-svg';

// SVG string content
const calendarSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z" stroke="currentColor" stroke-width="1.5"/>
  <path d="M7 4V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M17 4V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M2.5 9H21.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M18 17C18 17.5523 17.5523 18 17 18C16.4477 18 16 17.5523 16 17C16 16.4477 16.4477 16 17 16C17.5523 16 18 16.4477 18 17Z" fill="currentColor"/>
  <path d="M18 13C18 13.5523 17.5523 14 17 14C16.4477 14 16 13.5523 16 13C16 12.4477 16.4477 12 17 12C17.5523 12 18 12.4477 18 13Z" fill="currentColor"/>
  <path d="M13 17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16C12.5523 16 13 16.4477 13 17Z" fill="currentColor"/>
  <path d="M13 13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13C11 12.4477 11.4477 12 12 12C12.5523 12 13 12.4477 13 13Z" fill="currentColor"/>
  <path d="M8 17C8 17.5523 7.55228 18 7 18C6.44772 18 6 17.5523 6 17C6 16.4477 6.44772 16 7 16C7.55228 16 8 16.4477 8 17Z" fill="currentColor"/>
  <path d="M8 13C8 13.5523 7.55228 14 7 14C6.44772 14 6 13.5523 6 13C6 12.4477 6.44772 12 7 12C7.55228 12 8 12.4477 8 13Z" fill="currentColor"/>
</svg>
`;

const bookSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 8C4 5.17157 4 3.75736 4.87868 2.87868C5.75736 2 7.17157 2 10 2H14C16.8284 2 18.2426 2 19.1213 2.87868C20 3.75736 20 5.17157 20 8V16C20 18.8284 20 20.2426 19.1213 21.1213C18.2426 22 16.8284 22 14 22H10C7.17157 22 5.75736 22 4.87868 21.1213C4 20.2426 4 18.8284 4 16V8Z" stroke="currentColor" stroke-width="1.5"/>
  <path d="M19.8978 16H7.89778C6.96781 16 6.50282 16 6.12132 16.1022C5.08604 16.3796 4.2774 17.1883 4 18.2235" stroke="currentColor" stroke-width="1.5"/>
  <path d="M8 7H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M8 10.5H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
`;

const userSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/>
  <path d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" stroke="currentColor" stroke-width="1.5"/>
</svg>
`;

export type IconName = 
  | 'calendar'
  | 'book'
  | 'user';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const iconMap = {
  calendar: calendarSvg,
  book: bookSvg,
  user: userSvg,
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000' }) => {
  // Get the SVG string content
  const svgContent = iconMap[name];
  
  if (!svgContent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  // Replace 'currentColor' with the provided color
  const formattedSvg = svgContent.replace(/currentColor/g, color);

  return (
    <SvgXml xml={formattedSvg} width={size} height={size} />
  );
};

export default Icon; 