import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import AdminNav from "../../components/AdminNav";
import ImageField from "../../components/ImageField";
import { AlertBox, Field, PrimaryButton, Screen, SecondaryButton, Title } from "../../components/ui";
import { ApiError, api, type Service } from "../../lib/api";
import { colors, font } from "../../theme";

const emptyForm = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  durationMinutes: "45",
  isActive: true,
};

export default function AdminServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<{ services: Service[] }>("/admin/services")
      .then((res) => setServices(res.services))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async () => {
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      isActive: form.isActive,
    };
    try {
      if (editingId) await api.patch(`/admin/services/${editingId}`, payload);
      else await api.post("/admin/services", payload);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Title>Serviços</Title>
      <AdminNav current="Serviços" />
      <Text style={styles.h2}>{editingId ? "Editar serviço" : "Novo serviço"}</Text>
      {error ? <AlertBox kind="error">{error}</AlertBox> : null}
      <Field label="Nome" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
      <Field label="Preço (R$)" value={form.price} keyboardType="decimal-pad" onChangeText={(price) => setForm({ ...form, price })} />
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        value={form.description}
        onChangeText={(description) => setForm({ ...form, description })}
        multiline
        style={[styles.input, styles.area]}
      />
      <ImageField label="Imagem do serviço" value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
      <Field
        label="Duração (min)"
        value={form.durationMinutes}
        keyboardType="number-pad"
        onChangeText={(durationMinutes) => setForm({ ...form, durationMinutes })}
      />
      {editingId && (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Serviço ativo</Text>
          <Switch value={form.isActive} onValueChange={(isActive) => setForm({ ...form, isActive })} />
        </View>
      )}
      <PrimaryButton
        label={saving ? "Salvando..." : editingId ? "Atualizar" : "Criar serviço"}
        disabled={saving || !form.name.trim() || !form.description.trim() || !form.price}
        onPress={submit}
      />
      {editingId && (
        <View style={styles.cancel}>
          <SecondaryButton
            label="Cancelar"
            onPress={() => {
              setEditingId(null);
              setForm(emptyForm);
            }}
          />
        </View>
      )}
      {loading ? (
        <Text style={styles.muted}>Carregando...</Text>
      ) : (
        services.map((service) => (
          <View key={service.id} style={styles.card}>
            <Text style={styles.name}>
              {service.name}
              {service.isActive === false ? " · inativo" : ""}
            </Text>
            <Text style={styles.muted}>
              R$ {Number(service.price).toFixed(2)} · {service.durationMinutes} min
            </Text>
            <Pressable
              onPress={() => {
                setEditingId(service.id);
                setForm({
                  name: service.name,
                  description: service.description,
                  imageUrl: service.imageUrl,
                  price: String(service.price),
                  durationMinutes: String(service.durationMinutes),
                  isActive: service.isActive ?? true,
                });
              }}
            >
              <Text style={styles.edit}>Editar</Text>
            </Pressable>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: font.extra, fontSize: 18, color: colors.text, marginBottom: 10 },
  label: { fontFamily: font.semibold, color: colors.muted, marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: colors.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: font.regular,
    color: colors.text,
    marginBottom: 12,
  },
  area: { minHeight: 72, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  switchLabel: { fontFamily: font.semibold, color: colors.text },
  cancel: { marginTop: 10 },
  muted: { color: colors.muted, fontFamily: font.regular, marginTop: 4 },
  card: { marginTop: 12, backgroundColor: colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  name: { fontFamily: font.bold, color: colors.text, fontSize: 16 },
  edit: { marginTop: 8, color: colors.primary, fontFamily: font.semibold },
});
