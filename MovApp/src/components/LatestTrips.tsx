import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import Button from "../components/Button";

const FALLBACK_TRIPS = [
  { id: "1", driver: "Pablo Marin", price: "$8000", date: "2024-04-01" },
  { id: "2", driver: "Juan Restrepo", price: "$14500", date: "2024-03-25" },
  { id: "3", driver: "Carlos Lopez", price: "$17000", date: "2024-03-18" },
];

interface ILatestTripsProps {
  trips?: Array<{ id: string; driver: string; price: string; date: string }>;
}

const LatestTrips = ({ trips: propTrips }: ILatestTripsProps) => {
  const trips = propTrips ?? FALLBACK_TRIPS;
  const navigation = useNavigation();
  const [active, setActive] = useState<string | null>(null);

  const handleNavigation = useCallback(
    (to: string) => {
      setActive(to);
      navigation.navigate(to as never);
    },
    [navigation, setActive]
  );

  return (
    <View
      style={{ flex: 1, paddingTop: 20, paddingHorizontal: 5, width: "100%" }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Ultimos Servicios
      </Text>

      <View style={{ flex: 1 }}>
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%", // Ensures full width
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#ddd",
              }}
            >
              <Text style={{ flex: 1, textAlign: "left", fontSize: 16 }}>
                {item.driver}
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                {item.price}
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: "right",
                  fontSize: 14,
                  color: "gray",
                }}
              >
                {item.date}
              </Text>
            </View>
          )}
        />
      </View>

      <Button
        onPress={() => handleNavigation("PastServicesList")}
        color="#000066"
        style={{
          marginTop: 10,
          padding: 10,
          backgroundColor: "#007bff",
          borderRadius: 5,
          alignSelf: "flex-end", // Makes the button full width
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Ver Todos</Text>
      </Button>
    </View>
  );
};

export default LatestTrips;
