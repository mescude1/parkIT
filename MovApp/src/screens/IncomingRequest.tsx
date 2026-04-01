import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/core";

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
    valetService.getRequestStatus(request_id).then((data) => {
      setClientCoords({ latitude: data.latitude, longitude: data.longitude });
    }).catch(() => {
      Alert.alert("Error", "No se pudo obtener la solicitud.");
      navigation.goBack();
    });
  }, [request_id, navigation]);

  const handleAccept = useCallback(async () => {
    setIsAccepting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Es necesario el acceso a la ubicación para aceptar."
        );
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
        error instanceof Error ? error.message : "No se pudo aceptar la solicitud.";
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

      {/* bottom card */}
      <Block
        flex={0}
        style={styles.card}
        radius={sizes.sm}
        padding={sizes.sm}
        color={colors.card}
      >
        <Text p semibold center marginBottom={sizes.s}>
          Nueva solicitud de valet
        </Text>
        <Text
          size={12}
          center
          color={colors.secondary}
          marginBottom={sizes.sm}
        >
          Un cliente necesita un valet en tu área
        </Text>

        <Button
          gradient={gradients.primary}
          onPress={handleAccept}
          disabled={isAccepting}
          marginBottom={sizes.s}
          marginHorizontal={sizes.sm}
        >
          <Text bold white transform="uppercase">
            {isAccepting ? "Aceptando..." : "Aceptar"}
          </Text>
        </Button>

        <Button
          primary
          outlined
          onPress={handleDecline}
          disabled={isAccepting}
          marginHorizontal={sizes.sm}
        >
          <Text bold primary transform="uppercase">
            Rechazar
          </Text>
        </Button>
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

export default IncomingRequest;
