import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AlertBox, Empty, Loading, PrimaryButton, Screen, Title } from "../components/ui";
import { ApiError, api, type Booking } from "../lib/api";
import { useAuth } from "../lib/auth";
import { confirm } from "../lib/confirm";
import { formatDdMmYyTime, formatMoney } from "../lib/format";
import { loadGuestPhone, saveGuestPhone } from "../lib/guest";
import type { RootStackParamList } from "../navigation/types";
import { colors, font } from "../theme";

const statusLabel: Record<Booking["status"], string> = {
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

type Filter = "upcoming" | "past" | "canceled";

function bucket(booking: Booking): Filter {
  if (booking.status === "CANCELED") return "canceled";
  const when = new Date(booking.date).getTime();
  if (booking.status === "CONFIRMED" && when >= Date.now()) return "upcoming";
  return "past";
}

export default function BookingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [ready, setReady] = useState(false);
  const [lookedUp, setLookedUp] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("upcoming");

  const loadByAuth = () => {
    setLoading(true);
    setError("");
    api
      .get<{ bookings: Booking[] }>("/bookings")
      .then((data) => {
        setBookings(data.bookings);
        setLookedUp(true);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  };

  const loadByPhone = (value: string) => {
    setLoading(true);
    setError("");
    api
      .post<{ bookings: Booking[] }>("/bookings/lookup", { phone: value.trim() })
      .then(async (data) => {
        setBookings(data.bookings);
        setLookedUp(true);
        await saveGuestPhone(value.trim());
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user) {
        loadByAuth();
        if (!cancelled) setReady(true);
        return;
      }
      const saved = await loadGuestPhone();
      if (cancelled) return;
      if (saved) {
        setPhone(saved);
        loadByPhone(saved);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const submitPhone = () => {
    if (phone.replace(/\D/g, "").length < 8) {
      setError("Informe um telefone válido.");
      return;
    }
    loadByPhone(phone);
  };

  const cancel = async (id: string) => {
    const ok = await confirm("Cancelar este agendamento?");
    if (!ok) return;
    try {
      if (user) {
        await api.delete(`/bookings/${id}`);
        loadByAuth();
      } else {
        await api.delete(`/bookings/${id}`, { phone: phone.trim() });
        loadByPhone(phone);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao cancelar.");
    }
  };

  if (!ready) return <Loading />;

  const visible = bookings
    .filter((booking) => bucket(booking) === filter)
    .sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return filter === "upcoming" ? diff : -diff;
    });

  if (!user && !lookedUp) {
    return (
      <Screen>
        <Title>Meus agendamentos</Title>
        <Text style={styles.sub}>Informe o telefone usado na reserva.</Text>
        {error ? <AlertBox kind="error">{error}</AlertBox> : null}
        <Text style={styles.label}>Telefone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="(00) 00000-0000"
          placeholderTextColor={colors.faint}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <PrimaryButton label={loading ? "Buscando..." : "Ver agendamentos"} disabled={loading} onPress={submitPhone} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Meus agendamentos</Title>
      {!user && (
        <Pressable
          onPress={() => {
            setLookedUp(false);
            setBookings([]);
            setError("");
          }}
        >
          <Text style={styles.link}>Trocar telefone</Text>
        </Pressable>
      )}
      <View style={styles.tabs}>
        {(
          [
            ["upcoming", "Próximos"],
            ["past", "Passados"],
            ["canceled", "Cancelados"],
          ] as const
        ).map(([id, label]) => (
          <Pressable key={id} onPress={() => setFilter(id)} style={[styles.tab, filter === id && styles.tabOn]}>
            <Text style={[styles.tabText, filter === id && styles.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <AlertBox kind="error">{error}</AlertBox> : null}
      {loading ? (
        <Text style={styles.sub}>Carregando...</Text>
      ) : visible.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.sub}>
            {filter === "upcoming"
              ? "Nenhum horário por vir."
              : filter === "past"
                ? "Nenhum horário passado."
                : "Nenhum horário cancelado."}
          </Text>
          {filter === "upcoming" && (
            <PrimaryButton label="Agendar horário" onPress={() => navigation.navigate("Book")} />
          )}
        </View>
      ) : (
        visible.map((booking) => {
          const when = new Date(booking.date);
          const canCancel = booking.status === "CONFIRMED" && when.getTime() > Date.now();
          return (
            <View key={booking.id} style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.service}>{booking.service.name}</Text>
                <Text style={[styles.badge, badgeStyle(booking.status)]}>{statusLabel[booking.status]}</Text>
              </View>
              <Text style={styles.who}>{booking.barber?.name ?? booking.service.barbershop?.name}</Text>
              <Text style={styles.when}>
                {formatDdMmYyTime(when)} · {formatMoney(booking.service.price)}
              </Text>
              {canCancel && (
                <Pressable onPress={() => cancel(booking.id)}>
                  <Text style={styles.cancel}>Cancelar</Text>
                </Pressable>
              )}
            </View>
          );
        })
      )}
    </Screen>
  );
}

function badgeStyle(status: Booking["status"]) {
  if (status === "CANCELED" || status === "NO_SHOW") return styles.badgeBad;
  if (status === "COMPLETED") return styles.badgeMuted;
  return styles.badgeOk;
}

const styles = StyleSheet.create({
  sub: { color: colors.muted, fontFamily: font.regular, marginBottom: 14 },
  label: { fontFamily: font.semibold, color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: font.regular,
    color: colors.text,
    marginBottom: 14,
  },
  link: { color: colors.primary, fontFamily: font.semibold, marginBottom: 12 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tab: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontFamily: font.semibold, color: colors.muted, fontSize: 13 },
  tabTextOn: { color: colors.white },
  emptyBox: { gap: 12, marginTop: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
  service: { flex: 1, fontFamily: font.bold, color: colors.text, fontSize: 16 },
  who: { marginTop: 6, fontFamily: font.semibold, color: colors.text },
  when: { marginTop: 2, color: colors.muted, fontFamily: font.regular },
  cancel: { marginTop: 10, color: colors.danger, fontFamily: font.semibold },
  badge: { overflow: "hidden", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontFamily: font.semibold, fontSize: 12 },
  badgeOk: { backgroundColor: colors.primarySoft, color: colors.primary },
  badgeMuted: { backgroundColor: colors.input, color: colors.muted },
  badgeBad: { backgroundColor: colors.dangerSoft, color: colors.danger },
});
