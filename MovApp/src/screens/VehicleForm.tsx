import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/core";

import {
  Block,
  Button,
  Image,
  ImagePickerField,
  Input,
  Text,
} from "../components/";
import { useData, useTheme, useTranslation } from "../hooks/";
import { vehicleService } from "../services/vehicleService";

interface IVehicleForm {
  model: string;
  brand: string;
  license_plate: string;
  year: string;
  type: string;
  color: string;
  policy_number: string;
  insurance_expiration: string;
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
  color: "",
  policy_number: "",
  insurance_expiration: "",
  vehicle_img: "",
  proof_insurance_img: "",
  property_card: "",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Login" as never);
    }
  }, [authUser, navigation]);

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
              color: v.color ?? "",
              policy_number: v.policy_number ?? "",
              insurance_expiration: v.insurance_expiration ?? "",
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

  const requiredMissing =
    !form.brand.trim() ||
    !form.model.trim() ||
    !form.license_plate.trim() ||
    !form.year.trim() ||
    !form.type.trim() ||
    !form.policy_number.trim() ||
    !form.insurance_expiration.trim() ||
    !form.proof_insurance_img.trim();

  const handleSave = useCallback(async () => {
    if (form.insurance_expiration && !ISO_DATE.test(form.insurance_expiration)) {
      Alert.alert(t("vehicles.invalidDate"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        model: form.model,
        brand: form.brand,
        license_plate: form.license_plate,
        year: parseInt(form.year, 10) || 0,
        type: form.type,
        color: form.color || null,
        policy_number: form.policy_number || null,
        insurance_expiration: form.insurance_expiration || null,
        vehicle_img: form.vehicle_img || null,
        proof_insurance_img: form.proof_insurance_img || null,
        property_card: form.property_card || null,
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
  }, [form, isEdit, vehicleId, navigation, t]);

  const handleDelete = useCallback(() => {
    if (!vehicleId) return;
    Alert.alert(
      t("vehicles.deleteConfirmTitle"),
      t("vehicles.deleteConfirmMessage"),
      [
        { text: t("vehicles.cancel"), style: "cancel" },
        {
          text: t("vehicles.delete"),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await vehicleService.remove(vehicleId);
              navigation.goBack();
            } catch (error: unknown) {
              const message =
                error instanceof Error ? error.message : "Unknown error";
              Alert.alert("Error", message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [vehicleId, navigation, t]);

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
              label={t("vehicles.color")}
              placeholder={t("vehicles.color")}
              value={form.color}
              onChangeText={(v: string) => handleChange("color", v)}
            />
            <Input
              marginBottom={sizes.m}
              label={`${t("vehicles.policyNumber")} *`}
              placeholder={t("vehicles.policyNumber")}
              autoCapitalize="characters"
              value={form.policy_number}
              onChangeText={(v: string) => handleChange("policy_number", v)}
            />
            <Input
              marginBottom={sizes.m}
              label={`${t("vehicles.insuranceExpiration")} *`}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              value={form.insurance_expiration}
              onChangeText={(v: string) =>
                handleChange("insurance_expiration", v)
              }
            />

            <ImagePickerField
              label={t("vehicles.vehicleImage")}
              value={form.vehicle_img}
              onChange={(uri) => handleChange("vehicle_img", uri)}
            />
            <ImagePickerField
              label={`${t("vehicles.insuranceImage")} *`}
              value={form.proof_insurance_img}
              onChange={(uri) => handleChange("proof_insurance_img", uri)}
            />
            <ImagePickerField
              label={t("vehicles.propertyCard")}
              value={form.property_card}
              onChange={(uri) => handleChange("property_card", uri)}
            />

            <Button
              primary
              marginTop={sizes.s}
              onPress={handleSave}
              disabled={submitting || deleting || requiredMissing}
            >
              <Text bold white center>
                {t("vehicles.save")}
              </Text>
            </Button>

            {isEdit && (
              <Button
                danger
                marginTop={sizes.s}
                onPress={handleDelete}
                disabled={submitting || deleting}
              >
                <Text bold white center>
                  {t("vehicles.delete")}
                </Text>
              </Button>
            )}
          </Block>
        )}
      </Block>
    </Block>
  );
};

export default VehicleForm;
