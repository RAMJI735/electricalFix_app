import React from 'react';


import { vstackStyle } from './styles';




const VStack = React.forwardRef(
  function VStack({ className, space, reversed, ...props }, ref) {
    return (
      <div
        className={vstackStyle({
          space,
          reversed: reversed,
          class: className
        })}
        {...props}
        ref={ref} />);


  }
);

VStack.displayName = 'VStack';

export { VStack };