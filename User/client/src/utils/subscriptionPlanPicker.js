/** True when admin/portal plan line ends with expired (subscription_expired, Trial_expired). */
export function isPlanStatusExpired(planStatus) {
  return String(planStatus || "")
    .trim()
    .toLowerCase()
    .includes("expired");
}

/** Active paid subscription (not trial, not expired). */
export function isActivePaidSubscription(planStatus, subscription) {
  if (isPlanStatusExpired(planStatus)) return false;
  const sub = String(subscription || "")
    .trim()
    .toLowerCase();
  if (!sub || sub === "trial" || sub.startsWith("trial_") || sub.startsWith("trial ") || sub.startsWith("trial-")) {
    return false;
  }
  return true;
}

/** @returns {'renew' | 'upgrade'} */
export function resolvePickerMode({ planStatus, subscription, mode: modeFromState }) {
  if (modeFromState === "renew" || modeFromState === "upgrade") return modeFromState;
  if (isPlanStatusExpired(planStatus)) return "renew";
  if (isActivePaidSubscription(planStatus, subscription)) return "upgrade";
  return "upgrade";
}

function normalizePlanName(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

function sortPlans(plans) {
  return [...plans].sort(
    (a, b) =>
      (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
      Number(a.id) - Number(b.id),
  );
}

function findPlanByName(plans, subscriptionName) {
  const key = normalizePlanName(subscriptionName);
  if (!key) return null;
  return plans.find((p) => normalizePlanName(p.name) === key) ?? null;
}

/** Renew: all active plans. Upgrade: only tiers above current (trial / unknown name → all plans). */
export function filterPlansForPicker(plans, mode, currentPlanName) {
  const sorted = sortPlans(Array.isArray(plans) ? plans : []);
  if (mode === "renew") return sorted;

  const current = findPlanByName(sorted, currentPlanName);
  if (!current) return sorted;

  const minOrder = Number(current.sortOrder) || 0;
  const minPrice = Number(current.price);

  return sorted.filter((p) => {
    if (Number(p.id) === Number(current.id)) return false;
    const order = Number(p.sortOrder) || 0;
    if (order > minOrder) return true;
    if (order === minOrder && Number.isFinite(minPrice) && Number(p.price) > minPrice) return true;
    return false;
  });
}

export function pickerCopy(mode) {
  if (mode === "renew") {
    return {
      title: "Renew your subscription",
      description:
        "Your subscription has expired. Choose any plan below to renew and restore your portal access.",
      emptyTitle: "No subscription plans available",
      continueLabel: "Continue to payment",
    };
  }
  return {
    title: "Upgrade your plan",
    description:
      "Choose a higher plan to add more storage and extend your subscription. Plans at or below your current tier are hidden.",
    emptyTitle: "No higher plans available",
    emptyHint: "You are already on the highest plan we offer. Contact support if you need more capacity.",
    continueLabel: "Continue to payment",
  };
}

export function planPickerLinkLabel(planStatus, subscription) {
  return resolvePickerMode({ planStatus, subscription }) === "renew"
    ? "Renew subscription"
    : "Upgrade plan";
}

export function buildPlanPickerNavState(portal) {
  const planStatus = portal?.planStatus ?? portal?.subscription ?? "";
  const subscription = portal?.subscription ?? "";
  const mode = resolvePickerMode({ planStatus, subscription });
  return {
    mode,
    planStatus,
    currentPlanName: subscription,
  };
}
