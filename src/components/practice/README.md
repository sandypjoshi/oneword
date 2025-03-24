# AnimatedGradientCard Component

A high-performance React Native component that renders beautiful, natural-looking mesh gradients using Skia. The component creates smooth, organic gradients that adapt to light and dark modes with carefully selected natural color palettes.

## Features

- Smooth, natural mesh gradients inspired by real-world phenomena
- Curated color palettes based on natural environments
- Automatic light/dark mode adaptation
- High-performance Skia-based rendering
- Interactive gradient changes
- Completely smooth transitions without artifacts or jagged edges
- Hardware-accelerated graphics

## Color Palettes

### Light Mode - Natural Phenomena
- Morning Sky
- Spring Meadow
- Desert Sunrise
- Coastal Reef
- Autumn Leaves
- Cherry Blossom
- Mountain Vista

### Dark Mode - Natural Environments
- Night Sky
- Deep Ocean
- Forest Twilight
- Starry Nebula
- Volcanic Rock
- Midnight Forest
- Northern Lights

## Technical Implementation

The gradient generation uses a sophisticated approach:

- **Multi-directional Flow Fields**: Creates organic, natural-looking patterns
- **Smooth Blending**: Advanced color interpolation with gamma correction
- **Non-linear Gradient Distribution**: Based on noise fields with non-integer frequencies
- **Optimized for Both Modes**: Different parameters for light and dark ensure perfect results
- **High Resolution Mesh**: 32×32 grid (1024 vertices) for smooth transitions

## Usage

```tsx
import AnimatedGradientCard from './components/practice/AnimatedGradientCard';

const MyScreen = () => (
  <AnimatedGradientCard
    title="Welcome"
    description="Experience beautiful gradients"
  />
);
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| title | string | Main text displayed on the card |
| description | string | Secondary text displayed below the title |

## Performance Considerations

- Hardware-accelerated using Skia
- Optimized mesh generation with minimal computational overhead
- Efficient color blending with gamma correction
- No runtime animations (static gradients that change on demand)
- Memory-efficient implementation

## Key Algorithms

- **Control Point Placement**: Strategic positioning for natural flow
- **Flow-based Influence**: Multiple flow directions create organic patterns
- **Noise Fields**: Low-frequency noise for subtle variations
- **Smooth Falloff**: Carefully tuned falloff function prevents artifacts
- **Gamma-correct Blending**: Perceptually accurate color transitions

## Future Enhancements

- [ ] Add animation support for smooth transitions between gradients
- [ ] Implement gesture control for interactive exploration of gradients
- [ ] Custom color palette selection
- [ ] Export gradients as SVG
- [ ] Performance optimizations for lower-end devices

## Technical Details

### Performance Characteristics

- Uses `@shopify/react-native-skia` for hardware-accelerated rendering
- Efficient mesh generation with optimized vertex count (32x32 grid)
- Minimal re-renders (only on theme change or user interaction)
- Memory-efficient color blending
- No runtime animations (static gradients that change on demand)

### Resolution and Quality

- 32x32 vertex grid (1024 vertices)
- Smooth color interpolation using quadratic falloff
- Strategic control point placement for natural gradient flow
- Clean edge handling

## Implementation Notes

The gradient generation uses a combination of:
- Strategic control point placement
- Quadratic falloff for color blending
- RGB color space interpolation
- Fixed grid mesh for stability

## Future Improvements

- [ ] Add animation support for smooth transitions
- [ ] Implement custom color palette options
- [ ] Add more gradient patterns
- [ ] Optimize for different screen sizes
- [ ] Add gesture controls for interactive gradients

## Dependencies

- React Native
- @shopify/react-native-skia
- React Native Reanimated (optional for future animations)

## Known Limitations

- Large vertex count might impact performance on low-end devices
- Color transitions are currently instant (no animations)
- Limited to predefined color palettes

## Contributing

Feel free to submit issues and enhancement requests! 