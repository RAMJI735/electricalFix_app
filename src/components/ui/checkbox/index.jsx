'use client';
import { createCheckbox } from '@gluestack-ui/core/checkbox/creator';
import { UIIcon } from '@gluestack-ui/core/icon/creator';

import { tva, withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
import { styled } from 'nativewind';
import React from 'react';

import { Platform, Pressable, Text, View } from 'react-native';

const IndicatorWrapper = React.forwardRef(


  function IndicatorWrapper({ ...props }, ref) {
    return <View {...props} ref={ref} />;
  });

const LabelWrapper = React.forwardRef(


  function LabelWrapper({ ...props }, ref) {
    return <Text {...props} ref={ref} />;
  });

const StyledUIIcon = styled(UIIcon, {
  className: "style"
});

const IconWrapper = React.forwardRef(


  function IconWrapper({ ...props }, ref) {
    return <StyledUIIcon {...props} ref={ref} />;
  });

const SCOPE = 'CHECKBOX';


const UICheckbox = createCheckbox({
  // @ts-expect-error : internal implementation for r-19/react-native-web
  Root:
  Platform.OS === 'web' ?
  withStyleContext(View, SCOPE) :
  withStyleContext(Pressable, SCOPE),
  Group: View,
  Icon: IconWrapper,
  Label: LabelWrapper,
  Indicator: IndicatorWrapper
});


const checkboxStyle = tva({
  base: 'group/checkbox flex-row items-center justify-start gap-2 web:cursor-pointer data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50'
});

const checkboxIndicatorStyle = tva({
  base: 'justify-center items-center w-4 h-4 shrink-0 rounded border border-input dark:bg-input/30   shadow-xs web:outline-none web:data-[focus-visible=true]:ring-[3px] web:data-[focus-visible=true]:ring-ring/50 web:data-[focus-visible=true]:border-ring data-[checked=true]:bg-primary  data-[checked=true]:border-primary dark:data-[checked=true]:bg-primary dark:data-[checked=true]:border-primary data-[invalid=true]:ring-destructive/20 data-[invalid=true]:border-destructive data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50'
});

const checkboxLabelStyle = tva({
  base: 'text-foreground text-sm font-medium font-body web:select-none web:cursor-pointer data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50'
});

const checkboxIconStyle = tva({
  base: 'text-primary-foreground fill-none h-3.5 w-3.5'
});

const CheckboxGroup = UICheckbox.Group;




const Checkbox = React.forwardRef(


  function Checkbox({ className, ...props }, ref) {
    return (
      <UICheckbox
        className={checkboxStyle({ class: className })}
        {...props}
        context={{}}
        ref={ref} />);


  });






const CheckboxIndicator = React.forwardRef(


  function CheckboxIndicator({ className, ...props }, ref) {
    return (
      <UICheckbox.Indicator
        className={checkboxIndicatorStyle({ class: className })}
        {...props}
        ref={ref} />);


  });





const CheckboxLabel = React.forwardRef(


  function CheckboxLabel({ className, ...props }, ref) {
    return (
      <UICheckbox.Label
        className={checkboxLabelStyle({ class: className })}
        {...props}
        ref={ref} />);


  });






const CheckboxIcon = React.forwardRef(


  function CheckboxIcon({ className, size, ...props }, ref) {
    if (typeof size === 'number') {
      return (
        <UICheckbox.Icon
          ref={ref}
          {...props}
          className={checkboxIconStyle({ class: className })}
          size={size} />);


    } else if (
    (props.height !== undefined || props.width !== undefined) &&
    size === undefined)
    {
      return (
        <UICheckbox.Icon
          ref={ref}
          {...props}
          className={checkboxIconStyle({ class: className })} />);


    }

    return (
      <UICheckbox.Icon
        className={checkboxIconStyle({ class: className })}
        {...props}
        ref={ref} />);


  });

Checkbox.displayName = 'Checkbox';
CheckboxIndicator.displayName = 'CheckboxIndicator';
CheckboxLabel.displayName = 'CheckboxLabel';
CheckboxIcon.displayName = 'CheckboxIcon';

export {
  Checkbox, CheckboxGroup, CheckboxIcon, CheckboxIndicator,
  CheckboxLabel };