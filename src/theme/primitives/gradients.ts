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
    // Morning Sky - Soft blues and pinks of dawn sky
    {
      id: 'morning-sky',
      name: 'Morning Sky',
      colors: ['#E9FAFF', '#FFD6E6', '#FFF5DE', '#BCD7FF'],
      description: 'Soft blues and pinks of dawn sky'
    },
    
    // Spring Meadow - Fresh greens and cool blues of spring
    {
      id: 'spring-meadow',
      name: 'Spring Meadow',
      colors: ['#E5F5D5', '#BFECD1', '#EBF9FC'],
      description: 'Fresh greens and cool blues of spring'
    },
    
    // Desert Sunrise - Warm ochres and cool violets
    {
      id: 'desert-sunrise',
      name: 'Desert Sunrise',
      colors: ['#FFFBD9', '#FFDACF', '#E3D8F0', '#FFBD9E'],
      description: 'Warm desert hues at sunrise'
    },
    
    // Coastal Reef - Vibrant aquatic blues
    {
      id: 'coastal-reef',
      name: 'Coastal Reef',
      colors: ['#D4F8FC', '#D7F2FF', '#E6ECFA'],
      description: 'Clear waters of coastal reef'
    },
    
    // Autumn Leaves - Warm golds and deep ambers
    {
      id: 'autumn-leaves',
      name: 'Autumn Leaves',
      colors: ['#FFFBD9', '#FFDBAA', '#FFC2AB', '#E6A677'],
      description: 'Warm autumn foliage colors'
    },
    
    // Cherry Blossom - Delicate pinks with cool undertones
    {
      id: 'cherry-blossom',
      name: 'Cherry Blossom',
      colors: ['#FACCE0', '#EACDF2', '#DAEEFF'],
      description: 'Delicate pink cherry blossoms'
    },
    
    // Mountain Vista - Crisp greens and distant blues
    {
      id: 'mountain-vista',
      name: 'Mountain Vista',
      colors: ['#F0FAF2', '#D2F0EB', '#E5F099'],
      description: 'Mountain landscape with distant haze'
    },
    
    // Tropical Lagoon - Bright blue water tones
    {
      id: 'tropical-lagoon',
      name: 'Tropical Lagoon',
      colors: ['#B9E5FF', '#8FDEFF', '#D0F1FF', '#8EDBCC'],
      description: 'Vibrant tropical waters'
    },
    
    // Lavender Fields - Soft purple variations
    {
      id: 'lavender-fields',
      name: 'Lavender Fields',
      colors: ['#E2D9F2', '#C8B5E8', '#ECD5F5'],
      description: 'Rolling fields of lavender'
    },
    
    // Coral Garden - Delicate coral reef hues
    {
      id: 'coral-garden',
      name: 'Coral Garden',
      colors: ['#FFEBD0', '#FFBFAA', '#C5F0F7'],
      description: 'Vibrant coral reef colors'
    },
    
    // Misty Morning - Soft, muted foggy morning
    {
      id: 'misty-morning',
      name: 'Misty Morning',
      colors: ['#EBF8F7', '#E5F5D5', '#F6FBF2'],
      description: 'Foggy morning with gentle hues'
    },
    
    // Sunset Beach - Warm sunset against cool water
    {
      id: 'sunset-beach',
      name: 'Sunset Beach',
      colors: ['#FFEBD0', '#FFDACF', '#CEEAFF', '#FFB5AB'],
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