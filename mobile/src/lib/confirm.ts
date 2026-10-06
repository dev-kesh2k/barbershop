import { Alert, Platform } from "react-native";

export function confirm(message: string): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => {
    Alert.alert("Confirmar", message, [
      { text: "Não", style: "cancel", onPress: () => resolve(false) },
      { text: "Sim", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
