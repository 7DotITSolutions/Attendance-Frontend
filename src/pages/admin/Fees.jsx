// =============================================================
// FILE: src/pages/admin/Fees.jsx
// PURPOSE: Admin fee management.
//   Tab 1: Collected — shows all students fee status for a batch+month
//   Tab 2: Defaulters — students with pending/partial fees
//          Has per-student 📱 Remind button + Remind All button
// =============================================================

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Modal   from "../../components/ui/Modal";
import Badge   from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import { FeeChart } from "../../components/charts/FeeChart";
import "./Fees.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const currentMonthStr = () => {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const Fees = () => {
  const [searchParams] = useSearchParams();

  const [batches,  setBatches]  = useState([]);
  const [feeData,  setFeeData]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [batchId,  setBatchId]  = useState(searchParams.get("batchId") || "");
  const [month,    setMonth]    = useState(currentMonthStr());
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState("fees"); // "fees" | "defaulters"
  const [generating, setGenerating] = useState(false);

  // Collect modal state
  const [collectModal, setCollectModal] = useState(false);
  const [selStudent,   setSelStudent]   = useState(null);
  const [collectAmt,   setCollectAmt]   = useState("");
  const [payMethod,    setPayMethod]    = useState("cash");
  const [payRemarks,   setPayRemarks]   = useState("");
  const [saving,       setSaving]       = useState(false);

  // WhatsApp reminder state
  const [remindingId,  setRemindingId]  = useState(null);
  const [remindingAll, setRemindingAll] = useState(false);

  useEffect(() => {
    axios.get(`${BASE}/admin/batch`, { headers: h() })
      .then((r) => setBatches(r.data.batches || []))
      .catch(() => {});
  }, []);

  const load = async () => {
    if (!batchId || !month) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE}/admin/fees/batch/${batchId}?month=${encodeURIComponent(month)}`,
        { headers: h() }
      );
      setFeeData(res.data.data || []);
      setSummary(res.data.summary || null);
    } catch {
      toast.error("Failed to load fees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [batchId, month]);

  const generateFees = async () => {
    if (!batchId || !month) return;
    if (!window.confirm(`Generate fees for ${month}?`)) return;
    setGenerating(true);
    try {
      const res = await axios.post(
        `${BASE}/admin/fees/generate`,
        { batchId, month },
        { headers: h() }
      );
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const openCollect = (student) => {
    setSelStudent(student);
    const due = Math.max(
      0,
      (student.feeEntry?.monthlyFee || student.monthlyFee) -
      (student.feeEntry?.paidAmount || 0)
    );
    setCollectAmt(due.toString());
    setPayMethod("cash");
    setPayRemarks("");
    setCollectModal(true);
  };

  const collectFee = async () => {
    if (!collectAmt || Number(collectAmt) <= 0) {
      toast.warning("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(
        `${BASE}/admin/fees/collect`,
        {
          studentId:     selStudent.studentId,
          month,
          amount:        Number(collectAmt),
          paymentMethod: payMethod,
          remarks:       payRemarks,
        },
        { headers: h() }
      );
      toast.success(res.data.message);
      setCollectModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Collection failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Remind single defaulter ───────────────────────────
  const remindStudent = async (studentId, name) => {
    if (!window.confirm(`Send WhatsApp reminder to ${name}?`)) return;
    setRemindingId(studentId);
    try {
      const res = await axios.post(
        `${BASE}/whatsapp/fee-reminder-single`,
        { studentId, month },
        { headers: h() }
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  };

  // ── Remind ALL defaulters in this batch ───────────────
  const remindAllDefaulters = async () => {
    const defaulters = feeData.filter(
      (d) => d.feeEntry?.status === "pending" || d.feeEntry?.status === "partial" || !d.feeEntry
    );
    if (!defaulters.length) {
      toast.info("No defaulters to remind");
      return;
    }
    if (!window.confirm(`Send WhatsApp to all ${defaulters.length} defaulters for ${month}?`)) return;
    setRemindingAll(true);
    try {
      const res = await axios.post(
        `${BASE}/whatsapp/fee-reminder-all-defaulters`,
        { month, batchId },
        { headers: h() }
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminders");
    } finally {
      setRemindingAll(false);
    }
  };

  const defaulters = feeData.filter(
    (d) => d.feeEntry?.status === "pending" || d.feeEntry?.status === "partial" || !d.feeEntry
  );

  const yearOptions = [new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <div className="fees-page">
      {/* Controls */}
      <div className="fees-controls">
        <select className="form-select" value={batchId}
          onChange={(e) => setBatchId(e.target.value)}>
          <option value="">Select batch</option>
          {batches.filter((b) => b.status === "active").map((b) => (
            <option key={b._id} value={b._id}>{b.batchName}</option>
          ))}
        </select>

        <select className="form-select" value={month}
          onChange={(e) => setMonth(e.target.value)}>
          {yearOptions.map((y) =>
            MONTHS.map((m) => (
              <option key={`${m} ${y}`} value={`${m} ${y}`}>{m} {y}</option>
            ))
          )}
        </select>

        <button className="btn btn-secondary"
          onClick={generateFees} disabled={!batchId || generating}>
          {generating ? "Generating..." : "⚡ Generate Fees"}
        </button>
      </div>

      {!batchId ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <div className="empty-text">Select a batch to manage fees</div>
        </div>
      ) : loading ? (
        <Spinner full />
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="fees-summary-row">
              <div className="fee-sum-card collected">
                <span className="fee-sum-val">
                  ₹{(summary.collected || 0).toLocaleString("en-IN")}
                </span>
                <span className="fee-sum-label">Collected</span>
              </div>
              <div className="fee-sum-card outstanding">
                <span className="fee-sum-val">
                  ₹{(summary.due || 0).toLocaleString("en-IN")}
                </span>
                <span className="fee-sum-label">Outstanding</span>
              </div>
              <div className="fee-sum-card">
                <span className="fee-sum-val">{summary.paid || 0}</span>
                <span className="fee-sum-label">Paid</span>
              </div>
              <div className="fee-sum-card">
                <span className="fee-sum-val">{summary.partial || 0}</span>
                <span className="fee-sum-label">Partial</span>
              </div>
              <div className="fee-sum-card">
                <span className="fee-sum-val">{summary.pending || 0}</span>
                <span className="fee-sum-label">Pending</span>
              </div>
              <FeeChart
                paid={summary.paid}
                partial={summary.partial}
                pending={summary.pending}
                title=""
              />
            </div>
          )}

          {/* Inner tabs */}
          <div className="fees-inner-tabs">
            <button
              className={`fees-inner-tab ${tab === "fees" ? "active" : ""}`}
              onClick={() => setTab("fees")}>
              💰 All Students
            </button>
            <button
              className={`fees-inner-tab ${tab === "defaulters" ? "active" : ""}`}
              onClick={() => setTab("defaulters")}>
              ⚠ Defaulters
              {defaulters.length > 0 && (
                <span className="fees-defaulter-badge">{defaulters.length}</span>
              )}
            </button>
          </div>

          {/* All students tab */}
          {tab === "fees" && (
            <div className="fees-list">
              {feeData.map((d) => {
                const fee    = d.feeEntry;
                const due    = fee ? Math.max(0, fee.monthlyFee - fee.paidAmount) : d.monthlyFee;
                const status = fee?.status || "not generated";
                const notGen = !fee;

                return (
                  <div key={d.studentId} className={`fee-student-card ${status}`}>
                    <div className="fee-student-left">
                      <div className="fee-avatar">{d.name[0]?.toUpperCase()}</div>
                      <div>
                        <div className="fee-student-name">{d.name}</div>
                        <div className="fee-student-phone">{d.phone}</div>
                        {d.advanceBalance > 0 && (
                          <div className="fee-advance">
                            Advance: ₹{d.advanceBalance.toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="fee-student-right">
                      {notGen ? (
                        <span className="badge badge-gray">Not generated</span>
                      ) : (
                        <div className="fee-amounts">
                          <div className="fee-amount-item">
                            <span className="fee-amount-label">Due</span>
                            <span className="fee-amount-val">
                              ₹{fee.monthlyFee.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="fee-amount-item">
                            <span className="fee-amount-label">Paid</span>
                            <span className="fee-amount-val paid">
                              ₹{fee.paidAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                          {due > 0 && (
                            <div className="fee-amount-item">
                              <span className="fee-amount-label">Balance</span>
                              <span className="fee-amount-val due">
                                ₹{due.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          <Badge status={status} />
                        </div>
                      )}
                      {!notGen && status !== "paid" && (
                        <button className="btn btn-success btn-sm"
                          onClick={() => openCollect(d)}>
                          💵 Collect
                        </button>
                      )}
                      {fee?.receiptNo && (
                        <div className="fee-receipt">🧾 {fee.receiptNo}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {!feeData.length && (
                <div className="empty-state">
                  <div className="empty-icon">💰</div>
                  <div className="empty-text">No students found. Generate fees first.</div>
                </div>
              )}
            </div>
          )}

          {/* Defaulters tab */}
          {tab === "defaulters" && (
            <div>
              {/* Defaulters header with Remind All */}
              <div className="defaulters-header">
                <div>
                  <h3 className="defaulters-title">
                    Defaulters — {month}
                    <span className="defaulters-count">{defaulters.length}</span>
                  </h3>
                  <p className="defaulters-sub">
                    Students with pending or partial fees
                  </p>
                </div>
                <button
                  className="btn btn-wa"
                  onClick={remindAllDefaulters}
                  disabled={remindingAll || !defaulters.length}>
                  {remindingAll
                    ? "Sending..."
                    : `📱 Remind All (${defaulters.length})`}
                </button>
              </div>

              {/* Defaulters list */}
              <div className="fees-list">
                {defaulters.map((d) => {
                  const fee    = d.feeEntry;
                  const due    = fee ? Math.max(0, fee.monthlyFee - fee.paidAmount) : d.monthlyFee;
                  const status = fee?.status || "not generated";

                  return (
                    <div key={d.studentId} className={`fee-student-card ${status}`}>
                      <div className="fee-student-left">
                        <div className="fee-avatar">{d.name[0]?.toUpperCase()}</div>
                        <div>
                          <div className="fee-student-name">{d.name}</div>
                          <div className="fee-student-phone">{d.phone}</div>
                          {d.advanceBalance > 0 && (
                            <div className="fee-advance">
                              Advance: ₹{d.advanceBalance.toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="fee-student-right">
                        <div className="fee-amounts">
                          <div className="fee-amount-item">
                            <span className="fee-amount-label">Due</span>
                            <span className="fee-amount-val">
                              ₹{(fee?.monthlyFee || d.monthlyFee || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="fee-amount-item">
                            <span className="fee-amount-label">Paid</span>
                            <span className="fee-amount-val paid">
                              ₹{(fee?.paidAmount || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="fee-amount-item">
                            <span className="fee-amount-label">Balance</span>
                            <span className="fee-amount-val due">
                              ₹{due.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <Badge status={status} />
                        </div>

                        {/* Action buttons */}
                        <div className="fee-defaulter-actions">
                          {fee && status !== "paid" && (
                            <button className="btn btn-success btn-sm"
                              onClick={() => openCollect(d)}>
                              💵 Collect
                            </button>
                          )}
                          <button
                            className="btn btn-wa btn-sm"
                            onClick={() => remindStudent(d.studentId, d.name)}
                            disabled={remindingId === d.studentId || !d.phone}
                            title={!d.phone ? "No phone number" : "Send WhatsApp reminder"}>
                            {remindingId === d.studentId ? "Sending..." : "📱 Remind"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!defaulters.length && (
                  <div className="empty-state">
                    <div className="empty-icon">🎉</div>
                    <div className="empty-text">No defaulters for {month}!</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Collect Modal */}
      <Modal open={collectModal} onClose={() => setCollectModal(false)}
        title={`Collect Fee — ${selStudent?.name}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setCollectModal(false)}>
              Cancel
            </button>
            <button className="btn btn-success" disabled={saving} onClick={collectFee}>
              {saving ? "Saving..." : "Collect Payment"}
            </button>
          </>
        }>
        {selStudent && (
          <div>
            <div className="collect-info-row">
              <div>
                <span className="collect-label">Month</span>
                <span className="collect-val">{month}</span>
              </div>
              <div>
                <span className="collect-label">Monthly Fee</span>
                <span className="collect-val">
                  ₹{(selStudent.feeEntry?.monthlyFee || selStudent.monthlyFee || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="collect-label">Already Paid</span>
                <span className="collect-val" style={{ color: "var(--success)" }}>
                  ₹{(selStudent.feeEntry?.paidAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹) <span className="req">*</span></label>
              <input type="number" className="form-input" value={collectAmt}
                onChange={(e) => setCollectAmt(e.target.value)}
                placeholder="Enter amount" />
            </div>
            <div className="form-group">
              <label className="form-label">Payment method</label>
              <select className="form-select" value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Remarks (optional)</label>
              <input className="form-input" placeholder="Any notes"
                value={payRemarks} onChange={(e) => setPayRemarks(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Fees;