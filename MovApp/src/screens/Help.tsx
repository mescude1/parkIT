import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/core";

import { Block, Button, Image, Text } from "../components/";
import { useData, useTheme, useTranslation } from "../hooks/";
import { chatService } from "../services/chatService";
import { IChatMessage } from "../constants/types/api";

const POLL_INTERVAL = 5000;

const Help = () => {
  const { authUser } = useData();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { assets, colors, sizes } = useTheme();

  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Auth guard
  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Login" as never);
    }
  }, [authUser, navigation]);

  // Get or create conversation on mount
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    chatService
      .getOrCreateConversation()
      .then((res: any) => {
        if (!cancelled) {
          const convId = res.conversation.id;
          setConversationId(convId);
          // Load initial messages
          return chatService.getMessages(convId).then((msgRes: any) => {
            if (!cancelled) {
              setMessages(msgRes.messages ?? []);
              setConnecting(false);
            }
          });
        }
      })
      .catch(() => {
        if (!cancelled) setConnecting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  // Poll for new messages
  useEffect(() => {
    if (!conversationId) return;

    pollRef.current = setInterval(async () => {
      try {
        const since =
          messages.length > 0
            ? messages[messages.length - 1].created_at
            : undefined;
        const res = (await chatService.getMessages(
          conversationId,
          since
        )) as any;
        const newMsgs: IChatMessage[] = res.messages ?? [];
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const unique = newMsgs.filter((m) => !existingIds.has(m.id));
            return unique.length > 0 ? [...prev, ...unique] : prev;
          });
        }
      } catch {
        // silently fail
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversationId, messages]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !conversationId || sending) return;

    const messageText = text.trim();
    setText("");
    setSending(true);

    // Optimistic update
    const tempMsg: IChatMessage = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: authUser!.id,
      sender_role: "user",
      message: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = (await chatService.sendMessage(
        conversationId,
        messageText
      )) as any;
      // Replace temp message with server response
      const serverMsg: IChatMessage = res.message;
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? serverMsg : m))
      );
    } catch {
      // Remove temp message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setText(messageText);
    } finally {
      setSending(false);
    }
  }, [text, conversationId, sending, authUser]);

  const renderMessage = useCallback(
    ({ item }: { item: IChatMessage }) => {
      const isUser = item.sender_role === "user";
      return (
        <Block
          flex={0}
          marginBottom={sizes.xs}
          align={isUser ? "flex-end" : "flex-start"}
        >
          <Block
            flex={0}
            padding={sizes.s}
            radius={sizes.sm}
            color={isUser ? colors.primary : colors.card}
            style={{ maxWidth: "80%" }}
          >
            <Text p color={isUser ? "#ffffff" : colors.text}>
              {item.message}
            </Text>
            <Text
              size={10}
              color={isUser ? "rgba(255,255,255,0.6)" : colors.gray}
              marginTop={2}
            >
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Block>
        </Block>
      );
    },
    [colors, sizes]
  );

  if (!authUser) return null;

  return (
    <Block safe marginTop={sizes.md}>
      {/* Header */}
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
              {t("help.title")}
            </Text>
          </Block>
        </Image>
      </Block>

      {connecting ? (
        <Block flex={1} align="center" justify="center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text p gray marginTop={sizes.s}>
            {t("help.connecting")}
          </Text>
        </Block>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={{
              paddingHorizontal: sizes.padding,
              paddingVertical: sizes.sm,
              flexGrow: 1,
              justifyContent: "flex-end",
            }}
            showsVerticalScrollIndicator={false}
          />

          {/* Input bar */}
          <Block
            flex={0}
            row
            align="center"
            padding={sizes.s}
            color={colors.card}
          >
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder={t("help.placeholder")}
              placeholderTextColor={String(colors.gray)}
              style={{
                flex: 1,
                paddingHorizontal: sizes.s,
                paddingVertical: sizes.xs,
                borderRadius: sizes.sm,
                backgroundColor: String(colors.white),
                color: String(colors.text),
                fontSize: 14,
              }}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Button
              flex={0}
              marginLeft={sizes.xs}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              <Ionicons
                name="send-outline"
                size={24}
                color={
                  text.trim() && !sending
                    ? String(colors.primary)
                    : String(colors.gray)
                }
              />
            </Button>
          </Block>
        </KeyboardAvoidingView>
      )}
    </Block>
  );
};

export default Help;
