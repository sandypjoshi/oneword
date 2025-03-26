/**
 * Gradient Primitives for OneWord App
 * 
 * This file defines color palette combinations for mesh gradients throughout the app.
 * Each gradient palette is designed to work with the current theme and adapts to light/dark mode.
 * Gradients are categorized by visual theme and follow nature-inspired color combinations.
 * 
 * The exact color values are derived from MeshGradientCard implementation for perfect compatibility.
 */

// Type definition for color mode from ThemeProvider
export type ColorMode = 'light' | 'dark' | 'system';

/**
 * Defines a single gradient color palette
 */
export interface GradientPalette {
  /** Unique identifier for the gradient */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Array of colors (3-4 colors recommended) */
  colors: string[];
  
  /** Optional description of the visual effect */
  description?: string;
}

/**
 * Gradients organized by theme (light/dark)
 */
export type GradientTheme = {
  [key in ColorMode]: GradientPalette[];
};

/**
 * Complete gradient collection with light and dark variants
 * Using exact color values from MeshGradientCard implementation
 */
export const gradients: GradientTheme = {
  light: [
    // Morning Sky - Soft blues and pinks of dawn sky - Very Light
    {
      id: 'morning-sky',
      name: 'Morning Sky',
      colors: ['#F2FDFF', '#FFEDF5', '#FFFAEF', '#DEE9FF'],
      description: 'Soft blues and pinks of dawn sky'
    },
    
    // Spring Meadow - Fresh greens and cool blues of spring - Very Light
    {
      id: 'spring-meadow',
      name: 'Spring Meadow',
      colors: ['#F2FBEA', '#E0F6E9', '#F5FCFE'],
      description: 'Fresh greens and cool blues of spring'
    },
    
    // Desert Sunrise - Warm ochres and cool violets - Very Light
    {
      id: 'desert-sunrise',
      name: 'Desert Sunrise',
      colors: ['#FFFDF0', '#FFF0EA', '#F4EDF9', '#FFE1D4'],
      description: 'Warm desert hues at sunrise'
    },
    
    // Coastal Reef - Vibrant aquatic blues - Very Light
    {
      id: 'coastal-reef',
      name: 'Coastal Reef',
      colors: ['#E8FCFE', '#EBFAFF', '#F2F6FC'],
      description: 'Clear waters of coastal reef'
    },
    
    // Autumn Leaves - Warm golds and deep ambers - Very Light
    {
      id: 'autumn-leaves',
      name: 'Autumn Leaves',
      colors: ['#FFFDF0', '#FFF2DB', '#FFE6DE', '#FFCEB1'],
      description: 'Warm autumn foliage colors'
    },
    
    // Cherry Blossom - Delicate pinks with cool undertones - Balanced
    {
      id: 'cherry-blossom',
      name: 'Cherry Blossom',
      colors: ['#FBE0F0', '#F0DAF7', '#E4F0FF'],
      description: 'Delicate pink cherry blossoms'
    },
    
    // Mountain Vista - Crisp greens and distant blues - Very Light
    {
      id: 'mountain-vista',
      name: 'Mountain Vista',
      colors: ['#F7FCF8', '#E9F8F5', '#F2FAD4'],
      description: 'Mountain landscape with distant haze'
    },
    
    // Tropical Lagoon - Bright blue water tones - Very Light
    {
      id: 'tropical-lagoon',
      name: 'Tropical Lagoon',
      colors: ['#D9F0FF', '#C6EEFF', '#E6F8FF', '#C6EEE2'],
      description: 'Vibrant tropical waters'
    },
    
    // Lavender Fields - Soft purple variations - Very Light
    {
      id: 'lavender-fields',
      name: 'Lavender Fields',
      colors: ['#F2EEFA', '#E5DBFA', '#F7EEFA'],
      description: 'Rolling fields of lavender'
    },
    
    // Coral Garden - Delicate coral reef hues - Very Light
    {
      id: 'coral-garden',
      name: 'Coral Garden',
      colors: ['#FFF8F0', '#FFE3DC', '#E5FAFD'],
      description: 'Vibrant coral reef colors'
    },
    
    // Misty Morning - Soft, muted foggy morning - Balanced
    {
      id: 'misty-morning',
      name: 'Misty Morning',
      colors: ['#E0F0EE', '#E2F0D2', '#EDF4E8'],
      description: 'Foggy morning with gentle hues'
    },
    
    // Sunset Beach - Warm sunset against cool water - Very Light
    {
      id: 'sunset-beach',
      name: 'Sunset Beach',
      colors: ['#FFF8F0', '#FFF0EA', '#E8F5FF', '#FFE2DE'],
      description: 'Warm sunset over cool waters'
    }
  ],
  
  dark: [
    // Night Sky - Deep blues and subtle stars
    {
      id: 'night-sky',
      name: 'Night Sky',
      colors: ['#0D1B2A', '#1B263B', '#2A3240', '#405A7E'],
      description: 'Deep blues of the night sky'
    },
    
    // Deep Ocean - Dark teal-blues of ocean depths
    {
      id: 'deep-ocean',
      name: 'Deep Ocean',
      colors: ['#01242F', '#0A3240', '#143B4F', '#1D5A6B'],
      description: 'Dark blue-greens of ocean depths'
    },
    
    // Forest Twilight - Mysterious forest at dusk
    {
      id: 'forest-twilight',
      name: 'Forest Twilight',
      colors: ['#1A1A1D', '#252837', '#1F3A4C', '#213326'],
      description: 'Mysterious forest at dusk'
    },
    
    // Starry Nebula - Deep space with cosmic dust
    {
      id: 'starry-nebula',
      name: 'Starry Nebula',
      colors: ['#171E4A', '#251643', '#3A1250', '#0A0920'],
      description: 'Cosmic nebula with vibrant dust clouds'
    },
    
    // Volcanic Rock - Dark stone with ember undertones
    {
      id: 'volcanic-rock',
      name: 'Volcanic Rock',
      colors: ['#212121', '#2D2A2A', '#393D42', '#4D3A38'],
      description: 'Dark cooling volcanic rock'
    },
    
    // Midnight Forest - Deep greens in nighttime forest
    {
      id: 'midnight-forest',
      name: 'Midnight Forest',
      colors: ['#1B1B24', '#1A2C2F', '#1A4A1D', '#0F2F1A'],
      description: 'Deep forest illuminated by moonlight'
    },
    
    // Northern Lights - Dark sky with subtle aurora
    {
      id: 'northern-lights',
      name: 'Northern Lights',
      colors: ['#0E151B', '#0E3746', '#07485B', '#0B5C4E'],
      description: 'Dark sky with subtle aurora activity'
    },
    
    // Cosmic Dust - Scattered space dust against darkness
    {
      id: 'cosmic-dust',
      name: 'Cosmic Dust',
      colors: ['#1A1F35', '#0D2C48', '#193648', '#2B3359'],
      description: 'Scattered cosmic dust against darkness'
    },
    
    // Ember Glow - Smoldering embers and dark charcoal
    {
      id: 'ember-glow',
      name: 'Ember Glow',
      colors: ['#1A1A1D', '#271316', '#4F100C', '#2D0404'],
      description: 'Smoldering embers against dark charcoal'
    },
    
    // Deep Amethyst - Rich purples of precious gemstone
    {
      id: 'deep-amethyst',
      name: 'Deep Amethyst',
      colors: ['#1A1A2E', '#16213E', '#321850', '#100A26'],
      description: 'Rich purples of a deep amethyst'
    },
    
    // Midnight Garden - Deep foliage with moonlight
    {
      id: 'midnight-garden',
      name: 'Midnight Garden',
      colors: ['#111D13', '#1D3124', '#2D4739', '#243145'],
      description: 'Midnight garden under moonlight'
    },
    
    // Twilight Harbor - Evening water reflections
    {
      id: 'twilight-harbor',
      name: 'Twilight Harbor',
      colors: ['#10151C', '#1E252F', '#22303B', '#2A4250'],
      description: 'Harbor waters at twilight'
    },
    
    // Shadow Lake - Deep water shadows
    {
      id: 'shadow-lake',
      name: 'Shadow Lake',
      colors: ['#121619', '#151E24', '#1C2C38', '#243243'],
      description: 'Deep shadowy lake waters'
    },
    
    // Mountain Twilight - Twilight hues on distant peaks
    {
      id: 'mountain-twilight',
      name: 'Mountain Twilight',
      colors: ['#14151F', '#1F2133', '#272B42', '#383D5E'],
      description: 'Twilight colors on distant peaks'
    },
    
    // Moonlit Forest - Cool blues on forest foliage
    {
      id: 'moonlit-forest',
      name: 'Moonlit Forest',
      colors: ['#0F1A17', '#172A25', '#203B32', '#122536'],
      description: 'Forest bathed in moonlight'
    }
  ],
  // System mode just references light mode gradients
  system: []  // This will be filled at runtime with either light or dark
};

// System mode references light mode for now (it will be overridden by the user's system preference)
gradients.system = gradients.light;

/**
 * Get a random gradient from the current color mode
 */
export const getRandomGradient = (colorMode: ColorMode): GradientPalette => {
  const availableGradients = gradients[colorMode];
  const randomIndex = Math.floor(Math.random() * availableGradients.length);
  return availableGradients[randomIndex];
};

/**
 * Get a specific gradient by ID for the current color mode
 */
export const getGradientById = (id: string, colorMode: ColorMode): GradientPalette | undefined => {
  return gradients[colorMode].find(gradient => gradient.id === id);
};

/**
 * Get all gradient IDs for the current color mode
 */
export const getGradientIds = (colorMode: ColorMode): string[] => {
  return gradients[colorMode].map(gradient => gradient.id);
}; 