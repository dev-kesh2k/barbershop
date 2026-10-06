import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertBox, BackButton, Loading, Thumb } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatMoney, monthLabel, prettyDate, todayIso } from "../lib/format";
import { loadGuest, saveGuest } from "../lib/guest";
import { useShop } from "../lib/useShop";
import type { RootStackParamList } from "../navigation/types";
import { colors, font } from "../theme";

type Step = "service" | "barber" | "date" | "time" | "details";
const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export default function BookScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Book">>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { shop, loading, error: loadError } = useShop();

  const [step, setStep] = useState<Step | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadGuest().then((guest) => {
      setGuestName(guest.name);
      setGuestPhone(guest.phone);
    });
  }, []);

  useEffect(() => {
    if (!shop || step) return;
    const preset = route.params?.serviceId;
    if (preset && shop.services.some((item) => item.id === preset)) {
      setSelectedService(preset);
      setStep(shop.barbers.length > 0 ? "barber" : "date");
      return;
    }
    setStep("service");
  }, [shop, route.params?.serviceId, step]);

  useEffect(() => {
    if (!shop || !selectedService || !date || ((shop.barbers?.length ?? 0) > 0 && !selectedBarber)) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    const barberQuery = selectedBarber ? `&barberId=${encodeURIComponent(selectedBarber)}` : "";
    api
      .get<{ slots: string[] }>(
        `/barbershops/${shop.id}/slots?serviceId=${encodeURIComponent(selectedService)}&date=${date}${barberQuery}`,
      )
      .then((data) => {
        if (!cancelled) setSlots(data.slots);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shop, selectedService, selectedBarber, date]);

  const service = shop?.services.find((item) => item.id === selectedService);
  const barber = shop?.barbers.find((item) => item.id === selectedBarber);
  const needsBarber = (shop?.barbers.length ?? 0) > 0;
  const order: Step[] = needsBarber
    ? ["service", "barber", "date", "time", "details"]
    : ["service", "date", "time", "details"];
  const labels = needsBarber
    ? ["Serviço", "Barbeiro", "Data", "Horário", "Detalhes"]
    : ["Serviço", "Data", "Horário", "Detalhes"];
  const current = step ? order.indexOf(step) + 1 : 1;
  const minDate = useMemo(() => todayIso(), []);

  const goBack = () => {
    setError("");
    const index = step ? order.indexOf(step) : 0;
    if (index <= 0) {
      navigation.goBack();
      return;
    }
    setStep(order[index - 1]);
  };

  const canContinue =
    (step === "service" && Boolean(selectedService)) ||
    (step === "barber" && Boolean(selectedBarber)) ||
    (step === "date" && Boolean(date)) ||
    (step === "time" && Boolean(selectedSlot) && !slotsLoading) ||
    step === "details";

  async function handleBook() {
    if (!service || !date || !selectedSlot || booking) return;
    if (needsBarber && !selectedBarber) {
      setError("Escolha o barbeiro.");
      return;
    }
    if (!user) {
      if (!guestName.trim() || guestName.trim().length < 2) {
        setError("Informe seu nome.");
        return;
      }
      if (!guestPhone.trim() || guestPhone.replace(/\D/g, "").length < 8) {
        setError("Informe um telefone válido.");
        return;
      }
    }
    setError("");
    setBooking(true);
    try {
      const iso = new Date(`${date}T${selectedSlot}:00`).toISOString();
      const body: {
        serviceId: string;
        barberId?: string;
        date: string;
        guestName?: string;
        guestPhone?: string;
      } = {
        serviceId: selectedService,
        date: iso,
        ...(selectedBarber ? { barberId: selectedBarber } : {}),
      };
      if (!user) {
        const name = guestName.trim();
        const phone = guestPhone.trim();
        body.guestName = name;
        body.guestPhone = phone;
        await saveGuest(name, phone);
      }
      await api.post("/bookings", body);
      navigation.navigate("Main", { screen: "Bookings" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao agendar.");
      setBooking(false);
    }
  }

  const goNext = () => {
    setError("");
    if (step === "service" && selectedService) setStep(needsBarber ? "barber" : "date");
    else if (step === "barber" && selectedBarber) setStep("date");
    else if (step === "date" && date) setStep("time");
    else if (step === "time" && selectedSlot) setStep("details");
    else if (step === "details") void handleBook();
  };

  if (loading || !step) return <Loading />;
  if (!shop) return <View style={styles.screen}><Text style={styles.muted}>{loadError || "Barbearia não encontrada."}</Text></View>;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <BackButton onPress={goBack} />
        <Text style={styles.heading}>Agendar</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.steps}>
        {labels.map((label, index) => {
          const number = index + 1;
          const state = number < current ? "done" : number === current ? "current" : "todo";
          return (
            <Pressable
              key={label}
              disabled={number > current}
              onPress={() => {
                if (number < current) {
                  setError("");
                  setStep(order[index]);
                }
              }}
              style={styles.step}
            >
              <View style={styles.stepLine}>
                {index > 0 && <View style={[styles.connector, number <= current && styles.connectorOn]} />}
                <View style={[styles.dot, state !== "todo" && styles.dotOn]}>
                  <Text style={[styles.dotText, state !== "todo" && styles.dotTextOn]}>
                    {state === "done" ? "✓" : number}
                  </Text>
                </View>
              </View>
              <Text style={[styles.stepLabel, state === "current" && styles.stepLabelOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {error ? <AlertBox kind="error">{error}</AlertBox> : null}

        {step === "service" &&
          shop.services.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              style={[styles.pick, item.id === selectedService && styles.pickOn]}
              onPress={() => {
                setSelectedService(item.id);
                setSelectedBarber("");
                setDate("");
                setSelectedSlot("");
                setError("");
              }}
            >
              <Thumb src={item.imageUrl} label={item.name} />
              <View style={styles.pickCopy}>
                <Text style={styles.pickName}>{item.name}</Text>
                {item.description ? <Text style={styles.pickDesc}>{item.description}</Text> : null}
                <Text style={styles.pickMeta}>
                  {formatMoney(item.price)} · {item.durationMinutes} min
                </Text>
              </View>
              <View style={[styles.radio, item.id === selectedService && styles.radioOn]} />
            </Pressable>
          ))}

        {step === "barber" &&
          shop.barbers.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              style={[styles.pick, item.id === selectedBarber && styles.pickOn]}
              onPress={() => {
                setSelectedBarber(item.id);
                setDate("");
                setSelectedSlot("");
                setError("");
              }}
            >
              <Thumb src={item.imageUrl} label={item.name} round />
              <View style={styles.pickCopy}>
                <Text style={styles.pickName}>{item.name}</Text>
                <Text style={styles.pickDesc}>{item.title}</Text>
              </View>
              <View style={[styles.radio, item.id === selectedBarber && styles.radioOn]} />
            </Pressable>
          ))}

        {step === "date" && (
          <MonthCalendar
            value={date}
            minIso={minDate}
            onChange={(next) => {
              setDate(next);
              setSelectedSlot("");
              setError("");
            }}
          />
        )}

        {step === "time" && (
          <>
            <Text style={styles.context}>
              {[service?.name, barber?.name, date ? prettyDate(date) : ""].filter(Boolean).join(" · ")}
            </Text>
            <Text style={styles.section}>Horários disponíveis</Text>
            {slotsLoading ? (
              <Text style={styles.muted}>Buscando horários...</Text>
            ) : slots.length === 0 ? (
              <Text style={styles.muted}>Nenhum horário nesta data.</Text>
            ) : (
              <View style={styles.slots}>
                {slots.map((slot) => (
                  <Pressable
                    key={slot}
                    accessibilityRole="button"
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.slot, selectedSlot === slot && styles.slotOn]}
                  >
                    <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextOn]}>{slot}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        {step === "details" && service && (
          <>
            <View style={styles.summary}>
              <Thumb src={service.imageUrl} label={service.name} />
              <View style={styles.pickCopy}>
                <Text style={styles.pickName}>{service.name}</Text>
                <Text style={styles.pickDesc}>
                  {[barber?.name, prettyDate(date), selectedSlot].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Text style={styles.price}>{formatMoney(service.price)}</Text>
            </View>
            {!user && (
              <>
                <Text style={styles.section}>Nome</Text>
                <TextInput
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholder="Seu nome"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
                <Text style={styles.section}>Telefone</Text>
                <TextInput
                  value={guestPhone}
                  onChangeText={setGuestPhone}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor={colors.faint}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          accessibilityRole="button"
          disabled={!canContinue || booking}
          onPress={goNext}
          style={[styles.next, (!canContinue || booking) && styles.nextOff]}
        >
          <Text style={styles.nextText}>
            {booking ? "Agendando..." : step === "details" ? "Confirmar" : "Próximo"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MonthCalendar({
  value,
  minIso,
  onChange,
}: {
  value: string;
  minIso: string;
  onChange: (iso: string) => void;
}) {
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [cursor, setCursor] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = new Date();
  const cursorKey = year * 12 + month;
  const minKey = today.getFullYear() * 12 + today.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const offset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  const isoFor = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <View>
      <View style={styles.calHead}>
        <Pressable
          accessibilityLabel="Mês anterior"
          disabled={cursorKey <= minKey}
          onPress={() => setCursor(new Date(year, month - 1, 1))}
        >
          <Text style={[styles.calNav, cursorKey <= minKey && styles.calNavOff]}>‹</Text>
        </Pressable>
        <Text style={styles.calTitle}>{monthLabel(year, month)}</Text>
        <Pressable
          accessibilityLabel="Próximo mês"
          disabled={cursorKey >= minKey + 11}
          onPress={() => setCursor(new Date(year, month + 1, 1))}
        >
          <Text style={[styles.calNav, cursorKey >= minKey + 11 && styles.calNavOff]}>›</Text>
        </Pressable>
      </View>
      <View style={styles.calGrid}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.dow}>
            {day}
          </Text>
        ))}
        {cells.map((day, index) => {
          if (!day) return <View key={`e-${index}`} style={styles.dayCell} />;
          const iso = isoFor(day);
          const disabled = iso < minIso;
          const selected = iso === value;
          const isToday = iso === minIso;
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={String(day)}
              disabled={disabled}
              onPress={() => onChange(iso)}
              style={[styles.dayCell, selected && styles.dayOn, isToday && !selected && styles.dayToday]}
            >
              <Text style={[styles.dayText, disabled && styles.dayOff, selected && styles.dayTextOn]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  heading: { flex: 1, textAlign: "center", fontFamily: font.extra, fontSize: 18, color: colors.text },
  topSpacer: { width: 40 },
  steps: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 8 },
  step: { flex: 1, alignItems: "center" },
  stepLine: { height: 28, justifyContent: "center", alignItems: "center", width: "100%" },
  connector: {
    position: "absolute",
    left: 0,
    right: "50%",
    height: 2,
    backgroundColor: "#d9ddd6",
    top: 13,
  },
  connectorOn: { backgroundColor: colors.primary },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e6e8e3",
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { backgroundColor: colors.primary },
  dotText: { fontFamily: font.bold, fontSize: 12, color: colors.muted },
  dotTextOn: { color: colors.white },
  stepLabel: { marginTop: 4, fontSize: 10, color: colors.faint, fontFamily: font.semibold },
  stepLabelOn: { color: colors.primary },
  body: { padding: 16, paddingBottom: 24 },
  pick: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickOn: { borderColor: colors.primary },
  pickCopy: { flex: 1 },
  pickName: { fontFamily: font.bold, color: colors.text },
  pickDesc: { color: colors.muted, fontFamily: font.regular, marginTop: 2 },
  pickMeta: { color: colors.primary, fontFamily: font.semibold, marginTop: 4 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#c9cdc6" },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  context: { color: colors.muted, fontFamily: font.semibold, marginBottom: 12 },
  section: { fontFamily: font.semibold, color: colors.muted, marginBottom: 8 },
  muted: { color: colors.muted, fontFamily: font.regular },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    minWidth: 76,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  slotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontFamily: font.bold, color: colors.text },
  slotTextOn: { color: colors.white },
  summary: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  price: { fontFamily: font.bold, color: colors.text },
  input: {
    backgroundColor: colors.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: font.regular,
    color: colors.text,
    marginBottom: 12,
  },
  footer: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: colors.bg },
  next: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  nextOff: { opacity: 0.45 },
  nextText: { color: colors.white, fontFamily: font.bold, fontSize: 16 },
  calHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  calTitle: { fontFamily: font.extra, fontSize: 16, color: colors.text },
  calNav: { fontSize: 28, color: colors.text, paddingHorizontal: 8 },
  calNavOff: { color: "#c9cdc6" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  dow: { width: "14.28%", textAlign: "center", color: colors.faint, fontFamily: font.semibold, fontSize: 12, marginBottom: 6 },
  dayCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  dayOn: { backgroundColor: colors.primary },
  dayToday: { borderWidth: 1, borderColor: colors.primary },
  dayText: { fontFamily: font.semibold, color: colors.text },
  dayOff: { color: "#c5c9c2" },
  dayTextOn: { color: colors.white },
});
