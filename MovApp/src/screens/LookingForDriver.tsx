import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/core";

import { Block, Button, Text } from "../components/";
import { useTheme } from "../hooks/";
import { valetService } from "../services";

interface Coords {
  latitude: number;
  longitude: number;
}

const LookingForDriver = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { gradients, sizes, colors } = useTheme();

  const { request_id, latitude, longitude } = route.params as {
    request_id: number;
    latitude: number;
    longitude: number;
  };

  const [myCoords] = useState<Coords>({ latitude, longitude });
  const [valetCoords, setValetCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"pending" | "accepted" | "cancelled">("pending");
  const [isCancelling, setIsCancelling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await valetService.getRequestStatus(request_id);
        if (data.status === "accepted") {
          clearInterval(pollRef.current!);
          setStatus("accepted");
          if (data.valet_location) {
            setValetCoords({
              latitude: data.valet_location.latitude,
              longitude: data.valet_location.longitude,
            });
          }
          (navigation as any).navigate("ActiveService", {
            service_id: data.service_id,
            other_user_id: data.accepted_by,
          });
        } else if (data.status === "cancelled" || data.status === "expired") {
          clearInterval(pollRef.current!);
          setStatus("cancelled");
          Alert.alert("Solicitud cancelada", "Tu solicitud fue cancelada o expiró.");
          navigation.goBack();
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [request_id, navigation]);

  const handleCancel = useCallback(async () => {
    setIsCancelling(true);
    try {
      if (pollRef.current) clearInterval(pollRef.current);
      await valetService.cancelRequest(request_id);
    } catch {
      // ignore — we're leaving either way
    } finally {
      navigation.goBack();
    }
  }, [request_id, navigation]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: myCoords.latitude,
          longitude: myCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={myCoords} title="Tu ubicación" pinColor="#000066" />
        {valetCoords && (
          <Marker coordinate={valetCoords} title="Tu valet" pinColor="#00cc66" />
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
          {status === "accepted" ? "¡Valet aceptado!" : "Buscando valet..."}
        </Text>
        <Text
          size={12}
          center
          color={colors.secondary}
          marginBottom={sizes.sm}
        >
          {status === "pending"
            ? "Esperando que un valet acepte tu solicitud"
            : "Tu valet está en camino"}
        </Text>
        {status === "pending" && (
          <Button
            outlined
            onPress={handleCancel}
            disabled={isCancelling}
            marginHorizontal={sizes.sm}
          >
            <Text bold primary transform="uppercase">
              {isCancelling ? "Cancelando..." : "Cancelar solicitud"}
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

export default LookingForDriver;
