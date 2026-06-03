import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";

import { PRO_ENTITLEMENT_ID, REVENUECAT_API_KEY } from "@/config";

/**
 * Wraps RevenueCat. RevenueCat sits in front of App Store (StoreKit) and Play
 * Billing, so a single `isPro` flag works cross-platform and the "restore
 * purchases" / family-sharing / receipt-validation plumbing is handled for us.
 *
 * `isPro` is derived from the `pro` entitlement, which in the RevenueCat
 * dashboard is attached to BOTH the auto-renewing subscription products and
 * the one-time lifetime product. That is how "subscription + lifetime option"
 * collapses into one access check.
 */
interface PurchasesState {
  ready: boolean;
  isPro: boolean;
  offering: PurchasesOffering | null;
  purchasing: boolean;
  /** Purchase a package; resolves true if the user is Pro afterwards. */
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesState | null>(null);

function hasPro(info: CustomerInfo | null | undefined): boolean {
  return Boolean(info?.entitlements.active[PRO_ENTITLEMENT_ID]);
}

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setIsPro(hasPro(info));
      const offerings = await Purchases.getOfferings();
      setOffering(offerings.current ?? null);
    } catch (err) {
      // Offline or store unavailable — fail closed (treated as free) but don't crash.
      console.warn("[purchases] refresh failed", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.startsWith("REPLACE")) {
          // No key configured yet (e.g. running in Expo Go) — run in free mode.
          console.warn("[purchases] no RevenueCat key configured; running free-only");
          if (mounted) setReady(true);
          return;
        }
        if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        Purchases.addCustomerInfoUpdateListener((info) => setIsPro(hasPro(info)));
        await refresh();
      } catch (err) {
        console.warn("[purchases] configure failed", err);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const pro = hasPro(customerInfo);
      setIsPro(pro);
      return pro;
    } catch (err: unknown) {
      const e = err as { userCancelled?: boolean };
      if (!e?.userCancelled) console.warn("[purchases] purchase failed", err);
      return false;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setPurchasing(true);
    try {
      const info = await Purchases.restorePurchases();
      const pro = hasPro(info);
      setIsPro(pro);
      return pro;
    } catch (err) {
      console.warn("[purchases] restore failed", err);
      return false;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const value = useMemo<PurchasesState>(
    () => ({ ready, isPro, offering, purchasing, purchase, restore, refresh }),
    [ready, isPro, offering, purchasing, purchase, restore, refresh],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): PurchasesState {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error("usePurchases must be used within a PurchasesProvider");
  return ctx;
}

/** Convenience: true when the lesson is readable for the current user. */
export function useIsUnlocked(lessonIsFree: boolean): boolean {
  const { isPro } = usePurchases();
  return lessonIsFree || isPro;
}
