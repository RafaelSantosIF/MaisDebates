import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

const source = require('../../../assets/logo.png');
const sourceWidth = 2000;
const visible = { left: 199, top: 755, width: 1671, height: 548 };

export function BrandLogo({ width = 156 }: { width?: number }) {
  const window = useWindowDimensions();
  const logoWidth = Math.max(0, Math.min(width, window.width - 40));
  const imageSize = logoWidth * sourceWidth / visible.width;

  return <View
    accessible
    accessibilityRole="image"
    accessibilityLabel="Logo +Debates"
    style={[styles.frame, { width: logoWidth, height: logoWidth * visible.height / visible.width }]}
  >
    <Image
      source={source}
      resizeMode="stretch"
      accessible={false}
      style={{
        position: 'absolute',
        width: imageSize,
        height: imageSize,
        left: -visible.left * logoWidth / visible.width,
        top: -visible.top * logoWidth / visible.width,
      }}
    />
  </View>;
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    flexShrink: 1,
  },
});
