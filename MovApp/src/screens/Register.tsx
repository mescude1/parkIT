import React, { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import { useNavigation } from "@react-navigation/core";

import { useTheme, useTranslation } from "../hooks/";
import * as regex from "../constants/regex";
import { Block, Button, Input, Image, Text, Checkbox } from "../components/";
import { authService } from "../services";

const isAndroid = Platform.OS === "android";

type UserType = "cliente" | "valet";

interface IRegistration {
  userType: UserType;
  name: string;
  last_name: string;
  username: string;
  email: string;
  institutional_email: string;
  cellphone: string;
  password: string;
  confirm_password: string;
  vehicle_type: string;
  agreed: boolean;
}

interface IRegistrationValidation {
  name: boolean;
  last_name: boolean;
  username: boolean;
  email: boolean;
  cellphone: boolean;
  password: boolean;
  confirm_password: boolean;
  agreed: boolean;
}

const Register = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { assets, colors, gradients, sizes } = useTheme();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState<IRegistrationValidation>({
    name: false,
    last_name: false,
    username: false,
    email: false,
    cellphone: false,
    password: false,
    confirm_password: false,
    agreed: false,
  });
  const [registration, setRegistration] = useState<IRegistration>({
    userType: "cliente",
    name: "",
    last_name: "",
    username: "",
    email: "",
    institutional_email: "",
    cellphone: "",
    password: "",
    confirm_password: "",
    vehicle_type: "",
    agreed: false,
  });

  const handleChange = useCallback((value: Partial<IRegistration>) => {
    setRegistration((state) => ({ ...state, ...value }));
  }, []);

  const handleSignUp = useCallback(async () => {
    if (Object.values(isValid).includes(false)) return;
    setIsSubmitting(true);
    try {
      if (registration.userType === "cliente") {
        const response = await authService.registerCliente({
          name: registration.name,
          last_name: registration.last_name,
          username: registration.username,
          password: registration.password,
          email: registration.email,
          institutional_email: registration.institutional_email,
          cellphone: registration.cellphone,
          profile_img: "https://ui-avatars.com/api/?name=" + encodeURIComponent(registration.name),
          id_img: "https://via.placeholder.com/400x250?text=ID",
        });
        (navigation as any).navigate("EmailVerification", {
          user_id: response.data.id,
        });
      } else {
        await authService.registerValet({
          name: registration.name,
          last_name: registration.last_name,
          username: registration.username,
          password: registration.password,
          email: registration.email,
          cellphone: registration.cellphone,
          vehicle_type: registration.vehicle_type,
          profile_img: "https://ui-avatars.com/api/?name=" + encodeURIComponent(registration.name),
          id_img: "https://via.placeholder.com/400x250?text=ID",
          driver_license_img: "https://via.placeholder.com/400x250?text=License",
        });
        navigation.navigate("Login" as never);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, registration, navigation]);

  useEffect(() => {
    setIsValid((state) => ({
      ...state,
      name: regex.name.test(registration.name),
      last_name: regex.name.test(registration.last_name),
      username: registration.username.length >= 3,
      email: regex.email.test(registration.email),
      cellphone: registration.cellphone.length >= 7,
      password: regex.password.test(registration.password),
      confirm_password:
        registration.password.length > 0 &&
        registration.confirm_password === registration.password,
      agreed: registration.agreed,
    }));
  }, [registration]);

  const isCliente = registration.userType === "cliente";

  return (
    <Block safe flex={1}>
      <Block
        keyboard
        flex={1}
        behavior={!isAndroid ? "padding" : "height"}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: sizes.xxl }}
      >
        <Block paddingHorizontal={sizes.s}>
          {/* header image */}
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
                {t("register.title")}
              </Text>
            </Image>
          </Block>

          {/* form card */}
          <Block
            flex={0}
            radius={sizes.sm}
            marginHorizontal="8%"
            shadow={!isAndroid}
            marginTop={-(sizes.height * 0.2 - sizes.l)}
          >
            <Block
              blur
              flex={0}
              intensity={90}
              radius={sizes.sm}
              overflow="hidden"
              tint={colors.blurTint}
              paddingVertical={sizes.sm}
            >
              <Text p semibold center marginBottom={sizes.m}>
                {t("register.subtitle")}
              </Text>

              {/* user type selector */}
              <Block
                row
                flex={0}
                justify="center"
                marginBottom={sizes.m}
                paddingHorizontal={sizes.sm}
              >
                <Button
                  flex={1}
                  marginRight={sizes.s}
                  gradient={isCliente ? gradients.primary : undefined}
                  outlined={!isCliente}
                  onPress={() => handleChange({ userType: "cliente" })}
                >
                  <Text
                    bold
                    transform="uppercase"
                    white={isCliente}
                    primary={!isCliente}
                  >
                    Cliente
                  </Text>
                </Button>
                <Button
                  flex={1}
                  marginLeft={sizes.s}
                  gradient={!isCliente ? gradients.primary : undefined}
                  outlined={isCliente}
                  onPress={() => handleChange({ userType: "valet" })}
                >
                  <Text
                    bold
                    transform="uppercase"
                    white={!isCliente}
                    primary={isCliente}
                  >
                    Valet
                  </Text>
                </Button>
              </Block>

              {/* form inputs */}
              <Block paddingHorizontal={sizes.sm}>
                <Input
                  autoCapitalize="words"
                  marginBottom={sizes.m}
                  label={t("common.name")}
                  placeholder={t("common.namePlaceholder")}
                  success={Boolean(registration.name && isValid.name)}
                  danger={Boolean(registration.name && !isValid.name)}
                  onChangeText={(value) => handleChange({ name: value })}
                />
                <Input
                  autoCapitalize="words"
                  marginBottom={sizes.m}
                  label="Apellido"
                  placeholder="Ingresa tu apellido"
                  success={Boolean(
                    registration.last_name && isValid.last_name
                  )}
                  danger={Boolean(
                    registration.last_name && !isValid.last_name
                  )}
                  onChangeText={(value) => handleChange({ last_name: value })}
                />
                <Input
                  autoCapitalize="none"
                  marginBottom={sizes.m}
                  label="Usuario"
                  placeholder="Mínimo 3 caracteres"
                  success={Boolean(
                    registration.username && isValid.username
                  )}
                  danger={Boolean(
                    registration.username && !isValid.username
                  )}
                  onChangeText={(value) => handleChange({ username: value })}
                />
                <Input
                  autoCapitalize="none"
                  marginBottom={sizes.m}
                  label={t("common.email")}
                  keyboardType="email-address"
                  placeholder={t("common.emailPlaceholder")}
                  success={Boolean(registration.email && isValid.email)}
                  danger={Boolean(registration.email && !isValid.email)}
                  onChangeText={(value) => handleChange({ email: value })}
                />
                {isCliente && (
                  <>
                    <Input
                      autoCapitalize="none"
                      marginBottom={sizes.s}
                      label="Correo institucional"
                      keyboardType="email-address"
                      placeholder="usuario@gmail.com"
                      success={Boolean(
                        registration.institutional_email &&
                          registration.institutional_email.includes("@gmail.com")
                      )}
                      danger={Boolean(
                        registration.institutional_email &&
                          !registration.institutional_email.includes("@gmail.com")
                      )}
                      onChangeText={(value) =>
                        handleChange({ institutional_email: value })
                      }
                    />
                    <Text
                      size={11}
                      marginBottom={sizes.m}
                      color={
                        registration.institutional_email &&
                        !registration.institutional_email.includes("@gmail.com")
                          ? colors.danger
                          : colors.secondary
                      }
                    >
                      Debe ser una dirección @gmail.com
                    </Text>
                  </>
                )}
                <Input
                  autoCapitalize="none"
                  marginBottom={sizes.s}
                  label="Celular"
                  keyboardType="phone-pad"
                  placeholder="Número de celular"
                  success={Boolean(
                    registration.cellphone && isValid.cellphone
                  )}
                  danger={Boolean(
                    registration.cellphone && !isValid.cellphone
                  )}
                  onChangeText={(value) => handleChange({ cellphone: value })}
                />
                {!isCliente && (
                  <Input
                    autoCapitalize="none"
                    marginBottom={sizes.m}
                    label="Tipo de vehículo"
                    placeholder="Ej: Motocicleta, Bicicleta"
                    onChangeText={(value) =>
                      handleChange({ vehicle_type: value })
                    }
                  />
                )}
                <Input
                  secureTextEntry
                  autoCapitalize="none"
                  marginBottom={sizes.s}
                  label={t("common.password")}
                  placeholder="Crea tu contraseña"
                  onChangeText={(value) => handleChange({ password: value })}
                  success={Boolean(
                    registration.password && isValid.password
                  )}
                  danger={Boolean(
                    registration.password && !isValid.password
                  )}
                />
                {/* password requirements hint */}
                <Text
                  size={11}
                  marginBottom={sizes.m}
                  color={
                    registration.password && !isValid.password
                      ? colors.danger
                      : colors.secondary
                  }
                >
                  Mínimo 6 caracteres · una mayúscula · una minúscula · un número
                </Text>
                <Input
                  secureTextEntry
                  autoCapitalize="none"
                  marginBottom={sizes.s}
                  label="Confirmar contraseña"
                  placeholder="Repite tu contraseña"
                  onChangeText={(value) =>
                    handleChange({ confirm_password: value })
                  }
                  success={Boolean(
                    registration.confirm_password && isValid.confirm_password
                  )}
                  danger={Boolean(
                    registration.confirm_password && !isValid.confirm_password
                  )}
                />
                {registration.confirm_password.length > 0 &&
                  !isValid.confirm_password && (
                    <Text
                      size={11}
                      marginBottom={sizes.m}
                      color={colors.danger}
                    >
                      Las contraseñas no coinciden
                    </Text>
                  )}
              </Block>

              {/* checkbox terms */}
              <Block
                row
                flex={0}
                align="center"
                paddingHorizontal={sizes.sm}
                marginTop={sizes.s}
                marginBottom={sizes.sm}
              >
                <Checkbox
                  marginRight={sizes.sm}
                  checked={registration?.agreed}
                  onPress={(value) => handleChange({ agreed: value })}
                />
                <Text paddingRight={sizes.s}>
                  {t("common.agree")}
                  <Text
                    semibold
                    onPress={() => {
                      Linking.openURL("https://www.creative-tim.com/terms");
                    }}
                  >
                    {t("common.terms")}
                  </Text>
                </Text>
              </Block>

              <Button
                onPress={handleSignUp}
                marginVertical={sizes.s}
                marginHorizontal={sizes.sm}
                gradient={gradients.primary}
                disabled={
                  Object.values(isValid).includes(false) || isSubmitting
                }
              >
                <Text bold white transform="uppercase">
                  {isSubmitting ? "Registrando..." : t("common.signup")}
                </Text>
              </Button>

              <Button
                primary
                outlined
                shadow={!isAndroid}
                marginVertical={sizes.s}
                marginHorizontal={sizes.sm}
                onPress={() => navigation.navigate("Login" as never)}
              >
                <Text bold primary transform="uppercase">
                  {t("common.signin")}
                </Text>
              </Button>
            </Block>
          </Block>
        </Block>
      </Block>
    </Block>
  );
};

export default Register;
