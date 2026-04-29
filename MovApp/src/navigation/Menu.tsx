import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  StyleSheet,
} from "react-native";

import {
  useDrawerStatus,
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";

import Screens from "./Screens";
import { Block, Text, Button, Image } from "../components";
import { useData, useTheme, useTranslation } from "../hooks";

const Drawer = createDrawerNavigator();

/* ---------------- SCREEN STACK ---------------- */
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
    outputRange: [0, 22],
  });

  useEffect(() => {
    Animated.timing(animation, {
      duration: 220,
      useNativeDriver: true,
      toValue: isDrawerOpen ? 1 : 0,
    }).start();
  }, [isDrawerOpen]);

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          overflow: "hidden",
          borderColor: colors.card,
          borderWidth: isDrawerOpen ? 1 : 0,
        },
        {
          borderRadius,
          transform: [{ scale }],
        },
      ]}
    >
      <Screens />
    </Animated.View>
  );
};

/* ---------------- CUSTOM MENU ---------------- */
const DrawerContentObj = (props: DrawerContentComponentProps) => {
  const { navigation } = props;

  const { t } = useTranslation();
  const { assets, colors, gradients, sizes } = useTheme();
  const { setIsDark } = useData() as any;

  const [active, setActive] = useState("Home");

  const handleNavigation = useCallback(
    (to: string) => {
      setActive(to);
      (navigation as any).navigate("Screens", { screen: to });
    },
    [navigation]
  );

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Cerrar sesión",
      "¿Deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => {
            (navigation as any).navigate("Screens", {
              screen: "Login",
            });
          },
        },
      ]
    );
  }, [navigation]);

  const screens = [
    {
      name: t("screens.home"),
      to: "Home",
      icon: assets.home,
    },
    {
      name: t("screens.history"),
      to: "History",
      icon: assets.calendar,
    },
    {
      name: t("screens.vehicles"),
      to: "VehicleList",
      icon: assets.rental,
    },
    {
      name: t("screens.profile"),
      to: "Profile",
      icon: assets.profile,
    },
    {
      name: t("screens.settings"),
      to: "Settings",
      icon: assets.settings,
    },
    {
      name: t("screens.help"),
      to: "Help",
      icon: assets.chat,
    },
  ];

  return (
    <DrawerContentScrollView
      {...props}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: sizes.xl,
      }}
    >
      <Block padding={sizes.m}>
        {/* HEADER */}
        <Block
          radius={20}
          padding={sizes.m}
          marginBottom={sizes.l}
          color={colors.card}
        >
          <Block row align="center">
            <Image
              source={assets.logo}
              width={48}
              height={48}
              radius={12}
              marginRight={sizes.sm}
            />

            <Block>
              <Text semibold size={16}>
                Felipe Gomez
              </Text>

              <Text size={12} gray>
                Campus Parking
              </Text>
            </Block>
          </Block>
        </Block>

        {/* MENU ITEMS */}
        {screens.map((screen, index) => {
          const isActive = active === screen.to;

          return (
            <Button
              key={`drawer-${index}`}
              row
              align="center"
              justify="flex-start"
              padding={12}
              radius={14}
              marginBottom={8}
              color={isActive ? colors.card : "transparent"}
              onPress={() => handleNavigation(screen.to)}
            >
              <Block
                width={38}
                height={38}
                radius={12}
                align="center"
                justify="center"
                marginRight={12}
                gradient={
                  gradients[
                    isActive ? "primary" : "white"
                  ]
                }
              >
                <Image
                  source={screen.icon}
                  width={16}
                  height={16}
                  color={
                    colors[
                      isActive ? "white" : "black"
                    ]
                  }
                />
              </Block>

              <Text
                semibold={isActive}
                color={colors.text}
              >
                {screen.name}
              </Text>
            </Button>
          );
        })}

        {/* DIVIDER */}
        <Block
          height={1}
          marginVertical={sizes.m}
          gradient={gradients.menu}
        />

        {/* LOGOUT */}
        <Button
          row
          align="center"
          justify="flex-start"
          padding={12}
          radius={14}
          onPress={handleLogout}
        >
          <Block
            width={38}
            height={38}
            radius={12}
            align="center"
            justify="center"
            marginRight={12}
            color="#FFECEC"
          >
            <Text color="red">↩</Text>
          </Block>

          <Text semibold color="red">
            Cerrar sesión
          </Text>
        </Button>
      </Block>
    </DrawerContentScrollView>
  );
};

/* ---------------- ROOT ---------------- */
export default () => {
  const { gradients } = useTheme();

  return (
    <Block gradient={gradients.light}>
      <Drawer.Navigator
        drawerContent={(props) => (
          <DrawerContentObj {...props} />
        )}
        screenOptions={{
          headerShown: false,
          drawerType: "slide",
          overlayColor: "transparent",
          sceneStyle: {
            backgroundColor: "transparent",
          },
          drawerStyle: {
            width: "72%",
            borderRightWidth: 0,
            backgroundColor: "white",
          },
        }}
      >
        <Drawer.Screen
          name="Screens"
          component={ScreensStack}
        />
      </Drawer.Navigator>
    </Block>
  );
};