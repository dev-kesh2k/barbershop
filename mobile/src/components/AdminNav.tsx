import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors, font } from "../theme";

const LINKS: { label: string; route: keyof RootStackParamList }[] = [
  { label: "Dashboard", route: "Main" },
  { label: "Serviços", route: "AdminServices" },
  { label: "Barbeiros", route: "AdminBarbers" },
  { label: "Agenda", route: "Main" },
  { label: "Config", route: "AdminSettings" },
];

export default function AdminNav({ current }: { current: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const open = (label: string, route: keyof RootStackParamList) => {
    if (label === "Agenda") {
      navigation.navigate("Main", { screen: "AdminSchedule" });
      return;
    }
    if (label === "Dashboard") {
      navigation.navigate("Main", { screen: "AdminHome" });
      return;
    }
    navigation.navigate(route as "AdminServices");
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {LINKS.map((item) => {
        const active = item.label === current;
        return (
          <Pressable
            key={item.label}
            onPress={() => open(item.label, item.route)}
            style={[styles.chip, active && styles.chipOn]}
          >
            <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 16 },
  chip: { backgroundColor: colors.white, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: font.semibold, color: colors.muted, fontSize: 13 },
  chipTextOn: { color: colors.white },
});
