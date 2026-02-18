import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'live.youpick.app',
  appName: 'YouPick',
  webDir: 'dist',
  server: {
    url: 'https://youpick.live',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#F7F1E8',
    },
  },
};

export default config;
