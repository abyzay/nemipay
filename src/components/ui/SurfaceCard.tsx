import React from 'react';
import { AppCard, type AppCardProps } from './AppCard';

export interface SurfaceCardProps {
  children: React.ReactNode;
  style?: AppCardProps['style'];
  padding?: 'sm' | 'md';
  testID?: string;
}

export function SurfaceCard({ children, style, padding = 'md', testID }: SurfaceCardProps) {
  return (
    <AppCard variant="standard" padding={padding} style={style} testID={testID}>
      {children}
    </AppCard>
  );
}
