// =============================================================
// FILE: src/pages/admin/Fees.jsx
// PURPOSE: Admin fee management. Select batch + month to view
//          fee status of all students. Generate fees for month.
//          Collect payment per student (full or partial).
//          Shows paid/partial/pending breakdown with amounts.
// =============================================================

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import { FeeChart } from "../../components/charts/FeeChart";
import "./Fees.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const currentMonthStr = () => {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const Fees = () => {
  const [searchParams]  = useSearchParams();
  const [batches,  setBatches]  = useState([]);
  const [feeData,  setFeeData]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [batchId,  setBatchId]  = useState(searchParams.get("batchId") || "");
  const [month,    setMonth]    = useState(currentMonthStr());
  const [loading,  setLoading]  = useState(false);
  const [generating, setGenerating] = useState(false);
  const [collectModal, setCollectModal] = useState(false);
  const [selStudent, setSelStudent]     = useState(null);
  const [collectAmt, setCollectAmt]     = useState("");
  const [payMethod,  setPayMethod]      = useState("cash");
  const [payRemarks, setPayRemarks]     = useState("");
  const [saving,     setSaving]         = useState(false);

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
    } catch { toast.error("Failed to load fees"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [batchId, month]);

  const generateFees = async () => {
    if (!batchId || !month) return;
    if (!window.confirm(`Generate fees for ${month}? Students already having this month's entry will be skipped.`)) return;
    setGenerating(true);
    try {
      const res = await axios.post(`${BASE}/admin/fees/generate`, { batchId, month }, { headers: h() });
      toast.success(res.data.message);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to generate"); }
    finally { setGenerating(false); }
  };

  const openCollect = (student) => {
    setSelStudent(student);
    const due = Math.max(0, (student.feeEntry?.monthlyFee || student.monthlyFee) - (student.feeEntry?.paidAmount || 0));
    setCollectAmt(due.toString());
    setPayMethod("cash");
    setPayRemarks("");
    setCollectModal(true);
  };

  const collectFee = async () => {
    if (!collectAmt || Number(collectAmt) <= 0) { toast.warning("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const res = await axios.post(`${BASE}/admin/fees/collect`, {
        studentId: selStudent.studentId,
        month,
        amount: Number(collectAmt),
        paymentMethod: payMethod,
        remarks: payRemarks,
      }, { headers: h() });
      toast.success(res.data.message);
      setCollectModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Collection failed"); }
    finally { setSaving(false); }
  };

  const yearOptions = [new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <div className="fees-page">
      {/* Controls */}
      <div className="fees-controls">
        <select className="form-select" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="">Select batch</option>
          {batches.filter((b) => b.status === "active").map((b) => (
            <option key={b._id} value={b._id}>{b.batchName}</option>
          ))}
        </select>
        <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
          {yearOptions.map((y) =>
            MONTHS.map((m) => (
              <option key={`${m} ${y}`} value={`${m} ${y}`}>{m} {y}</option>
            ))
          )}
        </select>
        <button className="btn btn-secondary" onClick={generateFees} disabled={!batchId || generating}>
          {generating ? "Generating..." : "⚡ Generate Fees"}
        </button>
      </div>

      {!batchId ? (
        <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-text">Select a batch to manage fees</div></div>
      ) : loading ? (
        <Spinner full />
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="fees-summary-row">
              <div className="fee-sum-card collected">
                <span className="fee-sum-val">₹{(summary.collected || 0).toLocaleString("en-IN")}</span>
                <span className="fee-sum-label">Collected</span>
              </div>
              <div className="fee-sum-card outstanding">
                <span className="fee-sum-val">₹{(summary.outstanding || 0).toLocaleString("en-IN")}</span>
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
              {/* <FeeChart paid={summary.paid} partial={summary.partial} pending={summary.pending} title="" /> */}
            </div>
          )}

          {/* Fee list */}
          <div className="fees-list">
            {feeData.map((d) => {
              const fee       = d.feeEntry;
              const due       = fee ? Math.max(0, fee.monthlyFee - fee.paidAmount) : d.monthlyFee;
              const status    = fee?.status || "not generated";
              const notGen    = !fee;
              return (
                <div key={d.studentId} className={`fee-student-card ${status}`}>
                  <div className="fee-student-left">
                    <div className="fee-avatar">{d.name[0]?.toUpperCase()}</div>
                    <div>
                      <div className="fee-student-name">{d.name}</div>
                      <div className="fee-student-phone">{d.phone}</div>
                      {d.advanceBalance > 0 && (
                        <div className="fee-advance">Advance: ₹{d.advanceBalance.toLocaleString("en-IN")}</div>
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
                          <span className="fee-amount-val">₹{fee.monthlyFee.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="fee-amount-item">
                          <span className="fee-amount-label">Paid</span>
                          <span className="fee-amount-val paid">₹{fee.paidAmount.toLocaleString("en-IN")}</span>
                        </div>
                        {due > 0 && (
                          <div className="fee-amount-item">
                            <span className="fee-amount-label">Balance</span>
                            <span className="fee-amount-val due">₹{due.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        <Badge status={status} />
                      </div>
                    )}

                    {!notGen && status !== "paid" && (
                      <button className="btn btn-success btn-sm" onClick={() => openCollect(d)}>
                        💵 Collect
                      </button>
                    )}
                    {/* {fee?.receiptNo && (
                      <div className="fee-receipt">🧾 {fee.receiptNo}</div>
                    )} */}
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
        </>
      )}

      {/* Collect Modal */}
      <Modal open={collectModal} onClose={() => setCollectModal(false)} title={`Collect Fee — ${selStudent?.name}`}
        footer={<>
          <button className="btn btn-outline" onClick={() => setCollectModal(false)}>Cancel</button>
          <button className="btn btn-success" disabled={saving} onClick={collectFee}>
            {saving ? "Saving..." : "Collect Payment"}
          </button>
        </>}>
        {selStudent && (
          <div>
            <div className="collect-info-row">
              <div><span className="collect-label">Month</span><span className="collect-val">{month}</span></div>
              <div><span className="collect-label">Monthly Fee</span><span className="collect-val">₹{(selStudent.feeEntry?.monthlyFee || selStudent.monthlyFee || 0).toLocaleString("en-IN")}</span></div>
              <div><span className="collect-label">Already Paid</span><span className="collect-val" style={{ color: "var(--success)" }}>₹{(selStudent.feeEntry?.paidAmount || 0).toLocaleString("en-IN")}</span></div>
            </div>
            <div className="form-group">
              <label className="form-label">Amount to collect (₹) <span className="req">*</span></label>
              <input type="number" className="form-input" value={collectAmt}
                onChange={(e) => setCollectAmt(e.target.value)} placeholder="Enter amount" />
            </div>
            <div className="form-group">
              <label className="form-label">Payment method</label>
              <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Remarks (optional)</label>
              <input className="form-input" placeholder="Any notes" value={payRemarks}
                onChange={(e) => setPayRemarks(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Fees;