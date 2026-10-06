import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Empty, Loading, Screen, Thumb } from "../components/ui";
import { formatMoney } from "../lib/format";
import { useAuth } from "../lib/auth";
import { useShop } from "../lib/useShop";
import type { RootStackParamList } from "../navigation/types";
import { colors, font } from "../theme";

function ServiceTile({
  item,
  onPress,
}: {
  item: { name: string; imageUrl: string; price: number };
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <Thumb src={item.imageUrl} label={item.name} size={112} />
      <Text style={styles.tileName} numberOfLines={3}>
        {item.name}
      </Text>
      <Text style={styles.tilePrice}>{formatMoney(item.price)}</Text>
    </Pressable>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { shop, loading, error } = useShop();
  const [query, setQuery] = useState("");

  if (loading) return <Loading />;
  if (!shop) return <Empty>{error || "Barbearia não encontrada."}</Empty>;

  const phone = Array.isArray(shop.phones) ? shop.phones[0] : "";
  const initial = (user?.name || shop.name).trim().charAt(0).toUpperCase();
  const q = query.trim().toLowerCase();
  const services = shop.services.filter(
    (item) => !q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q),
  );

  return (
    <Screen>
      <View style={styles.hello}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Conta"
          onPress={() => navigation.navigate(user ? "Profile" : "Login")}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
        <View>
          <Text style={styles.greet}>{greeting()},</Text>
          <Text style={styles.name}>{user?.name?.trim() || "Bem-vindo"}</Text>
        </View>
      </View>

      <View style={styles.search}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar serviço..."
          placeholderTextColor={colors.faint}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.promo}>
        <View style={styles.promoCopy}>
          <Text style={styles.promoTitle}>Seu horário, sem fila</Text>
          <Text style={styles.promoText}>Escolha o serviço, o dia e o horário.</Text>
          <Pressable style={styles.promoBtn} onPress={() => navigation.navigate("Book")}>
            <Text style={styles.promoBtnText}>Agendar</Text>
          </Pressable>
        </View>
        {shop.imageUrl ? <Thumb src={shop.imageUrl} label={shop.name} size={92} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Serviços</Text>
        <Pressable onPress={() => navigation.navigate("Services")}>
          <Text style={styles.link}>Ver todos</Text>
        </Pressable>
      </View>
      {services.length === 0 ? (
        <Text style={styles.empty}>Nenhum serviço encontrado.</Text>
      ) : (
        <View style={styles.grid}>
          {services.map((item) => (
            <ServiceTile key={item.id} item={item} onPress={() => navigation.navigate("Book", { serviceId: item.id })} />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>A barbearia</Text>
      </View>
      <Pressable style={styles.shop} onPress={() => navigation.navigate("Services")}>
        <Thumb src={shop.imageUrl} label={shop.name} size={64} />
        <View style={styles.shopCopy}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopMeta}>{shop.address}</Text>
          {phone ? <Text style={styles.shopMeta}>{phone}</Text> : null}
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hello: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, marginBottom: 16 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontFamily: font.extra, fontSize: 18 },
  greet: { color: colors.muted, fontFamily: font.regular },
  name: { color: colors.text, fontFamily: font.extra, fontSize: 20 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { color: colors.faint, fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontFamily: font.regular, color: colors.text, fontSize: 15 },
  promo: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 22,
  },
  promoCopy: { flex: 1 },
  promoTitle: { color: colors.white, fontFamily: font.extra, fontSize: 22, marginBottom: 6 },
  promoText: { color: "#d7e4dc", fontFamily: font.regular, marginBottom: 14 },
  promoBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  promoBtnText: { color: colors.primary, fontFamily: font.bold },
  section: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: font.extra, fontSize: 18, color: colors.text },
  link: { color: colors.primary, fontFamily: font.semibold },
  empty: { color: colors.muted, fontFamily: font.regular, marginBottom: 16 },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginBottom: 22,
  },
  tile: {
    width: "46%",
    maxWidth: 180,
    alignItems: "center",
  },
  tileName: { marginTop: 8, fontFamily: font.bold, color: colors.text, fontSize: 13, textAlign: "center" },
  tilePrice: { color: colors.muted, fontFamily: font.semibold, marginTop: 2, textAlign: "center" },
  shop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shopCopy: { flex: 1 },
  shopName: { fontFamily: font.bold, color: colors.text, fontSize: 16 },
  shopMeta: { color: colors.muted, fontFamily: font.regular, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.faint },
});
