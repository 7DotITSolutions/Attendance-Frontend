// =============================================================
// FILE: src/pages/coach/CoachFees.jsx
// PURPOSE: Coach collects fees for students in their batches.
//          Coach cannot generate fees — admin does that.
//          Shows paid/partial/pending per student for a month.
//          Collect payment modal with amount + payment method.
// =============================================================

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import "./CoachFees.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const currentMonthStr = () => {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const CoachFees = () => {
  const [searchParams] = useSearchParams();
  const [myBatches, setMyBatches]   = useState([]);
  const [feeData,   setFeeData]     = useState([]);
  const [batchId,   setBatchId]     = useState(searchParams.get("batchId") || "");
  const [month,     setMonth]       = useState(currentMonthStr());
  const [loading,   setLoading]     = useState(false);
  const [collectModal, setCollectModal] = useState(false);
  const [selStudent,   setSelStudent]   = useState(null);
  const [collectAmt,   setCollectAmt]   = useState("");
  const [payMethod,    setPayMethod]    = useState("cash");
  const [saving,       setSaving]       = useState(false);

  // Load coach's batches
  useEffect(() => {
    axios.get(`${BASE}/coach/dashboard`, { headers: h() })
      .then((r) => {
        const batches = (r.data.batchStats || []).map((b) => ({
          _id: b.batchId, batchName: b.batchName,
        }));
        setMyBatches(batches);
      }).catch(() => {});
  }, []);

  const load = async () => {
    if (!batchId || !month) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE}/coach/fees/batch/${batchId}?month=${encodeURIComponent(month)}`,
        { headers: h() }
      );
      setFeeData(res.data.data || []);
    } catch { toast.error("Failed to load fees"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [batchId, month]);

  const openCollect = (student) => {
    setSelStudent(student);
    const due = Math.max(0, (student.feeEntry?.monthlyFee || student.monthlyFee) - (student.feeEntry?.paidAmount || 0));
    setCollectAmt(due.toString());
    setPayMethod("cash");
    setCollectModal(true);
  };

  const collectFee = async () => {
    if (!collectAmt || Number(collectAmt) <= 0) { toast.warning("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const res = await axios.post(`${BASE}/coach/fees/collect`, {
        studentId: selStudent.studentId,
        month,
        amount: Number(collectAmt),
        paymentMethod: payMethod,
      }, { headers: h() });
      toast.success(res.data.message);
      setCollectModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Collection failed"); }
    finally { setSaving(false); }
  };

  const paid    = feeData.filter((d) => d.feeEntry?.status === "paid").length;
  const partial = feeData.filter((d) => d.feeEntry?.status === "partial").length;
  const pending = feeData.filter((d) => !d.feeEntry || d.feeEntry?.status === "pending").length;
  const yearOptions = [new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <div className="coach-fees-page">
      {/* Controls */}
      <div className="cf-controls">
        <select className="form-select" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="">Select batch</option>
          {myBatches.map((b) => <option key={b._id} value={b._id}>{b.batchName}</option>)}
        </select>
        <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
          {yearOptions.map((y) => MONTHS.map((m) => (
            <option key={`${m} ${y}`} value={`${m} ${y}`}>{m} {y}</option>
          )))}
        </select>
      </div>

      {!batchId ? (
        <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-text">Select a batch to collect fees</div></div>
      ) : loading ? (
        <Spinner full />
      ) : (
        <>
          {/* Mini summary */}
          {feeData.length > 0 && (
            <div className="cf-summary">
              <div className="cf-sum-item paid"><span className="cf-sum-val">{paid}</span><span className="cf-sum-label">Paid</span></div>
              <div className="cf-sum-item partial"><span className="cf-sum-val">{partial}</span><span className="cf-sum-label">Partial</span></div>
              <div className="cf-sum-item pending"><span className="cf-sum-val">{pending}</span><span className="cf-sum-label">Pending</span></div>
              <div className="cf-sum-item"><span className="cf-sum-val">{feeData.length}</span><span className="cf-sum-label">Total</span></div>
            </div>
          )}

          {/* Student fee cards */}
          <div className="cf-list">
            {feeData.map((d) => {
              const fee    = d.feeEntry;
              const status = fee?.status || "not generated";
              const due    = fee ? Math.max(0, fee.monthlyFee - fee.paidAmount) : 0;
              const notGen = !fee;
              return (
                <div key={d.studentId} className={`cf-card ${status}`}>
                  <div className="cf-card-left">
                    <div className="cf-avatar">{d.name[0]?.toUpperCase()}</div>
                    <div>
                      <div className="cf-name">{d.name}</div>
                      <div className="cf-phone">{d.phone}</div>
                      {d.advanceBalance > 0 && (
                        <div className="cf-advance">Advance ₹{d.advanceBalance.toLocaleString("en-IN")}</div>
                      )}
                    </div>
                  </div>

                  <div className="cf-card-right">
                    {notGen ? (
                      <span className="badge badge-gray" style={{ fontSize: "0.7rem" }}>Ask admin to generate</span>
                    ) : (
                      <div className="cf-amounts">
                        <div><span className="cf-amt-label">Due</span><span className="cf-amt-val">₹{fee.monthlyFee.toLocaleString("en-IN")}</span></div>
                        <div><span className="cf-amt-label">Paid</span><span className="cf-amt-val" style={{ color: "var(--success)" }}>₹{fee.paidAmount.toLocaleString("en-IN")}</span></div>
                        {due > 0 && <div><span className="cf-amt-label">Balance</span><span className="cf-amt-val" style={{ color: "var(--danger)" }}>₹{due.toLocaleString("en-IN")}</span></div>}
                        <Badge status={status} />
                      </div>
                    )}
                    {!notGen && status !== "paid" && (
                      <button className="btn btn-success btn-sm" onClick={() => openCollect(d)}>💵 Collect</button>
                    )}
                  </div>
                </div>
              );
            })}
            {!feeData.length && (
              <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-text">No fee data. Admin needs to generate fees first.</div></div>
            )}
          </div>
        </>
      )}

      <Modal open={collectModal} onClose={() => setCollectModal(false)} title={`Collect — ${selStudent?.name}`}
        footer={<>
          <button className="btn btn-outline" onClick={() => setCollectModal(false)}>Cancel</button>
          <button className="btn btn-success" disabled={saving} onClick={collectFee}>{saving ? "Saving..." : "Collect"}</button>
        </>}>
        {selStudent && (
          <div>
            <div style={{ background: "var(--gray-50)", padding: "0.875rem", borderRadius: "10px", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>Month: <strong>{month}</strong></p>
              <p style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>Already paid: <strong style={{ color: "var(--success)" }}>₹{(selStudent.feeEntry?.paidAmount || 0).toLocaleString("en-IN")}</strong></p>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹) <span className="req">*</span></label>
              <input type="number" className="form-input" value={collectAmt} onChange={(e) => setCollectAmt(e.target.value)} />
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CoachFees;