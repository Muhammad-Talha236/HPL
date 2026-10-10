import { Navigate } from "react-router-dom";

// Safe compatibility target for old bookmarks. Editing lives in the single
// account-profile dialog, where profile images use verified media uploads.
export default function ProfileEditPage() {
  return <Navigate to="/account" replace />;
}
