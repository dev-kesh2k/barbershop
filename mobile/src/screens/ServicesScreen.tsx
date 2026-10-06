import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BackButton, Empty, Loading, Screen, Thumb } from "../components/ui";
import { formatMoney } from "../lib/format";
import { useShop } from "../lib/useShop";
import type { RootStackParamList } from "../navigation/types";
import { colors, font } from "../theme";

export default function ServicesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { shop, loading, error } = useShop();
  const [query, setQuery] = useState("");

  const services = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!shop) return [];
    return shop.services.filter(
      (item) => !q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q),
    );
  }, [shop, query]);

  if (loading) return <Loading />;
  if (!shop) return <Empty>{error || "Barbearia não encontrada."}</Empty>;

  return (
    <Screen>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Serviços</Text>
      <View style={styles.search}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar serviço..."
          placeholderTextColor={colors.faint}
          style={styles.searchInput}
        />
      </View>
      {services.length === 0 ? (
        <Text style={styles.empty}>Nenhum serviço encontrado.</Text>
      ) : (
        services.map((item) => (
          <Pressable
            key={item.id}
            style={styles.row}
            onPress={() => navigation.navigate("Book", { serviceId: item.id })}
          >
            <Thumb src={item.imageUrl} label={item.name} />
            <View style={styles.copy}>
              <Text style={styles.name}>{item.name}</Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              <Text style={styles.meta}>
                {item.durationMinutes} min · {formatMoney(item.price)}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.extra, fontSize: 28, color: colors.text, marginBottom: 12 },
  search: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  searchInput: { paddingHorizontal: 14, paddingVertical: 14, fontFamily: font.regular, color: colors.text },
  empty: { color: colors.muted, fontFamily: font.regular, textAlign: "center", marginTop: 24 },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copy: { flex: 1 },
  name: { fontFamily: font.bold, color: colors.text },
  desc: { color: colors.muted, fontFamily: font.regular, marginTop: 2 },
  meta: { color: colors.primary, fontFamily: font.semibold, marginTop: 4 },
  chevron: { color: colors.faint, fontSize: 22 },
});
