'use client';
import { createAvatar } from '@gluestack-ui/core/avatar/creator';
import React from 'react';
import { Image, Text, View } from 'react-native';

import { tva, withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
const SCOPE = 'AVATAR';

const UIAvatar = createAvatar({
  Root: withStyleContext(View, SCOPE),
  Badge: View,
  Group: View,
  Image: Image,
  FallbackText: Text
});

const avatarStyle = tva({
  base: 'relative flex h-12 w-12 shrink-0 rounded-full bg-muted items-center justify-center group-[.avatar-group]/avatar-group:-ml-2.5'
});

const avatarFallbackTextStyle = tva({
  base: 'text-foreground text-xs font-medium text-transform:uppercase'
});

const avatarGroupStyle = tva({
  base: 'group/avatar-group flex-row-reverse relative avatar-group'
});

const avatarBadgeStyle = tva({
  base: 'absolute h-3 w-3 rounded-full border-2 border-background right-0 bottom-0 bg-green-500'
});

const avatarImageStyle = tva({
  base: 'h-full w-full rounded-full absolute'
});







const Avatar = React.forwardRef(


  function Avatar({ className, ...props }, ref) {
    return (
      <UIAvatar
        ref={ref}
        {...props}
        className={avatarStyle({ class: className })}
        context={{}} />);


  });




const AvatarBadge = React.forwardRef(


  function AvatarBadge({ className, ...props }, ref) {
    return (
      <UIAvatar.Badge
        ref={ref}
        {...props}
        className={avatarBadgeStyle({ class: className })} />);


  });





const AvatarFallbackText = React.forwardRef(


  function AvatarFallbackText({ className, ...props }, ref) {
    return (
      <UIAvatar.FallbackText
        ref={ref}
        {...props}
        className={avatarFallbackTextStyle({ class: className })} />);


  });




const AvatarImage = React.forwardRef(


  function AvatarImage({ className, ...props }, ref) {
    return (
      <UIAvatar.Image
        ref={ref}
        {...props}
        className={avatarImageStyle({
          class: className
        })}
        // @ts-ignore - resizeMode is React Native specific
        resizeMode="cover" />);


  });




const AvatarGroup = React.forwardRef(


  function AvatarGroup({ className, ...props }, ref) {
    return (
      <UIAvatar.Group
        ref={ref}
        {...props}
        className={avatarGroupStyle({
          class: className
        })} />);


  });

// Alias for shadcn compatibility
const AvatarFallback = AvatarFallbackText;

export {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarFallbackText,
  AvatarGroup,
  AvatarImage };