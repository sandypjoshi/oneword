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
interface ColorPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

// Update color palettes for more distinct combinations
const GRADIENTS = {
  light: [
    // Soft pastels
    ['#FFE4E6', '#F5D0FE', '#E0F2FE'],
    // Warm neutrals
    ['#FFF7ED', '#FFEDD5', '#FEF3C7'],
    // Cool morning
    ['#F0F9FF', '#E0F2FE', '#DBEAFE'],
    // Dusty rose
    ['#FFF1F2', '#FFE4E6', '#FCE7F3'],
    // Mint cream
    ['#ECFDF5', '#D1FAE5', '#F0FDF4'],
  ],
  dark: [
    // Deep ocean
    ['#0C4A6E', '#1E3A8A', '#0F766E'],
    // Night sky
    ['#1E293B', '#1E1B4B', '#0F172A'],
    // Forest depths
    ['#064E3B', '#134E4A', '#1E3A8A'],
    // Twilight
    ['#3B0764', '#1E1B4B', '#0C4A6E'],
    // Dark earth
    ['#27272A', '#292524', '#1C1917'],
  ],
};

// Helper function for smooth interpolation
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// Enhanced mesh creation with smooth gradients
const createMeshPoints = (isDarkMode = false) => {
  const points = [];
  const colors = [];
  const indices = [];

  const cellWidth = CARD_WIDTH / (COLS - 1);
  const cellHeight = CARD_HEIGHT / (ROWS - 1);
  
  const colorSet = isDarkMode ? GRADIENTS.dark : GRADIENTS.light;
  const gradient = colorSet[Math.floor(Math.random() * colorSet.length)];

  // Create control points for color blending
  const numPoints = 4 + Math.floor(Math.random() * 3); // 4-6 points
  const controlPoints = [];
  
  // Add main anchor points with strategic positioning
  controlPoints.push({
    x: 0.1 + Math.random() * 0.2,
    y: 0.1 + Math.random() * 0.2,
    color: gradient[0],
    influence: 0.6 + Math.random() * 0.2 // Increased influence for smoother transitions
  });

  controlPoints.push({
    x: 0.8 + Math.random() * 0.2,
    y: 0.1 + Math.random() * 0.2,
    color: gradient[1],
    influence: 0.6 + Math.random() * 0.2
  });

  controlPoints.push({
    x: 0.1 + Math.random() * 0.2,
    y: 0.8 + Math.random() * 0.2,
    color: gradient[2],
    influence: 0.6 + Math.random() * 0.2
  });

  // Add random intermediate points
  for (let i = 3; i < numPoints; i++) {
    controlPoints.push({
      x: 0.2 + Math.random() * 0.6,
      y: 0.2 + Math.random() * 0.6,
      color: gradient[Math.floor(Math.random() * gradient.length)],
      influence: 0.5 + Math.random() * 0.2
    });
  }

  // Generate mesh points with smooth color transitions
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const nx = x / (COLS - 1);
      const ny = y / (ROWS - 1);
      
      // Create vertex position (no distortion)
      const finalX = x * cellWidth;
      const finalY = y * cellHeight;
      points.push({ x: finalX, y: finalY });

      // Calculate color influences with smoother falloff
      let totalInfluence = 0;
      const colorInfluences = controlPoints.map(point => {
        const dx = nx - point.x;
        const dy = ny - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Smoother falloff function
        const influence = Math.pow(Math.max(0, 1 - (distance / point.influence)), 2);
        totalInfluence += influence;
        return { color: point.color, influence };
      });

      // Blend colors with improved smoothing
      if (totalInfluence > 0) {
        const blendedColor = colorInfluences.reduce((acc, { color, influence }) => {
          const weight = influence / totalInfluence;
          const rgb = {
            r: parseInt(color.slice(1, 3), 16),
            g: parseInt(color.slice(3, 5), 16),
            b: parseInt(color.slice(5, 7), 16)
          };
          acc.r += rgb.r * weight;
          acc.g += rgb.g * weight;
          acc.b += rgb.b * weight;
          return acc;
        }, { r: 0, g: 0, b: 0 });

        const color = '#' + 
          Math.round(blendedColor.r).toString(16).padStart(2, '0') +
          Math.round(blendedColor.g).toString(16).padStart(2, '0') +
          Math.round(blendedColor.b).toString(16).padStart(2, '0');
        colors.push(color);
      } else {
        colors.push(gradient[0]);
      }
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