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
  // ✅ Sin alignItems/justifyContent en el style del ScrollView
  const scrollStyle = [styles.scrollView, { marginTop, padding }, style];

  // ✅ Props de flex van en contentContainerStyle
  const contentContainerStyle: ViewStyle = horizontal
    ? { alignItems: "flex-start", flexDirection: "row" }
    : { alignItems: "flex-start", justifyContent: "flex-start", flexGrow: 1 };

  if (scroll) {
    return (
      <View style={styles.wrapper}>
        <ScrollView
          horizontal={horizontal}
          renderToHardwareTextureAndroid={renderToHardwareTextureAndroid}
          showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
          contentOffset={contentOffset}
          style={scrollStyle}
          contentContainerStyle={contentContainerStyle}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.plainContainer, { marginTop, padding }, style]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
  },
  // ✅ Solo propiedades de layout/visual — sin alignItems/justifyContent
  scrollView: {
    width: 380,
    height: 300,
    backgroundColor: "white",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 10,
  },
  plainContainer: {
    width: 380,
    height: 300,
    backgroundColor: "white",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 10,
  },
});

export default CenteredContainer;