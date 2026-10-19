'use client';
import React from 'react';
import { View } from 'react-native';
import { cardStyle } from './styles';








const Card = React.forwardRef(
  function Card({ className, size = 'default', ...props }, ref) {
    return (
      <View className={cardStyle({ size, class: className })} {...props} ref={ref} />);

  }
);

Card.displayName = 'Card';

export { Card };