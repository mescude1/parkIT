import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { useData, useTheme } from "../hooks/";
import { Text } from "../components/";
import GreetUser from "../components/GreetUser";
import LatestTrips from "../components/LatestTrips";
import ServiceRequest from "../components/ServiceRequest";

const isAndroid = Platform.OS === "android";

const C = {
  navy:    "#0f1d36",
  navyMid: "#1a3a6e",
  blue:    "#1a56db",
  orange:  "#e8600a",
  white:   "#ffffff",
  bg:      "#f4f7fc",
  card:    "#ffffff",
  border:  "#e4eaf8",
  muted:   "#8a9ab8",
  green:   "#4ade80",
};

const Home = () => {
  const { handleLogout, authUser } = useData();
  const isValet = authUser?.type === "valet";

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ── HEADER ─────────────────────────────── */}
        <LinearGradient
          colors={[C.navy, C.navyMid, C.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          {/* Top row: logo + logout */}
          <View style={s.headerTop}>
            <View style={s.logoRow}>
              <View style={s.logoCircle}>
                <Image
                  source={require("../assets/images/Parkit-logo.png")}
                  style={s.logoImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={s.brandTxt}>PARKIT</Text>
            </View>

            {/* Logout button */}
            <TouchableOpacity
              style={s.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.75}
            >
              <Ionicons name="log-out-outline" size={20} color={C.white} />
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={s.greetWrap}>
            <GreetUser />
          </View>

          {/* Status pill — diferente por rol */}
          <View style={s.statusPill}>
            <View style={s.activeDot} />
            <Text style={s.statusTxt}>
              {isValet ? "Modo Conductor · Activo" : "Campus Parking · Activo"}
            </Text>
          </View>
        </LinearGradient>

        {/* ── BODY ───────────────────────────────── */}
        <View style={s.body}>

          {isValet ? (
            /*
            ========================================
            SECCIÓN CONDUCTOR
            Panel de disponibilidad del valet.
            ========================================
            */
            <View>
              {/* Panel de estado */}
              <View style={s.valetPanel}>
                <View style={s.valetIconWrap}>
                  <Ionicons name="car-sport-outline" size={40} color={C.blue} />
                </View>
                <Text style={s.valetTitle}>Estás disponible</Text>
                <Text style={s.valetSubtitle}>
                  Cuando un cliente solicite un valet cercano, recibirás una notificación aquí.
                </Text>
              </View>

              {/* Acciones rápidas del conductor */}
              <Text style={s.sectionTitle}>Acciones rápidas</Text>
              <View style={s.qaRow}>
                {[
                  { icon: "time-outline",        label: "Historial",  bg: "#faf5ff", color: "#7c3aed" },
                  { icon: "person-outline",      label: "Perfil",     bg: "#eef3ff", color: C.blue    },
                  { icon: "settings-outline",    label: "Config.",    bg: "#fff5ef", color: C.orange  },
                  { icon: "help-circle-outline", label: "Ayuda",      bg: "#f0fdf4", color: "#16a34a" },
                ].map((a) => (
                  <TouchableOpacity key={a.label} style={s.qaBtn} activeOpacity={0.75}>
                    <View style={[s.qaIcon, { backgroundColor: a.bg }]}>
                      <Ionicons name={a.icon as any} size={22} color={a.color} />
                    </View>
                    <Text style={s.qaLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Últimos servicios del conductor */}
              <Text style={s.sectionTitle}>Últimos servicios</Text>
              <View style={s.card}>
                <LatestTrips />
              </View>
            </View>
          ) : (
            /*
            ========================================
            SECCIÓN CLIENTE (NO MODIFICAR)
            Esta parte corresponde a la funcionalidad del cliente.
            Debe mantenerse intacta y organizada.
            ========================================
            */
            <View>
              {/* Quick actions */}
              <Text style={s.sectionTitle}>Acciones rápidas</Text>
              <View style={s.qaRow}>
                {[
                  { icon: "car-outline",       label: "Reservar",  bg: "#eef3ff", color: C.blue    },
                  { icon: "navigate-outline",  label: "Navegar",   bg: "#fff5ef", color: C.orange  },
                  { icon: "card-outline",      label: "Pagar",     bg: "#f0fdf4", color: "#16a34a" },
                  { icon: "time-outline",      label: "Historial", bg: "#faf5ff", color: "#7c3aed" },
                ].map((a) => (
                  <TouchableOpacity key={a.label} style={s.qaBtn} activeOpacity={0.75}>
                    <View style={[s.qaIcon, { backgroundColor: a.bg }]}>
                      <Ionicons name={a.icon as any} size={22} color={a.color} />
                    </View>
                    <Text style={s.qaLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Latest trips */}
              <Text style={s.sectionTitle}>Últimos servicios</Text>
              <View style={s.card}>
                <LatestTrips />
              </View>

              {/* Service request */}
              <View style={s.card}>
                <ServiceRequest />
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
};

export default Home;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },

  // Header
  header: {
    paddingTop:        isAndroid ? 36 : 58,
    paddingHorizontal: 20,
    paddingBottom:     24,
  },
  headerTop: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
  },
  logoCircle: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: C.white,
    alignItems:      "center",
    justifyContent:  "center",
    overflow:        "hidden",
  },
  logoImg: {
    width:  32,
    height: 32,
  },
  brandTxt: {
    fontSize:      15,
    fontWeight:    "800",
    color:         C.white,
    letterSpacing: 3,
  },
  logoutBtn: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.25)",
    alignItems:      "center",
    justifyContent:  "center",
  },

  // Greeting
  greetWrap: {
    marginBottom: 14,
  },

  // Status pill
  statusPill: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             8,
    alignSelf:       "flex-start",
    backgroundColor: "rgba(74,222,128,0.15)",
    borderWidth:     1,
    borderColor:     "rgba(74,222,128,0.3)",
    borderRadius:    20,
    paddingVertical:   6,
    paddingHorizontal: 12,
  },
  activeDot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: C.green,
  },
  statusTxt: {
    fontSize:   12,
    fontWeight: "600",
    color:      C.green,
  },

  // Body
  body: {
    padding:    16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize:     14,
    fontWeight:   "800",
    color:        C.navy,
    marginBottom: 12,
  },

  // Quick actions
  qaRow: {
    flexDirection: "row",
    gap:           10,
    marginBottom:  20,
  },
  qaBtn: {
    flex:            1,
    backgroundColor: C.card,
    borderRadius:    16,
    paddingVertical:   14,
    paddingHorizontal: 6,
    alignItems:      "center",
    gap:             8,
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     "#1a56db",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       2,
  },
  qaIcon: {
    width:         40,
    height:        40,
    borderRadius:  12,
    alignItems:    "center",
    justifyContent:"center",
  },
  qaLabel: {
    fontSize:   10,
    fontWeight: "700",
    color:      C.navy,
    textAlign:  "center",
  },

  // Card wrapper
  card: {
    backgroundColor: C.card,
    borderRadius:    18,
    borderWidth:     1,
    borderColor:     C.border,
    overflow:        "hidden",
    marginBottom:    16,
    shadowColor:     "#1a56db",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       2,
    padding:         12,
  },

  /*
  ========================================
  SECCIÓN CONDUCTOR — estilos del panel valet
  ========================================
  */
  valetPanel: {
    backgroundColor: C.card,
    borderRadius:    18,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      "center",
    padding:         32,
    marginBottom:    24,
    shadowColor:     "#1a56db",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       2,
  },
  valetIconWrap: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: "#eef3ff",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    16,
  },
  valetTitle: {
    fontSize:     18,
    fontWeight:   "800",
    color:        C.navy,
    marginBottom: 8,
    textAlign:    "center",
  },
  valetSubtitle: {
    fontSize:   13,
    color:      C.muted,
    textAlign:  "center",
    lineHeight: 20,
  },
});
