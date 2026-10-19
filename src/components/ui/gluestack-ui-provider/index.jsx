import React, { useEffect } from 'react';
import { View, Appearance } from 'react-native';

export function GluestackUIProvider({
  mode = 'system',
  ...props
}) {
  useEffect(() => {
    Appearance.setColorScheme(mode);
  }, [mode]);

  return (
    <View
      style={[
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ]}
    >
      {props.children}
    </View>
  );
}

export default GluestackUIProvider;