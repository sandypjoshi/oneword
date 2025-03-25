/**
 * MeshGradient Component - Optimized Direct Port From MeshGradientCard
 * 
 * This component is a direct port of the MeshGradientCard implementation
 * with performance optimizations for better rendering efficiency.
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, StyleProp, ViewStyle, useWindowDimensions, useColorScheme } from 'react-native';
import {
  Canvas,
  Group,
  Vertices,
} from '@shopify/react-native-skia';
import { useTheme } from '../../theme/ThemeProvider';
import { getGradientById, getRandomGradient, GradientPalette } from '../../theme/primitives/gradients';

// Define mesh data interface
interface MeshPoint {
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
  points: MeshPoint[];
  colors: string[];
  indices: number[];
}

// Mesh gradient configuration props
export interface MeshGradientProps {
  /**
   * Gradient palette ID from theme gradients.
   */
  gradientId?: string;
  
  /**
   * Gradient palette object.
   */
  palette?: GradientPalette;
  
  /**
   * Custom colors to use for gradient.
   */
  colors?: string[];
  
  /**
   * Whether to add a subtle border around the gradient.
   */
  withBorder?: boolean;
  
  /**
   * Opacity of the border.
   */
  borderOpacity?: number;
  
  /**
   * Whether to apply a subtle shadow to the gradient.
   */
  withShadow?: boolean;
  
  /**
   * Style props for the container View.
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Z-index for the gradient component.
   */
  zIndex?: number;
  
  /**
   * Resolution for the mesh grid. Higher values mean more detail but lower performance.
   * Defaults to 32 for optimal quality/performance balance.
   */
  resolution?: number;
  
  /**
   * Seed value for generating the gradient pattern.
   * Same seed will generate the same pattern for the same colors.
   */
  seed?: number;
}

// Mesh grid resolution - configurable with sensible default
const DEFAULT_RESOLUTION = 32;

// Math helpers - outside component to avoid recreating on each render
const sin = Math.sin;
const cos = Math.cos;
const pow = Math.pow;
const sqrt = Math.sqrt;
const PI = Math.PI;
const max = Math.max;
const min = Math.min;
const round = Math.round;
const floor = Math.floor;
const random = Math.random;

// Helper function for smooth interpolation
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = max(0, min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// Generate a pseudorandom number from a seed
const seededRandom = (seed: number) => {
  return () => {
    // Simple xorshift algorithm
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return (seed < 0 ? ~seed + 1 : seed) % 1000 / 1000;
  };
};

// Memoize indices based on resolution - calculating only once per resolution
const getIndices = (() => {
  const cache = new Map<number, number[]>();
  
  return (rows: number, cols: number): number[] => {
    const key = rows * 10000 + cols; // Create a unique key based on dimensions
    
    if (!cache.has(key)) {
      const indices: number[] = [];
      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
          const i = y * cols + x;
          indices.push(i, i + 1, i + cols);
          indices.push(i + 1, i + cols + 1, i + cols);
        }
      }
      cache.set(key, indices);
    }
    
    return cache.get(key)!;
  };
})();

// Color parsing utility for optimized performance
const parseColor = (() => {
  const colorCache = new Map<string, { r: number, g: number, b: number }>();
  
  return (color: string) => {
    if (!colorCache.has(color)) {
      const r = pow(parseInt(color.slice(1, 3), 16) / 255, 2.2);
      const g = pow(parseInt(color.slice(3, 5), 16) / 255, 2.2);
      const b = pow(parseInt(color.slice(5, 7), 16) / 255, 2.2);
      colorCache.set(color, { r, g, b });
    }
    
    return colorCache.get(color)!;
  };
})();

/**
 * A high-quality mesh gradient component optimized for mobile performance.
 */
export const MeshGradient: React.FC<MeshGradientProps> = ({
  gradientId,
  palette,
  colors,
  withBorder = false,
  borderOpacity = 0.1,
  withShadow = false,
  style,
  zIndex = -1,
  resolution = DEFAULT_RESOLUTION,
  seed,
}) => {
  const { colorMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const deviceColorScheme = useColorScheme();
  const isDark = deviceColorScheme === 'dark';
  
  // Use useRef pattern for mesh data
  const meshRef = useRef<MeshData | null>(null);
  
  // Use useState for forcing re-renders when mesh changes
  const [meshVersion, setMeshVersion] = useState(0);
  
  // Limit resolution to reasonable bounds for performance
  const rows = resolution < 8 ? 8 : (resolution > 64 ? 64 : resolution);
  const cols = rows; // Keep grid square
  
  // Skip rendering if dimensions aren't available
  if (!width || !height || width < 10 || height < 10) {
    return null;
  }
  
  // Get gradient colors - memoized to prevent recalculation
  const gradientColors = useMemo(() => {
    if (colors && colors.length >= 2) {
      return colors;
    }
    
    if (palette) {
      return palette.colors;
    }
    
    if (gradientId) {
      const themeGradient = getGradientById(gradientId, colorMode);
      if (themeGradient) {
        return themeGradient.colors;
      }
    }
    
    // Default to a random gradient from our theme primitives
    return getRandomGradient(colorMode).colors;
  }, [colors, palette, gradientId, colorMode]);

  // Create mesh points - significant optimizations for performance
  const createMeshPoints = useCallback((): MeshData => {
    // Generate a predictable random stream if seed is provided
    const rng = seed !== undefined ? seededRandom(seed) : random;
    
    const points: MeshPoint[] = [];
    const colors: string[] = [];
    
    const cellWidth = width / (cols - 1);
    const cellHeight = height / (rows - 1);
    
    // Use the gradient colors
    const gradient = gradientColors;
  
    // Enhanced smoothing parameters
    const smoothingFactor = isDark ? 0.028 : 0.025;
    const falloffPower = isDark ? 2.5 : 2.8;
    const noiseStrengthFactor = 0.35;
    
    // More balanced influence areas
    const influenceMultiplier = isDark ? 1.2 : 1.1; 
    
    // Create flow directions once
    const baseAngle = rng() * PI * 2;
    const angleOffset = PI * (0.25 + rng() * 0.3);
    
    const flow1 = { 
      x: cos(baseAngle), 
      y: sin(baseAngle) 
    };
    
    const flow2 = { 
      x: cos(baseAngle + angleOffset), 
      y: sin(baseAngle + angleOffset) 
    };
    
    const flow3 = { 
      x: cos(baseAngle - angleOffset * 0.7), 
      y: sin(baseAngle - angleOffset * 0.7) 
    };
  
    // Center offset calculations
    const centerOffsetX = -0.05 + rng() * 0.1;
    const centerOffsetY = -0.05 + rng() * 0.1;
    
    // Prepare control points
    const controlPoints: ControlPoint[] = [];
    
    // Control point adding function
    const addControlPoint = (radius: number, angle: number, color: string, influence: number): void => {
      const x = 0.5 + centerOffsetX + cos(angle) * radius;
      const y = 0.5 + centerOffsetY + sin(angle) * radius;
      controlPoints.push({
        x: max(0.1, min(0.9, x)),
        y: max(0.1, min(0.9, y)),
        color,
        influence: influence * influenceMultiplier
      });
    };
    
    // Add points with natural distribution
    const numPoints = 5 + floor(rng() * 2);
    const baseRadius = 0.25 + rng() * 0.15;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * PI * 2 + rng() * 0.3;
      const radiusVar = baseRadius * (0.8 + rng() * 0.4);
      const colorIndex = i % gradient.length;
      const influence = 0.35 + rng() * 0.25;
      
      addControlPoint(radiusVar, angle, gradient[colorIndex], influence);
    }
    
    // Add central points for smooth blending
    const centerRadiusRange = isDark ? [0.15, 0.25] : [0.1, 0.2];
    const centerRadius = centerRadiusRange[0] + rng() * (centerRadiusRange[1] - centerRadiusRange[0]);
    const centerAngle = rng() * PI * 2;
    const colorIndex = floor(rng() * gradient.length);
    addControlPoint(centerRadius, centerAngle, gradient[colorIndex], 0.4 + rng() * 0.2);
  
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
        const distance = sqrt(dx * dx + dy * dy);
        
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
    const noiseField: NoisePoint[][] = Array(rows);
    for (let y = 0; y < rows; y++) {
      noiseField[y] = Array(cols);
      for (let x = 0; x < cols; x++) {
        const nx = x / (cols - 1);
        const ny = y / (rows - 1);
        
        const angle = 
          sin(nx * 2.7 + ny * 3.2) * PI + 
          cos(nx * 1.8 - ny * 2.4) * PI * 0.6 +
          sin((nx + ny) * 2.1) * PI * 0.4;
        
        const strength = 
          (sin(nx * 2.3 + ny * 2.7) * 0.4 + 0.6) * 
          (cos(nx * 2.1 - ny * 1.8) * 0.2 + 0.8);
        
        noiseField[y][x] = { angle, strength };
      }
    }
  
    // Pre-allocate arrays for better memory management
    points.length = rows * cols;
    colors.length = rows * cols;
  
    // Generate mesh points
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const index = y * cols + x;
        const nx = x / (cols - 1);
        const ny = y / (rows - 1);
        
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
          
          const distance = sqrt(dx * dx + dy * dy + localSmoothingFactor);
          
          // Calculate flow influences
          const flowMix1 = sin(flowValue1 * PI * 1.5 + noise.angle * 0.4) * 0.5 + 0.5;
          const flowMix2 = sin(flowValue2 * PI * 1.5 - noise.angle * 0.5) * 0.5 + 0.5;
          const flowMix3 = sin(flowValue3 * PI * 1.5 + noise.angle * 0.3) * 0.5 + 0.5;
          
          const flowFactor = (
            flowMix1 * 0.35 + 
            flowMix2 * 0.35 + 
            flowMix3 * 0.3
          ) * noise.strength * noiseStrengthFactor + 0.85;
          
          const weight = pow(
            max(0, 1 - distance / (point.influence * flowFactor)), 
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
        
        // Blend colors using cached color parsing for performance
        for (let i = 0; i < controlPoints.length; i++) {
          const normalizedWeight = weights[i] / totalWeight;
          const { r, g, b } = parseColor(controlPoints[i].color);
          
          blendedColor.r += r * normalizedWeight;
          blendedColor.g += g * normalizedWeight;
          blendedColor.b += b * normalizedWeight;
        }
  
        // Convert back to hex with gamma correction
        const r = min(255, max(0, round(pow(blendedColor.r, 1/2.2) * 255))).toString(16).padStart(2, '0');
        const g = min(255, max(0, round(pow(blendedColor.g, 1/2.2) * 255))).toString(16).padStart(2, '0');
        const b = min(255, max(0, round(pow(blendedColor.b, 1/2.2) * 255))).toString(16).padStart(2, '0');
        
        colors[index] = `#${r}${g}${b}`;
      }
    }
  
    return { 
      points, 
      colors, 
      indices: getIndices(rows, cols)
    };
  }, [width, height, gradientColors, isDark, rows, cols, seed]);
  
  // Initialize mesh if not already done
  if (!meshRef.current) {
    meshRef.current = createMeshPoints();
  }
  
  // Update mesh when dependencies change
  useEffect(() => {
    meshRef.current = createMeshPoints();
    setMeshVersion(prev => prev + 1); // Force re-render
  }, [createMeshPoints, isDark, width, height]);
  
  // Handle regenerating the gradient
  const handleChangeGradient = useCallback(() => {
    meshRef.current = createMeshPoints();
    setMeshVersion(prev => prev + 1); // Force re-render
  }, [createMeshPoints]);
  
  // Extract mesh data for rendering
  const mesh = meshRef.current;
  
  // Early return if mesh is not ready
  if (!mesh) return null;
  
  // Render the gradient using React Native Skia
  return (
    <Canvas style={[styles.container, { zIndex }, style]}>
      <Group>
        <Vertices
          vertices={mesh.points}
          colors={mesh.colors}
          indices={mesh.indices}
        />
      </Group>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

export default MeshGradient; 