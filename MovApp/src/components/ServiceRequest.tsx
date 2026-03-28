import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Button, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/core";

import { valetService } from "../services";

const ServiceRequest = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Es necesario permitir el acceso a la ubicación."
        );
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  const handleRequestValet = useCallback(async () => {
    if (!location) {
      Alert.alert(
        "Ubicación no disponible",
        "Espera a que se obtenga tu ubicación."
      );
      return;
    }
    setIsRequesting(true);
    try {
      const response = await valetService.requestService({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (response.drivers && response.drivers.length > 0) {
        (navigation as any).navigate("LookingForDriver", {
          drivers: response.drivers,
        });
      } else {
        Alert.alert(
          "Sin conductores",
          response.message ?? "No hay conductores cercanos en este momento."
        );
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo solicitar el servicio.";
      Alert.alert("Error", message);
    } finally {
      setIsRequesting(false);
    }
  }, [location, navigation]);

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location} title="Usted está aquí" />
        </MapView>
      ) : (
        <View style={styles.loading} />
      )}
      <Button
        title={isRequesting ? "Buscando..." : "Solicitar Valet"}
        onPress={handleRequestValet}
        color="#000066"
        disabled={isRequesting || !location}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
    width: "100%",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ServiceRequest;
