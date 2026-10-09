import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, ChevronDown } from "lucide-react";
import { getProfile, getVenues, updateProfile, fieldErrors } from "../api/profile";


function Field({ label, error, helper, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-[10px]">
        <label className="text-[12px] leading-[13px] font-semibold text-white">
          {label}
        </label>
        {children}
      </div>
      {error ? (
        <p className="text-[12px] leading-[13px] font-semibold text-[#EC3013]">{error}</p>
      ) : helper ? (
        <p className="text-[12px] leading-[13px] font-semibold text-[#A9A9A9]">{helper}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "h-10 w-full rounded-xl bg-[#1E2031] px-4 text-[12px] font-semibold text-white placeholder:text-[#A9A9A9] outline-none border border-transparent focus:border-white/30";

export default function Profile() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "tickets" ? "tickets" : "info";

  const [profile, setProfile] = useState(null);
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    dateOfBirth: "",
    preferredVenueId: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([getProfile(), getVenues()])
      .then(([p, v]) => {
        if (!alive) return;
        setProfile(p);
        setVenues(v);
        setForm({
          fullName: p.fullName,
          mobileNumber: p.mobileNumber,
          dateOfBirth: p.dateOfBirth,
          preferredVenueId: p.preferredVenueId ? String(p.preferredVenueId) : "",
        });
      })
      .catch((e) => alive && setMessage(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
    setSaved(false);
  };

  async function handleSave() {
    setSaving(true);
    setErrors({});
    setMessage("");
    setSaved(false);
    try {
      const p = await updateProfile({
        ...form,
        preferredVenueId: form.preferredVenueId || null,
      });
      setProfile(p);
      setForm((f) => ({ ...f, mobileNumber: p.mobileNumber, dateOfBirth: p.dateOfBirth }));
      setSaved(true);
      // TODO: refresh the auth user here so the Navbar dot updates (profileComplete).
    } catch (err) {
      if (err.status === 422) {
        const fe = fieldErrors(err);
        setErrors(fe);
        if (!Object.keys(fe).length) setMessage(err.message);
      } else {
        // TODO 401: open the login modal and replay the action.
        setMessage(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const incomplete = profile && !profile.profileComplete;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1728px] px-[51px] pb-24 pt-[117px] text-white">
      {/* Header + tabs */}
      <div className="flex flex-col gap-7 border-b border-[#1E2031]">
        <h1 className="text-[24px] leading-[26px] font-extrabold">My Profile</h1>

        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setParams({})}
            className="flex flex-col gap-[14px] text-left"
          >
            <span className="flex items-center gap-2 px-[2px]">
              <span
                className={`text-[14px] leading-[15px] font-semibold ${
                  tab === "info" ? "text-white" : "text-[#A9A9A9]"
                }`}
              >
                Personal info
              </span>
              {incomplete && <span className="h-2 w-2 bg-[#F5B83D]" />}
            </span>
            <span
              className={`h-[2px] w-full rounded-t-sm ${
                tab === "info" ? "bg-[#EC3013]" : "bg-transparent"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setParams({ tab: "tickets" })}
            className="flex flex-col gap-[14px] text-left"
          >
            <span className="flex items-center gap-2 px-[2px]">
              <span
                className={`text-[14px] leading-[15px] font-semibold ${
                  tab === "tickets" ? "text-white" : "text-[#A9A9A9]"
                }`}
              >
                My Tickets
              </span>
            </span>
            <span
              className={`h-[2px] w-full rounded-t-sm ${
                tab === "tickets" ? "bg-[#EC3013]" : "bg-transparent"
              }`}
            />
          </button>
        </div>
      </div>

      {tab === "tickets" ? (
        <p className="mt-10 text-[14px] text-[#A9A9A9]">Tickets are coming in the next step.</p>
      ) : (
        <div className="mt-10 flex w-full max-w-[880px] flex-col gap-9">
          {incomplete && (
            <div className="rounded-xl border border-[#F5B83D] bg-[#F5B83D]/10 px-4 py-3 text-[12px] font-semibold text-[#F5B83D]">
              Complete your profile (full name, mobile number and date of birth) to book tickets.
            </div>
          )}

          {profile?.age != null && profile.dateOfBirth && (
            <p className="text-[12px] font-semibold text-[#A9A9A9]">
              {profile.age >= 18
                ? `You are ${profile.age}, you can buy tickets for all age ratings`
                : `You are ${profile.age}`}
            </p>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Field label="Full name" error={errors.fullName}>
                <input
                  className={`${inputBase} ${errors.fullName ? "border-[#EC3013]" : ""}`}
                  value={form.fullName}
                  onChange={set("fullName")}
                  disabled={loading}
                  placeholder="Jane Dolidze"
                />
              </Field>

              <Field
                label="Email"
                helper="Email is set at registration and cannot be changed here."
              >
                <input
                  className={`${inputBase} cursor-not-allowed text-[#A9A9A9]`}
                  value={profile?.email || ""}
                  readOnly
                  disabled
                />
              </Field>
            </div>

            <div className="flex flex-col gap-5">
              <Field label="Mobile number" error={errors.mobileNumber}>
                <input
                  className={`${inputBase} ${errors.mobileNumber ? "border-[#EC3013]" : ""}`}
                  value={form.mobileNumber}
                  onChange={set("mobileNumber")}
                  disabled={loading}
                  inputMode="numeric"
                  placeholder="599 123 456"
                />
              </Field>

              <Field label="Date of birth" error={errors.dateOfBirth}>
                <div className="relative">
                  <input
                    type="date"
                    className={`${inputBase} [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                      errors.dateOfBirth ? "border-[#EC3013]" : ""
                    }`}
                    value={form.dateOfBirth}
                    onChange={set("dateOfBirth")}
                    disabled={loading}
                  />
                  <Calendar
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white"
                  />
                </div>
              </Field>

              <Field label="Preferred venue (optional)" error={errors.preferredVenueId}>
                <div className="relative">
                  <select
                    className={`${inputBase} appearance-none pr-10`}
                    value={form.preferredVenueId}
                    onChange={set("preferredVenueId")}
                    disabled={loading || venues.length === 0}
                  >
                    <option value="">Select a venue</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                        {v.city ? `, ${v.city}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white"
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
              className="flex h-[41px] w-[143px] items-center justify-center rounded-full bg-[#EC3013] text-[14px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#505261] disabled:text-[#A9A9A9]"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && <span className="text-[12px] font-semibold text-[#A9A9A9]">Profile saved</span>}
            {message && <span className="text-[12px] font-semibold text-[#EC3013]">{message}</span>}
          </div>
        </div>
      )}
    </main>
  );
}