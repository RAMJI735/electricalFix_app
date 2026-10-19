import React from 'react';

import { textStyle } from './styles';



const Text = React.forwardRef(
  function Text(
  {
    className,
    isTruncated,
    bold,
    underline,
    strikeThrough,
    size = 'md',
    sub,
    italic,
    highlight,
    ...props
  },
  ref)
  {
    return (
      <span
        className={textStyle({
          isTruncated: isTruncated,
          bold: bold,
          underline: underline,
          strikeThrough: strikeThrough,
          size,
          sub: sub,
          italic: italic,
          highlight: highlight,
          class: className
        })}
        {...props}
        ref={ref} />);


  }
);

Text.displayName = 'Text';

export { Text };