import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import Block from "./Block";
import Button from "./Button";
import Image from "./Image";
import Text from "./Text";
import { useTheme, useTranslation } from "../hooks";

interface IImagePickerFieldProps {
  label: string;
  value?: string | null;
  onChange: (dataUri: string) => void;
  marginBottom?: number;
}

const ImagePickerField = ({
  label,
  value,
  onChange,
  marginBottom,
}: IImagePickerFieldProps) => {
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handlePick = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("vehicles.photoPermissionDenied"));
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.6,
        allowsEditing: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.base64) return;

      const mime = asset.mimeType || "image/jpeg";
      onChange(`data:${mime};base64,${asset.base64}`);
    } finally {
      setLoading(false);
    }
  }, [onChange, t]);

  const hasImage = !!value;

  return (
    <Block flex={0} marginBottom={marginBottom ?? sizes.m}>
      <Text p bold marginBottom={sizes.xs}>
        {label}
      </Text>
      {hasImage ? (
        <Image
          resizeMode="cover"
          source={{ uri: value as string }}
          radius={sizes.cardRadius}
          height={140}
          marginBottom={sizes.xs}
        />
      ) : (
        <Block
          flex={0}
          align="center"
          justify="center"
          radius={sizes.cardRadius}
          color={colors.light}
          height={140}
          marginBottom={sizes.xs}
        >
          <Text p gray>
            {t("vehicles.noPhoto")}
          </Text>
        </Block>
      )}
      <Button outlined onPress={handlePick} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text bold primary>
            {hasImage ? t("vehicles.changePhoto") : t("vehicles.pickPhoto")}
          </Text>
        )}
      </Button>
    </Block>
  );
};

export default ImagePickerField;
