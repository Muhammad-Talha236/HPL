import api from "../../../services/apiClient";
const data = response => response.data.data;
export const listApplications = async params => data(await api.get("/registrations/submissions", { params }));
export const getApplication = async id => data(await api.get(`/registrations/submissions/${id}`));
export const saveApplication = async (body, id) => data(await (id ? api.put(`/registrations/submissions/${id}`, body) : api.post("/registrations/submissions", body)));
export const reviewApplication = async (id, action, reason, payment = false) => data(await api.post(`/registrations/submissions/${id}/${payment ? "payment-review" : "review"}`, { action, reason }));
export const receiptDownload = async id => data(await api.get(`/registrations/receipts/${id}`));
export const listAccounts = async () => data(await api.get("/admin/payment-accounts"));
export const saveAccount = async (body, id) => data(await (id ? api.put(`/admin/payment-accounts/${id}`, body) : api.post("/admin/payment-accounts", body)));
export const manageCompetitions = async id => data(await api.get(`/competitions/management${id ? `/${id}` : ""}`));
export const saveCompetition = async (body, id) => data(await (id ? api.patch(`/competitions/${id}`, body) : api.post("/competitions", body)));
export const competitionAction = async (id, action) => data(await api.post(`/competitions/${id}/${action}`, {}));
export const uploadFile = async (file, receipt = false) => {
  if (file.size > 5 * 1024 * 1024) throw new Error("Choose a file no larger than 5 MB.");
  if (!(receipt ? ["image/jpeg", "image/png", "application/pdf"] : ["image/jpeg", "image/png"]).includes(file.type)) throw new Error(receipt ? "Choose a JPG, PNG or PDF." : "Choose a JPG or PNG.");
  const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); });
  return data(await api.post(`/registrations/${receipt ? "receipt-upload" : "image-upload"}`, { base64 }));
};
export const requestMessage = error => error.response?.data?.message || error.message || "Please try again.";

export const releaseRegistrationName = async (id, reason) => data(await api.post(`/registrations/submissions/${id}/release-name`, { reason }));
