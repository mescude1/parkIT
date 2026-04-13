import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/core";

import { Block, Button, Image, Text } from "../components/";
import { useData, useTheme, useTranslation } from "../hooks/";
import { vehicleService } from "../services/vehicleService";
import { IVehicle } from "../constants/types/api";

const VehicleList = () => {
  const { authUser } = useData();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { assets, colors, sizes } = useTheme();

  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Login" as never);
    }
  }, [authUser, navigation]);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehicleService.getAll();
      const data = res as any;
      setVehicles(data.vehicles ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser) loadVehicles();
  }, [authUser]);

  // Reload when returning from VehicleForm
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (authUser) loadVehicles();
    });
    return unsubscribe;
  }, [navigation, authUser, loadVehicles]);

  const renderItem = useCallback(
    ({ item }: { item: IVehicle }) => (
      <Button
        onPress={() =>
          (navigation as any).navigate("VehicleForm", { vehicleId: item.id })
        }
      >
        <Block
          card
          flex={0}
          row
          align="center"
          justify="space-between"
          marginBottom={sizes.s}
          padding={sizes.sm}
        >
          <Block flex={1}>
            <Text p semibold>
              {item.brand} {item.model}
            </Text>
            <Text p gray>
              {item.license_plate} · {item.year}
            </Text>
          </Block>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </Block>
      </Button>
    ),
    [colors, sizes, navigation]
  );

  const renderEmpty = useCallback(
    () =>
      !loading ? (
        <Block align="center" marginTop={sizes.l}>
          <Text p gray>
            {t("vehicles.noVehicles")}
          </Text>
        </Block>
      ) : null,
    [loading, sizes, t]
  );

  if (!authUser) return null;

  return (
    <Block safe marginTop={sizes.md}>
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
              {t("screens.vehicleList")}
            </Text>
          </Block>
        </Image>
      </Block>

      {loading && vehicles.length === 0 ? (
        <Block align="center" marginTop={sizes.l}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Block>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: sizes.padding,
            paddingTop: sizes.sm,
            paddingBottom: sizes.padding,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Block flex={0} padding={sizes.padding}>
        <Button
          primary
          onPress={() => navigation.navigate("VehicleForm" as never)}
        >
          <Text bold white center>
            {t("vehicles.addVehicle")}
          </Text>
        </Button>
      </Block>
    </Block>
  );
};

export default VehicleList;
