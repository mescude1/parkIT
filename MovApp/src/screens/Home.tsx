import React, { useCallback, useState } from "react";

import { useData, useTheme, useTranslation } from "../hooks/";
import { Block, Button, Image, Input, Product, Text } from "../components/";
import GreetUser from "../components/GreetUser";
import CenteredContainer from "../components/CenteredContainer";
import LatestTrips from "../components/LatestTrips";
import ServiceRequest from "../components/ServiceRequest";
import { View } from "react-native";
const Home = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<number>(0);
  const { assets, colors, fonts, gradients, sizes } = useTheme();

  return (
    <>
      <CenteredContainer
        scroll
        horizontal
        renderToHardwareTextureAndroid
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: -sizes.padding, y: 10 }}
      >
        <GreetUser />
        <LatestTrips />
      </CenteredContainer>
      <CenteredContainer
        scroll
        horizontal
        renderToHardwareTextureAndroid
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: -sizes.padding, y: 10 }}
        style={{ height: 400, marginTop: -50 }}
      >
        <ServiceRequest />
      </CenteredContainer>
    </>
  );
};

export default Home;
