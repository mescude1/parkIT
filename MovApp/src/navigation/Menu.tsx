// src/navigation/Menu.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Linking, StyleSheet } from "react-native";

import {
  useDrawerStatus,
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";

import Screens from "./Screens";
import { Block, Text, Switch, Button, Image } from "../components";
import { useData, useTheme, useTranslation } from "../hooks";

const Drawer = createDrawerNavigator();

/* drawer menu screens navigation */
const ScreensStack = () => {
  const { colors } = useTheme();
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === "open";
  const animation = useRef(new Animated.Value(0)).current;

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });

  const borderRadius = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  const animatedStyle = {
    borderRadius: borderRadius,
    transform: [{ scale: scale }],
  };

  useEffect(() => {
    Animated.timing(animation, {
      duration: 200,
      useNativeDriver: true,
      toValue: isDrawerOpen ? 1 : 0,
    }).start();
  }, [isDrawerOpen, animation]);

  return (
    <Animated.View
      style={StyleSheet.flatten([
        animatedStyle,
        {
          flex: 1,
          overflow: "hidden",
          borderColor: colors.card,
          borderWidth: isDrawerOpen ? 1 : 0,
        },
      ])}
    >
      <Screens />
    </Animated.View>
  );
};

/* custom drawer menu */
const DrawerContentObj = (props: DrawerContentComponentProps) => {
  const { navigation } = props;
  const { t } = useTranslation();
  const [active, setActive] = useState("Home");
  const { assets, colors, gradients, sizes } = useTheme();
  // ── ROL ──────────────────────────────────────────────────────────────
  const { authUser } = useData();
  const isValet = authUser?.type === "valet";
  // ─────────────────────────────────────────────────────────────────────
  const labelColor = colors.text;

  const handleNavigation = useCallback(
    (to: string) => {
      setActive(to);
      (navigation as any).navigate("Screens", { screen: to });
    },
    [navigation, setActive]
  );

  const handleWebLink = useCallback((url: any) => Linking.openURL(url), []);

  // ── Menú conductor (sin Vehículos) ────────────────────────────────────
  const screensValet = [
    { name: t("screens.home"),     to: "Home",     icon: assets.home     },
    { name: t("screens.history"),  to: "History",  icon: assets.calendar },
    { name: t("screens.profile"),  to: "Profile",  icon: assets.profile  },
    { name: t("screens.settings"), to: "Settings", icon: assets.settings },
    { name: t("screens.help"),     to: "Help",     icon: assets.chat     },
  ];

  // ── Menú cliente (con Vehículos) ──────────────────────────────────────
  const screensCliente = [
    { name: t("screens.home"),     to: "Home",        icon: assets.home     },
    { name: t("screens.history"),  to: "History",     icon: assets.calendar },
    /*
    ========================================
    SECCIÓN CLIENTE (NO MODIFICAR)
    Esta parte corresponde a la funcionalidad del cliente.
    Debe mantenerse intacta y organizada.
    ========================================
    */
    { name: t("screens.vehicles"), to: "VehicleList", icon: assets.rental   },
    { name: t("screens.profile"),  to: "Profile",     icon: assets.profile  },
    { name: t("screens.settings"), to: "Settings",    icon: assets.settings },
    { name: t("screens.help"),     to: "Help",        icon: assets.chat     },
  ];

  const screens = isValet ? screensValet : screensCliente;

  return (
    <DrawerContentScrollView
      {...props}
      scrollEnabled
      removeClippedSubviews
      renderToHardwareTextureAndroid
      contentContainerStyle={{ paddingBottom: sizes.padding }}
    >
      <Block paddingHorizontal={sizes.padding}>
        <Block flex={0} row align="center" marginBottom={sizes.l}>
          <Image
            radius={0}
            width={40}
            height={40}
            source={require("../assets/images/logo.png")}
            marginRight={sizes.sm}
          />
          <Block>
            <Text size={12} semibold>
              {t("app.name")}
            </Text>
            <Text size={12} semibold>
              {t("app.native")}
            </Text>
          </Block>
        </Block>

        {screens?.map((screen, index) => {
          const isActive = active === screen.to;
          return (
            <Button
              row
              justify="flex-start"
              marginBottom={sizes.s}
              key={`menu-screen-${screen.name}-${index}`}
              onPress={() => handleNavigation(screen.to)}
            >
              <Block
                flex={0}
                radius={6}
                align="center"
                justify="center"
                width={sizes.md}
                height={sizes.md}
                marginRight={sizes.s}
                gradient={gradients[isActive ? "primary" : "white"]}
              >
                <Image
                  radius={0}
                  width={14}
                  height={14}
                  source={screen.icon}
                  color={colors[isActive ? "white" : "black"]}
                />
              </Block>
              <Text p semibold={isActive} color={labelColor}>
                {screen.name}
              </Text>
            </Button>
          );
        })}

        <Block
          flex={0}
          height={1}
          marginRight={sizes.md}
          marginVertical={sizes.sm}
          gradient={gradients.menu}
        />
      </Block>
    </DrawerContentScrollView>
  );
};

/* drawer menu navigation */
export default () => {
  const { gradients } = useTheme();

  return (
    <Block gradient={gradients.light}>
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContentObj {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: "slide",
          overlayColor: "transparent",
          sceneStyle: { backgroundColor: "transparent" },
          drawerStyle: {
            flex: 1,
            width: "60%",
            borderRightWidth: 0,
            backgroundColor: "transparent",
          },
        }}
      >
        <Drawer.Screen name="Screens" component={ScreensStack} />
      </Drawer.Navigator>
    </Block>
  );
};