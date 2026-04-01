import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  Text,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import useTheme from "../hooks/useTheme";
import { useData } from "../hooks/useData";
import { IBlockProps } from "../constants/types";

const GreetUser = (props: IBlockProps) => {
  const {
    id = "GreetUser",
    style,
    safe,
    keyboard,
    scroll,
    gradient,
    blur,
    intensity,
    tint,
    children,
    ...rest
  } = props;
  const { colors } = useTheme();
  const { authUser } = useData();

  const blockStyles = StyleSheet.flatten([style, { padding: 5 }]) as ViewStyle;

  const blockID =
    Platform.OS === "android" ? { accessibilityLabel: id } : { testID: id };

  const displayName = authUser
    ? `${authUser.name} ${authUser.last_name}`
    : "Guest";
  const greetingText = `Hola! ${displayName}`;

  if (safe) {
    return (
      <SafeAreaView {...blockID} {...rest} style={blockStyles}>
        <Text style={styles.text}>{greetingText}</Text>
        {children}
      </SafeAreaView>
    );
  }

  if (keyboard) {
    return (
      <KeyboardAwareScrollView {...blockID} {...rest} style={blockStyles}>
        <Text style={styles.text}>{greetingText}</Text>
        {children}
      </KeyboardAwareScrollView>
    );
  }

  if (scroll) {
    return (
      <ScrollView {...blockID} {...rest} style={blockStyles}>
        <Text style={styles.text}>{greetingText}</Text>
        {children}
      </ScrollView>
    );
  }

  if (gradient) {
    return (
      <LinearGradient
        {...blockID}
        colors={gradient}
        style={blockStyles}
        {...rest}
      >
        <Text style={styles.text}>{greetingText}</Text>
        {children}
      </LinearGradient>
    );
  }

  if (blur) {
    return (
      <BlurView
        {...blockID}
        tint={tint}
        intensity={intensity}
        style={blockStyles}
      >
        <Text style={styles.text}>{greetingText}</Text>
        {children}
      </BlurView>
    );
  }

  return (
    <View {...blockID} {...rest} style={blockStyles}>
      <Text style={styles.text}>{greetingText}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
});

export default React.memo(GreetUser);
