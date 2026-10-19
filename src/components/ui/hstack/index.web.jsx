import React from 'react';

import { hstackStyle } from './styles';




const HStack = React.forwardRef(
  function HStack({ className, space, reversed, ...props }, ref) {
    return (
      <div
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