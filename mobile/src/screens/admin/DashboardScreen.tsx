import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AdminNav from "../../components/AdminNav";
import { Screen, Title } from "../../components/ui";
import { ApiError, api, type ScheduleBlock } from "../../lib/api";
import { colors, font } from "../../theme";

interface DashboardData {
  todayBookings: number;
  upcomingBookings: number;
  servicesCount: number;
  blocks: ScheduleBlock[];
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ dashboard: DashboardData }>("/admin/dashboard")
      .then((res) => setData(res.dashboard))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen>
      <Title>Painel</Title>
      <AdminNav current="Dashboard" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <Text style={styles.hint}>Carregando...</Text>
      ) : data ? (
        <>
          <View style={styles.grid}>
            <Stat value={data.todayBookings} label="Agendamentos hoje" />
            <Stat value={data.upcomingBookings} label="Próximos confirmados" />
            <Stat value={data.servicesCount} label="Serviços cadastrados" />
          </View>
          <Text style={styles.hint}>Veja e gerencie os horários marcados na Agenda.</Text>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  stat: { backgroundColor: colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  value: { fontFamily: font.extra, fontSize: 28, color: colors.primary },
  statLabel: { color: colors.muted, fontFamily: font.regular, marginTop: 2 },
  hint: { color: colors.muted, fontFamily: font.regular, marginTop: 16 },
  error: { color: colors.danger, fontFamily: font.semibold, marginBottom: 10 },
});
