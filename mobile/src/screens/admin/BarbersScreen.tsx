import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import AdminNav from "../../components/AdminNav";
import ImageField from "../../components/ImageField";
import { AlertBox, Field, PrimaryButton, Screen, SecondaryButton, Title } from "../../components/ui";
import { ApiError, api, type Barber } from "../../lib/api";
import { colors, font } from "../../theme";

const emptyForm = { name: "", title: "Barbeiro", imageUrl: "", isActive: true };

export default function AdminBarbersScreen() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<{ barbers: Barber[] }>("/admin/barbers")
      .then((res) => setBarbers(res.barbers))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async () => {
    setSaving(true);
    setError("");
    const payload = { name: form.name, title: form.title, imageUrl: form.imageUrl, isActive: form.isActive };
    try {
      if (editingId) await api.patch(`/admin/barbers/${editingId}`, payload);
      else await api.post("/admin/barbers", payload);
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
      <Title>Barbeiros</Title>
      <AdminNav current="Barbeiros" />
      <Text style={styles.h2}>{editingId ? "Editar barbeiro" : "Novo barbeiro"}</Text>
      {error ? <AlertBox kind="error">{error}</AlertBox> : null}
      <Field label="Nome" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
      <Field label="Função" value={form.title} onChangeText={(title) => setForm({ ...form, title })} placeholder="Barbeiro sênior" />
      <ImageField label="Foto" value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Atende na agenda</Text>
        <Switch value={form.isActive} onValueChange={(isActive) => setForm({ ...form, isActive })} />
      </View>
      <PrimaryButton
        label={saving ? "Salvando..." : editingId ? "Atualizar" : "Adicionar"}
        disabled={saving || form.name.trim().length < 2}
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
        barbers.map((barber) => (
          <View key={barber.id} style={styles.card}>
            <Text style={styles.name}>{barber.name}</Text>
            <Text style={styles.muted}>
              {barber.title}
              {barber.isActive === false ? " · inativo" : ""}
            </Text>
            <Pressable
              onPress={() => {
                setEditingId(barber.id);
                setForm({
                  name: barber.name,
                  title: barber.title,
                  imageUrl: barber.imageUrl,
                  isActive: barber.isActive ?? true,
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
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  switchLabel: { fontFamily: font.semibold, color: colors.text },
  cancel: { marginTop: 10 },
  muted: { color: colors.muted, fontFamily: font.regular, marginTop: 4 },
  card: { marginTop: 12, backgroundColor: colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  name: { fontFamily: font.bold, color: colors.text, fontSize: 16 },
  edit: { marginTop: 8, color: colors.primary, fontFamily: font.semibold },
});
