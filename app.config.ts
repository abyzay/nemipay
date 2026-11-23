import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppEnv = 'development' | 'production';

function resolveAppEnv(): AppEnv {
  return process.env.APP_ENV === 'production' ? 'production' : 'development';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = resolveAppEnv();
  const isProduction = appEnv === 'production';

  return {
    ...config,
    name: isProduction ? 'NemiPay' : 'NemiPay Dev',
    slug: config.slug ?? 'nemipay',
    ios: {
      ...config.ios,
      bundleIdentifier: isProduction ? 'com.nemipay.app' : 'com.nemipay.app.dev',
    },
    android: {
      ...config.android,
      package: isProduction ? 'com.nemipay.app' : 'com.nemipay.app.dev',
    },
    extra: {
      ...config.extra,
      appEnv,
    },
  };
};
