import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/core";

import { Block, Button, Image, Input, Text } from "../components/";
import { useData, useTheme, useTranslation } from "../hooks/";
import { vehicleService } from "../services/vehicleService";

interface IVehicleForm {
  model: string;
  brand: string;
  license_plate: string;
  year: string;
  type: string;
  vehicle_img: string;
  proof_insurance_img: string;
  property_card: string;
}

const emptyForm: IVehicleForm = {
  model: "",
  brand: "",
  license_plate: "",
  year: "",
  type: "",
  vehicle_img: "",
  proof_insurance_img: "",
  property_card: "",
};

const VehicleForm = () => {
  const { authUser } = useData();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { assets, colors, sizes } = useTheme();

  const vehicleId = (route.params as any)?.vehicleId as number | undefined;
  const isEdit = !!vehicleId;

  const [form, setForm] = useState<IVehicleForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Login" as never);
    }
  }, [authUser, navigation]);

  // Load existing vehicle data in edit mode
  useEffect(() => {
    if (isEdit && vehicleId) {
      setLoading(true);
      vehicleService
        .getOne(vehicleId)
        .then((res: any) => {
          const v = res.vehicle;
          if (v) {
            setForm({
              model: v.model ?? "",
              brand: v.brand ?? "",
              license_plate: v.license_plate ?? "",
              year: v.year ? String(v.year) : "",
              type: v.type ?? "",
              vehicle_img: v.vehicle_img ?? "",
              proof_insurance_img: v.proof_insurance_img ?? "",
              property_card: v.property_card ?? "",
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isEdit, vehicleId]);

  const handleChange = useCallback(
    (field: keyof IVehicleForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        year: parseInt(form.year, 10) || 0,
      };
      if (isEdit && vehicleId) {
        await vehicleService.update(vehicleId, payload);
      } else {
        await vehicleService.create(payload);
      }
      navigation.goBack();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  }, [form, isEdit, vehicleId, navigation]);

  if (!authUser) return null;

  const title = isEdit
    ? t("vehicles.editVehicle")
    : t("vehicles.addVehicle");

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
                {title}
              </Text>
            </Block>
          </Image>
        </Block>

        {loading ? (
          <Block align="center" marginTop={sizes.l}>
            <ActivityIndicator size="large" color={colors.primary} />
          </Block>
        ) : (
          <Block paddingHorizontal={sizes.sm} marginTop={sizes.sm}>
            <Input
              marginBottom={sizes.m}
              label={t("vehicles.brand")}
              placeholder={t("vehicles.brand")}
              value={form.brand}
              onChangeText={(v: string) => handleChange("brand", v)}
            />
            <Input
              marginBottom={sizes.m}
              label={t("vehicles.model")}
              placeholder={t("vehicles.model")}
              value={form.model}
              onChangeText={(v: string) => handleChange("model", v)}
            />
            <Input
              marginBottom={sizes.m}
              label={t("vehicles.licensePlate")}
              placeholder={t("vehicles.licensePlate")}
              autoCapitalize="characters"
              value={form.license_plate}
              onChangeText={(v: string) => handleChange("license_plate", v)}
            />
            <Input
              marginBottom={sizes.m}
              label={t("vehicles.year")}
              placeholder={t("vehicles.year")}
              keyboardType="number-pad"
              value={form.year}
              onChangeText={(v: string) => handleChange("year", v)}
            />
            <Input
              marginBottom={sizes.m}
              label={t("vehicles.type")}
              placeholder={t("vehicles.type")}
              value={form.type}
              onChangeText={(v: string) => handleChange("type", v)}
            />
            <Input
              marginBottom={sizes.m}
              label={t("vehicles.vehicleImage")}
              placeholder="https://..."
              autoCapitalize="none"
              value={form.vehicle_img}
              onChangeText={(v: string) => handleChange("vehicle_img", v)}
            />
            <Input
              marginBottom={sizes.m}
              label={t("vehicles.insuranceImage")}
              placeholder="https://..."
              autoCapitalize="none"
              value={form.proof_insurance_img}
              onChangeText={(v: string) =>
                handleChange("proof_insurance_img", v)
              }
            />
            <Input
              marginBottom={sizes.m}
              label={t("vehicles.propertyCard")}
              placeholder="https://..."
              autoCapitalize="none"
              value={form.property_card}
              onChangeText={(v: string) => handleChange("property_card", v)}
            />

            <Button
              primary
              marginTop={sizes.s}
              onPress={handleSave}
              disabled={submitting}
            >
              <Text bold white center>
                {t("vehicles.save")}
              </Text>
            </Button>
          </Block>
        )}
      </Block>
    </Block>
  );
};

export default VehicleForm;
