/**
 * Mesh Gradient Generator
 * 
 * A utility for generating high-quality mesh gradients using the fine-tuned parameters
 * originally from the MeshGradientCard component. This implementation ensures
 * consistent, beautiful gradients across the app.
 */

import { Dimensions } from 'react-native';
import { 
  getMeshGradientParams, 
  MeshGradientMode 
} from '../theme/primitives/meshGradientParameters';
import { 
  getRandomGradient, 
  ColorMode,
  getGradientIds,
  getGradientById
} from '../theme/primitives/gradients';

// Standard grid resolution for mesh gradients
export const DEFAULT_RESOLUTION = 32;

/**
 * Basic point interface representing x, y coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Control point that influences the gradient appearance
 */
export interface ControlPoint {
  x: number;
  y: number;
  color: string;
  influence: number;
}

/**
 * Noise point for creating organic variations in the gradient
 */
export interface NoisePoint {
  angle: number;
  strength: number;
}

/**
 * Complete mesh data needed for rendering
 */
export interface MeshData {
  points: Point[];
  colors: string[];
  indices: number[];
}

/**
 * Configuration options for generating a mesh gradient
 */
export interface MeshGradientOptions {
  /**
   * Width of the gradient mesh
   */
  width: number;
  
  /**
   * Height of the gradient mesh
   */
  height: number;
  
  /**
   * Whether to use dark mode colors and parameters
   */
  isDarkMode: boolean;
  
  /**
   * Optional specific colors to use (overrides random selection)
   */
  colors?: string[];
  
  /**
   * Resolution of the mesh grid (rows and columns)
   */
  resolution?: number;
  
  /**
   * Optional seed for consistent random generation
   */
  seed?: number;
}

/**
 * Memoize indices calculation for different resolutions to avoid recalculation
 */
const getMemoizedIndices = (() => {
  const cache = new Map<number, number[]>();
  
  return (rows: number, cols: number): number[] => {
    const key = rows * 10000 + cols;
    
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

/**
 * Global mesh cache to avoid regenerating meshes
 * Keys are wordId_isDarkMode (e.g., "ineffable_true")
 */
const meshCache: Record<string, MeshData> = {};

// Theme version to invalidate cache when theme changes
let themeVersion = 1;

/**
 * Increment theme version to invalidate all cached meshes
 * Call this when the app's theme is changed
 */
export function invalidateMeshCache(): void {
  themeVersion++;
}

/**
 * Check if a mesh exists in the cache
 */
export function hasCachedMesh(wordId: string, isDarkMode: boolean): boolean {
  const cacheKey = `${wordId}_${isDarkMode}_v${themeVersion}`;
  return !!meshCache[cacheKey];
}

/**
 * Get a mesh from the cache
 */
export function getCachedMesh(wordId: string, isDarkMode: boolean): MeshData | null {
  const cacheKey = `${wordId}_${isDarkMode}_v${themeVersion}`;
  return meshCache[cacheKey] || null;
}

/**
 * Store a mesh in the cache
 */
export function cacheMesh(wordId: string, isDarkMode: boolean, mesh: MeshData): void {
  const cacheKey = `${wordId}_${isDarkMode}_v${themeVersion}`;
  meshCache[cacheKey] = mesh;
}

/**
 * Generate or retrieve a cached mesh gradient
 * 
 * @param options Configuration options including wordId for caching
 * @returns Complete mesh data for rendering with Skia
 */
export function getOrGenerateMesh(wordId: string, options: MeshGradientOptions): MeshData {
  // Try to get from cache first
  const cached = getCachedMesh(wordId, options.isDarkMode);
  if (cached) {
    return cached;
  }
  
  // Generate new mesh
  const mesh = generateMeshGradient(options);
  
  // Cache the result
  cacheMesh(wordId, options.isDarkMode, mesh);
  
  return mesh;
}

/**
 * Generate a complete mesh gradient ready for rendering
 * 
 * @param options Configuration options for the gradient
 * @returns Complete mesh data for rendering with Skia
 */
export function generateMeshGradient(options: MeshGradientOptions): MeshData {
  const {
    width,
    height,
    isDarkMode,
    colors: customColors,
    resolution = DEFAULT_RESOLUTION,
    seed
  } = options;
  
  const ROWS = resolution;
  const COLS = resolution;
  
  const points: Point[] = [];
  const colors: string[] = [];
  
  const cellWidth = width / (COLS - 1);
  const cellHeight = height / (ROWS - 1);
  
  // Get either custom colors or random gradient colors
  let gradient: string[];
  if (customColors && customColors.length > 0) {
    gradient = customColors;
  } else {
    const colorMode: ColorMode = isDarkMode ? 'dark' : 'light';
    
    // If we have a seed, use it to deterministically select a gradient
    if (seed !== undefined) {
      const gradientList = getGradientIds(colorMode);
      const deterministicIndex = seed % gradientList.length;
      const selectedGradientId = gradientList[deterministicIndex];
      gradient = getGradientById(selectedGradientId, colorMode)!.colors;
    } else {
      // Fall back to random selection for unseeded cases
      gradient = getRandomGradient(colorMode).colors;
    }
  }
  
  // Get the fine-tuned parameters based on current mode
  const mode: MeshGradientMode = isDarkMode ? 'dark' : 'light';
  const params = getMeshGradientParams(mode);
  
  // Access parameters for cleaner code
  const smoothingFactor = params.smoothingFactor;
  const falloffPower = params.falloffPower;
  const noiseStrengthFactor = params.noiseStrengthFactor;
  const influenceMultiplier = params.influenceMultiplier;
  
  // Set up randomization function (either seeded or Math.random)
  const random = seed !== undefined 
    ? (() => {
        let state = seed;
        return () => {
          state = (state * 9301 + 49297) % 233280;
          return state / 233280;
        };
      })()
    : Math.random;
  
  // Create flow directions for organic movement
  const baseAngle = random() * Math.PI * 2;
  const angleOffset = Math.PI * (
    params.controlPoints.angleOffset.base + 
    random() * params.controlPoints.angleOffset.random
  );
  
  const flow1 = { 
    x: Math.cos(baseAngle), 
    y: Math.sin(baseAngle) 
  };
  
  const flow2 = { 
    x: Math.cos(baseAngle + angleOffset), 
    y: Math.sin(baseAngle + angleOffset) 
  };
  
  const flow3 = { 
    x: Math.cos(baseAngle - angleOffset * params.controlPoints.flowMultiplier), 
    y: Math.sin(baseAngle - angleOffset * params.controlPoints.flowMultiplier) 
  };

  // Center offset calculations
  const centerOffsetX = params.controlPoints.centerOffset.x.min + 
                      random() * params.controlPoints.centerOffset.x.range;
  const centerOffsetY = params.controlPoints.centerOffset.y.min + 
                      random() * params.controlPoints.centerOffset.y.range;
  
  // Prepare control points
  const controlPoints: ControlPoint[] = [];
  
  // Helper for adding control points with boundary checking
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
  const numPoints = params.controlPoints.count.base + 
                  Math.floor(random() * params.controlPoints.count.random);
  const baseRadius = params.controlPoints.radius.base + 
                   random() * params.controlPoints.radius.variation;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 + random() * 0.3;
    const radiusVar = baseRadius * (0.8 + random() * 0.4);
    const colorIndex = i % gradient.length;
    const influence = params.controlPoints.influence.min + 
                    random() * params.controlPoints.influence.range;
    
    addControlPoint(radiusVar, angle, gradient[colorIndex], influence);
  }
  
  // Add central points for smooth blending
  const centerRadiusRange = [params.centerPoint.radius.min, params.centerPoint.radius.max];
  const centerRadius = centerRadiusRange[0] + 
                     random() * (centerRadiusRange[1] - centerRadiusRange[0]);
  const centerAngle = random() * Math.PI * 2;
  const colorIndex = Math.floor(random() * gradient.length);
  addControlPoint(centerRadius, centerAngle, gradient[colorIndex], 
                params.centerPoint.influence.min + 
                random() * params.centerPoint.influence.range);

  // Add corner control points
  const cornerInfluence = params.controlPoints.cornerInfluence;
  const cornerOffset = params.controlPoints.cornerOffset;
  
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
      const localSmoothingFactor = isCorner 
        ? smoothingFactor * params.corner.smoothingMultiplier 
        : smoothingFactor;
      const localFalloffPower = isCorner 
        ? falloffPower * params.corner.falloffMultiplier 
        : falloffPower;
      
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

  // Get memoized indices for this resolution
  const indices = getMemoizedIndices(ROWS, COLS);

  return { points, colors, indices };
}

/**
 * Helper function to generate a consistent seed from a string
 * Useful for generating the same gradient for a specific word
 */
export function generateSeedFromString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash) - 1;
}

/**
 * Utility function to get a recommended border color based on theme
 */
export function getGradientBorderColor(isDarkMode: boolean, opacity = 0.15): string {
  return isDarkMode 
    ? `rgba(255, 255, 255, ${opacity})` 
    : `rgba(0, 0, 0, ${opacity * 0.333})`;
} 