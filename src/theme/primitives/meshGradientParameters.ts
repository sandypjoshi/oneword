/**
 * Mesh Gradient Parameters - The "Goldilocks" Settings
 * 
 * This file contains the carefully fine-tuned parameters that control the 
 * appearance of mesh gradients throughout the app. These parameters control
 * various aspects of gradient generation including smoothness, flow patterns,
 * and color blending.
 * 
 * These values were derived from the original MeshGradientCard implementation
 * and have been preserved exactly to maintain the same beautiful gradient appearance.
 */

export type MeshGradientMode = 'light' | 'dark';

/**
 * Core parameters that control gradient appearance
 */
export interface MeshGradientParams {
  // Smoothing factor affects the transition sharpness between colors
  smoothingFactor: number;
  
  // Controls how quickly influence falls off with distance
  falloffPower: number;
  
  // Controls the strength of the noise effect on the gradient
  noiseStrengthFactor: number;
  
  // Multiplier for the influence radius of control points
  influenceMultiplier: number;
  
  // Control point distribution parameters
  controlPoints: {
    // Additional angle offset for flow directions
    angleOffset: {
      base: number;
      random: number;
    };
    // Flow direction adjustments
    flowMultiplier: number;
    // Center offset ranges
    centerOffset: {
      x: {
        min: number;
        range: number;
      };
      y: {
        min: number;
        range: number;
      };
    };
    // Corner influence strength
    cornerInfluence: number;
    // Corner offset from edge
    cornerOffset: number;
    // Number of points range
    count: {
      base: number;
      random: number;
    };
    // Base radius and variation
    radius: {
      base: number;
      variation: number;
    };
    // Influence ranges
    influence: {
      min: number;
      range: number;
    };
  };
  
  // Parameters for center points
  centerPoint: {
    // Radius range for center control points
    radius: {
      min: number;
      max: number;
    };
    // Influence range for center control points
    influence: {
      min: number;
      range: number;
    };
  };
  
  // Corner handling parameters
  corner: {
    // Extra smoothing for corners
    smoothingMultiplier: number;
    // Falloff adjustment for corners
    falloffMultiplier: number;
  };
}

/**
 * The exact "goldilocks" parameters for light mode
 */
export const lightModeParams: MeshGradientParams = {
  smoothingFactor: 0.025,
  falloffPower: 2.8,
  noiseStrengthFactor: 0.35,
  influenceMultiplier: 1.1,
  controlPoints: {
    angleOffset: {
      base: 0.25,
      random: 0.3,
    },
    flowMultiplier: 0.7,
    centerOffset: {
      x: {
        min: -0.05,
        range: 0.1,
      },
      y: {
        min: -0.05,
        range: 0.1,
      },
    },
    cornerInfluence: 0.3,
    cornerOffset: 0.05,
    count: {
      base: 5,
      random: 2,
    },
    radius: {
      base: 0.25,
      variation: 0.15,
    },
    influence: {
      min: 0.35,
      range: 0.25,
    },
  },
  centerPoint: {
    radius: {
      min: 0.1,
      max: 0.2,
    },
    influence: {
      min: 0.4,
      range: 0.2,
    },
  },
  corner: {
    smoothingMultiplier: 1.5,
    falloffMultiplier: 0.9,
  },
};

/**
 * The exact "goldilocks" parameters for dark mode - adjusted to prevent center split
 */
export const darkModeParams: MeshGradientParams = {
  smoothingFactor: 0.03, // Slightly reduced for more defined transitions
  falloffPower: 2.0, // Reduced for more dynamic blending
  noiseStrengthFactor: 0.55, // Increased for more organic patterns
  influenceMultiplier: 1.4, // Increased for more influence overlap
  controlPoints: {
    angleOffset: {
      base: 0.7, // Increased angle offset for more turbulent flows
      random: 0.65, // Significantly more variation in angle directions
    },
    flowMultiplier: 1.1, // Increased for more dynamic flow patterns
    centerOffset: {
      x: {
        min: -0.15, // Wider horizontal offset
        range: 0.3, // More horizontal variation
      },
      y: {
        min: -0.12, // More vertical offset
        range: 0.24, // More vertical variation
      },
    },
    cornerInfluence: 0.5, // Slightly increased corner influence
    cornerOffset: 0.05,
    count: {
      base: 6, // Increased base control point count
      random: 3, // Same random variation
    },
    radius: {
      base: 0.28, // Slightly larger radius
      variation: 0.4, // More variation
    },
    influence: {
      min: 0.4, // Stronger minimum influence
      range: 0.3, // Wider influence range
    },
  },
  centerPoint: {
    radius: {
      min: 0.12,
      max: 0.25,
    },
    influence: {
      min: 0.45, // Stronger center influence
      range: 0.25, // More variation
    },
  },
  corner: {
    smoothingMultiplier: 1.1, // Adjusted for balance
    falloffMultiplier: 1.4, // Adjusted for more distinct patterns
  },
};

/**
 * Get the mesh gradient parameters for the current mode
 */
export const getMeshGradientParams = (mode: MeshGradientMode): MeshGradientParams => {
  return mode === 'light' ? lightModeParams : darkModeParams;
};

/**
 * Helper function for smooth interpolation - commonly used in mesh gradients
 */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}; 