import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import AdminNav from "../../components/AdminNav";
import ImageField from "../../components/ImageField";
import { AlertBox, Field, PrimaryButton, Screen, Title } from "../../components/ui";
import { ApiError, api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, font } from "../../theme";

export default function AdminSettingsScreen() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phones, setPhones] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        if (!user?.barbershopId) return;
        const detail = await api.get<{
          barbershop: { name: string; address: string; phones: string[]; description: string; imageUrl: string };
        }>(`/barbershops/${user.barbershopId}`);
        const shop = detail.barbershop;
        setName(shop.name);
        setAddress(shop.address);
        setPhones(shop.phones.join(", "));
        setDescription(shop.description);
        setImageUrl(shop.imageUrl);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.barbershopId]);

  const submit = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.patch("/admin/settings", {
        name,
        address,
        phones: phones.split(",").map((item) => item.trim()).filter(Boolean),
        description,
        imageUrl,
      });
      setMessage("Configurações salvas.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Title>Configurações</Title>
      <AdminNav current="Config" />
      {loading ? (
        <Text style={styles.muted}>Carregando...</Text>
      ) : (
        <>
          {error ? <AlertBox kind="error">{error}</AlertBox> : null}
          {message ? <AlertBox kind="success">{message}</AlertBox> : null}
          <Field label="Nome da barbearia" value={name} onChangeText={setName} />
          <Field label="Endereço" value={address} onChangeText={setAddress} />
          <Field label="Telefones (separados por vírgula)" value={phones} onChangeText={setPhones} />
          <Text style={styles.label}>Descrição</Text>
          <TextInput value={description} onChangeText={setDescription} multiline style={styles.area} />
          <ImageField label="Imagem da barbearia" value={imageUrl} onChange={setImageUrl} />
          <PrimaryButton label={saving ? "Salvando..." : "Salvar configurações"} disabled={saving} onPress={submit} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted, fontFamily: font.regular },
  label: { fontFamily: font.semibold, color: colors.muted, marginBottom: 6, fontSize: 13 },
  area: {
    backgroundColor: colors.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 96,
    textAlignVertical: "top",
    fontFamily: font.regular,
    color: colors.text,
    marginBottom: 12,
  },
});
