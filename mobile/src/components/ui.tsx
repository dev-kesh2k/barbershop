import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveImageUrl } from "../lib/api";
import { colors, font } from "../theme";

export function Screen({
  children,
  footer,
  padded = true,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          padded && styles.pad,
          { paddingBottom: (footer ? 24 : 120) + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

export function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.center}>
      <Text style={styles.mutedCenter}>{children}</Text>
    </View>
  );
}

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function AlertBox({ kind, children }: { kind: "error" | "success"; children: string }) {
  return (
    <Text style={[styles.alert, kind === "error" ? styles.alertError : styles.alertOk]}>{children}</Text>
  );
}

export function Field({
  label,
  ...input
}: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.faint} style={styles.input} {...input} />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primary, disabled && styles.disabled]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondary}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function Thumb({
  src,
  label,
  size = 56,
  round = false,
}: {
  src?: string | null;
  label?: string;
  size?: number;
  round?: boolean;
}) {
  const url = resolveImageUrl(src);
  const radius = round ? size / 2 : 14;
  if (!url) {
    const letter = (label || "").trim().charAt(0).toUpperCase() || "•";
    return (
      <View style={[styles.thumbFallback, { width: size, height: size, borderRadius: radius }]}>
        <Text style={styles.thumbLetter}>{letter}</Text>
      </View>
    );
  }
  return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: radius }} />;
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onPress} style={styles.back}>
      <Text style={styles.backIcon}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 18, paddingTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10, backgroundColor: colors.bg },
  muted: { color: colors.muted, fontFamily: font.regular, marginTop: 8 },
  mutedCenter: { color: colors.muted, fontFamily: font.regular, textAlign: "center", fontSize: 15 },
  title: { fontFamily: font.extra, fontSize: 28, color: colors.text, marginBottom: 14, marginTop: 8 },
  alert: { borderRadius: 12, padding: 12, marginBottom: 12, overflow: "hidden", fontFamily: font.semibold },
  alertError: { backgroundColor: colors.dangerSoft, color: colors.danger },
  alertOk: { backgroundColor: colors.primarySoft, color: colors.primary },
  field: { marginBottom: 12 },
  label: { fontFamily: font.semibold, color: colors.muted, marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: colors.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.text,
  },
  primary: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  primaryText: { color: colors.white, fontFamily: font.bold, fontSize: 16 },
  disabled: { opacity: 0.45 },
  secondary: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.input,
    alignItems: "center",
  },
  secondaryText: { color: colors.text, fontFamily: font.semibold },
  thumbFallback: { backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  thumbLetter: { color: colors.primary, fontFamily: font.extra, fontSize: 18 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 32, lineHeight: 34, color: colors.text, fontFamily: font.regular },
});
