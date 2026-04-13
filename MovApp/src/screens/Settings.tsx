import React, { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/core";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Block, Button, Image, Switch, Text } from "../components/";
import { useData, useTheme, useTranslation } from "../hooks/";

const isAndroid = Platform.OS === "android";
const NOTIF_KEY = "settings_email_notifications";

const Settings = () => {
  const { authUser } = useData();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { assets, colors, sizes } = useTheme();

  const [emailNotifications, setEmailNotifications] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Login" as never);
    }
  }, [authUser, navigation]);

  // Load persisted notification preference
  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then((val) => {
      if (val !== null) setEmailNotifications(val === "true");
    });
  }, []);

  const toggleNotifications = useCallback(
    (value: boolean) => {
      setEmailNotifications(value);
      AsyncStorage.setItem(NOTIF_KEY, String(value));
    },
    []
  );

  if (!authUser) return null;

  return (
    <Block safe marginTop={sizes.md}>
      <Block
        scroll
        paddingHorizontal={sizes.s}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: sizes.padding }}
      >
        <Block flex={0}>
          <Image
            background
            resizeMode="cover"
            padding={sizes.sm}
            paddingBottom={sizes.l}
            radius={sizes.cardRadius}
            source={assets.background}
          >
            <Button
              row
              flex={0}
              justify="flex-start"
              onPress={() => navigation.goBack()}
            >
              <Image
                radius={0}
                width={10}
                height={18}
                color={colors.white}
                source={assets.arrow}
                transform={[{ rotate: "180deg" }]}
              />
              <Text p white marginLeft={sizes.s}>
                {t("common.goBack")}
              </Text>
            </Button>
            <Block flex={0} align="center" marginTop={sizes.sm}>
              <Text h5 center white>
                {t("settings.title")}
              </Text>
            </Block>
          </Image>
        </Block>

        {/* Notifications */}
        <Block
          card
          flex={0}
          row
          align="center"
          justify="space-between"
          marginTop={sizes.sm}
          padding={sizes.sm}
        >
          <Block row flex={1} align="center">
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
              style={{ marginRight: sizes.s }}
            />
            <Text p semibold>
              {t("settings.emailNotifications")}
            </Text>
          </Block>
          <Switch
            checked={emailNotifications}
            onPress={(val: boolean) => toggleNotifications(val)}
          />
        </Block>

        {/* My Vehicles */}
        <Button
          onPress={() => navigation.navigate("VehicleList" as never)}
        >
          <Block
            card
            flex={0}
            row
            align="center"
            justify="space-between"
            marginTop={sizes.s}
            padding={sizes.sm}
          >
            <Block row flex={1} align="center">
              <Ionicons
                name="car-outline"
                size={22}
                color={colors.text}
                style={{ marginRight: sizes.s }}
              />
              <Text p semibold>
                {t("settings.myVehicles")}
              </Text>
            </Block>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.gray}
            />
          </Block>
        </Button>

        {/* Payment Methods */}
        <Block
          card
          flex={0}
          row
          align="center"
          justify="space-between"
          marginTop={sizes.s}
          padding={sizes.sm}
        >
          <Block row flex={1} align="center">
            <Ionicons
              name="card-outline"
              size={22}
              color={colors.gray}
              style={{ marginRight: sizes.s }}
            />
            <Text p color={colors.gray}>
              {t("settings.paymentMethods")}
            </Text>
          </Block>
          <Text p gray size={12}>
            {t("settings.comingSoon")}
          </Text>
        </Block>
      </Block>
    </Block>
  );
};

export default Settings;
