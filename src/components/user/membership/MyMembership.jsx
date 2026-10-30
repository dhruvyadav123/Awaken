
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { addMembershipToCart } from "@/lib/cart";
import { useApi, rowsOf } from "@/components/common/dashboard/data";
import { Pagination } from "@/components/common/dashboard/Elements";
import { externalUrl, titleOf } from "@/lib/learning-data";
import {
  allAccountPages,
  formatSchedule,
  requiredVersion,
} from "@/lib/student-flow";
import {
  availablePlan,
  money,
  planBenefits,
  planRequiresPayment,
  planPeriod,
  planPrice,
  readableStatus,
} from "@/lib/membership-ui";
import styles from "./membership.module.css";

function displayDate(value) {
  return value ? formatSchedule(value) : "—";
}

function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `membership-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function Alert({ message, kind = "error" }) {
  if (!message) return null;

  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`${styles.alert} ${kind === "error" ? styles.alertError : styles.alertSuccess}`}
    >
      {message}
    </p>
  );
}

function Benefits({ plan }) {
  const benefits = planBenefits(plan);

  if (!benefits.length) return null;

  return (
    <div className={styles.benefits}>
      <div className={styles.sectionLabel}>
        <span className={styles.sectionLabelIcon}>✦</span>
        <h3>
        Included in your plan
        </h3>
      </div>

      <ul className={styles.benefitGrid}>
        {benefits.map((benefit, index) => (
          <li
            key={`${benefit}-${index}`}
            className={styles.benefit}
          >
            <span
              aria-hidden="true"
              className={styles.check}
            >
              ✓
            </span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MembershipDiscount({ courseId }) {
  const state = useApi(
    courseId
      ? `me/membership-discount?resourceType=COURSE&resourceId=${encodeURIComponent(
          courseId
        )}`
      : null
  );

  if (!courseId) return null;

  if (state.loading) {
    return (
      <p role="status" className="text-sm text-[#6c7b70]">
        Checking membership pricing…
      </p>
    );
  }

  if (state.error) {
    return (
      <p
        role="alert"
        className="text-sm text-[#9a493b]"
      >
        {state.error}{" "}
        <button
          type="button"
          className="font-semibold underline"
          onClick={state.reload}
        >
          Retry
        </button>
      </p>
    );
  }

  const discount = state.data;

  if (!discount) return null;

  const percent =
    discount.membershipDiscountPercent;

  const finalAmount = money(
    discount.finalAmount,
    discount.currency || "INR"
  );

  const description =
    discount.included === true
      ? "Included with your membership."
      : [
          percent != null
            ? `Membership discount: ${percent}%`
            : null,

          finalAmount
            ? `Final price: ${finalAmount}`
            : null,

          discount.paymentRequired === false
            ? "No payment required."
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

  if (!description) return null;

  return (
    <div className="rounded-xl border border-[#dbe9dc] bg-[#f3f8f3] px-4 py-3 text-sm leading-6 text-[#315a48]">
      {description}{" "}
      <Link
        href="/profile/membership"
        className="font-semibold underline"
      >
        View membership
      </Link>
    </div>
  );
}

export default function MyMembership({
  membershipId = "",
  planId = "",
}) {
  const detailsMode = Boolean(membershipId);
  const router = useRouter();

  const [selection, setSelection] = useState({
    loading: Boolean(planId),
    plan: null,
    error: "",
  });

  const [page, setPage] = useState(1);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const busyRef = useRef(false);
  const idempotencyKeys = useRef({});

  const current = useApi(
    detailsMode
      ? `me/membership/${encodeURIComponent(membershipId)}`
      : "me/membership"
  );

  const history = useApi(
    detailsMode
      ? null
      : `me/membership/history?page=${page}&limit=20`
  );

  // Load the selected public plan.
  useEffect(() => {
    if (!planId || detailsMode) return;

    let live = true;

    queueMicrotask(() => {
      if (!live) return;

      setSelection({
        loading: true,
        plan: null,
        error: "",
      });
    });

    allAccountPages(
      accountFetch,
      "public/membership-plans",
      ["plans", "membershipPlans", "items"]
    )
      .then((plans) => {
        if (!live) return;

        const plan = plans.find(
          (item) =>
            String(item?.id) === String(planId) &&
            availablePlan(item)
        );

        setSelection({
          loading: false,
          plan: plan || null,
          error: plan
            ? ""
            : "This plan is no longer available. Choose another plan.",
        });
      })
      .catch((caught) => {
        if (!live) return;

        setSelection({
          loading: false,
          plan: null,
          error:
            caught?.message ||
            "Unable to load the selected plan.",
        });
      });

    return () => {
      live = false;
    };
  }, [planId, detailsMode]);

  const memberships = rowsOf(
    current.data,
    ["memberships"]
  );

  const membership =
    current.data?.membership ||
    (current.data?.id ? current.data : null) ||
    (!detailsMode
      ? memberships.find(
          (item) => item.hasAccess === true
        ) || memberships[0]
      : null) ||
    null;

  const entries = rowsOf(
    history.data,
    ["history", "memberships"]
  );

  const isMissing = current.status === 404;

  const loadError = isMissing
    ? ""
    : current.error;

  const status = String(
    membership?.status || ""
  ).toUpperCase();

  const terminal = [
    "CANCELLED",
    "CANCELED",
    "EXPIRED",
    "REVOKED",
  ].includes(status);

  const hasOngoingMembership = Boolean(
    membership && !terminal
  );

  const selectedPlan =
    selection.plan &&
    String(selection.plan.id) === String(planId)
      ? selection.plan
      : null;

  const renewal = membership?.renewal;

  // An expired membership can still be renewable
  // when the backend explicitly marks it eligible.
  const canRenew =
    renewal?.eligible === true &&
    membership?.version != null;

  const canCancel = Boolean(
    detailsMode &&
    membership &&
    !terminal &&
    membership.version != null
  );

  const paymentLink =
    externalUrl(receipt?.payment) ||
    externalUrl(receipt?.checkout);

  const orderId =
    receipt?.orderId ||
    receipt?.order?.id ||
    receipt?.period?.orderId;

  function keyFor(key) {
    if (!idempotencyKeys.current[key]) {
      idempotencyKeys.current[key] =
        newIdempotencyKey();
    }

    return idempotencyKeys.current[key];
  }

  async function refresh() {
    if (busyRef.current) return;

    setError("");

    await Promise.all([
      current.reload(),
      ...(detailsMode ? [] : [history.reload()]),
    ]);
  }

  // Actual backend mutations.
  async function act(action) {
    if (busyRef.current) return;

    busyRef.current = true;
    setWorking(action);
    setError("");
    setNotice("");

    try {
      let path;
      let body;
      let keyName;

      if (action === "activate") {
        if (!planId || !selectedPlan) {
          throw new Error(
            "Choose an available plan first."
          );
        }

        if (hasOngoingMembership) {
          throw new Error(
            "Manage your existing membership before selecting another plan."
          );
        }

        if (planRequiresPayment(selectedPlan)) {
          await addMembershipToCart(planId);
          router.push("/cart");
          return;
        }

        keyName = `activate-${planId}`;
        path = "me/membership/activate";

        body = {
          planId,
          idempotencyKey: keyFor(keyName),
        };
      } else {
        if (!membership?.id) {
          throw new Error(
            "Membership details are unavailable."
          );
        }

        if (action === "renew" && !canRenew) {
          throw new Error(
            "Renewal is not currently available."
          );
        }

        if (action === "cancel" && !canCancel) {
          throw new Error(
            "Cancellation is not available for this membership."
          );
        }

        if (action === "cancel" && !reason.trim()) {
          throw new Error(
            "Enter a cancellation reason."
          );
        }

        const version = requiredVersion(
          membership.version,
          "membership"
        );

        path = `me/membership/${encodeURIComponent(
          String(membership.id)
        )}/${action}`;

        if (action === "renew") {
          keyName = `renew-${membership.id}`;

          body = {
            version,
            idempotencyKey: keyFor(keyName),
          };
        } else {
          body = {
            version,
            reason: reason.trim(),
          };
        }
      }

      const response = await accountFetch(path, {
        method: "POST",
        body,
      });

      setReceipt(response?.data || null);

      setNotice(
        response?.message ||
          "Request submitted. Check the latest membership status below."
      );

      if (keyName) {
        delete idempotencyKeys.current[keyName];
      }

      if (action === "cancel") {
        setCancelOpen(false);
        setReason("");
      }

      try {
        await Promise.all([
          current.reload(),
          ...(detailsMode
            ? []
            : [history.reload()]),
        ]);
      } catch {
        setNotice(
          "Request submitted successfully. Use Refresh to load the updated membership details."
        );
      }
    } catch (caught) {
      if (caught?.status === 409) {
        setError(
          "Membership details changed on the server. Review the latest information and try again."
        );

        await current.reload();
      } else {
        setError(
          caught?.message ||
            "The membership request failed. Please try again."
        );
      }
    } finally {
      busyRef.current = false;
      setWorking("");
    }
  }

  const otherMemberships = memberships.filter(
    (item) =>
      item.id &&
      String(item.id) !== String(membership?.id)
  );

  const activePlanPrice = membership?.plan
    ? planPrice(membership.plan)
    : { current: "", original: "" };
  const activePlanPeriod = membership?.plan
    ? planPeriod(membership.plan)
    : "";
  const accessUntil =
    membership?.currentPeriod?.expiresAt || membership?.expiresAt;
  const periodStart = membership?.currentPeriod?.startsAt;
  const activeBenefits = planBenefits(membership?.plan);

  return (
    <main className={styles.page} data-membership-page>
      <div className={styles.container}>

        {/* Header */}
        <div className={`${styles.header} membership-page-header`}>
          <div className={styles.headerCopy}>
            <Link
              href={
                detailsMode
                  ? "/profile/membership"
                  : "/profile"
              }
              className={styles.backLink}
            >
              ← {detailsMode ? "My membership" : "My account"}
            </Link>

            <p className={styles.eyebrow}>YOUR MEMBERSHIP</p>
            <h1>
              {detailsMode
                ? "Manage membership"
                : "My membership"}
            </h1>

            <p className={styles.lede}>
              {detailsMode
                ? "View your plan and available actions."
                : "View your access, payments and membership history."}
            </p>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            disabled={
              current.loading || Boolean(working)
            }
            onClick={refresh}
          >
            <span className={styles.refreshIcon}>↻</span>
            {current.loading ? "Refreshing…" : "Refresh details"}
          </button>
        </div>

        {/* API messages and payment */}
        <div className={styles.messageStack}>
          <Alert message={error || loadError} />
          <Alert message={notice} kind="success" />

          {orderId && (
            <Link
              href={`/profile/orders/${encodeURIComponent(
                String(orderId)
              )}`}
              className={styles.inlineLink}
            >
              View related order
            </Link>
          )}

          {paymentLink && (
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.primaryButton}
            >
              Continue payment →
            </a>
          )}
        </div>

        {current.loading ? (
          <p
            role="status"
            className={styles.loadingState}
          >
            Loading membership…
          </p>
        ) : detailsMode && isMissing ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✦</div>
            <p className={styles.emptyTitle}>
              This membership could not be found.
            </p>

            <Link
              href="/profile/membership"
              className={styles.inlineLink}
            >
              Back to my membership
            </Link>
          </div>
        ) : !loadError && (
          <div className={styles.contentStack}>

            {/* Current membership */}
            {membership ? (
              <section
                className={styles.planCard}
                aria-labelledby="current-membership-heading"
              >
                <div className={styles.planTop}>
                  <div className={styles.planIdentity}>
                    <div className={styles.planIcon}>∞</div>
                    <div>
                    <p className={styles.cardKicker}>CURRENT PLAN</p>

                    <h2
                      id="current-membership-heading"
                      className={styles.planTitle}
                    >
                      {titleOf(
                        membership.plan,
                        "Membership plan"
                      )}
                    </h2>

                    <div className={styles.planStatusRow}>
                      {membership.status && (
                        <span className={`${styles.statusBadge} ${terminal ? styles.statusBadgeMuted : ""}`}>
                          {readableStatus(
                            membership.status
                          )}
                        </span>
                      )}

                      {typeof membership.hasAccess ===
                        "boolean" && (
                        <span className={`${styles.accessBadge} ${membership.hasAccess ? styles.accessGood : styles.accessMuted}`}>
                          {membership.hasAccess
                            ? "Access available"
                            : "Access unavailable"}
                        </span>
                      )}
                    </div>
                    </div>
                  </div>

                  {!detailsMode && membership.id && (
                    <Link
                      href={`/profile/membership/${encodeURIComponent(
                        String(membership.id)
                      )}`}
                      className={styles.primaryButton}
                    >
                      Manage membership →
                    </Link>
                  )}
                </div>

                <dl className={styles.planMetaGrid}>
                  <div className={styles.planMetaItem}>
                    <dt>Plan value</dt>
                    <dd>{activePlanPrice.current || "Included"} <small>{activePlanPeriod}</small></dd>
                  </div>
                  <div className={styles.planMetaItem}>
                    <dt>Access until</dt>
                    <dd>{displayDate(accessUntil)}</dd>
                  </div>
                  <div className={styles.planMetaItem}>
                    <dt>Auto-renewal</dt>
                    <dd>{typeof membership.autoRenew === "boolean" ? membership.autoRenew ? "Enabled" : "Disabled" : "Not set"}</dd>
                  </div>
                  <div className={styles.planMetaItem}>
                    <dt>Member since</dt>
                    <dd>{displayDate(periodStart)}</dd>
                  </div>
                </dl>

                <div className={styles.planFooter}>
                  <span><strong>{activeBenefits.length || "—"}</strong> benefits included</span>
                  <span className={styles.secureNote}><span aria-hidden="true">⌁</span> Secure account access</span>
                </div>

                <Benefits plan={membership.plan} />
              </section>
            ) : (
              <section className={styles.emptyCard}>
                <div className={styles.emptyIcon}>∞</div>
                <p className={styles.cardKicker}>A SPACE TO GO DEEPER</p>
                <h2>
                  No current membership
                </h2>

                <p className={styles.emptyDescription}>
                  Choose a plan to get started.
                </p>

                {!planId && (
                  <Link
                    href="/infinity/membership"
                    className={styles.primaryButton}
                  >
                    Explore membership plans →
                  </Link>
                )}
              </section>
            )}

            {/* Other memberships */}
            {!detailsMode &&
              otherMemberships.length > 0 && (
                <section className={styles.otherMemberships} aria-labelledby="other-memberships-heading">
                  <div className={styles.sectionHeadingRow}>
                  <h2
                    id="other-memberships-heading"
                    className={styles.sectionHeading}
                  >
                    Other memberships
                  </h2>
                  <span className={styles.sectionCount}>{otherMemberships.length} previous</span>
                  </div>

                  <div className={styles.otherList}>
                    {otherMemberships.map((item) => (
                      <div
                        key={item.id}
                        className={styles.otherItem}
                      >
                        <span className={styles.otherItemName}>
                          {titleOf(
                            item.plan,
                            "Membership"
                          )}
                          {" · "}
                          {readableStatus(item.status)}
                        </span>

                        <Link
                          href={`/profile/membership/${encodeURIComponent(
                            String(item.id)
                          )}`}
                          className={styles.inlineLink}
                        >
                          View details →
                        </Link>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {/* Selected plan activation */}
            {!detailsMode && planId && (
              <section
                className={styles.selectedCard}
                aria-labelledby="chosen-plan-heading"
              >
                <div className={styles.selectedTop}>
                  <div>
                    <p className={styles.cardKicker}>
                      Selected plan
                    </p>

                    <h2
                      id="chosen-plan-heading"
                      className={styles.selectedTitle}
                    >
                      {selectedPlan?.name ||
                        selectedPlan?.title ||
                        "Membership plan"}
                    </h2>

                    {selectedPlan && (
                      <p className={styles.selectedPrice}>
                        <span>
                          {planPrice(selectedPlan)
                            .current ||
                            "Price unavailable"}
                        </span>

                        {planPeriod(selectedPlan) && (
                            <span className={styles.pricePeriod}>
                            {planPeriod(selectedPlan)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <Link
                    href="/infinity/membership"
                    className={styles.inlineLink}
                  >
                    Change plan →
                  </Link>
                </div>

                {selection.loading && (
                  <p
                    role="status"
                    className={styles.inlineStatus}
                  >
                    Loading selected plan…
                  </p>
                )}

                <Alert message={selection.error} />

                {selectedPlan && (
                  <Benefits plan={selectedPlan} />
                )}

                {hasOngoingMembership && (
                  <p className={styles.warningNote}>
                    You already have a membership
                    that has not ended. Manage it
                    before activating a new plan.
                  </p>
                )}

                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={
                    Boolean(working) ||
                    selection.loading ||
                    !selectedPlan ||
                    hasOngoingMembership ||
                    current.loading
                  }
                  onClick={() => act("activate")}
                >
                  {working === "activate"
                    ? planRequiresPayment(selectedPlan)
                      ? "Adding to cart…"
                      : "Processing…"
                    : planRequiresPayment(selectedPlan)
                      ? "Add to cart & pay →"
                      : "Activate selected plan →"}
                </button>

                <p className={styles.helperText}>
                  Paid membership plans are added to your cart first.
                  Payment is completed securely from checkout.
                </p>
              </section>
            )}

            {/* Renewal and cancellation */}
            {detailsMode &&
              membership &&
              (canRenew || canCancel) && (
                <section
                  className={styles.actionGrid}
                  aria-label="Manage membership actions"
                >
                  {canRenew && (
                    <div className={`${styles.actionCard} ${styles.renewCard}`}>
                      <span className={styles.actionIcon}>↻</span>
                      <h2>
                        Renew membership
                      </h2>

                      <p className={styles.actionDescription}>
                        {renewal.durationDays
                          ? `${renewal.durationDays} days`
                          : "Renew membership"}

                        {money(
                          renewal.amount,
                          renewal.currency ||
                            membership.plan?.currency ||
                            "INR"
                        )
                          ? ` · ${money(
                              renewal.amount,
                              renewal.currency ||
                                membership.plan
                                  ?.currency ||
                                "INR"
                            )}`
                          : ""}

                        {typeof renewal.paymentRequired ===
                        "boolean"
                          ? renewal.paymentRequired
                            ? " · Payment required"
                            : " · No payment required"
                          : ""}
                      </p>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={Boolean(working)}
                        onClick={() => act("renew")}
                      >
                        {working === "renew"
                          ? "Processing…"
                          : "Renew membership →"}
                      </button>
                    </div>
                  )}

                  {canCancel && (
                    <div className={`${styles.actionCard} ${styles.cancelCard}`}>
                      <span className={styles.actionIcon}>×</span>
                      <h2>
                        Cancel membership
                      </h2>

                      {!cancelOpen ? (
                        <>
                           <p className={styles.actionDescription}>
                            Request cancellation of
                            this membership.
                          </p>

                          <button
                            type="button"
                            className={styles.outlineButton}
                            disabled={Boolean(working)}
                            onClick={() =>
                              setCancelOpen(true)
                            }
                          >
                            Cancel membership
                          </button>
                        </>
                      ) : (
                        <form
                          className={styles.cancelForm}
                          onSubmit={(event) => {
                            event.preventDefault();
                            void act("cancel");
                          }}
                        >
                          <label
                            htmlFor="cancellation-reason"
                            className={styles.formLabel}
                          >
                            Reason for cancellation
                          </label>

                          <textarea
                            id="cancellation-reason"
                            value={reason}
                            onChange={(event) =>
                              setReason(
                                event.target.value
                              )
                            }
                            maxLength={500}
                            required
                            disabled={Boolean(working)}
                            rows={3}
                            className={styles.textarea}
                          />

                          <div className={styles.formActions}>
                            <button
                              type="submit"
                              className={styles.dangerButton}
                              disabled={
                                Boolean(working) ||
                                !reason.trim()
                              }
                            >
                              {working === "cancel"
                                ? "Processing…"
                                : "Confirm cancellation"}
                            </button>

                            <button
                              type="button"
                              className={styles.keepButton}
                              disabled={Boolean(working)}
                              onClick={() => {
                                setCancelOpen(false);
                                setReason("");
                              }}
                            >
                              Keep membership
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </section>
              )}

            {/* Membership history - overview only */}
            {!detailsMode && (
              <section
                className={styles.historySection}
                aria-labelledby="history-heading"
              >
                <h2
                  id="history-heading"
                  className={styles.sectionHeading}
                >
                  Membership history
                </h2>

                <p className={styles.sectionDescription}>
                  Past periods and membership activity.
                </p>

                {history.loading ? (
                  <p
                    role="status"
                    className={styles.inlineStatus}
                  >
                    Loading history…
                  </p>
                ) : history.error ? (
                  <div className={styles.historyError}>
                    <Alert message={history.error} />

                    <button
                      type="button"
                      className={styles.inlineLink}
                      onClick={history.reload}
                    >
                      Retry history
                    </button>
                  </div>
                ) : entries.length === 0 ? (
                  <p className={styles.historyEmpty}>
                    No membership history yet.
                  </p>
                ) : (
                  <div className={styles.historyList}>
                    {entries.map((entry, index) => (
                      <div
                        key={
                          entry.id ||
                          `history-${index}`
                        }
                        className={styles.historyItem}
                      >
                        <div>
                          <h3 className={styles.historyTitle}>
                            {titleOf(
                              entry.plan,
                              "Membership period"
                            )}
                          </h3>

                          <p className={styles.historyMeta}>
                            {[
                              entry.operation,
                              entry.membershipStatus,
                              entry.paymentStatus,
                            ]
                              .filter(Boolean)
                              .map(readableStatus)
                              .join(" · ")}
                          </p>

                          {(entry.startsAt ||
                            entry.expiresAt) && (
                            <p className={styles.historyMeta}>
                              {displayDate(
                                entry.startsAt
                              )}
                              {" — "}
                              {displayDate(
                                entry.expiresAt
                              )}
                            </p>
                          )}
                        </div>

                        {entry.membershipId && (
                          <Link
                            href={`/profile/membership/${encodeURIComponent(
                              String(
                                entry.membershipId
                              )
                            )}`}
                            className={styles.inlineLink}
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Pagination
                  page={page}
                  pagination={history.pagination}
                  count={entries.length}
                  loading={history.loading}
                  onChange={setPage}
                />
              </section>
            )}

          </div>
        )}
      </div>
    </main>
  );
}
