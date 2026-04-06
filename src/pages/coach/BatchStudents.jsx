// =============================================================
// FILE: src/pages/coach/BatchStudents.jsx
// PURPOSE: Coach views and manages students in their batch.
//          Add / Edit / Delete students directly.
//          Bulk import from Excel using xlsx library.
//          All API calls use /coach/* endpoints (coach-scoped).
// =============================================================

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Modal   from "../../components/ui/Modal";
import Badge   from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import "./BatchStudents.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const BatchStudents = () => {
  const { batchId } = useParams();
  const navigate    = useNavigate();
  const fileInputRef = useRef(null);

  const [batch,      setBatch]      = useState(null);
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");

  // Add / Edit modal
  const [modal,      setModal]      = useState(false);
  const [editStudent,setEditStudent]= useState(null);
  const [saving,     setSaving]     = useState(false);

  // Bulk import
  const [bulkModal,  setBulkModal]  = useState(false);
  const [bulkRows,   setBulkRows]   = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // ── Load batch + students ─────────────────────────────
  const load = () => {
    setLoading(true);
    axios
      .get(`${BASE}/coach/batch/${batchId}/students`, { headers: h() })
      .then((r) => {
        setBatch(r.data.batch);
        setStudents(r.data.students || []);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load batch");
        navigate("/coach-dashboard");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [batchId]);

  // ── Open add modal ────────────────────────────────────
  const openAdd = () => {
    setEditStudent(null);
    reset({
      name: "", fatherName: "", phone: "",
      motherName: "", schoolName: "", address: "", DOB: "", monthlyFee: "",
    });
    setModal(true);
  };

  // ── Open edit modal ───────────────────────────────────
  const openEdit = (s) => {
    setEditStudent(s);
    reset({
      name:        s.name,
      fatherName:  s.fatherName,
      motherName:  s.motherName  || "",
      phone:       s.phone,
      schoolName:  s.schoolName  || "",
      address:     s.address     || "",
      DOB:         s.DOB         || "",
      monthlyFee:  s.monthlyFee  || "",
    });
    setModal(true);
  };

  // ── Save (add or edit) ────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editStudent) {
        await axios.put(
          `${BASE}/coach/student/${editStudent._id}`,
          data,
          { headers: h() }
        );
        toast.success("Student updated");
      } else {
        await axios.post(
          `${BASE}/coach/batch/${batchId}/students`,
          data,
          { headers: h() }
        );
        toast.success("Student enrolled");
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete student ────────────────────────────────────
  const deleteStudent = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${BASE}/coach/student/${id}`, { headers: h() });
      toast.success("Student deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  // ── Excel import ──────────────────────────────────────
  const handleExcelFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb   = XLSX.read(evt.target.result, { type: "binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);

        if (!rows.length) {
          toast.warning("Excel file is empty");
          return;
        }

        // Normalize headers — handle case variations
        const normalized = rows.map((row) => {
          const lower = {};
          Object.keys(row).forEach((k) => {
            lower[k.toLowerCase().replace(/\s+/g, "")] = row[k];
          });
          return {
            name:        lower["name"]        || lower["studentname"] || "",
            fatherName:  lower["fathername"]  || lower["father"]      || "",
            motherName:  lower["mothername"]  || lower["mother"]      || "",
            phone:       lower["phone"]?.toString() || lower["mobile"]?.toString() || "",
            schoolName:  lower["schoolname"]  || lower["school"]      || "",
            address:     lower["address"]     || "",
            DOB:         lower["dob"]         || lower["dateofbirth"] || "",
            monthlyFee:  lower["monthlyfee"]  || lower["fee"]         || "",
          };
        });

        setBulkRows(normalized);
        setBulkModal(true);
      } catch {
        toast.error("Failed to parse Excel file");
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input so same file can be re-selected
    e.target.value = "";
  };

  const confirmBulkImport = async () => {
    if (!bulkRows.length) return;
    setBulkSaving(true);
    try {
      const res = await axios.post(
        `${BASE}/coach/batch/${batchId}/students/bulk`,
        { students: bulkRows },
        { headers: h() }
      );
      toast.success(res.data.message);
      if (res.data.skippedReasons?.length) {
        console.log("Skipped:", res.data.skippedReasons);
      }
      setBulkModal(false);
      setBulkRows([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk import failed");
    } finally {
      setBulkSaving(false);
    }
  };

  // ── Download Excel template ───────────────────────────
  const downloadTemplate = () => {
    const template = [
      {
        name: "John Doe",
        fatherName: "James Doe",
        motherName: "Jane Doe",
        phone: "9876543210",
        schoolName: "ABC School",
        address: "123 Main St",
        DOB: "2010-05-15",
        monthlyFee: "1000",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student-import-template.xlsx");
  };

  if (loading) return <Spinner full />;

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.fatherName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/coach-dashboard")}
            style={{ marginBottom: "0.5rem" }}
          >
            ← Dashboard
          </button>
          <h1 className="page-title">{batch?.batchName}</h1>
          <p className="page-subtitle">
            {batch?.timing || "Timing not set"} · {students.length} students
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>
            ⬇ Template
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            📊 Import Excel
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            + Add Student
          </button>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleExcelFile}
          />
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="bs-actions">
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/coach/attendance?batchId=${batchId}`)}
        >
          📋 Mark Attendance
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/coach/fees?batchId=${batchId}`)}
        >
          💰 Collect Fees
        </button>
      </div>

      {/* Search */}
      <div className="search-wrap" style={{ marginBottom: "1rem", width: "100%" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="form-input search-input"
          style={{ width: "100%" }}
          placeholder="Search by name, phone or father name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Student list */}
      <div className="bs-list">
        {filtered.map((s, i) => (
          <div key={s._id} className="bs-card">
            <div className="bs-card-left">
              <div className="bs-serial">{i + 1}</div>
              <div className="bs-avatar">{s.name[0].toUpperCase()}</div>
              <div>
                <div className="bs-name">{s.name}</div>
                <div className="bs-sub">S/o {s.fatherName} · {s.phone}</div>
                <div className="bs-fee">
                  ₹{(s.monthlyFee || 0).toLocaleString("en-IN")}/month
                  {s.advanceBalance > 0 && (
                    <span style={{ color: "var(--success)", marginLeft: "0.5rem" }}>
                      · Adv: ₹{s.advanceBalance.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
              <Badge status={s.status} />
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteStudent(s._id, s.name)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <div className="empty-text">
              {search ? "No students match your search" : "No students yet. Add your first student."}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editStudent ? `Edit — ${editStudent.name}` : "Enroll New Student"}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleSubmit(onSubmit)}>
              {saving ? "Saving..." : editStudent ? "Save Changes" : "Enroll Student"}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Student name <span className="req">*</span></label>
            <input className={`form-input ${errors.name ? "error" : ""}`}
              placeholder="Full name"
              {...register("name", { required: "Name is required" })} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Father name <span className="req">*</span></label>
            <input className={`form-input ${errors.fatherName ? "error" : ""}`}
              placeholder="Father's full name"
              {...register("fatherName", { required: "Father name is required" })} />
            {errors.fatherName && <p className="form-error">{errors.fatherName.message}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone <span className="req">*</span></label>
            <input className={`form-input ${errors.phone ? "error" : ""}`}
              placeholder="10-digit number"
              {...register("phone", { required: "Phone is required" })} />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Mother name</label>
            <input className="form-input" placeholder="Mother's name (optional)"
              {...register("motherName")} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Monthly fee (₹)</label>
            <input type="number" className="form-input"
              placeholder={batch?.fee || "0"}
              {...register("monthlyFee")} />
          </div>
          <div className="form-group">
            <label className="form-label">Date of birth</label>
            <input type="date" className="form-input" {...register("DOB")} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">School name</label>
          <input className="form-input" placeholder="School name (optional)"
            {...register("schoolName")} />
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea className="form-textarea" rows={2}
            placeholder="Home address (optional)"
            {...register("address")} />
        </div>
      </Modal>

      {/* Bulk Import Preview Modal */}
      <Modal
        open={bulkModal}
        onClose={() => { setBulkModal(false); setBulkRows([]); }}
        title={`Import ${bulkRows.length} Students`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline"
              onClick={() => { setBulkModal(false); setBulkRows([]); }}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={bulkSaving}
              onClick={confirmBulkImport}>
              {bulkSaving ? "Importing..." : `Import ${bulkRows.length} Students`}
            </button>
          </>
        }
      >
        <p style={{ fontSize: "0.82rem", color: "var(--gray-500)", marginBottom: "1rem" }}>
          Review the students below before importing. Students with duplicate phone numbers in this batch will be skipped automatically.
        </p>
        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Father</th>
                <th>Phone</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {bulkRows.map((r, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--gray-400)", fontSize: "0.8rem" }}>{i + 1}</td>
                  <td>{r.name || <span style={{ color: "var(--danger)" }}>Missing</span>}</td>
                  <td style={{ fontSize: "0.82rem" }}>{r.fatherName || "—"}</td>
                  <td style={{ fontSize: "0.82rem" }}>
                    {r.phone || <span style={{ color: "var(--danger)" }}>Missing</span>}
                  </td>
                  <td style={{ fontSize: "0.82rem" }}>
                    {r.monthlyFee ? `₹${r.monthlyFee}` : `₹${batch?.fee || 0} (default)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default BatchStudents;