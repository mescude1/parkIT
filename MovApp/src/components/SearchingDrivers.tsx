// @ts-nocheck — react-native-svg is not installed; this component is unused until the dependency is added
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle, Image } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const circleRadius = 60; // Circle path radius

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SearchingDrivers = () => {
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withRepeat(withTiming(360, { duration: 4000 }), -1);
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const radians = (angle.value * Math.PI) / 180;
    const x = width / 2 + circleRadius * Math.cos(radians);
    const y = height / 3 + circleRadius * Math.sin(radians);
    return {
      cx: x,
      cy: y,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Buscando Conductores...</Text>
      <Svg height="200" width={width}>
        <AnimatedCircle
          animatedProps={animatedProps}
          r="20"
          fill="transparent"
        />
        <Image
          href={require("..assets/image/car.png")} // Use a small car image in your assets
          x={width / 2 - 15}
          y={height / 3 - 15}
          width="30"
          height="30"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default SearchingDrivers;
