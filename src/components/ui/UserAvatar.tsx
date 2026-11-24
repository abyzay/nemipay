import React from 'react';
import { AppAvatar, type AppAvatarProps } from './AppAvatar';

export type UserAvatarProps = AppAvatarProps;

export function UserAvatar(props: UserAvatarProps) {
  return <AppAvatar {...props} />;
}

const _unused = undefined;
void _unused;
