export const getAuthToken = (): string => {
  const token = localStorage.getItem("auth_token");
  return token || "";
}; 