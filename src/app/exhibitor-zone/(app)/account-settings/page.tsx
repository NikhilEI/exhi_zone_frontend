"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../_lib/apiClient";
import { useSession } from "../../_lib/SessionProvider";

export default function AccountSettingsPage() {
  const { user, refresh } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    // Seeds editable local state once the session's user arrives (it loads
    // asynchronously via SessionProvider, so it isn't available for a lazy
    // useState initializer on first render).
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setSavingProfile(true);
    try {
      await api.patch("/auth/me", { firstName, lastName, phone: phone || undefined });
      await refresh();
      setProfileMessage("Account details updated.");
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Failed to update account.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    setSavingPassword(true);
    try {
      await api.post("/auth/password/change", { currentPassword, newPassword });
      setPasswordMessage("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Account Settings</h1>
        <p className="content-subtitle">Manage your personal details and account password</p>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Profile</span>
          </div>
          <div className="card-body">
            {profileMessage && <div className="alert alert-success mb-3">{profileMessage}</div>}
            {profileError && <div className="alert alert-danger mb-3">{profileError}</div>}

            <form noValidate onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" value={user?.email || ""} disabled />
                <p className="form-text">Email cannot be changed here.</p>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Change Password</span>
          </div>
          <div className="card-body">
            {passwordMessage && <div className="alert alert-success mb-3">{passwordMessage}</div>}
            {passwordError && <div className="alert alert-danger mb-3">{passwordError}</div>}

            <form noValidate onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
