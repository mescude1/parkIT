// src/navigation/Screens.tsx
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

import {
  Home,
  Profile,
  Register,
  Login,
  Articles,
  EmailVerification,
  LookingForDriver,
  Settings,
  History,
  IncomingRequest,
  ActiveService,
  Help,
  VehicleList,
  VehicleForm,
  Chat,
  Belongings,
  KeyHandover,
  VehicleInspection,
} from "../screens";
import { useScreenOptions, useTranslation } from "../hooks";

const Stack = createStackNavigator();

export default () => {
  const { t } = useTranslation();
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions.stack}>

      {/* ── GENERALES (ambos roles) ─────────────────────────────────── */}
      <Stack.Screen
        name="Home"
        component={Home}
        options={{ title: t("navigation.home") }}
      />
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{ headerShown: false, title: t("navigation.profile") }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{ headerShown: false, title: t("screens.settings") }}
      />
      <Stack.Screen
        name="History"
        component={History}
        options={{ headerShown: false, title: t("screens.history") }}
      />
      <Stack.Screen
        name="Help"
        component={Help}
        options={{ headerShown: false, title: t("screens.help") }}
      />
      <Stack.Screen
        name="Chat"
        component={Chat}
        options={{ headerShown: false, title: "Chat" }}
      />

      {/* ── AUTH (sin sesión) ────────────────────────────────────────── */}
      <Stack.Screen
        name="Register"
        component={Register}
        options={{ headerShown: false, title: t("navigation.register") }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false, title: t("navigation.login") }}
      />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerification}
        options={{ headerShown: false, title: "Verificar correo" }}
      />
      <Stack.Screen
        name="Ultimos Servicios"
        component={Articles}
        options={{ title: t("navigation.past_services_list") }}
      />

      {/* ── CONDUCTOR (valet) ────────────────────────────────────────── */}
      <Stack.Screen
        name="IncomingRequest"
        component={IncomingRequest}
        options={{ headerShown: false, title: "Nueva solicitud" }}
      />
      <Stack.Screen
        name="ActiveService"
        component={ActiveService}
        options={{ headerShown: false, title: "Servicio activo" }}
      />
      <Stack.Screen
        name="KeyHandover"
        component={KeyHandover}
        options={{ headerShown: false, title: "Entrega de llaves" }}
      />
      <Stack.Screen
        name="VehicleInspection"
        component={VehicleInspection}
        options={{ headerShown: false, title: "Inspección del vehículo" }}
      />

      {/*
      ========================================
      SECCIÓN CLIENTE (NO MODIFICAR)
      Esta parte corresponde a la funcionalidad del cliente.
      Debe mantenerse intacta y organizada.
      ========================================
      */}
      <Stack.Screen
        name="LookingForDriver"
        component={LookingForDriver}
        options={{ headerShown: false, title: "Buscando conductor" }}
      />
      <Stack.Screen
        name="VehicleList"
        component={VehicleList}
        options={{ headerShown: false, title: t("screens.vehicleList") }}
      />
      <Stack.Screen
        name="VehicleForm"
        component={VehicleForm}
        options={{ headerShown: false, title: t("screens.vehicleForm") }}
      />
      <Stack.Screen
        name="Belongings"
        component={Belongings}
        options={{ headerShown: false, title: "Pertenencias" }}
      />

    </Stack.Navigator>
  );
};