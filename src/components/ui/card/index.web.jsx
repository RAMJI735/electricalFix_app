import React from 'react';
import { cardStyle } from './styles';








const Card = React.forwardRef(function Card(
{ className, size = 'default', ...props },
ref)
{
  return (
    <div
      className={cardStyle({ size, class: className })}
      {...props}
      ref={ref} />);


});

Card.displayName = 'Card';

export { Card };