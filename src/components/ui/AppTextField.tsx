import React from 'react';
import { AppInput, type AppInputProps } from './AppInput';

export type AppTextFieldProps = AppInputProps;

export function AppTextField(props: AppTextFieldProps) {
  return <AppInput {...props} />;
}
