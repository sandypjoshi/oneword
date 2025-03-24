import React from 'react';
import { View, StyleSheet, Text, Dimensions, useColorScheme } from 'react-native';
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
const ROWS = 16;
const COLS = 16;

// Beautiful color combinations
const GRADIENTS = {
  light: [
    ['#FF8BAC', '#F8CD65'], // Sunset peach to warm yellow
    ['#A8EDEA', '#FED6E3'], // Soft cyan to pink
    ['#D4FC79', '#96E6A1'], // Spring green
  ],
  dark: [
    ['#30496B', '#30B8D2'], // Deep blue to cyan
    ['#3B2667', '#BC78EC'], // Deep purple to lavender
    ['#203A43', '#2C5364'], // Ocean depths
  ],
};

// Create mesh points
const createMeshPoints = (isDarkMode = false) => {
  const points = [];
  const colors = [];
  const indices = [];

  const cellWidth = CARD_WIDTH / (COLS - 1);
  const cellHeight = CARD_HEIGHT / (ROWS - 1);
  
  // Choose a random gradient pair
  const colorSet = isDarkMode ? GRADIENTS.dark : GRADIENTS.light;
  const gradient = colorSet[Math.floor(Math.random() * colorSet.length)];

  // Helper function to interpolate colors
  const lerpColor = (color1: string, color2: string, t: number) => {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Generate vertices and colors
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      // Normalize coordinates (0 to 1)
      const nx = x / (COLS - 1);
      const ny = y / (ROWS - 1);
      
      // Calculate base position
      const baseX = x * cellWidth;
      const baseY = y * cellHeight;
      
      // Only apply distortion to interior points
      let finalX = baseX;
      let finalY = baseY;
      
      if (x !== 0 && x !== COLS - 1 && y !== 0 && y !== ROWS - 1) {
        // Calculate distortion strength that fades towards edges
        const edgeDistX = Math.min(x, COLS - 1 - x) / (COLS / 2);
        const edgeDistY = Math.min(y, ROWS - 1 - y) / (ROWS / 2);
        const distortionStrength = Math.min(edgeDistX, edgeDistY);
        
        // Apply weighted distortion
        const distortionX = Math.sin(ny * Math.PI) * Math.cos(nx * Math.PI) * 20 * distortionStrength;
        const distortionY = Math.cos(nx * Math.PI * 2) * Math.sin(ny * Math.PI) * 20 * distortionStrength;
        
        finalX += distortionX;
        finalY += distortionY;
      }
      
      // Add point with or without distortion
      points.push({ x: finalX, y: finalY });
      
      // Non-linear gradient using polar coordinates for more organic feel
      const centerX = 0.5;
      const centerY = 0.5;
      const dx = nx - centerX;
      const dy = ny - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy) * 1.4;
      const angle = Math.atan2(dy, dx) / (Math.PI * 2) + 0.5;
      
      // Combine distance and angle for color mixing
      const t = (distance + angle) / 2;
      colors.push(lerpColor(gradient[0], gradient[1], t));
    }
  }

  // Generate indices for triangles
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

  // Update mesh when color scheme changes
  React.useEffect(() => {
    mesh = createMeshPoints(isDark);
  }, [isDark]);

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
    height: CARD_HEIGHT + 40,
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
});

export default AnimatedGradientCard; 