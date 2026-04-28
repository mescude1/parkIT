import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/core";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { Block, Button, Text } from "../components/";
import { useData, useTheme } from "../hooks/";
import {
  keyHandoverService,
  IKeyHandover,
} from "../services/keyHandoverService";

const KeyHandoverScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { authUser } = useData();
  const { sizes } = useTheme();

  const { service_id } = (route.params as { service_id: number }) || {};
  const isValet = authUser?.type === "valet";

  const [existing, setExisting] = useState<IKeyHandover | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const refresh = useCallback(async () => {
    if (!service_id) return;
    try {
      const res = await keyHandoverService.getByService(service_id);
      setExisting(res.handover);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [service_id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Activa el permiso de cámara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhoto(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!service_id) return;
    if (!locationLabel.trim()) {
      Alert.alert(
        "Falta ubicación",
        "Indica dónde dejaste las llaves (ej: 'caja fuerte 14')."
      );
      return;
    }
    if (!photo) {
      Alert.alert("Falta evidencia", "Toma una foto del lugar/llaves.");
      return;
    }
    setSubmitting(true);
    try {
      let coords: { latitude?: number; longitude?: number } = {};
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const loc = await Location.getCurrentPositionAsync({});
          coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
        }
      } catch {
        // optional, ignore
      }

      await keyHandoverService.dropoff({
        service_id,
        location_label: locationLabel.trim(),
        evidence_photo: photo,
        notes: notes.trim() || undefined,
        ...coords,
      });
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }, [service_id, locationLabel, photo, notes, refresh]);

  const handleMarkReturned = useCallback(async () => {
    if (!existing) return;
    try {
      await keyHandoverService.markReturned(existing.id);
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      Alert.alert("Error", msg);
    }
  }, [existing, refresh]);

  if (loading) {
    return (
      <Block flex={1} center justify="center">
        <ActivityIndicator size="large" />
      </Block>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: sizes.l }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text p semibold>
          Recolección de llaves
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {existing ? (
          <View style={styles.card}>
            <Text p semibold marginBottom={6}>
              Estado:{" "}
              <Text
                p
                style={{
                  color: existing.status === "returned" ? "#00aa55" : "#cc7700",
                }}
              >
                {existing.status === "returned"
                  ? "Devueltas al cliente"
                  : "En custodia"}
              </Text>
            </Text>
            <Text p marginBottom={4}>
              Ubicación: {existing.location_label}
            </Text>
            {existing.notes ? (
              <Text size={13} marginBottom={4}>
                Notas: {existing.notes}
              </Text>
            ) : null}
            <Text size={12} marginBottom={6}>
              Registradas el {existing.stored_at?.split("T")[0]}
            </Text>
            {existing.evidence_photo ? (
              <RNImage
                source={{ uri: existing.evidence_photo }}
                style={styles.evidence}
              />
            ) : null}
            {existing.status !== "returned" && (
              <Button
                primary
                marginTop={sizes.s}
                onPress={handleMarkReturned}
              >
                <Text bold white center>
                  Confirmar entrega al cliente
                </Text>
              </Button>
            )}
          </View>
        ) : isValet ? (
          <View style={styles.card}>
            <Text p semibold marginBottom={8}>
              Registrar entrega de llaves
            </Text>
            <TextInput
              placeholder="Ubicación (p.ej. 'caja fuerte 14')"
              value={locationLabel}
              onChangeText={setLocationLabel}
              style={styles.input}
            />
            <TextInput
              placeholder="Notas (opcional)"
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, { minHeight: 60 }]}
              multiline
            />
            <TouchableOpacity onPress={takePhoto} style={styles.photoButton}>
              {photo ? (
                <RNImage source={{ uri: photo }} style={styles.evidence} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color="#666" />
                  <Text size={12} style={{ color: "#666" }}>
                    Tomar foto de evidencia
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Button
              primary
              marginTop={sizes.s}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text bold white center>
                {submitting ? "Guardando..." : "Registrar"}
              </Text>
            </Button>
          </View>
        ) : (
          <Text p center style={{ marginTop: 24, color: "#666" }}>
            Aún no hay registro de llaves para este servicio.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  card: {
    backgroundColor: "#f8f8f8",
    padding: 14,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  photoButton: { alignSelf: "stretch" },
  photoPlaceholder: {
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#bbb",
    alignItems: "center",
    justifyContent: "center",
  },
  evidence: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 6,
  },
});

export default KeyHandoverScreen;
