import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  belongingsService,
  IBelonging,
} from "../services/belongingsService";

interface DraftItem {
  description: string;
  quantity: string;
  photos: string[];
}

const emptyDraft: DraftItem = {
  description: "",
  quantity: "1",
  photos: [],
};

const Belongings = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { authUser } = useData();
  const { colors, sizes } = useTheme();

  const { request_id } = (route.params as { request_id?: number }) || {};

  const [items, setItems] = useState<IBelonging[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftItem>(emptyDraft);
  const [creating, setCreating] = useState(false);

  const isOwner = items[0]?.owner_id === authUser?.id || items.length === 0;

  const refresh = useCallback(async () => {
    if (!request_id) return;
    try {
      const res = await belongingsService.listForRequest(request_id);
      setItems(res.belongings);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [request_id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Activa el permiso de galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setDraft((d) => ({ ...d, photos: [...d.photos, result.assets[0].uri] }));
    }
  }, []);

  const removeDraftPhoto = useCallback((idx: number) => {
    setDraft((d) => ({
      ...d,
      photos: d.photos.filter((_, i) => i !== idx),
    }));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!request_id) return;
    if (!draft.description.trim()) {
      Alert.alert("Falta descripción", "Indica qué objeto vas a registrar.");
      return;
    }
    const qty = parseInt(draft.quantity, 10);
    if (!qty || qty < 1) {
      Alert.alert("Cantidad inválida", "Debe ser un número mayor o igual a 1.");
      return;
    }
    setCreating(true);
    try {
      await belongingsService.create({
        valet_request_id: request_id,
        description: draft.description.trim(),
        quantity: qty,
        photos: draft.photos,
      });
      setDraft(emptyDraft);
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      Alert.alert("Error", msg);
    } finally {
      setCreating(false);
    }
  }, [draft, request_id, refresh]);

  const toggleMissing = useCallback(
    async (item: IBelonging) => {
      try {
        await belongingsService.update(item.id, {
          reported_missing: !item.reported_missing,
        });
        await refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        Alert.alert("Error", msg);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (item: IBelonging) => {
      Alert.alert("Eliminar", `¿Quitar "${item.description}"?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await belongingsService.remove(item.id);
              await refresh();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Error";
              Alert.alert("Error", msg);
            }
          },
        },
      ]);
    },
    [refresh]
  );

  const renderItem = ({ item }: { item: IBelonging }) => {
    const isMine = item.owner_id === authUser?.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text p semibold>
            {item.description}
          </Text>
          <Text p>x{item.quantity}</Text>
        </View>
        {item.photos.length > 0 && (
          <ScrollView horizontal style={styles.photoRow}>
            {item.photos.map((p, i) => (
              <RNImage key={i} source={{ uri: p }} style={styles.photo} />
            ))}
          </ScrollView>
        )}
        {item.reported_missing && (
          <Text size={12} style={{ color: "#cc0033" }}>
            Reportado como faltante el{" "}
            {item.missing_reported_at?.split("T")[0]}
          </Text>
        )}
        {isMine && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => toggleMissing(item)}
              style={styles.actionButton}
            >
              <Ionicons
                name={item.reported_missing ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={item.reported_missing ? "#00aa55" : "#cc0033"}
              />
              <Text size={12} style={{ marginLeft: 4 }}>
                {item.reported_missing ? "Marcar como OK" : "Reportar faltante"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

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
          Pertenencias
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(b) => String(b.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <Text size={13} center style={{ marginTop: 24, color: "#888" }}>
            Aún no has registrado pertenencias.
          </Text>
        }
        ListFooterComponent={
          isOwner ? (
            <View style={styles.draftCard}>
              <Text p semibold marginBottom={6}>
                Agregar pertenencia
              </Text>
              <TextInput
                placeholder="Descripción (p.ej. Maletín gris)"
                value={draft.description}
                onChangeText={(v) =>
                  setDraft((d) => ({ ...d, description: v }))
                }
                style={styles.input}
              />
              <TextInput
                placeholder="Cantidad"
                value={draft.quantity}
                onChangeText={(v) =>
                  setDraft((d) => ({ ...d, quantity: v.replace(/[^0-9]/g, "") }))
                }
                keyboardType="number-pad"
                style={styles.input}
              />
              <ScrollView horizontal style={styles.photoRow}>
                {draft.photos.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => removeDraftPhoto(i)}
                  >
                    <RNImage source={{ uri: p }} style={styles.photo} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={pickPhoto}
                  style={styles.addPhotoButton}
                >
                  <Ionicons name="camera" size={22} color="#666" />
                </TouchableOpacity>
              </ScrollView>
              <Button
                primary
                marginTop={sizes.s}
                onPress={handleCreate}
                disabled={creating}
              >
                <Text bold white center>
                  {creating ? "Guardando..." : "Agregar"}
                </Text>
              </Button>
            </View>
          ) : null
        }
      />
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
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  photoRow: { flexDirection: "row", marginBottom: 6 },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 6,
  },
  addPhotoButton: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", marginTop: 6, gap: 12 },
  actionButton: { flexDirection: "row", alignItems: "center" },
  draftCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
});

export default Belongings;
