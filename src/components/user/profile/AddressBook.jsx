
"use client";

import { useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { requiredVersion } from "@/lib/student-flow";
import { useApi, rowsOf } from "@/components/common/dashboard/data";
import { Pagination } from "@/components/common/dashboard/Elements";

const initialForm = () => ({
  label: "Home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  isDefault: false,
});

const inputStyle =
  "h-11 w-full rounded-lg border border-[#d9e0dc] bg-white px-3.5 text-[14px] text-[#23352d] outline-none transition placeholder:text-[#a0aaa3] focus:border-[#315a48] focus:ring-2 focus:ring-[#315a48]/10 disabled:opacity-60";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#315a48] px-5 text-sm font-medium text-white transition hover:bg-[#254838] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#dce3de] bg-white px-5 text-sm font-medium text-[#34473c] transition hover:bg-[#f7f9f7] disabled:opacity-50";

function PinIcon({ size = 21 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.7" />
    </svg>
  );
}

function FormField({
  label,
  name,
  form,
  setForm,
  placeholder,
  required = true,
  type = "text",
  autoComplete,
  maxLength = 120,
  className = "",
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-[#34433a]">
        {label}
        {!required && (
          <span className="ml-1 font-normal text-[#9ba69e]">
            (optional)
          </span>
        )}
      </span>

      <input
        name={name}
        type={type}
        required={required}
        value={form[name] ?? ""}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={inputStyle}
        onChange={(event) =>
          setForm((previous) => ({
            ...previous,
            [name]: event.target.value,
          }))
        }
      />
    </label>
  );
}

function AddressCard({
  address,
  busy,
  onEdit,
  onDelete,
  onDefault,
}) {
  const lines = [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(", "),
    address.country && address.country !== "IN"
      ? address.country
      : null,
  ].filter(Boolean);

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-[#e2e8e3] bg-white p-5 transition-colors hover:border-[#cbd9cf] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f1] text-[#315a48]">
            <PinIcon size={19} />
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-[#263a2e]">
              {address.label || "Address"}
            </h3>
          </div>
        </div>

        {address.isDefault && (
          <span className="shrink-0 rounded-md bg-[#eaf3ec] px-2.5 py-1 text-[11px] font-semibold text-[#315a48]">
            Default
          </span>
        )}
      </div>

      <div className="mt-4 flex-1">
        <p className="break-words text-[15px] font-semibold text-[#27372e]">
          {address.fullName || "Recipient"}
        </p>

        <p className="mt-2 whitespace-pre-line break-words text-[13px] leading-[1.85] text-[#66746b]">
          {lines.join("\n")}
        </p>

        {address.phone && (
          <p className="mt-3 break-words text-[13px] text-[#445249]">
            <span className="font-medium">Mobile:</span>{" "}
            {address.phone}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#edf0ed] pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => onEdit(address)}
          className="text-[13px] font-semibold text-[#315a48] transition hover:underline disabled:opacity-50"
        >
          Edit
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(address)}
          className="text-[13px] font-medium text-[#a24b46] transition hover:underline disabled:opacity-50"
        >
          Delete
        </button>

        {!address.isDefault && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onDefault(address)}
            className="ml-auto text-[13px] font-medium text-[#58675c] transition hover:text-[#315a48] hover:underline disabled:opacity-50"
          >
            Set as default
          </button>
        )}
      </div>
    </article>
  );
}

export default function AddressBook({ onChange }) {
  const [page, setPage] = useState(1);

  const state = useApi(
    `me/addresses?page=${page}&limit=20`
  );

  const addresses = rowsOf(state.data, ["addresses"]);

  const sortedAddresses = [...addresses].sort(
    (a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault))
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const lock = useRef(false);

  const busy = Boolean(pending);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape" && !lock.current) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function getErrorMessage(caught) {
    const message =
      caught?.message || "Something went wrong. Please try again.";

    if (caught?.status === 409) {
      return (
        message +
        " The address has changed. Close this form, refresh the addresses and edit it again."
      );
    }

    return message;
  }

  function closeForm() {
    if (lock.current) return;

    setOpen(false);
    setEditing(null);
    setForm(initialForm());
    setError("");
  }

  function openAddForm() {
    if (lock.current) return;

    setEditing(null);
    setForm({
      ...initialForm(),
      isDefault: page === 1 && addresses.length === 0,
    });
    setError("");
    setNotice("");
    setOpen(true);
  }

  async function openEditForm(address) {
    if (lock.current || !address?.id) return;

    lock.current = true;
    setPending("edit");
    setError("");
    setNotice("");

    try {
      const response = await accountFetch(
        `me/addresses/${encodeURIComponent(address.id)}`
      );

      const current = response?.data;

      if (!current) {
        throw new Error("Address details could not be loaded.");
      }

      requiredVersion(current.version, "address");

      const updated = initialForm();

      for (const key of Object.keys(updated)) {
        if (key === "isDefault") {
          updated[key] = Boolean(current[key]);
        } else {
          updated[key] = String(current[key] ?? "");
        }
      }

      setEditing(current);
      setForm(updated);
      setOpen(true);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      lock.current = false;
      setPending("");
    }
  }

  function preparePayload() {
    const payload = {
      label: form.label.trim(),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim().toUpperCase(),
    };

    const required = [
      "label",
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
    ];

    if (required.some((key) => !payload[key])) {
      throw new Error("Please complete all required fields.");
    }

    if (!/^[A-Z]{2}$/.test(payload.country)) {
      throw new Error("Enter a valid 2-letter country code, like IN.");
    }

    const digits = payload.phone.replace(/\D/g, "");

    if (
      !/^\+?[0-9\s()-]+$/.test(payload.phone) ||
      digits.length < 8 ||
      digits.length > 15
    ) {
      throw new Error("Enter a valid phone number.");
    }

    return payload;
  }

  async function saveAddress(event) {
    event.preventDefault();

    if (lock.current) return;

    let payload;

    try {
      payload = preparePayload();
    } catch (caught) {
      setError(caught.message);
      return;
    }

    lock.current = true;
    setPending("save");
    setError("");
    setNotice("");

    try {
      const isEditing = Boolean(editing?.id);

      const url = isEditing
        ? `me/addresses/${encodeURIComponent(editing.id)}`
        : "me/addresses";

      const body = isEditing
        ? {
            ...payload,
            version: requiredVersion(
              editing.version,
              "address"
            ),
          }
        : {
            ...payload,
            isDefault: Boolean(form.isDefault),
          };

      const response = await accountFetch(url, {
        method: isEditing ? "PATCH" : "POST",
        body,
      });

      setOpen(false);
      setEditing(null);
      setForm(initialForm());

      setNotice(
        response?.message ||
          (isEditing
            ? "Address updated successfully."
            : "Address added successfully.")
      );

      await state.reload();
      await onChange?.();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      lock.current = false;
      setPending("");
    }
  }

  async function changeAddress(address, action) {
    if (lock.current || !address?.id) return;

    if (action === "delete") {
      const confirmed = window.confirm(
        `Are you sure you want to delete your "${address.label || "saved"}" address?`
      );

      if (!confirmed) return;
    }

    lock.current = true;
    setPending(`${action}-${address.id}`);
    setError("");
    setNotice("");

    try {
      const url = `me/addresses/${encodeURIComponent(address.id)}`;

      // Get latest version before changing or deleting.
      const detail = await accountFetch(url);

      const version = requiredVersion(
        detail?.data?.version,
        "address"
      );

      let response;

      if (action === "default") {
        response = await accountFetch(`${url}/default`, {
          method: "PATCH",
          body: { version },
        });
      } else if (action === "delete") {
        response = await accountFetch(url, {
          method: "DELETE",
          body: { version },
        });
      } else {
        throw new Error("Unsupported address action.");
      }

      setNotice(
        response?.message ||
          (action === "default"
            ? "Default address updated."
            : "Address deleted successfully.")
      );

      if (
        action === "delete" &&
        addresses.length === 1 &&
        page > 1
      ) {
        setPage((previous) => Math.max(1, previous - 1));
      } else {
        await state.reload();
      }

      await onChange?.();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      lock.current = false;
      setPending("");
    }
  }

  const listError =
    typeof state.error === "string"
      ? state.error
      : state.error?.message;

  return (
    <section aria-label="Manage addresses" className="w-full">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-semibold tracking-tight text-[#253a2d] sm:text-[29px]">
            My Addresses
          </h1>
          <p className="mt-1 text-[13px] text-[#829087]">
            Manage your saved delivery addresses.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          disabled={busy}
          className={primaryButton}
        >
          <span className="text-xl font-light leading-none">+</span>
          Add new address
        </button>
      </div>

      {/* Feedback */}
      {notice && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2 rounded-lg bg-[#edf6ef] px-4 py-3 text-[13px] text-[#315a48]"
        >
          <span aria-hidden="true" className="font-bold">✓</span>
          <span>{notice}</span>
        </div>
      )}

      {!open && error && (
        <div
          role="alert"
          className="mb-5 rounded-lg bg-[#fff1ef] px-4 py-3 text-[13px] text-[#a24942]"
        >
          {error}
        </div>
      )}

      {listError && (
        <div
          role="alert"
          className="mb-5 rounded-lg bg-[#fff1ef] px-4 py-3 text-[13px] text-[#a24942]"
        >
          <p>{listError}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => state.reload()}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {state.loading && addresses.length === 0 && !listError && (
        <div
          role="status"
          className="py-16 text-center text-sm text-[#7a8a80]"
        >
          Loading your addresses...
        </div>
      )}

      {/* Address list */}
      {(!state.loading || addresses.length > 0) &&
        !listError &&
        (sortedAddresses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sortedAddresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  busy={busy}
                  onEdit={openEditForm}
                  onDelete={(item) =>
                    changeAddress(item, "delete")
                  }
                  onDefault={(item) =>
                    changeAddress(item, "default")
                  }
                />
              ))}
            </div>

            <div className="mt-5">
              <Pagination
                page={page}
                pagination={state.pagination}
                count={addresses.length}
                loading={state.loading || busy}
                onChange={setPage}
              />
            </div>
          </>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[#dce5dc] px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f6f1] text-[#577a65]">
              <PinIcon size={25} />
            </div>

            <h2 className="mt-4 text-[17px] font-semibold text-[#293e30]">
              No saved addresses
            </h2>

            <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#839087]">
              Add an address to make your checkout easier.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              disabled={busy}
              className={`${primaryButton} mt-6`}
            >
              Add address
            </button>
          </div>
        ))}

      {/* Add / Edit Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-[#14231a]/50 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
            className="my-auto w-full max-w-[600px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4 sm:px-6">
              <h2
                id="address-modal-title"
                className="text-[19px] font-semibold text-[#263a2e]"
              >
                {editing ? "Edit address" : "Add new address"}
              </h2>

              <button
                type="button"
                aria-label="Close address form"
                disabled={busy}
                onClick={closeForm}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#6c7c70] transition hover:bg-[#f2f5f2] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveAddress}>
              <fieldset disabled={busy}>
                <div className="max-h-[min(68vh,630px)] overflow-y-auto px-5 py-5 sm:px-6">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <FormField
                      label="Full name"
                      name="fullName"
                      form={form}
                      setForm={setForm}
                      placeholder="Enter full name"
                      autoComplete="name"
                      className="sm:col-span-2"
                    />

                    <FormField
                      label="Phone number"
                      name="phone"
                      form={form}
                      setForm={setForm}
                      placeholder="+91 9876543210"
                      type="tel"
                      maxLength={20}
                      autoComplete="tel"
                    />

                    <FormField
                      label="Address label"
                      name="label"
                      form={form}
                      setForm={setForm}
                      placeholder="Home / Work / Other"
                      maxLength={40}
                    />

                    <FormField
                      label="Address line 1"
                      name="addressLine1"
                      form={form}
                      setForm={setForm}
                      placeholder="House no., street, area"
                      autoComplete="address-line1"
                      className="sm:col-span-2"
                    />

                    <FormField
                      label="Address line 2"
                      name="addressLine2"
                      form={form}
                      setForm={setForm}
                      placeholder="Apartment, floor, landmark"
                      autoComplete="address-line2"
                      required={false}
                      className="sm:col-span-2"
                    />

                    <FormField
                      label="City"
                      name="city"
                      form={form}
                      setForm={setForm}
                      placeholder="City"
                      autoComplete="address-level2"
                    />

                    <FormField
                      label="State"
                      name="state"
                      form={form}
                      setForm={setForm}
                      placeholder="State"
                      autoComplete="address-level1"
                    />

                    <FormField
                      label="Postal code"
                      name="postalCode"
                      form={form}
                      setForm={setForm}
                      placeholder="Postal / PIN code"
                      autoComplete="postal-code"
                      maxLength={20}
                    />

                    <FormField
                      label="Country code"
                      name="country"
                      form={form}
                      setForm={setForm}
                      placeholder="IN"
                      maxLength={2}
                      autoComplete="country"
                    />
                  </div>

                  {!editing && (
                    <label className="mt-5 flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            isDefault: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#315a48]"
                      />
                      <span className="text-[13px] font-medium text-[#44564a]">
                        Make this my default address
                      </span>
                    </label>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="mt-4 rounded-lg bg-[#fff1ef] px-3 py-3 text-[13px] text-[#a24942]"
                    >
                      {error}
                    </div>
                  )}
                </div>
              </fieldset>

              <div className="flex items-center justify-end gap-3 border-t border-[#edf0ed] px-5 py-4 sm:px-6">
                <button
                  type="button"
                  disabled={busy}
                  onClick={closeForm}
                  className={secondaryButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  className={primaryButton}
                >
                  {pending === "save"
                    ? "Saving..."
                    : editing
                    ? "Save changes"
                    : "Save address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
