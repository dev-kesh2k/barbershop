import type { NavigatorScreenParams } from "@react-navigation/native";

export type CustomerTabParamList = {
  Home: undefined;
  Bookings: undefined;
};

export type AdminTabParamList = {
  AdminHome: undefined;
  AdminSchedule: undefined;
  Profile: undefined;
};

export type MainTabParamList = CustomerTabParamList & AdminTabParamList;

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Book: { serviceId?: string } | undefined;
  Services: undefined;
  Login: undefined;
  Profile: undefined;
  AdminServices: undefined;
  AdminBarbers: undefined;
  AdminSettings: undefined;
};
