import React, { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { useFonts } from "expo-font";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as SplashScreen from "expo-splash-screen";

import Menu from "./Menu";
import { useData, ThemeProvider, TranslationProvider } from "../hooks";
import Login from "../screens/Login";
import Register from "../screens/Register";
import EmailVerification from "../screens/EmailVerification";

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
        <NavigationContainer theme={navigationTheme}>
          {isAuthenticated ? <Menu /> : <AuthNavigator />}
        </NavigationContainer>
      </ThemeProvider>
    </TranslationProvider>
  );
};
