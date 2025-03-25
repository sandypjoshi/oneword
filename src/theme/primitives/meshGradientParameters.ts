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
  smoothingFactor: 0.035, // Increased for smoother transitions
  falloffPower: 2.2, // Reduced for more gradual blending
  noiseStrengthFactor: 0.4, // Slightly higher for more organic patterns
  influenceMultiplier: 1.3, // Increased for more influence overlap
  controlPoints: {
    angleOffset: {
      base: 0.25,
      random: 0.4, // More variation in angle
    },
    flowMultiplier: 0.6, // Adjusted for dark mode
    centerOffset: {
      x: {
        min: -0.08, // Wider horizontal offset
        range: 0.16, // More horizontal variation
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
      random: 3, // More control points
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
      min: 0.15,
      max: 0.25,
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