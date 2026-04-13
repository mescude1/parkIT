import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Platform } from "react-native";
import { useNavigation } from "@react-navigation/core";

import { Block, Button, Image, Text } from "../components/";
import { useData, useTheme, useTranslation } from "../hooks/";
import { historyService } from "../services/historyService";
import { IServiceHistoryItem } from "../constants/types/api";

const isAndroid = Platform.OS === "android";

const History = () => {
  const { authUser } = useData();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { assets, colors, sizes } = useTheme();

  const [services, setServices] = useState<IServiceHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Login" as never);
    }
  }, [authUser, navigation]);

  const loadServices = useCallback(
    async (pageNum: number) => {
      if (loading) return;
      setLoading(true);
      try {
        const res = await historyService.fetchHistory(pageNum);
        const data = res as any;
        if (pageNum === 1) {
          setServices(data.services);
        } else {
          setServices((prev) => [...prev, ...data.services]);
        }
        setHasMore(data.has_next);
        setPage(pageNum);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  useEffect(() => {
    if (authUser) {
      loadServices(1);
    }
  }, [authUser]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadServices(page + 1);
    }
  }, [hasMore, loading, page, loadServices]);

  const renderItem = useCallback(
    ({ item }: { item: IServiceHistoryItem }) => {
      const statusColor = item.is_finished ? colors.success : colors.warning;
      const statusLabel = item.is_finished
        ? t("history.finished")
        : t("history.active");

      return (
        <Block
          card
          flex={0}
          row
          align="center"
          justify="space-between"
          marginBottom={sizes.s}
          padding={sizes.sm}
        >
          <Block flex={1}>
            <Text p semibold>
              {item.counterpart_name}
            </Text>
            <Text p gray>
              {item.date
                ? new Date(item.date).toLocaleDateString()
                : "--"}
            </Text>
          </Block>
          <Block flex={0} align="flex-end">
            <Text p semibold>
              {item.price}
            </Text>
            <Text
              p
              bold
              size={12}
              color={statusColor}
            >
              {statusLabel}
            </Text>
          </Block>
        </Block>
      );
    },
    [colors, sizes, t]
  );

  const renderEmpty = useCallback(
    () =>
      !loading ? (
        <Block align="center" marginTop={sizes.l}>
          <Text p gray>
            {t("history.noServices")}
          </Text>
        </Block>
      ) : null,
    [loading, sizes, t]
  );

  const renderFooter = useCallback(
    () =>
      loading && services.length > 0 ? (
        <Block align="center" paddingVertical={sizes.sm}>
          <ActivityIndicator size="small" color={colors.primary} />
        </Block>
      ) : null,
    [loading, services.length, colors, sizes]
  );

  if (!authUser) return null;

  return (
    <Block safe marginTop={sizes.md}>
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
              {t("history.title")}
            </Text>
          </Block>
        </Image>
      </Block>

      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{
          paddingHorizontal: sizes.padding,
          paddingTop: sizes.sm,
          paddingBottom: sizes.padding,
        }}
        showsVerticalScrollIndicator={false}
      />
    </Block>
  );
};

export default History;
