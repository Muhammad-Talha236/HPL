import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import apiClient from "../../../services/apiClient";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true, success: false, message: "" });
  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState({ loading: false, success: false, message: "This verification link is invalid or expired." });
      return undefined;
    }
    apiClient.get("/auth/verify-email", { params: { token } })
      .then((response) => setState({ loading: false, success: true, message: response.data.message }))
      .catch((error) => setState({ loading: false, success: false, message: error.response?.data?.message || "This verification link is invalid or expired." }));
    return undefined;
  }, [params]);
  return <main className="grid min-h-screen place-items-center bg-[#f4f7fb] px-4"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">{state.loading ? <Loader2 className="mx-auto animate-spin text-[#0B5D46]" size={34}/> : <CheckCircle2 className={`mx-auto ${state.success ? "text-[#0B5D46]" : "text-red-500"}`} size={42}/>}<h1 className="mt-4 text-2xl font-extrabold text-[#10213f]">{state.loading ? "Verifying your email..." : state.success ? "Email verified" : "Verification unavailable"}</h1>{!state.loading && <p className="mt-3 text-sm leading-6 text-slate-600">{state.message}</p>} {!state.loading && <Link to="/account" className="mt-6 inline-flex rounded-lg bg-[#0B5D46] px-4 py-2.5 text-sm font-bold text-white">Continue to account</Link>}</section></main>;
}
