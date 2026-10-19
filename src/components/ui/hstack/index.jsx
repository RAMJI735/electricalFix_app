import React from 'react';

import { View } from 'react-native';

import { hstackStyle } from './styles';



const HStack = React.forwardRef(
  function HStack({ className, space, reversed, ...props }, ref) {
    return (
      <View
        className={hstackStyle({
          space,
          reversed: reversed,
          class: className
        })}
        {...props}
        ref={ref} />);


  }
);

HStack.displayName = 'HStack';

export { HStack };