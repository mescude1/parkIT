import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/core";

import { Block, Button, Text } from "../components/";
import { useData, useTheme } from "../hooks/";
import { valetService } from "../services";

interface Coords {
  latitude: number;
  longitude: number;
}

const POLL_INTERVAL = 3000;

const ActiveService = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { gradients, sizes, colors } = useTheme();
  const { authUser } = useData();

  const { service_id, other_user_id, initial_other_coords } = route.params as {
    service_id: number;
    other_user_id: number;
    initial_other_coords?: Coords;
  };

  const [myCoords, setMyCoords] = useState<Coords | null>(null);
  const [otherCoords, setOtherCoords] = useState<Coords | null>(
    initial_other_coords ?? null
  );
  const [isEnding, setIsEnding] = useState(false);

  const pushRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pullRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Push own location every 3s
    pushRef.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setMyCoords(coords);
        await valetService.updateLocation(coords);
      } catch {
        // ignore transient errors
      }
    }, POLL_INTERVAL);

    // Pull other party's location every 3s
    pullRef.current = setInterval(async () => {
      try {
        const loc = await valetService.getLocation(other_user_id);
        setOtherCoords({ latitude: loc.latitude, longitude: loc.longitude });
      } catch {
        // 404 means no location yet — keep waiting
      }
    }, POLL_INTERVAL);

    return () => {
      if (pushRef.current) clearInterval(pushRef.current);
      if (pullRef.current) clearInterval(pullRef.current);
    };
  }, [other_user_id]);

  const handleEndService = useCallback(async () => {
    setIsEnding(true);
    try {
      if (pushRef.current) clearInterval(pushRef.current);
      if (pullRef.current) clearInterval(pullRef.current);
      await valetService.endService({ service_id });
      (navigation as any).navigate("Home");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo finalizar el servicio.";
      Alert.alert("Error", message);
      setIsEnding(false);
    }
  }, [service_id, navigation]);

  const isValet = authUser?.type === "valet";
  const mapCenter = myCoords ?? otherCoords;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={
          mapCenter
            ? {
                latitude: mapCenter.latitude,
                longitude: mapCenter.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }
            : undefined
        }
      >
        {myCoords && (
          <Marker
            coordinate={myCoords}
            title={isValet ? "Tu ubicación" : "Tu ubicación"}
            pinColor={isValet ? "#00cc66" : "#000066"}
          />
        )}
        {otherCoords && (
          <Marker
            coordinate={otherCoords}
            title={isValet ? "Cliente" : "Tu valet"}
            pinColor={isValet ? "#000066" : "#00cc66"}
          />
        )}
      </MapView>

      {/* bottom card */}
      <Block
        flex={0}
        style={styles.card}
        radius={sizes.sm}
        padding={sizes.sm}
        color={colors.card}
      >
        <Text p semibold center marginBottom={sizes.s}>
          {isValet ? "Servicio activo" : "Tu valet está en camino"}
        </Text>
        <Text
          size={12}
          center
          color={colors.secondary}
          marginBottom={isValet ? sizes.sm : 0}
        >
          {isValet
            ? "Navega hasta el cliente y recoge su vehículo"
            : "El mapa se actualiza en tiempo real"}
        </Text>

        {isValet && (
          <Button
            gradient={gradients.primary}
            onPress={handleEndService}
            disabled={isEnding}
            marginHorizontal={sizes.sm}
          >
            <Text bold white transform="uppercase">
              {isEnding ? "Finalizando..." : "Finalizar servicio"}
            </Text>
          </Button>
        )}
      </Block>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default ActiveService;
