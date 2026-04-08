import React, { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/core";

import { Block, Button, Image, Input, Text } from "../components/";
import { useData, useTheme, useTranslation } from "../hooks/";
import { profileService } from "../services/profileService";

const isAndroid = Platform.OS === "android";

interface IProfileForm {
  name: string;
  last_name: string;
  email: string;
  cellphone: string;
  vehicle_type: string;
}

const Profile = () => {
  const { authUser, handleUpdateAuthUser } = useData();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { assets, colors, sizes } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<IProfileForm>({
    name: "",
    last_name: "",
    email: "",
    cellphone: "",
    vehicle_type: "",
  });

  // Auth guard — redirect to Login if not authenticated
  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Login" as never);
    }
  }, [authUser, navigation]);

  // Populate form when entering edit mode
  const startEditing = useCallback(() => {
    if (authUser) {
      setForm({
        name: authUser.name ?? "",
        last_name: authUser.last_name ?? "",
        email: authUser.email ?? "",
        cellphone: authUser.cellphone ?? "",
        vehicle_type: authUser.vehicle_type ?? "",
      });
    }
    setIsEditing(true);
  }, [authUser]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof IProfileForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await profileService.editProfile(form);
      await handleUpdateAuthUser(form);
      Alert.alert(t("profile.profileUpdated"));
      setIsEditing(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert(t("profile.profileUpdateError"), message);
      // Still update local state so user sees their changes
      await handleUpdateAuthUser(form);
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, handleUpdateAuthUser, t]);

  const handleCall = useCallback(() => {
    if (authUser?.cellphone) {
      Linking.openURL(`tel:${authUser.cellphone}`);
    }
  }, [authUser]);

  if (!authUser) {
    return null;
  }

  const isValet = authUser.type === "valet";
  const fullName = `${authUser.name} ${authUser.last_name}`;
  const userTypeLabel = isValet ? "Valet" : "Cliente";

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
                {t("profile.title")}
              </Text>
            </Button>
            <Block flex={0} align="center">
              <Image
                width={64}
                height={64}
                marginBottom={sizes.sm}
                source={{
                  uri:
                    authUser.profile_img ||
                    "https://via.placeholder.com/64",
                }}
              />
              <Text h5 center white>
                {fullName}
              </Text>
              <Text p center white>
                {userTypeLabel}
              </Text>
              <Block row marginVertical={sizes.m}>
                <Button
                  white
                  outlined
                  shadow={false}
                  radius={sizes.m}
                  onPress={startEditing}
                >
                  <Block
                    row
                    justify="center"
                    align="center"
                    radius={sizes.m}
                    paddingHorizontal={sizes.m}
                    color="rgba(255,255,255,0.2)"
                  >
                    <Ionicons
                      size={16}
                      name="create-outline"
                      color={colors.white}
                      style={{ marginRight: 6 }}
                    />
                    <Text white bold transform="uppercase">
                      {t("profile.editProfile")}
                    </Text>
                  </Block>
                </Button>
                {authUser.cellphone ? (
                  <Button
                    shadow={false}
                    radius={sizes.m}
                    marginLeft={sizes.sm}
                    color="rgba(255,255,255,0.2)"
                    outlined={String(colors.white)}
                    onPress={handleCall}
                  >
                    <Block
                      row
                      justify="center"
                      align="center"
                      paddingHorizontal={sizes.s}
                    >
                      <Ionicons
                        size={18}
                        name="call-outline"
                        color={colors.white}
                        style={{ marginRight: 4 }}
                      />
                      <Text white bold>
                        {t("profile.callPhone")}
                      </Text>
                    </Block>
                  </Button>
                ) : null}
              </Block>
            </Block>
          </Image>

          {/* profile: stats */}
          <Block
            flex={0}
            radius={sizes.sm}
            shadow={!isAndroid}
            marginTop={-sizes.l}
            marginHorizontal="8%"
            color="rgba(255,255,255,0.2)"
          >
            <Block
              row
              blur
              flex={0}
              intensity={100}
              radius={sizes.sm}
              overflow="hidden"
              tint={colors.blurTint}
              justify="space-evenly"
              paddingVertical={sizes.sm}
              renderToHardwareTextureAndroid
            >
              <Block align="center">
                <Text h5>{"--"}</Text>
                <Text>{t("profile.servicesCompleted")}</Text>
              </Block>
              <Block align="center">
                <Block row align="center">
                  <Text h5>{"--"}</Text>
                  <Ionicons
                    size={14}
                    name="star"
                    color={colors.warning}
                    style={{ marginLeft: 4 }}
                  />
                </Block>
                <Text>{t("profile.customerRating")}</Text>
              </Block>
            </Block>
          </Block>

          {/* profile: personal info or edit form */}
          <Block paddingHorizontal={sizes.sm} marginTop={sizes.sm}>
            <Text h5 semibold marginBottom={sizes.s}>
              {t("profile.personalInfo")}
            </Text>

            {isEditing ? (
              <Block>
                <Input
                  autoCapitalize="words"
                  marginBottom={sizes.m}
                  label={t("profile.name")}
                  placeholder={t("profile.name")}
                  value={form.name}
                  onChangeText={(value: string) =>
                    handleFormChange("name", value)
                  }
                />
                <Input
                  autoCapitalize="words"
                  marginBottom={sizes.m}
                  label={t("profile.lastName")}
                  placeholder={t("profile.lastName")}
                  value={form.last_name}
                  onChangeText={(value: string) =>
                    handleFormChange("last_name", value)
                  }
                />
                <Input
                  autoCapitalize="none"
                  marginBottom={sizes.m}
                  label={t("profile.email")}
                  placeholder={t("profile.email")}
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(value: string) =>
                    handleFormChange("email", value)
                  }
                />
                <Input
                  marginBottom={sizes.m}
                  label={t("profile.phone")}
                  placeholder={t("profile.phone")}
                  keyboardType="phone-pad"
                  value={form.cellphone}
                  onChangeText={(value: string) =>
                    handleFormChange("cellphone", value)
                  }
                />
                {isValet && (
                  <Input
                    marginBottom={sizes.m}
                    label={t("profile.vehicleType")}
                    placeholder={t("profile.vehicleType")}
                    value={form.vehicle_type}
                    onChangeText={(value: string) =>
                      handleFormChange("vehicle_type", value)
                    }
                  />
                )}
                <Block row justify="space-between" marginTop={sizes.s}>
                  <Button
                    outlined
                    flex={1}
                    marginRight={sizes.s}
                    onPress={cancelEditing}
                    disabled={isSubmitting}
                  >
                    <Text bold primary center>
                      {t("profile.cancel")}
                    </Text>
                  </Button>
                  <Button
                    primary
                    flex={1}
                    marginLeft={sizes.s}
                    onPress={handleSave}
                    disabled={isSubmitting}
                  >
                    <Text bold white center>
                      {t("profile.saveChanges")}
                    </Text>
                  </Button>
                </Block>
              </Block>
            ) : (
              <Block>
                <InfoRow
                  label={t("profile.name")}
                  value={authUser.name}
                  sizes={sizes}
                />
                <InfoRow
                  label={t("profile.lastName")}
                  value={authUser.last_name}
                  sizes={sizes}
                />
                <InfoRow
                  label={t("profile.email")}
                  value={authUser.email}
                  sizes={sizes}
                />
                <InfoRow
                  label={t("profile.phone")}
                  value={authUser.cellphone}
                  sizes={sizes}
                />
                <InfoRow
                  label={t("profile.userType")}
                  value={userTypeLabel}
                  sizes={sizes}
                />
                {isValet && authUser.vehicle_type && (
                  <InfoRow
                    label={t("profile.vehicleType")}
                    value={authUser.vehicle_type}
                    sizes={sizes}
                  />
                )}
                {isValet && authUser.valet_code && (
                  <InfoRow
                    label={t("profile.valetCode")}
                    value={authUser.valet_code}
                    sizes={sizes}
                  />
                )}
              </Block>
            )}
          </Block>
        </Block>
      </Block>
    </Block>
  );
};

const InfoRow = ({
  label,
  value,
  sizes,
}: {
  label: string;
  value: string | null | undefined;
  sizes: any;
}) => (
  <Block
    row
    justify="space-between"
    align="center"
    paddingVertical={sizes.xs}
    marginBottom={sizes.xs}
  >
    <Text bold p>
      {label}
    </Text>
    <Text p gray>
      {value || "--"}
    </Text>
  </Block>
);

export default Profile;
