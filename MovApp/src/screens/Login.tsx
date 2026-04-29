import React, { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/core";

import { useData, useTheme, useTranslation } from "../hooks/";
import { Block, Button, Input, Image, Text } from "../components/";

const isAndroid = Platform.OS === "android";

interface ILogin {
  username: string;
  password: string;
}

const Login = () => {
  const { handleLogin, isLoading } = useData();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { assets, colors, gradients, sizes } = useTheme();

  const [login, setLogin] = useState<ILogin>({ username: "", password: "" });

  const handleChange = useCallback(
    (value: Partial<ILogin>) => {
      setLogin((state) => ({ ...state, ...value }));
    },
    []
  );

  const handleSignIn = useCallback(async () => {
    if (!login.username || !login.password) return;
    const result = await handleLogin(login.username, login.password);
    if (!result.success) {
      Alert.alert("Error", result.message ?? "Login failed");
    }
    // On success, isAuthenticated becomes true and App.tsx switches to Menu automatically
  }, [login, handleLogin]);

  const isDisabled = !login.username || !login.password || isLoading;

  return (
    <Block safe marginTop={sizes.md}>
      <Block paddingHorizontal={sizes.s}>
        <Block flex={0} style={{ zIndex: 0 }}>
          <Image
            background
            resizeMode="cover"
            padding={sizes.sm}
            radius={sizes.cardRadius}
            source={assets.background}
            height={sizes.height * 0.3}
          >
            <Button
              row
              flex={0}
              justify="flex-start"
              onPress={() => navigation.canGoBack() && navigation.goBack()}
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

            <Text h4 center white marginBottom={sizes.md}>
              {t("register.title")}
            </Text>
          </Image>
        </Block>

        {/* login form */}
        <Block
          keyboard
          behavior={!isAndroid ? "padding" : "height"}
          marginTop={-(sizes.height * 0.2 - sizes.l)}
        >
          <Block
            flex={0}
            radius={sizes.sm}
            marginHorizontal="8%"
            shadow={!isAndroid}
          >
            <Block
              blur
              flex={0}
              intensity={90}
              radius={sizes.sm}
              overflow="hidden"
              justify="space-evenly"
              tint={colors.blurTint}
              paddingVertical={sizes.sm}
            >
              <Text p semibold center>
                {t("register.subtitle")}
              </Text>

              {/* form inputs */}
              <Block paddingHorizontal={sizes.sm} marginTop={sizes.m}>
                <Input
                  autoCapitalize="none"
                  marginBottom={sizes.m}
                  label="Usuario"
                  placeholder="Ingresa tu usuario"
                  onChangeText={(value) => handleChange({ username: value })}
                  success={Boolean(login.username)}
                />
                <Input
                  secureTextEntry
                  autoCapitalize="none"
                  marginBottom={sizes.m}
                  label={t("common.password")}
                  placeholder={t("common.passwordPlaceholder")}
                  onChangeText={(value) => handleChange({ password: value })}
                  success={Boolean(login.password)}
                />
              </Block>

              <Button
                onPress={handleSignIn}
                marginVertical={sizes.s}
                marginHorizontal={sizes.sm}
                gradient={gradients.primary}
                disabled={isDisabled}
              >
                <Text bold white transform="uppercase">
                  {isLoading ? "Ingresando..." : t("common.signin")}
                </Text>
              </Button>

              <Button
                primary
                outlined
                shadow={!isAndroid}
                marginVertical={sizes.s}
                marginHorizontal={sizes.sm}
                onPress={() => navigation.navigate("Register" as never)}
              >
                <Text bold primary transform="uppercase">
                  {t("common.signup")}
                </Text>
              </Button>
            </Block>
          </Block>
        </Block>
      </Block>
    </Block>
  );
};

export default Login;
