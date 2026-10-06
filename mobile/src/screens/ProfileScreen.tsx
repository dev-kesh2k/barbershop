import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AlertBox, BackButton, PrimaryButton, Screen } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { RootStackParamList } from "../navigation/types";
import { colors, font } from "../theme";

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refresh, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  const submit = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.patch("/profile", { name, phone: phone || null });
      await refresh();
      setMessage("Perfil atualizado.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const initial = (user?.name || user?.email || "B").trim().charAt(0).toUpperCase();

  return (
    <Screen>
      {navigation.canGoBack() && <BackButton onPress={() => navigation.goBack()} />}
      <Text style={styles.title}>Perfil</Text>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.name}>{user?.name?.trim() || "Sua conta"}</Text>
          <Text style={styles.meta}>{user?.email}</Text>
          {user?.phone ? <Text style={styles.meta}>{user.phone}</Text> : null}
        </View>
      </View>

      <Pressable style={styles.row} onPress={() => setOpen((value) => !value)}>
        <Text style={styles.rowText}>Informações pessoais</Text>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </Pressable>
      <Pressable
        style={styles.row}
        onPress={() =>
          navigation.navigate("Main", {
            screen: user?.role === "BARBER_ADMIN" ? "AdminSchedule" : "Bookings",
          })
        }
      >
        <Text style={styles.rowText}>Meus agendamentos</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable
        style={styles.row}
        onPress={() => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: "Main" }] });
        }}
      >
        <Text style={styles.danger}>Sair</Text>
      </Pressable>

      {open && (
        <View style={styles.form}>
          {error ? <AlertBox kind="error">{error}</AlertBox> : null}
          {message ? <AlertBox kind="success">{message}</AlertBox> : null}
          <Text style={styles.label}>E-mail</Text>
          <TextInput value={user?.email ?? ""} editable={false} style={[styles.input, styles.locked]} />
          <Text style={styles.label}>Nome</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="(11) 99999-9999"
            placeholderTextColor={colors.faint}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <PrimaryButton label={saving ? "Salvando..." : "Salvar"} disabled={saving} onPress={submit} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.extra, fontSize: 28, color: colors.text, marginBottom: 14 },
  hero: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 18 },
  heroCopy: { flex: 1 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontFamily: font.extra, fontSize: 24 },
  name: { fontFamily: font.extra, fontSize: 18, color: colors.text },
  meta: { color: colors.muted, fontFamily: font.regular },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: { flex: 1, fontFamily: font.semibold, color: colors.text },
  danger: { fontFamily: font.semibold, color: colors.danger },
  chevron: { fontSize: 22, color: colors.faint },
  chevronOpen: { transform: [{ rotate: "90deg" }] },
  form: { marginTop: 8, backgroundColor: colors.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border },
  label: { fontFamily: font.semibold, color: colors.muted, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: colors.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: font.regular,
    color: colors.text,
    marginBottom: 8,
  },
  locked: { color: colors.muted },
});
