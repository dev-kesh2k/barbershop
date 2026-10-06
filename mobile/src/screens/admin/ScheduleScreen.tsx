import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import AdminNav from "../../components/AdminNav";
import { AlertBox, Field, PrimaryButton, Screen, Title } from "../../components/ui";
import { ApiError, api, type OpeningHour, type ScheduleBlock } from "../../lib/api";
import { confirm } from "../../lib/confirm";
import { formatDdMmYyTime, formatMoney, parseLocalDateTime } from "../../lib/format";
import { colors, font } from "../../theme";

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

interface AdminBooking {
  id: string;
  date: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
  user: { id: string; name: string | null; phone: string | null; email: string };
  barber?: { id: string; name: string } | null;
  service: { id: string; name: string; price: number; durationMinutes: number };
}

const statusLabel: Record<AdminBooking["status"], string> = {
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

export default function AdminScheduleScreen() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [bookingsRes, blocksRes, hoursRes] = await Promise.all([
        api.get<{ bookings: AdminBooking[] }>("/admin/bookings"),
        api.get<{ blocks: ScheduleBlock[] }>("/admin/schedule-blocks"),
        api.get<{ openingHours: OpeningHour[] }>("/admin/opening-hours"),
      ]);
      setBookings(bookingsRes.bookings);
      setBlocks(blocksRes.blocks);
      setHours(hoursRes.openingHours);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (id: string, status: AdminBooking["status"]) => {
    try {
      await api.patch(`/admin/bookings/${id}`, { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao atualizar.");
    }
  };

  const addBlock = async () => {
    const start = parseLocalDateTime(startsAt);
    const end = parseLocalDateTime(endsAt);
    if (!start || !end) {
      setError("Use o formato 2026-10-06 14:00.");
      return;
    }
    setError("");
    try {
      await api.post("/admin/schedule-blocks", {
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        reason: reason || undefined,
      });
      setStartsAt("");
      setEndsAt("");
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar bloqueio.");
    }
  };

  const removeBlock = async (id: string) => {
    if (!(await confirm("Remover este bloqueio?"))) return;
    await api.delete(`/admin/schedule-blocks/${id}`);
    await load();
  };

  const saveHours = async () => {
    setSavingHours(true);
    setError("");
    try {
      await api.put("/admin/opening-hours", hours);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar horários.");
    } finally {
      setSavingHours(false);
    }
  };

  const upcoming = bookings.filter((item) => item.status === "CONFIRMED" && new Date(item.date).getTime() >= Date.now());
  const past = bookings.filter((item) => !(item.status === "CONFIRMED" && new Date(item.date).getTime() >= Date.now()));

  return (
    <Screen>
      <Title>Agenda</Title>
      <AdminNav current="Agenda" />
      {error ? <AlertBox kind="error">{error}</AlertBox> : null}
      <Text style={styles.h2}>Próximos agendamentos</Text>
      {loading ? (
        <Text style={styles.muted}>Carregando...</Text>
      ) : upcoming.length === 0 ? (
        <Text style={styles.muted}>Nenhum horário marcado ainda.</Text>
      ) : (
        upcoming.map((booking) => (
          <View key={booking.id} style={styles.card}>
            <Text style={styles.name}>{booking.service.name}</Text>
            <Text style={styles.when}>{formatDdMmYyTime(booking.date)}</Text>
            <Text style={styles.client}>
              {booking.user.name || "Cliente"}
              {booking.barber?.name ? ` · ${booking.barber.name}` : ""}
              {booking.user.phone ? ` · ${booking.user.phone}` : ""}
            </Text>
            <Text style={styles.meta}>
              {statusLabel[booking.status]} · {formatMoney(booking.service.price)}
            </Text>
            <View style={styles.actions}>
              <Pressable style={styles.action} onPress={() => updateStatus(booking.id, "COMPLETED")}>
                <Text style={styles.actionText}>Concluir</Text>
              </Pressable>
              <Pressable
                style={styles.action}
                onPress={async () => {
                  if (await confirm("Cancelar este agendamento?")) updateStatus(booking.id, "CANCELED");
                }}
              >
                <Text style={styles.danger}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {past.length > 0 && (
        <>
          <Text style={styles.h2}>Histórico recente</Text>
          {past.slice(0, 10).map((booking) => (
            <View key={booking.id} style={styles.card}>
              <Text style={styles.name}>{booking.service.name}</Text>
              <Text style={styles.when}>{formatDdMmYyTime(booking.date)}</Text>
              <Text style={styles.client}>
                {booking.user.name || "Cliente"}
                {booking.barber?.name ? ` · ${booking.barber.name}` : ""}
              </Text>
              <Text style={styles.meta}>{statusLabel[booking.status]}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={styles.h2}>Horário de funcionamento</Text>
      {hours.map((hour) => (
        <View key={hour.weekday} style={styles.hour}>
          <Text style={styles.day}>{WEEKDAYS[hour.weekday]}</Text>
          <View style={styles.switchRow}>
            <Text style={styles.muted}>Fechado</Text>
            <Switch
              value={hour.isClosed}
              onValueChange={(isClosed) =>
                setHours((prev) => prev.map((item) => (item.weekday === hour.weekday ? { ...item, isClosed } : item)))
              }
            />
          </View>
          <View style={styles.times}>
            <TextInput
              value={hour.opensAt}
              editable={!hour.isClosed}
              onChangeText={(opensAt) =>
                setHours((prev) => prev.map((item) => (item.weekday === hour.weekday ? { ...item, opensAt } : item)))
              }
              style={[styles.time, hour.isClosed && styles.timeOff]}
            />
            <TextInput
              value={hour.closesAt}
              editable={!hour.isClosed}
              onChangeText={(closesAt) =>
                setHours((prev) => prev.map((item) => (item.weekday === hour.weekday ? { ...item, closesAt } : item)))
              }
              style={[styles.time, hour.isClosed && styles.timeOff]}
            />
          </View>
        </View>
      ))}
      <PrimaryButton label={savingHours ? "Salvando..." : "Salvar horários"} disabled={savingHours} onPress={saveHours} />

      <Text style={styles.h2}>Novo bloqueio</Text>
      <Field label="Início" value={startsAt} onChangeText={setStartsAt} placeholder="2026-10-06 14:00" autoCapitalize="none" />
      <Field label="Fim" value={endsAt} onChangeText={setEndsAt} placeholder="2026-10-06 18:00" autoCapitalize="none" />
      <Field label="Motivo (opcional)" value={reason} onChangeText={setReason} />
      <PrimaryButton label="Adicionar bloqueio" onPress={addBlock} />

      <Text style={styles.h2}>Bloqueios</Text>
      {blocks.length === 0 ? (
        <Text style={styles.muted}>Nenhum bloqueio cadastrado.</Text>
      ) : (
        blocks.map((block) => (
          <View key={block.id} style={styles.card}>
            <Text style={styles.name}>
              {formatDdMmYyTime(block.startsAt)} — {formatDdMmYyTime(block.endsAt)}
            </Text>
            {block.reason ? <Text style={styles.muted}>{block.reason}</Text> : null}
            <Pressable onPress={() => removeBlock(block.id)}>
              <Text style={styles.danger}>Remover</Text>
            </Pressable>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: font.extra, fontSize: 18, color: colors.text, marginTop: 18, marginBottom: 10 },
  muted: { color: colors.muted, fontFamily: font.regular },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  name: { fontFamily: font.bold, color: colors.text },
  when: { color: colors.text, fontFamily: font.semibold, marginTop: 4 },
  client: { color: colors.muted, fontFamily: font.regular, marginTop: 2 },
  meta: { color: colors.primary, fontFamily: font.semibold, marginTop: 6 },
  actions: { flexDirection: "row", gap: 16, marginTop: 10 },
  action: { paddingVertical: 4 },
  actionText: { color: colors.primary, fontFamily: font.semibold },
  danger: { color: colors.danger, fontFamily: font.semibold, marginTop: 8 },
  hour: { backgroundColor: colors.white, borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  day: { fontFamily: font.bold, color: colors.text },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  times: { flexDirection: "row", gap: 8, marginTop: 8 },
  time: { flex: 1, backgroundColor: colors.input, borderRadius: 12, padding: 10, fontFamily: font.semibold, color: colors.text },
  timeOff: { opacity: 0.4 },
});
