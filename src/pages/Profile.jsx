import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, ChevronDown } from "lucide-react";
import { getProfile, getVenues, updateProfile, fieldErrors } from "../api/profile";
import { useAuth } from "../context/AuthContext";
import MyTickets from "../components/MyTickets";


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

const EMPTY = { fullName: "", mobileNumber: "", dateOfBirth: "", preferredVenueId: "" };

// Messages are the exact strings from the brief.
function validate(f) {
  const e = {};

  const name = f.fullName.trim();
  if (!name) e.fullName = "Name is required";
  else if (name.length < 3) e.fullName = "Name must be at least 3 characters";
  else if (name.length > 50) e.fullName = "Name must not exceed 50 characters";

  const mobile = f.mobileNumber.replace(/\s/g, "");
  if (!mobile) e.mobileNumber = "Mobile number is required";
  else if (!/^\d+$/.test(mobile))
    e.mobileNumber = "Please enter a valid Georgian mobile number (9 digits starting with 5)";
  else if (mobile[0] !== "5") e.mobileNumber = "Georgian mobile numbers must start with 5";
  else if (mobile.length !== 9) e.mobileNumber = "Mobile number must be exactly 9 digits";

  if (!f.dateOfBirth) e.dateOfBirth = "Date of birth is required";
  else {
    const dob = new Date(f.dateOfBirth);
    const today = new Date();
    if (Number.isNaN(dob.getTime()) || dob > today) {
      e.dateOfBirth = "Please enter a valid date of birth";
    } else {
      const min = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
      if (dob > min) e.dateOfBirth = "You must be at least 12 years old to create an account";
    }
  }

  return e;
}

function ageNotice(age) {
  if (age == null) return "";
  if (age >= 18) return `You are ${age}, you can buy tickets for all age ratings`;
  if (age >= 16) return `You are ${age}, you cannot buy tickets for 18+ titles`;
  return `You are ${age}, you cannot buy tickets for 16+ or 18+ titles`;
}

export default function Profile() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "tickets" ? "tickets" : "info";

  const [profile, setProfile] = useState(null);
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const { refreshUser, requireAuth, loading: authLoading, user } = useAuth();

  function applyProfile(p) {
    const next = {
      fullName: p.fullName,
      mobileNumber: p.mobileNumber,
      dateOfBirth: p.dateOfBirth,
      preferredVenueId: p.preferredVenueId ? String(p.preferredVenueId) : "",
    };
    setProfile(p);
    setForm(next);
    setInitial(next);
  }

  useEffect(() => {
    let alive = true;
    Promise.all([getProfile(), getVenues()])
      .then(([p, v]) => {
        if (!alive) return;
        setVenues(v);
        applyProfile(p);
      })
      .catch((e) => {
        if (!alive) return;
        // TODO 401: drop the stale token and open the login modal.
        setMessage(
          e.status === 401 ? "Please log in to view your profile." : e.message
        );
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
  if (!authLoading && !user) requireAuth(() => window.location.reload());
}, [authLoading, user]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setServerErrors((er) => ({ ...er, [key]: undefined }));
    setSaved(false);
  };
  const blur = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  const clientErrors = validate(form);
  const isValid = Object.keys(clientErrors).length === 0;
  const isDirty = Object.keys(EMPTY).some((k) => form[k] !== initial[k]);

  // Server message wins; client message only after the field was touched.
  const err = (key) => serverErrors[key] || (touched[key] ? clientErrors[key] : undefined);

  async function handleSave() {
    if (!isValid || !isDirty) return;
    setSaving(true);
    setServerErrors({});
    setMessage("");
    setSaved(false);
    try {
      const p = await updateProfile({
        ...form,
        preferredVenueId: form.preferredVenueId || null,
      });
      applyProfile(p);
      setSaved(true);
      // TODO: refresh the auth user so the Navbar indicator updates (profileComplete).
    } catch (e) {
      if (e.status === 422) {
        const fe = fieldErrors(e);
        setServerErrors(fe);
        if (!Object.keys(fe).length) setMessage(e.message);
      } else {
        // TODO 401: open the login modal and replay the action.
        setMessage(e.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const loaded = Boolean(profile);
  const incomplete = loaded && !profile.profileComplete;
  const complete = loaded && profile.profileComplete;
  const canSave = isValid && isDirty && !saving && !loading && loaded;

  return (
    <main className="mx-auto min-h-[calc(100vh-98px)] w-full max-w-[1728px] px-[51px] pb-24 pt-[117px] text-white">
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
          <MyTickets />
      ) : (
        <div className="mt-10 flex w-full max-w-[880px] flex-col gap-9">
          {incomplete && (
            <div className="rounded-xl border border-[#F5B83D] bg-[#F5B83D]/10 px-4 py-3 text-[12px] font-semibold text-[#F5B83D]">
              Please complete your profile to enable booking.
            </div>
          )}

          {complete && (
            <p className="text-[12px] font-semibold text-[#2FBF71]">Profile Complete ✓</p>
          )}

          {loaded && profile.dateOfBirth && profile.age != null && (
            <p className="text-[12px] font-semibold text-[#A9A9A9]">{ageNotice(profile.age)}</p>
          )}

          {!loaded && message && (
            <p className="text-[12px] font-semibold text-[#EC3013]">{message}</p>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-[18px]">
              <Field label="Full name" error={err("fullName")}>
                <input
                  className={`${inputBase} ${err("fullName") ? "border-[#EC3013]" : ""}`}
                  value={form.fullName}
                  onChange={set("fullName")}
                  onBlur={blur("fullName")}
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
              <Field label="Mobile number" error={err("mobileNumber")}>
                <input
                  className={`${inputBase} ${err("mobileNumber") ? "border-[#EC3013]" : ""}`}
                  value={form.mobileNumber}
                  onChange={set("mobileNumber")}
                  onBlur={blur("mobileNumber")}
                  disabled={loading}
                  inputMode="numeric"
                  placeholder="599 123 456"
                />
              </Field>

              <Field label="Date of birth" error={err("dateOfBirth")}>
                <div className="relative">
                  <input
                    type="date"
                    className={`${inputBase} [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                      err("dateOfBirth") ? "border-[#EC3013]" : ""
                    }`}
                    value={form.dateOfBirth}
                    onChange={set("dateOfBirth")}
                    onBlur={blur("dateOfBirth")}
                    disabled={loading}
                  />
                  <Calendar
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white"
                  />
                </div>
              </Field>

              <Field label="Preferred venue" error={serverErrors.preferredVenueId}>
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
              disabled={!canSave}
              className="flex h-[41px] w-[143px] items-center justify-center rounded-full bg-[#EC3013] text-[14px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#505261] disabled:text-[#A9A9A9]"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {saved && (
              <span className="text-[12px] font-semibold text-[#A9A9A9]">Profile saved</span>
            )}
            {loaded && message && (
              <span className="text-[12px] font-semibold text-[#EC3013]">{message}</span>
            )}
          </div>
        </div>
      )}
    </main>
  );
}