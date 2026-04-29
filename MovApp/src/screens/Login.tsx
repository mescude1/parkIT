// src/screens/Login.tsx
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
  const { colors, gradients, sizes } = useTheme();

  const [login, setLogin] = useState<ILogin>({ username: "", password: "" });

  const handleChange = useCallback((value: Partial<ILogin>) => {
    setLogin((state) => ({ ...state, ...value }));
  }, []);

  const handleSignIn = useCallback(async () => {
    if (!login.username || !login.password) return;
    const result = await handleLogin(login.username, login.password);
    if (!result.success) {
      Alert.alert("Error", result.message ?? "Login failed");
    }
  }, [login, handleLogin]);

  const isDisabled = !login.username || !login.password || isLoading;

  return (
    <Block safe marginTop={sizes.md}>
      <Block paddingHorizontal={sizes.s}>

        {/* Header con logo */}
        <Block
          flex={0}
          align="center"
          justify="center"
          style={{ height: sizes.height * 0.28 }}
        >
          <Image
            width={110}
            height={110}
            radius={55}
            source={require("../assets/images/logo.png")}
            resizeMode="contain"
          />
          <Text h4 center marginTop={sizes.sm}>
            ParkIT
          </Text>
          <Text p center color={colors.secondary} marginTop={sizes.xs}>
            Valet parking bajo demanda
          </Text>
        </Block>

        {/* Formulario */}
        <Block
          keyboard
          behavior={!isAndroid ? "padding" : "height"}
          marginTop={sizes.s}
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