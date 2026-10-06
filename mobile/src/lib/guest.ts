import AsyncStorage from "@react-native-async-storage/async-storage";

const NAME_KEY = "barbershop_guest_name";
const PHONE_KEY = "barbershop_guest_phone";

export async function loadGuest() {
  const pairs = await AsyncStorage.multiGet([NAME_KEY, PHONE_KEY]);
  return {
    name: pairs[0]?.[1] ?? "",
    phone: pairs[1]?.[1] ?? "",
  };
}

export async function saveGuest(name: string, phone: string) {
  await AsyncStorage.multiSet([
    [NAME_KEY, name],
    [PHONE_KEY, phone],
  ]);
}

export async function loadGuestPhone() {
  return (await AsyncStorage.getItem(PHONE_KEY)) ?? "";
}

export async function saveGuestPhone(phone: string) {
  await AsyncStorage.setItem(PHONE_KEY, phone);
}
