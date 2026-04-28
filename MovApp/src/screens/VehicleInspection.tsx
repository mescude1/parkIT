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

import { Block, Button, Text } from "../components/";
import { useData, useTheme } from "../hooks/";
import {
  inspectionService,
  IVehicleInspection,
  ISpeedAlert,
} from "../services/inspectionService";

type Stage = "before" | "after" | "view";

const VehicleInspectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { authUser } = useData();
  const { sizes } = useTheme();

  const { service_id, stage: initialStage } = (route.params as {
    service_id: number;
    stage?: Stage;
  }) || { service_id: 0 };

  const [stage, setStage] = useState<Stage>(initialStage ?? "before");
  const [inspections, setInspections] = useState<IVehicleInspection[]>([]);
  const [alerts, setAlerts] = useState<ISpeedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValet = authUser?.type === "valet";

  const refresh = useCallback(async () => {
    if (!service_id) return;
    try {
      const res = await inspectionService.listForService(service_id);
      setInspections(res.inspections);
      setAlerts(res.speed_alerts);
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

  const addPhoto = useCallback(async () => {
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
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }, []);

  const removePhoto = useCallback((idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const submit = useCallback(async () => {
    if (!service_id || stage === "view") return;
    if (photos.length === 0) {
      Alert.alert(
        "Falta evidencia",
        "Agrega al menos una foto del vehículo."
      );
      return;
    }
    setSubmitting(true);
    try {
      await inspectionService.create({
        service_id,
        stage,
        photos,
        notes: notes.trim() || undefined,
      });
      setPhotos([]);
      setNotes("");
      await refresh();
      setStage("view");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }, [service_id, stage, photos, notes, refresh]);

  const before = inspections.find((i) => i.stage === "before");
  const after = inspections.find((i) => i.stage === "after");

  if (loading) {
    return (
      <Block flex={1} center justify="center">
        <ActivityIndicator size="large" />
      </Block>
    );
  }

  const renderInspection = (
    title: string,
    record?: IVehicleInspection
  ) => (
    <View style={styles.card}>
      <Text p semibold marginBottom={6}>
        {title}
      </Text>
      {record ? (
        <>
          <Text size={12} marginBottom={4}>
            {record.created_at?.split("T")[0]}
          </Text>
          <ScrollView horizontal>
            {record.photos.map((p, i) => (
              <RNImage key={i} source={{ uri: p }} style={styles.photoView} />
            ))}
          </ScrollView>
          {record.notes ? (
            <Text size={13} marginTop={4}>
              Notas: {record.notes}
            </Text>
          ) : null}
        </>
      ) : (
        <Text size={13} style={{ color: "#888" }}>
          Aún sin registro.
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: sizes.l }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text p semibold>
          Inspección del vehículo
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {renderInspection("Antes de tomar custodia", before)}
        {renderInspection("Al devolver el vehículo", after)}

        {alerts.length > 0 && (
          <View style={[styles.card, { backgroundColor: "#fff5f5" }]}>
            <Text p semibold marginBottom={6} style={{ color: "#cc0033" }}>
              Alertas de velocidad ({alerts.length})
            </Text>
            <Text size={12} marginBottom={6}>
              Límite: 10 km/h. Eventos registrados durante el servicio.
            </Text>
            {alerts.map((a) => (
              <Text key={a.id} size={12}>
                • {a.speed_kmh.toFixed(1)} km/h —{" "}
                {a.created_at?.replace("T", " ").split(".")[0]}
              </Text>
            ))}
          </View>
        )}

        {isValet && stage !== "view" && (
          <View style={styles.card}>
            <Text p semibold marginBottom={8}>
              Registrar fotos —{" "}
              {stage === "before" ? "antes" : "después"}
            </Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setStage("before")}
                style={[
                  styles.toggle,
                  stage === "before" && styles.toggleActive,
                ]}
              >
                <Text size={12} bold>
                  Antes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStage("after")}
                style={[
                  styles.toggle,
                  stage === "after" && styles.toggleActive,
                ]}
              >
                <Text size={12} bold>
                  Después
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal style={{ marginVertical: 10 }}>
              {photos.map((p, i) => (
                <TouchableOpacity key={i} onPress={() => removePhoto(i)}>
                  <RNImage source={{ uri: p }} style={styles.photoNew} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={addPhoto}
                style={styles.addPhotoButton}
              >
                <Ionicons name="camera" size={28} color="#666" />
              </TouchableOpacity>
            </ScrollView>
            <TextInput
              placeholder="Notas (opcional, golpes previos, etc.)"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              multiline
            />
            <Button
              primary
              marginTop={sizes.s}
              onPress={submit}
              disabled={submitting}
            >
              <Text bold white center>
                {submitting ? "Guardando..." : "Guardar inspección"}
              </Text>
            </Button>
          </View>
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
    marginBottom: 12,
  },
  photoView: {
    width: 120,
    height: 90,
    borderRadius: 6,
    marginRight: 6,
  },
  photoNew: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 6,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    backgroundColor: "#fff",
  },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#eee",
  },
  toggleActive: { backgroundColor: "#cce4ff" },
});

export default VehicleInspectionScreen;
