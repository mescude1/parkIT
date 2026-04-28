import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Image as RNImage,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/core";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { Block, Text } from "../components/";
import { useData, useTheme } from "../hooks/";
import { chatService } from "../services";
import { IChatMessage, IConversation } from "../constants/types/api";

const POLL_INTERVAL = 3000;

const Chat = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { authUser } = useData();
  const { colors, sizes } = useTheme();

  const { request_id } = (route.params as { request_id?: number }) || {};

  const [conversation, setConversation] = useState<IConversation | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const lastTimestampRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<FlatList<IChatMessage>>(null);

  // Bootstrap conversation
  useEffect(() => {
    const init = async () => {
      try {
        const res = request_id
          ? await chatService.getOrCreateForRequest(request_id)
          : await chatService.getOrCreateConversation();
        setConversation(res.conversation);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        Alert.alert("Error", msg);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [request_id]);

  // Initial load + polling
  useEffect(() => {
    if (!conversation) return;

    const fetchMessages = async (since?: string) => {
      try {
        const res = await chatService.getMessages(conversation.id, since);
        if (res.messages.length === 0) return;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const fresh = res.messages.filter((m) => !known.has(m.id));
          if (!fresh.length) return prev;
          const next = [...prev, ...fresh];
          lastTimestampRef.current = next[next.length - 1].created_at;
          return next;
        });
      } catch {
        // ignore transient errors
      }
    };

    fetchMessages();
    pollRef.current = setInterval(() => {
      fetchMessages(lastTimestampRef.current ?? undefined);
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversation]);

  // Auto-scroll on new message
  useEffect(() => {
    if (messages.length === 0) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const handlePickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Activa el permiso de galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAttachment(result.assets[0].uri);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!conversation) return;
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    setSending(true);
    try {
      const res = await chatService.sendMessage(
        conversation.id,
        trimmed,
        attachment ?? undefined
      );
      setMessages((prev) => [...prev, res.message]);
      lastTimestampRef.current = res.message.created_at;
      setText("");
      setAttachment(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      Alert.alert("Error", msg);
    } finally {
      setSending(false);
    }
  }, [conversation, text, attachment]);

  const renderMessage = useCallback(
    ({ item }: { item: IChatMessage }) => {
      const isMine = item.sender_id === authUser?.id;
      return (
        <View
          style={[
            styles.bubbleRow,
            { justifyContent: isMine ? "flex-end" : "flex-start" },
          ]}
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: isMine ? colors.primary : colors.gray,
                borderBottomRightRadius: isMine ? 4 : 16,
                borderBottomLeftRadius: isMine ? 16 : 4,
              },
            ]}
          >
            {item.attachment_url ? (
              <RNImage
                source={{ uri: item.attachment_url }}
                style={styles.attachment}
                resizeMode="cover"
              />
            ) : null}
            {item.message ? (
              <Text style={{ color: isMine ? "#fff" : "#222" }}>
                {item.message}
              </Text>
            ) : null}
          </View>
        </View>
      );
    },
    [authUser?.id, colors.primary, colors.gray]
  );

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
        <Text p semibold style={styles.headerTitle}>
          {request_id ? "Chat con tu valet" : "Soporte"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
        />

        {attachment ? (
          <View style={styles.previewBar}>
            <RNImage
              source={{ uri: attachment }}
              style={styles.previewThumb}
            />
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <Ionicons name="close-circle" size={22} color="#666" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <TouchableOpacity
            onPress={handlePickImage}
            style={styles.iconButton}
          >
            <Ionicons name="image-outline" size={22} color="#444" />
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            multiline
            style={styles.input}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || (!text.trim() && !attachment)}
            style={[
              styles.iconButton,
              { opacity: sending || (!text.trim() && !attachment) ? 0.4 : 1 },
            ]}
          >
            <Ionicons name="send" size={22} color={colors.primary as any} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 16 },
  listContent: { padding: 12, paddingBottom: 4 },
  bubbleRow: { flexDirection: "row", marginVertical: 4 },
  bubble: {
    maxWidth: "78%",
    padding: 10,
    borderRadius: 16,
  },
  attachment: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
  },
  previewBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
    gap: 8,
  },
  previewThumb: { width: 48, height: 48, borderRadius: 6 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  iconButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#f3f3f3",
    fontSize: 14,
  },
});

export default Chat;
