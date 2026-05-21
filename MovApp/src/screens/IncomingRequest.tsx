// src/screens/IncomingRequest.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/core";
import { Ionicons } from "@expo/vector-icons";

import { Block, Button, Text } from "../components/";
import { useTheme } from "../hooks/";
import { valetService } from "../services";

interface Coords {
  latitude: number;
  longitude: number;
}

const IncomingRequest = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { gradients, sizes, colors } = useTheme();

  const { request_id } = route.params as { request_id: number };

  const [clientCoords, setClientCoords] = useState<Coords | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    valetService
      .getRequestStatus(request_id)
      .then((data) => {
        setClientCoords({ latitude: data.latitude, longitude: data.longitude });
      })
      .catch(() => {
        Alert.alert("Error", "No se pudo obtener la solicitud.");
        navigation.goBack();
      });
  }, [request_id, navigation]);

  const handleAccept = useCallback(async () => {
    setIsAccepting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceso a la ubicación.");
        setIsAccepting(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const res = await valetService.acceptRequest(request_id, {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      (navigation as any).replace("ActiveService", {
        service_id: res.service_id,
        other_user_id: res.client_location.user_id,
        initial_other_coords: {
          latitude: res.client_location.latitude,
          longitude: res.client_location.longitude,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo aceptar la solicitud.";
      Alert.alert("Error", message);
      setIsAccepting(false);
    }
  }, [request_id, navigation]);

  const handleDecline = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={
          clientCoords
            ? {
                latitude: clientCoords.latitude,
                longitude: clientCoords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
      >
        {clientCoords && (
          <Marker
            coordinate={clientCoords}
            title="Cliente"
            description="Ubicación del cliente"
            pinColor="#000066"
          />
        )}
      </MapView>

      {/* card inferior */}
      <Block flex={0} style={styles.card} color={colors.card}>
        {/* indicador visual */}
        <Block flex={0} align="center" marginBottom={sizes.sm}>
          <Block
            flex={0}
            width={48}
            height={48}
            radius={24}
            align="center"
            justify="center"
            color={String(colors.primary) + "20"}
          >
            <Ionicons name="car-sport-outline" size={26} color={colors.primary} />
          </Block>
        </Block>

        <Text h5 semibold center marginBottom={sizes.xs}>
          Nueva solicitud
        </Text>
        <Text size={13} center color={colors.secondary} marginBottom={sizes.sm}>
          Un cliente necesita un valet en tu área
        </Text>

        <Block
          flex={0}
          row
          align="center"
          justify="center"
          marginBottom={sizes.md}
        >
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text size={13} color={colors.primary} marginLeft={4}>
            Ver en el mapa
          </Text>
        </Block>

        <Button
          gradient={gradients.primary}
          onPress={handleAccept}
          disabled={isAccepting}
          marginBottom={sizes.s}
          marginHorizontal={sizes.sm}
          style={styles.btn}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text bold white transform="uppercase">
            {isAccepting ? "Aceptando..." : "Aceptar solicitud"}
          </Text>
        </Button>

        <Button
          primary
          outlined
          onPress={handleDecline}
          disabled={isAccepting}
          marginHorizontal={sizes.sm}
          style={styles.btn}
        >
          <Ionicons
            name="close-circle-outline"
            size={18}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text bold primary transform="uppercase">
            Rechazar
          </Text>
        </Button>
      </Block>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  card: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default IncomingRequest;