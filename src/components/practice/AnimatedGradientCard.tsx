import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, useColorScheme, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Canvas,
  Vertices,
  vec,
  Group,
} from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = height * 0.7;

// Increase resolution for smoother gradients
const ROWS = 32;
const COLS = 32;

// Add type definitions
interface Point {
  x: number;
  y: number;
}

interface ControlPoint {
  x: number;
  y: number;
  color: string;
  influence: number;
}

interface NoisePoint {
  angle: number;
  strength: number;
}

interface MeshData {
  points: Point[];
  colors: string[];
  indices: number[];
}

// Natural color palettes inspired by real world phenomena
const GRADIENTS = {
  light: [
    // Morning Sky - Added deeper blue for dawn transition
    ['#E9FAFF', '#FFD6E6', '#FFF5DE', '#BCD7FF'],
    // Spring Meadow
    ['#E5F5D5', '#BFECD1', '#EBF9FC'],
    // Desert Sunrise - Added deeper orange
    ['#FFFBD9', '#FFDACF', '#E3D8F0', '#FFBD9E'],
    // Coastal Reef
    ['#D4F8FC', '#D7F2FF', '#E6ECFA'],
    // Autumn Leaves - Added deep amber
    ['#FFFBD9', '#FFDBAA', '#FFC2AB', '#E6A677'],
    // Cherry Blossom
    ['#FACCE0', '#EACDF2', '#DAEEFF'],
    // Mountain Vista
    ['#F0FAF2', '#D2F0EB', '#E5F099'],
    // Tropical Lagoon - Added teal
    ['#B9E5FF', '#8FDEFF', '#D0F1FF', '#8EDBCC'],
    // Lavender Fields
    ['#E2D9F2', '#C8B5E8', '#ECD5F5'],
    // Coral Garden
    ['#FFEBD0', '#FFBFAA', '#C5F0F7'],
    // Misty Morning
    ['#EBF8F7', '#E5F5D5', '#F6FBF2'],
    // Sunset Beach - Added sunset red
    ['#FFEBD0', '#FFDACF', '#CEEAFF', '#FFB5AB'],
  ],
  dark: [
    // Night Sky - Enhanced with deeper blues and subtle highlight
    ['#0D1B2A', '#1B263B', '#2A3240', '#405A7E'],
    // Deep Ocean - Added teal accent for underwater distinction
    ['#01242F', '#0A3240', '#143B4F', '#1D5A6B'],
    // Forest Twilight - More distinct forest greens and blues
    ['#1A1A1D', '#252837', '#1F3A4C', '#213326'],
    // Starry Nebula - Clearer distinction between purple tones
    ['#171E4A', '#251643', '#3A1250', '#0A0920'],
    // Volcanic Rock - Added subtle ember glow
    ['#212121', '#2D2A2A', '#393D42', '#4D3A38'],
    // Midnight Forest - Enhanced contrast between forest tones
    ['#1B1B24', '#1A2C2F', '#1A4A1D', '#0F2F1A'],
    // Northern Lights - More vibrant aurora accent
    ['#0E151B', '#0E3746', '#07485B', '#0B5C4E'],
    // Cosmic Dust - Added distant star hint
    ['#1A1F35', '#0D2C48', '#193648', '#2B3359'],
    // Ember Glow - More distinct ember color separation
    ['#1A1A1D', '#271316', '#4F100C', '#2D0404'],
    // Deep Amethyst - Richer, more distinct purples
    ['#1A1A2E', '#16213E', '#321850', '#100A26'],
    // Midnight Garden - Added moonlight accent
    ['#111D13', '#1D3124', '#2D4739', '#243145'],
    // Twilight Harbor - Added water reflection
    ['#10151C', '#1E252F', '#22303B', '#2A4250'],
    // Shadow Lake - More distinct contrast in blues
    ['#121619', '#151E24', '#1C2C38', '#243243'],
    // Mountain Twilight - Added distant peak highlight
    ['#14151F', '#1F2133', '#272B42', '#383D5E'],
    // Moonlit Forest - Enhanced contrast between foliage and sky
    ['#0F1A17', '#172A25', '#203B32', '#122536'],
  ]
};

// Helper function for smooth interpolation
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// Memoize the indices calculation since it never changes
const MEMOIZED_INDICES = (() => {
  const indices: number[] = [];
  for (let y = 0; y < ROWS - 1; y++) {
    for (let x = 0; x < COLS - 1; x++) {
      const i = y * COLS + x;
      indices.push(i, i + 1, i + COLS);
      indices.push(i + 1, i + COLS + 1, i + COLS);
    }
  }
  return indices;
})();

// Enhanced mesh creation with ultra-smooth transitions
const createMeshPoints = (isDarkMode = false): MeshData => {
  const points: Point[] = [];
  const colors: string[] = [];
  
  const cellWidth = CARD_WIDTH / (COLS - 1);
  const cellHeight = CARD_HEIGHT / (ROWS - 1);
  
  const colorSet = isDarkMode ? GRADIENTS.dark : GRADIENTS.light;
  const gradient = colorSet[Math.floor(Math.random() * colorSet.length)];

  // Enhanced smoothing parameters - reduce the difference between modes
  const smoothingFactor = isDarkMode ? 0.028 : 0.025; // Less difference
  const falloffPower = isDarkMode ? 2.5 : 2.8; // Less difference
  const noiseStrengthFactor = 0.35; // Same for both modes
  
  // More balanced influence areas
  const influenceMultiplier = isDarkMode ? 1.2 : 1.1; 
  
  // Create flow directions once
  const baseAngle = Math.random() * Math.PI * 2;
  const angleOffset = Math.PI * (0.25 + Math.random() * 0.3);
  
  const flow1 = { 
    x: Math.cos(baseAngle), 
    y: Math.sin(baseAngle) 
  };
  
  const flow2 = { 
    x: Math.cos(baseAngle + angleOffset), 
    y: Math.sin(baseAngle + angleOffset) 
  };
  
  const flow3 = { 
    x: Math.cos(baseAngle - angleOffset * 0.7), 
    y: Math.sin(baseAngle - angleOffset * 0.7) 
  };

  // Center offset calculations
  const centerOffsetX = -0.05 + Math.random() * 0.1;
  const centerOffsetY = -0.05 + Math.random() * 0.1;
  
  // Prepare control points
  const controlPoints: ControlPoint[] = [];
  
  // Control point adding function
  const addControlPoint = (radius: number, angle: number, color: string, influence: number): void => {
    const x = 0.5 + centerOffsetX + Math.cos(angle) * radius;
    const y = 0.5 + centerOffsetY + Math.sin(angle) * radius;
    controlPoints.push({
      x: Math.max(0.1, Math.min(0.9, x)),
      y: Math.max(0.1, Math.min(0.9, y)),
      color,
      influence: influence * influenceMultiplier
    });
  };
  
  // Add points with natural distribution
  const numPoints = 5 + Math.floor(Math.random() * 2);
  const baseRadius = 0.25 + Math.random() * 0.15;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 + Math.random() * 0.3;
    const radiusVar = baseRadius * (0.8 + Math.random() * 0.4);
    const colorIndex = i % gradient.length;
    const influence = 0.35 + Math.random() * 0.25;
    
    addControlPoint(radiusVar, angle, gradient[colorIndex], influence);
  }
  
  // Add central points for smooth blending
  const centerRadiusRange = isDarkMode ? [0.15, 0.25] : [0.1, 0.2];
  const centerRadius = centerRadiusRange[0] + Math.random() * (centerRadiusRange[1] - centerRadiusRange[0]);
  const centerAngle = Math.random() * Math.PI * 2;
  const colorIndex = Math.floor(Math.random() * gradient.length);
  addControlPoint(centerRadius, centerAngle, gradient[colorIndex], 0.4 + Math.random() * 0.2);

  // Add corner control points
  const cornerInfluence = 0.3;
  const cornerOffset = 0.05;
  
  const corners = [
    { x: cornerOffset, y: cornerOffset },
    { x: 1 - cornerOffset, y: cornerOffset },
    { x: cornerOffset, y: 1 - cornerOffset },
    { x: 1 - cornerOffset, y: 1 - cornerOffset },
  ];
  
  corners.forEach(corner => {
    // Find nearest existing control point
    let nearestPoint = controlPoints[0];
    let minDistance = 999;
    
    controlPoints.forEach(point => {
      const dx = corner.x - point.x;
      const dy = corner.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    });
    
    // Add corner point
    controlPoints.push({
      x: corner.x,
      y: corner.y,
      color: nearestPoint.color,
      influence: cornerInfluence
    });
  });

  // Create optimized noise field
  const noiseField: NoisePoint[][] = Array(ROWS);
  for (let y = 0; y < ROWS; y++) {
    noiseField[y] = Array(COLS);
    for (let x = 0; x < COLS; x++) {
      const nx = x / (COLS - 1);
      const ny = y / (ROWS - 1);
      
      const angle = 
        Math.sin(nx * 2.7 + ny * 3.2) * Math.PI + 
        Math.cos(nx * 1.8 - ny * 2.4) * Math.PI * 0.6 +
        Math.sin((nx + ny) * 2.1) * Math.PI * 0.4;
      
      const strength = 
        (Math.sin(nx * 2.3 + ny * 2.7) * 0.4 + 0.6) * 
        (Math.cos(nx * 2.1 - ny * 1.8) * 0.2 + 0.8);
      
      noiseField[y][x] = { angle, strength };
    }
  }

  // Pre-allocate points array to reduce memory allocations
  points.length = ROWS * COLS;
  colors.length = ROWS * COLS;

  // Generate mesh points with optimized memory usage
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const index = y * COLS + x;
      const nx = x / (COLS - 1);
      const ny = y / (ROWS - 1);
      
      // Create vertex position
      points[index] = { 
        x: x * cellWidth,
        y: y * cellHeight
      };

      // Calculate flow values
      const flowValue1 = (nx * flow1.x + ny * flow1.y) * 0.5 + 0.5; 
      const flowValue2 = (nx * flow2.x + ny * flow2.y) * 0.5 + 0.5;
      const flowValue3 = (nx * flow3.x + ny * flow3.y) * 0.5 + 0.5;
      
      // Get noise
      const noise = noiseField[y][x];
      
      // Setup for color blending
      const blendedColor = { r: 0, g: 0, b: 0 };
      
      // Check if near corner for extra smoothing
      const isCorner = (nx <= 0.1 || nx >= 0.9) && (ny <= 0.1 || ny >= 0.9);
      const localSmoothingFactor = isCorner ? smoothingFactor * 1.5 : smoothingFactor;
      const localFalloffPower = isCorner ? falloffPower * 0.9 : falloffPower;
      
      // Calculate weights
      const weights: number[] = [];
      let totalWeight = 0;
      
      for (let i = 0; i < controlPoints.length; i++) {
        const point = controlPoints[i];
        const dx = nx - point.x;
        const dy = ny - point.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy + localSmoothingFactor);
        
        // Calculate flow influences
        const flowMix1 = Math.sin(flowValue1 * Math.PI * 1.5 + noise.angle * 0.4) * 0.5 + 0.5;
        const flowMix2 = Math.sin(flowValue2 * Math.PI * 1.5 - noise.angle * 0.5) * 0.5 + 0.5;
        const flowMix3 = Math.sin(flowValue3 * Math.PI * 1.5 + noise.angle * 0.3) * 0.5 + 0.5;
        
        const flowFactor = (
          flowMix1 * 0.35 + 
          flowMix2 * 0.35 + 
          flowMix3 * 0.3
        ) * noise.strength * noiseStrengthFactor + 0.85;
        
        const weight = Math.pow(
          Math.max(0, 1 - distance / (point.influence * flowFactor)), 
          localFalloffPower
        );
        
        weights[i] = weight;
        totalWeight += weight;
      }
      
      if (totalWeight === 0) {
        // Fallback
        colors[index] = gradient[0];
        continue;
      }
      
      // Blend colors
      for (let i = 0; i < controlPoints.length; i++) {
        const normalizedWeight = weights[i] / totalWeight;
        const color = controlPoints[i].color;
        
        // RGB color parsing with bit manipulation for performance
        const r = Math.pow(parseInt(color.slice(1, 3), 16) / 255, 2.2);
        const g = Math.pow(parseInt(color.slice(3, 5), 16) / 255, 2.2);
        const b = Math.pow(parseInt(color.slice(5, 7), 16) / 255, 2.2);
        
        blendedColor.r += r * normalizedWeight;
        blendedColor.g += g * normalizedWeight;
        blendedColor.b += b * normalizedWeight;
      }

      // Convert back to hex with faster calculation
      const r = Math.min(255, Math.max(0, Math.round(Math.pow(blendedColor.r, 1/2.2) * 255))).toString(16).padStart(2, '0');
      const g = Math.min(255, Math.max(0, Math.round(Math.pow(blendedColor.g, 1/2.2) * 255))).toString(16).padStart(2, '0');
      const b = Math.min(255, Math.max(0, Math.round(Math.pow(blendedColor.b, 1/2.2) * 255))).toString(16).padStart(2, '0');
      
      colors[index] = `#${r}${g}${b}`;
    }
  }

  return { points, colors, indices: MEMOIZED_INDICES };
};

interface MeshGradientCardProps {
  title: string;
  description: string;
}

const MeshGradientCard: React.FC<MeshGradientCardProps> = React.memo(({
  title,
  description,
}) => {
  const theme = useTheme();
  const deviceColorScheme = useColorScheme();
  const isDark = deviceColorScheme === 'dark';
  
  // Use useRef for mesh data to prevent unnecessary re-renders
  const meshRef = useRef<MeshData | null>(null);
  
  // Use useState for forcing re-renders when mesh changes
  const [meshVersion, setMeshVersion] = useState(0);
  
  // Initialize mesh if not already done
  if (!meshRef.current) {
    meshRef.current = createMeshPoints(isDark);
  }
  
  // Update mesh when color scheme changes
  React.useEffect(() => {
    meshRef.current = createMeshPoints(isDark);
    setMeshVersion(prev => prev + 1); // Force re-render
    
    // Return cleanup function
    return () => {
      // No specific cleanup needed for mesh data
    };
  }, [isDark]);

  // Memoize border color based on theme
  const borderColor = useMemo(() => 
    isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)'
  , [isDark]);
  
  // Use useCallback for event handlers to prevent unnecessary recreations
  const handleChangeGradient = useCallback(() => {
    meshRef.current = createMeshPoints(isDark);
    setMeshVersion(prev => prev + 1); // Force re-render
  }, [isDark]);
  
  // Extract mesh data for rendering
  const mesh = meshRef.current;

  // Memoize text colors
  const titleColor = useMemo(() => 
    isDark ? '#FFFFFF' : '#000000'
  , [isDark]);
  
  const descriptionColor = useMemo(() => 
    isDark ? '#EEEEEE' : '#333333'
  , [isDark]);
  
  const buttonBackgroundColor = useMemo(() => 
    isDark ? '#FFFFFF20' : '#00000010'
  , [isDark]);

  // Early return if mesh is not ready
  if (!mesh) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Canvas for gradient */}
        <Canvas style={styles.canvas}>
          <Group>
            <Vertices
              vertices={mesh.points}
              colors={mesh.colors}
              indices={mesh.indices}
            />
          </Group>
        </Canvas>
        
        {/* Inner border overlay with blend mode */}
        <View style={[
          styles.innerBorder, 
          { borderColor }
        ]} />
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: titleColor }]}>
            {title}
          </Text>
          <Text style={[styles.description, { color: descriptionColor }]}>
            {description}
          </Text>
        </View>
      </View>
      <Pressable 
        style={({ pressed }) => [
          styles.button,
          { 
            opacity: pressed ? 0.8 : 1,
            backgroundColor: buttonBackgroundColor 
          }
        ]}
        onPress={handleChangeGradient}
      >
        <Text style={[styles.buttonText, { color: titleColor }]}>
          Change Gradient
        </Text>
      </Pressable>
    </View>
  );
});

// Memoize styles to prevent recreation on each render
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 80,
    width: '100%',
    height: CARD_HEIGHT + 100, // Increased to accommodate button
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: 'relative',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 24,
    // borderColor set dynamically based on color scheme
  },
  canvas: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  content: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 20,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 28,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default MeshGradientCard; 