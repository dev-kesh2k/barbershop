import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BackButton, PrimaryButton, Screen } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { RootStackParamList } from "../navigation/types";
import { colors, font } from "../theme";

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  }, [user, navigation]);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "login") await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.mark}>✂</Text>
      <Text style={styles.title}>Brutus Barber</Text>
      <Text style={styles.lede}>
        {tab === "login" ? "Entre para acompanhar seus horários." : "Crie sua conta em poucos segundos."}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {tab === "register" && (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />
      )}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="E-mail"
        placeholderTextColor={colors.faint}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <View style={styles.password}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          placeholderTextColor={colors.faint}
          secureTextEntry={!showPassword}
          style={styles.passwordInput}
        />
        <Pressable accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"} onPress={() => setShowPassword((value) => !value)}>
          <Text style={styles.eye}>{showPassword ? "ocultar" : "mostrar"}</Text>
        </Pressable>
      </View>
      <PrimaryButton
        label={loading ? "Aguarde..." : tab === "login" ? "Entrar" : "Criar conta"}
        disabled={loading || !email || password.length < 6 || (tab === "register" && name.trim().length < 2)}
        onPress={submit}
      />
      <Pressable onPress={() => setTab(tab === "login" ? "register" : "login")} style={styles.switchBtn}>
        <Text style={styles.switchText}>
          {tab === "login" ? "Não tem conta? " : "Já tem conta? "}
          <Text style={styles.switchLink}>{tab === "login" ? "Cadastre-se" : "Entrar"}</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mark: { textAlign: "center", fontSize: 42, color: colors.primary, marginTop: 12 },
  title: { textAlign: "center", fontFamily: font.extra, fontSize: 28, color: colors.text, marginTop: 8 },
  lede: { textAlign: "center", color: colors.muted, fontFamily: font.regular, marginTop: 6, marginBottom: 18 },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, borderRadius: 12, padding: 12, marginBottom: 12, overflow: "hidden", fontFamily: font.semibold },
  input: {
    backgroundColor: colors.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: font.regular,
    color: colors.text,
    marginBottom: 10,
  },
  password: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input,
    borderRadius: 14,
    marginBottom: 16,
    paddingRight: 12,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontFamily: font.regular, color: colors.text },
  eye: { color: colors.primary, fontFamily: font.semibold, fontSize: 13 },
  switchBtn: { marginTop: 16, alignItems: "center" },
  switchText: { color: colors.muted, fontFamily: font.regular },
  switchLink: { color: colors.primary, fontFamily: font.bold },
});
