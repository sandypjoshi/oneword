import React from 'react';
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

// Natural color palettes inspired by real world phenomena
const GRADIENTS = {
  light: [
    // Morning Sky
    ['#E0F7FF', '#FFC8DD', '#FFEFCF'],
    // Spring Meadow
    ['#DCEDC8', '#A8DDB5', '#E0F7FA'],
    // Desert Sunrise
    ['#FFF9C4', '#FFCCBC', '#D1C4E9'],
    // Coastal Reef
    ['#B2EBF2', '#B3E5FC', '#C5CAE9'],
    // Autumn Leaves
    ['#FFF9C4', '#FFCC80', '#FFAB91'],
    // Cherry Blossom
    ['#F8BBD0', '#E1BEE7', '#BBDEFB'],
    // Mountain Vista
    ['#E8F5E9', '#B2DFDB', '#DCE775'],
  ],
  dark: [
    // Night Sky
    ['#0D1B2A', '#1B263B', '#415A77'],
    // Deep Ocean
    ['#01242F', '#044F67', '#1F618D'],
    // Forest Twilight
    ['#1A1A1D', '#4E4E50', '#2E4057'],
    // Starry Nebula
    ['#1A237E', '#311B92', '#4A148C'],
    // Volcanic Rock
    ['#212121', '#37474F', '#455A64'],
    // Midnight Forest
    ['#1B1B24', '#273238', '#1B5E20'],
    // Northern Lights
    ['#0E151B', '#0E3746', '#07485B'],
  ]
};

// Helper function for smooth interpolation
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// Enhanced mesh creation with ultra-smooth transitions
const createMeshPoints = (isDarkMode = false) => {
  const points: Point[] = [];
  const colors: string[] = [];
  const indices: number[] = [];

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
  
  // Create multiple flow directions for gentle, natural patterns
  const baseAngle = Math.random() * Math.PI * 2;
  const flow1 = { 
    x: Math.cos(baseAngle), 
    y: Math.sin(baseAngle) 
  };
  
  // More subtle angle offsets for smoother transitions
  const angleOffset = Math.PI * (0.25 + Math.random() * 0.3); // 25-55% of PI
  const flow2 = { 
    x: Math.cos(baseAngle + angleOffset), 
    y: Math.sin(baseAngle + angleOffset) 
  };
  
  const flow3 = { 
    x: Math.cos(baseAngle - angleOffset * 0.7), 
    y: Math.sin(baseAngle - angleOffset * 0.7) 
  };

  // Add primary color points in gentler, more organic positions
  const centerOffsetX = -0.05 + Math.random() * 0.1; // Reduced offset (-5% to +5%)
  const centerOffsetY = -0.05 + Math.random() * 0.1;
  
  // More natural distribution of control points
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
  
  // Create organic patterns with varied control points
  const controlPoints: ControlPoint[] = [];
  
  // Add points with natural distribution
  const numPoints = 5 + Math.floor(Math.random() * 2); // 5-6 points (reduced from 6-8)
  const baseRadius = 0.25 + Math.random() * 0.15; // 25-40% of canvas
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 + Math.random() * 0.3; // Reduced randomness
    const radiusVar = baseRadius * (0.8 + Math.random() * 0.4); // More consistent radius
    const colorIndex = i % gradient.length;
    const influence = 0.35 + Math.random() * 0.25; // Increased minimum influence
    
    addControlPoint(radiusVar, angle, gradient[colorIndex], influence);
  }
  
  // Add central points for smooth blending
  const centerRadiusRange = isDarkMode ? [0.15, 0.25] : [0.1, 0.2];
  const centerRadius = centerRadiusRange[0] + Math.random() * (centerRadiusRange[1] - centerRadiusRange[0]);
  const centerAngle = Math.random() * Math.PI * 2;
  const colorIndex = Math.floor(Math.random() * gradient.length);
  addControlPoint(centerRadius, centerAngle, gradient[colorIndex], 0.4 + Math.random() * 0.2);

  // Generate smoother noise field
  const noiseField: NoisePoint[][] = Array(ROWS).fill(0).map(() => 
    Array(COLS).fill(0).map(() => ({
      angle: Math.random() * Math.PI * 2,
      strength: Math.random() * (isDarkMode ? 0.4 : 0.6) + (isDarkMode ? 0.15 : 0.25)
    }))
  );
  
  // Smooth the noise field with gentler frequencies
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const nx = x / (COLS - 1);
      const ny = y / (ROWS - 1);
      
      // Use non-integer, lower frequencies for smoother noise
      noiseField[y][x].angle = 
        Math.sin(nx * 2.7 + ny * 3.2) * Math.PI + 
        Math.cos(nx * 1.8 - ny * 2.4) * Math.PI * 0.6 +
        Math.sin((nx + ny) * 2.1) * Math.PI * 0.4;
      
      noiseField[y][x].strength = 
        (Math.sin(nx * 2.3 + ny * 2.7) * 0.4 + 0.6) * 
        (Math.cos(nx * 2.1 - ny * 1.8) * 0.2 + 0.8);
    }
  }

  // Generate mesh points with ultra-smooth color blending
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const nx = x / (COLS - 1);
      const ny = y / (ROWS - 1);
      
      // Create vertex position
      const finalX = x * cellWidth;
      const finalY = y * cellHeight;
      points.push({ x: finalX, y: finalY });

      // Calculate position in multi-directional flow space
      const flowValue1 = (nx * flow1.x + ny * flow1.y) * 0.5 + 0.5; 
      const flowValue2 = (nx * flow2.x + ny * flow2.y) * 0.5 + 0.5;
      const flowValue3 = (nx * flow3.x + ny * flow3.y) * 0.5 + 0.5;
      
      // Get noise influence at this point
      const noise = noiseField[y][x];
      
      // Calculate ultra-smooth color blending
      const blendedColor = { r: 0, g: 0, b: 0 };
      let totalWeight = 0;
      
      // Calculate weights with gentler flow influence
      const weights = controlPoints.map(point => {
        const dx = nx - point.x;
        const dy = ny - point.y;
        
        // Enhanced smooth distance function
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared + smoothingFactor);
        
        // Gentler flow influence
        const flowMix1 = Math.sin(flowValue1 * Math.PI * 1.5 + noise.angle * 0.4) * 0.5 + 0.5;
        const flowMix2 = Math.sin(flowValue2 * Math.PI * 1.5 - noise.angle * 0.5) * 0.5 + 0.5;
        const flowMix3 = Math.sin(flowValue3 * Math.PI * 1.5 + noise.angle * 0.3) * 0.5 + 0.5;
        
        // More balanced flow factor
        const flowFactor = (
          flowMix1 * 0.35 + 
          flowMix2 * 0.35 + 
          flowMix3 * 0.3
        ) * noise.strength * noiseStrengthFactor + 0.85; // Increased base influence
        
        // Smoother falloff function
        const weight = Math.pow(
          Math.max(0, 1 - distance / (point.influence * flowFactor)), 
          falloffPower
        );
        
        return weight;
      });
      
      totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      if (totalWeight === 0) {
        // Fallback color if no influence (rare case)
        colors.push(gradient[0]);
        continue;
      }
      
      // Blend colors with gamma correction
      for (let i = 0; i < controlPoints.length; i++) {
        const normalizedWeight = weights[i] / totalWeight;
        const color = controlPoints[i].color;
        
        // Convert to RGB with gamma correction
        const r = Math.pow(parseInt(color.slice(1, 3), 16) / 255, 2.2);
        const g = Math.pow(parseInt(color.slice(3, 5), 16) / 255, 2.2);
        const b = Math.pow(parseInt(color.slice(5, 7), 16) / 255, 2.2);
        
        blendedColor.r += r * normalizedWeight;
        blendedColor.g += g * normalizedWeight;
        blendedColor.b += b * normalizedWeight;
      }

      // Convert back to hex with gamma correction
      const color = '#' + 
        Math.round(Math.pow(blendedColor.r, 1/2.2) * 255).toString(16).padStart(2, '0') +
        Math.round(Math.pow(blendedColor.g, 1/2.2) * 255).toString(16).padStart(2, '0') +
        Math.round(Math.pow(blendedColor.b, 1/2.2) * 255).toString(16).padStart(2, '0');
      
      colors.push(color);
    }
  }

  // Generate indices (unchanged)
  for (let y = 0; y < ROWS - 1; y++) {
    for (let x = 0; x < COLS - 1; x++) {
      const i = y * COLS + x;
      indices.push(i, i + 1, i + COLS);
      indices.push(i + 1, i + COLS + 1, i + COLS);
    }
  }

  return { points, colors, indices };
};

// Create initial mesh
let mesh = createMeshPoints(false);

interface AnimatedGradientCardProps {
  title: string;
  description: string;
}

const AnimatedGradientCard: React.FC<AnimatedGradientCardProps> = ({
  title,
  description,
}) => {
  const theme = useTheme();
  const deviceColorScheme = useColorScheme();
  const isDark = deviceColorScheme === 'dark';
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // Update mesh when color scheme changes
  React.useEffect(() => {
    mesh = createMeshPoints(isDark);
  }, [isDark]);

  const handleChangeGradient = () => {
    mesh = createMeshPoints(isDark);
    forceUpdate();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Canvas style={styles.canvas}>
          <Group>
            <Vertices
              vertices={mesh.points}
              colors={mesh.colors}
              indices={mesh.indices}
            />
          </Group>
        </Canvas>
        <View style={styles.content}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {title}
          </Text>
          <Text style={[styles.description, { color: isDark ? '#EEEEEE' : '#333333' }]}>
            {description}
          </Text>
        </View>
      </View>
      <Pressable 
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.8 : 1,
            backgroundColor: isDark ? '#FFFFFF20' : '#00000010' 
          }
        ]}
        onPress={handleChangeGradient}
      >
        <Text style={[styles.buttonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Change Gradient
        </Text>
      </Pressable>
    </View>
  );
};

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
  },
  canvas: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
    backgroundColor: '#00000010',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AnimatedGradientCard; 