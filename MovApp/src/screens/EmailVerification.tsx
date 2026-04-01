import React, { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/core";

import { useTheme, useTranslation } from "../hooks/";
import { Block, Button, Input, Image, Text } from "../components/";
import { verificationService } from "../services";

const isAndroid = Platform.OS === "android";

const EmailVerification = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { assets, colors, gradients, sizes } = useTheme();

  const userId = (route.params as { user_id: number })?.user_id;

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) {
      Alert.alert("Error", "El código debe tener 6 dígitos");
      return;
    }
    setIsSubmitting(true);
    try {
      await verificationService.verifyEmail({ user_id: userId, code });
      Alert.alert("Éxito", "Correo verificado. Por favor inicia sesión.", [
        { text: "OK", onPress: () => navigation.navigate("Login" as never) },
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Código inválido";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  }, [code, userId, navigation]);

  const handleResend = useCallback(async () => {
    try {
      await verificationService.resendCode({ user_id: userId });
      setResendCooldown(60);
      Alert.alert("Enviado", "Se envió un nuevo código a tu correo.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo reenviar el código";
      Alert.alert("Error", message);
    }
  }, [userId]);

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

            <Text h4 center white marginBottom={sizes.md}>
              Verificar correo
            </Text>
          </Image>
        </Block>

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
              <Text p semibold center marginBottom={sizes.s}>
                Ingresa el código de 6 dígitos enviado a tu correo institucional
              </Text>

              <Block paddingHorizontal={sizes.sm}>
                <Input
                  autoCapitalize="none"
                  marginBottom={sizes.m}
                  label="Código de verificación"
                  placeholder="000000"
                  keyboardType="numeric"
                  maxLength={6}
                  onChangeText={setCode}
                  success={code.length === 6}
                  danger={Boolean(code.length > 0 && code.length < 6)}
                />
              </Block>

              <Button
                onPress={handleVerify}
                marginVertical={sizes.s}
                marginHorizontal={sizes.sm}
                gradient={gradients.primary}
                disabled={code.length !== 6 || isSubmitting}
              >
                <Text bold white transform="uppercase">
                  {isSubmitting ? "Verificando..." : "Verificar"}
                </Text>
              </Button>

              <Button
                primary
                outlined
                shadow={!isAndroid}
                marginVertical={sizes.s}
                marginHorizontal={sizes.sm}
                onPress={handleResend}
                disabled={resendCooldown > 0}
              >
                <Text bold primary transform="uppercase">
                  {resendCooldown > 0
                    ? `Reenviar (${resendCooldown}s)`
                    : "Reenviar código"}
                </Text>
              </Button>
            </Block>
          </Block>
        </Block>
      </Block>
    </Block>
  );
};

export default EmailVerification;
