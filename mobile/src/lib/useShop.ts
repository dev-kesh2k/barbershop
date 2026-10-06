import { useEffect, useState } from "react";
import { api, type Barber, type Barbershop, type Service } from "./api";

export type ShopWithServices = Barbershop & { services: Service[]; barbers: Barber[] };

export function useShop() {
  const [shop, setShop] = useState<ShopWithServices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.get<{ barbershops: Barbershop[] }>("/barbershops");
        const id = list.barbershops[0]?.id;
        if (!id) {
          if (!cancelled) setError("Barbearia não encontrada.");
          return;
        }
        const data = await api.get<{ barbershop: ShopWithServices }>(`/barbershops/${id}`);
        if (!cancelled) setShop(data.barbershop);
      } catch {
        if (!cancelled) setError("Não foi possível carregar a barbearia.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { shop, loading, error };
}
