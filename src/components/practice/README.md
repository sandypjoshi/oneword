# AnimatedGradientCard Component

A high-performance React Native component that renders beautiful mesh gradients using Skia. The component creates smooth, organic-looking gradients that adapt to light and dark modes.

## Features

- Smooth mesh gradients with carefully curated color palettes
- Automatic light/dark mode adaptation
- High-performance Skia-based rendering
- Interactive gradient changes
- Responsive design
- Hardware-accelerated graphics
- Customizable content (title and description)

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

### Props

| Prop | Type | Description |
|------|------|-------------|
| title | string | Main text displayed on the card |
| description | string | Secondary text displayed below the title |

### Dimensions

- Width: Screen width - 40px
- Height: 70% of screen height
- Padding: 20px
- Border Radius: 24px

## Color Palettes

### Light Mode
- Soft pastels
- Warm neutrals
- Cool morning
- Dusty rose
- Mint cream

### Dark Mode
- Deep ocean
- Night sky
- Forest depths
- Twilight
- Dark earth

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

## Performance Considerations

1. **Memory Usage**
   - Fixed vertex count (1024 vertices)
   - Static color arrays
   - No dynamic memory allocation during rendering

2. **CPU Usage**
   - Gradient calculation only happens on demand
   - No per-frame updates
   - Efficient color interpolation

3. **GPU Usage**
   - Hardware-accelerated rendering via Skia
   - Single draw call per frame
   - Static geometry

## Known Limitations

- Large vertex count might impact performance on low-end devices
- Color transitions are currently instant (no animations)
- Limited to predefined color palettes

## Contributing

Feel free to submit issues and enhancement requests! 