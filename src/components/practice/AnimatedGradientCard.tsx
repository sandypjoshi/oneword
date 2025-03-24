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

// Helper function to convert hex to RGB
const hexToRGB = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
};

// Helper function to convert RGB to hex
const RGBToHex = (r: number, g: number, b: number) => {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Perceptual color interpolation with gamma correction
const interpolateColors = (color1: string, color2: string, t: number) => {
  const c1 = hexToRGB(color1);
  const c2 = hexToRGB(color2);
  
  // Gamma correction (sRGB to linear)
  const linear1 = {
    r: Math.pow(c1.r, 2.2),
    g: Math.pow(c1.g, 2.2),
    b: Math.pow(c1.b, 2.2)
  };
  const linear2 = {
    r: Math.pow(c2.r, 2.2),
    g: Math.pow(c2.g, 2.2),
    b: Math.pow(c2.b, 2.2)
  };
  
  // Interpolate in linear space
  const r = linear1.r * (1 - t) + linear2.r * t;
  const g = linear1.g * (1 - t) + linear2.g * t;
  const b = linear1.b * (1 - t) + linear2.b * t;
  
  // Convert back to sRGB space
  return RGBToHex(
    Math.pow(r, 1/2.2),
    Math.pow(g, 1/2.2),
    Math.pow(b, 1/2.2)
  );
};

// Helper function to create curved paths
const createCurvedPath = (startX: number, startY: number, endX: number, endY: number, curvature: number) => {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const angle = Math.atan2(endY - startY, endX - startX);
  const perpendicular = angle + Math.PI / 2;
  
  const controlX = midX + Math.cos(perpendicular) * curvature;
  const controlY = midY + Math.sin(perpendicular) * curvature;
  
  return { controlX, controlY };
};

const createMeshPoints = (isDarkMode = false) => {
  const points = [];
  const colors = [];
  const indices = [];

  const cellWidth = CARD_WIDTH / (COLS - 1);
  const cellHeight = CARD_HEIGHT / (ROWS - 1);
  
  const colorSet = isDarkMode ? GRADIENTS.dark : GRADIENTS.light;
  const gradient = colorSet[Math.floor(Math.random() * colorSet.length)];

  // Create organic paths for color regions
  const colorPaths = [
    // Primary path
    {
      start: { x: 0.1, y: 0.2 + Math.random() * 0.3 },
      end: { x: 0.9, y: 0.3 + Math.random() * 0.3 },
      color: gradient[0],
      curvature: 0.2 + Math.random() * 0.3,
      influence: 0.4
    },
    // Secondary path
    {
      start: { x: 0.2, y: 0.8 - Math.random() * 0.3 },
      end: { x: 0.8, y: 0.7 - Math.random() * 0.3 },
      color: gradient[1],
      curvature: -0.2 - Math.random() * 0.3,
      influence: 0.4
    },
    // Accent path
    {
      start: { x: 0.5 + Math.random() * 0.3, y: 0.1 },
      end: { x: 0.6 + Math.random() * 0.3, y: 0.9 },
      color: gradient[2],
      curvature: 0.1 + Math.random() * 0.2,
      influence: 0.35
    }
  ];

  // Generate mesh points
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const nx = x / (COLS - 1);
      const ny = y / (ROWS - 1);
      
      const finalX = x * cellWidth;
      const finalY = y * cellHeight;
      points.push({ x: finalX, y: finalY });

      // Calculate color influences based on distance to curved paths
      const influences = colorPaths.map(path => {
        const curve = createCurvedPath(
          path.start.x,
          path.start.y,
          path.end.x,
          path.end.y,
          path.curvature
        );

        // Calculate distance to curved path
        const dx = nx - curve.controlX;
        const dy = ny - curve.controlY;
        const distanceToCurve = Math.sqrt(dx * dx + dy * dy);

        // Calculate distance to line segment
        const lineX = path.end.x - path.start.x;
        const lineY = path.end.y - path.start.y;
        const projection = ((nx - path.start.x) * lineX + (ny - path.start.y) * lineY) / 
                         (lineX * lineX + lineY * lineY);
        const projectionPoint = {
          x: path.start.x + projection * lineX,
          y: path.start.y + projection * lineY
        };
        const distanceToLine = Math.sqrt(
          Math.pow(nx - projectionPoint.x, 2) + 
          Math.pow(ny - projectionPoint.y, 2)
        );

        // Combine both distances for organic feel
        const distance = Math.min(distanceToCurve, distanceToLine);
        const t = Math.max(0, 1 - distance / path.influence);
        const influence = Math.pow(t, 2) * (3 - 2 * t); // Smoothstep

        return {
          color: path.color,
          influence: influence
        };
      });

      // Sort influences by strength
      influences.sort((a, b) => b.influence - a.influence);

      // Blend between the two strongest influences
      const totalInfluence = influences[0].influence + influences[1].influence;
      
      if (totalInfluence > 0) {
        const t = influences[1].influence / totalInfluence;
        const finalColor = interpolateColors(
          influences[0].color,
          influences[1].color,
          smoothstep(0, 1, t)
        );
        colors.push(finalColor);
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