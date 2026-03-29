import React, { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { useFonts } from "expo-font";
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";

import Menu from "./Menu";
import { useData, ThemeProvider, TranslationProvider } from "../hooks";
import Login from "../screens/Login";
import Register from "../screens/Register";
import EmailVerification from "../screens/EmailVerification";

export const navigationRef = createNavigationContainerRef();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Auth = createStackNavigator();

const AuthNavigator = () => (
  <Auth.Navigator screenOptions={{ headerShown: false }}>
    <Auth.Screen name="Login" component={Login} />
    <Auth.Screen name="Register" component={Register} />
    <Auth.Screen name="EmailVerification" component={EmailVerification} />
  </Auth.Navigator>
);

export default () => {
  const { isDark, theme, setTheme, isAuthenticated, isInitializing } =
    useData();

  // Listen for incoming push notifications and navigate accordingly
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as {
        type?: string;
        request_id?: number;
        service_id?: number;
        valet_id?: number;
      };
      if (!navigationRef.isReady()) return;
      if (data.type === "valet_request" && data.request_id != null) {
        (navigationRef as any).navigate("IncomingRequest", {
          request_id: data.request_id,
        });
      }
      if (
        data.type === "valet_accepted" &&
        data.service_id != null &&
        data.valet_id != null
      ) {
        (navigationRef as any).navigate("ActiveService", {
          service_id: data.service_id,
          other_user_id: data.valet_id,
        });
      }
    });
    return () => sub.remove();
  }, []);

  /* set the status bar based on isDark constant */
  useEffect(() => {
    Platform.OS === "android" && StatusBar.setTranslucent(true);
    StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    return () => {
      StatusBar.setBarStyle("default");
    };
  }, [isDark]);

  // load custom fonts
  const [fontsLoaded] = useFonts({
    "OpenSans-Light": theme.assets.OpenSansLight,
    "OpenSans-Regular": theme.assets.OpenSansRegular,
    "OpenSans-SemiBold": theme.assets.OpenSansSemiBold,
    "OpenSans-ExtraBold": theme.assets.OpenSansExtraBold,
    "OpenSans-Bold": theme.assets.OpenSansBold,
  });

  useEffect(() => {
    if (fontsLoaded && !isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitializing]);

  if (!fontsLoaded || isInitializing) {
    return null;
  }

  const navigationTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      border: "rgba(0,0,0,0)",
      text: String(theme.colors.text),
      card: String(theme.colors.card),
      primary: String(theme.colors.primary),
      notification: String(theme.colors.primary),
      background: String(theme.colors.background),
    },
  };

  return (
    <TranslationProvider>
      <ThemeProvider theme={theme} setTheme={setTheme}>
        <NavigationContainer theme={navigationTheme} ref={navigationRef}>
          {isAuthenticated ? <Menu /> : <AuthNavigator />}
        </NavigationContainer>
      </ThemeProvider>
    </TranslationProvider>
  );
};
