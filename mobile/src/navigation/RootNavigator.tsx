import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme, type LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";
import BookScreen from "../screens/BookScreen";
import BookingsScreen from "../screens/BookingsScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ServicesScreen from "../screens/ServicesScreen";
import AdminBarbersScreen from "../screens/admin/BarbersScreen";
import DashboardScreen from "../screens/admin/DashboardScreen";
import AdminScheduleScreen from "../screens/admin/ScheduleScreen";
import AdminServicesScreen from "../screens/admin/ServicesScreen";
import AdminSettingsScreen from "../screens/admin/SettingsScreen";
import { colors, font } from "../theme";
import type { AdminTabParamList, CustomerTabParamList, RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const CustomerTabs = createBottomTabNavigator<CustomerTabParamList>();
const AdminTabs = createBottomTabNavigator<AdminTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg },
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: Platform.OS === "web" ? [window.location.origin] : ["brutusbarber://"],
  config: {
    screens: {
      Main: {
        screens: {
          Home: "",
          Bookings: "agenda",
          AdminHome: "admin",
          AdminSchedule: "admin/agenda",
          Profile: "admin/perfil",
        },
      },
      Book: "agendar",
      Services: "servicos",
      Login: "entrar",
      Profile: "perfil",
      AdminServices: "admin/servicos",
      AdminBarbers: "admin/barbeiros",
      AdminSettings: "admin/config",
    },
  },
};

const screenTitle: Record<string, string> = {
  Main: "Brutus Barber",
  Book: "Agendar",
  Services: "Serviços",
  Login: "Entrar",
  Profile: "Perfil",
  AdminServices: "Serviços",
  AdminBarbers: "Barbeiros",
  AdminSettings: "Configurações",
};

function PillBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.barWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const icon = options.tabBarIcon?.({ focused, color: focused ? colors.primary : colors.faint, size: 22 });
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={[styles.item, focused && styles.itemOn]}
            >
              {icon}
              <Text style={[styles.itemLabel, focused && styles.itemLabelOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CustomerMain() {
  return (
    <CustomerTabs.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <PillBar {...props} />}>
      <CustomerTabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Agendar",
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} />,
        }}
      />
      <CustomerTabs.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
    </CustomerTabs.Navigator>
  );
}

function AdminMain() {
  return (
    <AdminTabs.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <PillBar {...props} />}>
      <AdminTabs.Screen
        name="AdminHome"
        component={DashboardScreen}
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
      <AdminTabs.Screen
        name="AdminSchedule"
        component={AdminScheduleScreen}
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
      <AdminTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </AdminTabs.Navigator>
  );
}

function Main() {
  const { user } = useAuth();
  return user?.role === "BARBER_ADMIN" ? <AdminMain /> : <CustomerMain />;
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function RootNavigator() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [adminSurface, setAdminSurface] = useState(
    () => Platform.OS === "web" && isAdminPath(window.location.pathname),
  );
  const wide = Platform.OS === "web" && width >= 768 && adminSurface;
  return (
    <View style={styles.shell}>
    <View style={[styles.column, wide && styles.columnWide]}>
    <NavigationContainer
      theme={navTheme}
      linking={linking}
      documentTitle={{
        enabled: Platform.OS === "web",
        formatter: (options, route) => screenTitle[route?.name ?? ""] || options?.title || "Brutus Barber",
      }}
      onStateChange={() => {
        if (Platform.OS === "web") setAdminSurface(isAdminPath(window.location.pathname));
      }}
    >
      <Stack.Navigator
        key={user?.role === "BARBER_ADMIN" ? "admin" : "customer"}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
      >
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="Book" component={BookScreen} />
        <Stack.Screen name="Services" component={ServicesScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AdminServices" component={AdminServicesScreen} />
        <Stack.Screen name="AdminBarbers" component={AdminBarbersScreen} />
        <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, alignItems: "center" },
  column: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 1120 : undefined,
    backgroundColor: colors.bg,
  },
  columnWide: { maxWidth: 1120 },
  barWrap: {
    position: Platform.OS === "web" ? ("fixed" as "absolute") : "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 999,
    padding: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: "#eceee8",
    width: "88%",
    maxWidth: 420,
    shadowColor: "#162016",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 999, paddingVertical: 8, gap: 2 },
  itemOn: { backgroundColor: colors.primarySoft },
  itemLabel: { fontFamily: font.semibold, fontSize: 11, color: colors.faint },
  itemLabelOn: { color: colors.primary },
});
