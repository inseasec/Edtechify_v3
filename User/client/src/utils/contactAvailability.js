import api from "../api";

export async function ensureContactAvailable(userId, params) {
  if (userId == null) return;
  const { data } = await api.get("/users/availability", {
    params: { excludeUserId: userId, ...params },
  });
  if (!data?.available) {
    const message =
      (typeof data?.message === "string" && data.message.trim()) ||
      (params.email ? "Email not available for use." : "Mobile number not available for use.");
    throw Object.assign(new Error(message), { fieldMessage: message });
  }
}
