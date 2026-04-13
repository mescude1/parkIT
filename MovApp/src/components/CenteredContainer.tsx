import React from "react";
import { View, ScrollView, StyleSheet, ViewStyle } from "react-native";

interface CenteredContainerProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  marginTop?: number;
  padding?: number;
  scroll?: boolean;
  horizontal?: boolean;
  renderToHardwareTextureAndroid?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  contentOffset?: { x: number; y: number };
  useSafeArea?: boolean;
}

const CenteredContainer: React.FC<CenteredContainerProps> = ({
  children,
  style,
  marginTop = 15,
  padding = 10,
  scroll,
  horizontal,
  renderToHardwareTextureAndroid,
  showsHorizontalScrollIndicator,
  contentOffset,
}) => {
  const containerStyle = [styles.container, { marginTop, padding }, style];

  if (scroll) {
    return (
      <View style={styles.wrapper}>
        <ScrollView
          horizontal={horizontal}
          renderToHardwareTextureAndroid={renderToHardwareTextureAndroid}
          showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
          contentOffset={contentOffset}
          style={containerStyle}
          contentContainerStyle={horizontal ? { alignItems: "flex-start" } : undefined}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={containerStyle}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
  },
  container: {
    width: 380,
    height: 300,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 10,
  },
});

export default CenteredContainer;
