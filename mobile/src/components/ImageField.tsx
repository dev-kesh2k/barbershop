import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ApiError, api, resolveImageUrl } from "../lib/api";
import { colors, font } from "../theme";

export default function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const preview = resolveImageUrl(value);

  const pick = async () => {
    setError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted && permission.accessPrivileges !== "limited") {
      setError("Permita o acesso às fotos para enviar uma imagem.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const uploaded = await api.uploadImage({
        uri: asset.uri,
        name: asset.fileName || "foto.jpg",
        type: asset.mimeType || "image/jpeg",
      });
      onChange(uploaded.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {preview ? (
        <Image source={{ uri: preview }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Nenhuma imagem selecionada</Text>
        </View>
      )}
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={pick} disabled={uploading}>
          <Text style={styles.btnText}>{uploading ? "Enviando..." : "Escolher da galeria"}</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => setShowUrl((open) => !open)}>
          <Text style={styles.btnText}>{showUrl ? "Ocultar URL" : "Usar URL"}</Text>
        </Pressable>
      </View>
      {showUrl && (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="https://..."
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          style={styles.input}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontFamily: font.semibold, color: colors.muted, marginBottom: 6, fontSize: 13 },
  preview: { width: "100%", height: 160, borderRadius: 16, marginBottom: 10, backgroundColor: colors.input },
  placeholder: {
    height: 96,
    borderRadius: 16,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  placeholderText: { color: colors.faint, fontFamily: font.regular },
  row: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, backgroundColor: colors.input, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  btnText: { fontFamily: font.semibold, color: colors.text, fontSize: 13 },
  input: {
    marginTop: 10,
    backgroundColor: colors.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.regular,
    color: colors.text,
  },
  error: { color: colors.danger, marginTop: 8, fontFamily: font.regular },
});
