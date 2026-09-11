"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatCurrency, formatDateTime } from "../../../_lib/format";
import { amountInWords } from "../../../_lib/numberToWords";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface DocType {
  key: string;
  label: string;
}

interface ExhibitorProfile {
  id: number;
  display_name: string;
  legal_name: string;
  company_email: string | null;
  profile_status: string;
}

interface GeneratedDocRow {
  id: number;
  document_type: string;
  document_number: string | null;
  status: "draft" | "finalized" | "void";
  version: number;
  created_at: string;
  finalized_at: string | null;
  exhibitor_profile_id: number;
  pdf_document_upload_id: number | null;
  company_name: string;
  created_by_name: string | null;
}

interface PrefillResponse {
  exhibitor: {
    companyName: string;
    addressLines: string[];
    gstin: string | null;
    stateDisplay: string | null;
    gstStateCode: string | null;
    category: string;
    msmeRegNo: string | null;
    contactName: string | null;
    contactDesignation: string | null;
    contactEmail: string | null;
    contactMobile: string | null;
    contactTel: string | null;
    boothNo: string | null;
    areaSqm: number | null;
    rawShell: string;
    suggestedRatePerSqm: number | null;
  };
  event: { showName: string; eventDatesText: string };
  organiser: { homeStateCode: string; standardGstRatePct: number; defaultHsnSac: string };
}

interface LineItem {
  particular: string;
  boothNo: string;
  areaSqm: number | "";
  rawShell: string;
  ratePerSqm: number | "";
  hsnSac: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmt: number;
  sgstRate: number;
  sgstAmt: number;
  igstRate: number;
  igstAmt: number;
}

interface PaymentRow {
  description: string;
  amount: number | "";
}

interface ExhibitorFields {
  companyName: string;
  addressText: string;
  gstin: string;
  stateDisplay: string;
  category: string;
  msmeRegNo: string;
  showName: string;
  eventDatesText: string;
  contactTel: string;
  contactName: string;
  contactDesignation: string;
  contactEmail: string;
  contactMobile: string;
}

interface FormState {
  dateText: string;
  placeOfSupply: string;
  exhibitor: ExhibitorFields;
  lineItems: LineItem[];
  paymentSchedule: PaymentRow[];
  reverseChargeTax: number;
}

function todayLongDate() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function computeLineAmounts(item: LineItem): LineItem {
  const area = item.areaSqm === "" ? 0 : Number(item.areaSqm);
  const rate = item.ratePerSqm === "" ? 0 : Number(item.ratePerSqm);
  const taxableValue = item.taxableValue || Math.round(area * rate);
  return {
    ...item,
    cgstAmt: Math.round((taxableValue * item.cgstRate) / 100),
    sgstAmt: Math.round((taxableValue * item.sgstRate) / 100),
    igstAmt: Math.round((taxableValue * item.igstRate) / 100)
  };
}

function buildInitialForm(prefill: PrefillResponse, orgCategory: string, defaultHsnSac: string, homeStateCode: string, standardRate: number): FormState {
  const sameState = prefill.exhibitor.gstStateCode && prefill.exhibitor.gstStateCode === homeStateCode;
  const area = prefill.exhibitor.areaSqm || "";
  const rate = prefill.exhibitor.suggestedRatePerSqm || "";
  const taxableValue = area && rate ? Math.round(Number(area) * Number(rate)) : 0;

  const lineItem: LineItem = {
    particular: "Participation Fee",
    boothNo: prefill.exhibitor.boothNo || "",
    areaSqm: area,
    rawShell: prefill.exhibitor.rawShell || "",
    ratePerSqm: rate,
    hsnSac: defaultHsnSac,
    taxableValue,
    cgstRate: sameState ? standardRate / 2 : 0,
    cgstAmt: 0,
    sgstRate: sameState ? standardRate / 2 : 0,
    sgstAmt: 0,
    igstRate: sameState ? 0 : standardRate,
    igstAmt: 0
  };

  return {
    dateText: todayLongDate(),
    placeOfSupply: prefill.exhibitor.stateDisplay || "",
    exhibitor: {
      companyName: prefill.exhibitor.companyName,
      addressText: prefill.exhibitor.addressLines.join("\n"),
      gstin: prefill.exhibitor.gstin || "",
      stateDisplay: prefill.exhibitor.stateDisplay || "",
      category: prefill.exhibitor.category || orgCategory,
      msmeRegNo: prefill.exhibitor.msmeRegNo || "",
      showName: prefill.event.showName,
      eventDatesText: prefill.event.eventDatesText,
      contactTel: prefill.exhibitor.contactTel || "",
      contactName: prefill.exhibitor.contactName || "",
      contactDesignation: prefill.exhibitor.contactDesignation || "",
      contactEmail: prefill.exhibitor.contactEmail || "",
      contactMobile: prefill.exhibitor.contactMobile || ""
    },
    lineItems: [computeLineAmounts(lineItem)],
    paymentSchedule: [],
    reverseChargeTax: 0
  };
}

function snapshotFromForm(form: FormState) {
  const totals = form.lineItems.reduce(
    (acc, i) => ({
      taxableValue: acc.taxableValue + i.taxableValue,
      cgstAmt: acc.cgstAmt + i.cgstAmt,
      sgstAmt: acc.sgstAmt + i.sgstAmt,
      igstAmt: acc.igstAmt + i.igstAmt
    }),
    { taxableValue: 0, cgstAmt: 0, sgstAmt: 0, igstAmt: 0 }
  );
  const grandTotal = totals.taxableValue + totals.cgstAmt + totals.sgstAmt + totals.igstAmt;

  return {
    dateText: form.dateText,
    placeOfSupply: form.placeOfSupply,
    exhibitor: {
      companyName: form.exhibitor.companyName,
      addressLines: form.exhibitor.addressText.split("\n").map((l) => l.trim()).filter(Boolean),
      gstin: form.exhibitor.gstin,
      stateDisplay: form.exhibitor.stateDisplay,
      category: form.exhibitor.category,
      msmeRegNo: form.exhibitor.msmeRegNo,
      showName: form.exhibitor.showName,
      eventDatesText: form.exhibitor.eventDatesText,
      contactTel: form.exhibitor.contactTel,
      contactName: form.exhibitor.contactName,
      contactDesignation: form.exhibitor.contactDesignation,
      contactEmail: form.exhibitor.contactEmail,
      contactMobile: form.exhibitor.contactMobile
    },
    lineItems: form.lineItems.map((i) => ({
      particular: i.particular,
      boothNo: i.boothNo,
      areaSqm: i.areaSqm === "" ? null : Number(i.areaSqm),
      rawShell: i.rawShell,
      ratePerSqm: i.ratePerSqm === "" ? null : Number(i.ratePerSqm),
      hsnSac: i.hsnSac,
      taxableValue: i.taxableValue,
      cgstRate: i.cgstRate,
      cgstAmt: i.cgstAmt,
      sgstRate: i.sgstRate,
      sgstAmt: i.sgstAmt,
      igstRate: i.igstRate,
      igstAmt: i.igstAmt
    })),
    totals: { ...totals, grandTotal },
    totalInWords: amountInWords(grandTotal),
    reverseChargeTax: form.reverseChargeTax,
    paymentSchedule: form.paymentSchedule
      .filter((p) => p.description)
      .map((p) => ({ description: p.description, amount: p.amount === "" ? 0 : Number(p.amount) }))
  };
}

function formFromSnapshot(data: ReturnType<typeof snapshotFromForm> & Record<string, unknown>): FormState {
  const exhibitor = data.exhibitor as ExhibitorFields & { addressLines?: string[] };
  return {
    dateText: (data.dateText as string) || todayLongDate(),
    placeOfSupply: (data.placeOfSupply as string) || "",
    exhibitor: {
      companyName: exhibitor.companyName || "",
      addressText: (exhibitor.addressLines || []).join("\n"),
      gstin: exhibitor.gstin || "",
      stateDisplay: exhibitor.stateDisplay || "",
      category: exhibitor.category || "",
      msmeRegNo: exhibitor.msmeRegNo || "",
      showName: exhibitor.showName || "",
      eventDatesText: exhibitor.eventDatesText || "",
      contactTel: exhibitor.contactTel || "",
      contactName: exhibitor.contactName || "",
      contactDesignation: exhibitor.contactDesignation || "",
      contactEmail: exhibitor.contactEmail || "",
      contactMobile: exhibitor.contactMobile || ""
    },
    lineItems: ((data.lineItems as LineItem[]) || []).map((i) => ({
      particular: i.particular || "",
      boothNo: i.boothNo || "",
      areaSqm: i.areaSqm ?? "",
      rawShell: i.rawShell || "",
      ratePerSqm: i.ratePerSqm ?? "",
      hsnSac: i.hsnSac || "",
      taxableValue: i.taxableValue || 0,
      cgstRate: i.cgstRate || 0,
      cgstAmt: i.cgstAmt || 0,
      sgstRate: i.sgstRate || 0,
      sgstAmt: i.sgstAmt || 0,
      igstRate: i.igstRate || 0,
      igstAmt: i.igstAmt || 0
    })),
    paymentSchedule: ((data.paymentSchedule as PaymentRow[]) || []).map((p) => ({ description: p.description, amount: p.amount ?? "" })),
    reverseChargeTax: (data.reverseChargeTax as number) || 0
  };
}

export default function DocumentGeneratorPage() {
  const [view, setView] = useState<"list" | "pick-exhibitor" | "form">("list");
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [rows, setRows] = useState<GeneratedDocRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [profiles, setProfiles] = useState<ExhibitorProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [picking, setPicking] = useState(false);

  const [docId, setDocId] = useState<number | null>(null);
  const [docStatus, setDocStatus] = useState<"draft" | "finalized" | "void">("draft");
  const [docNumber, setDocNumber] = useState<string | null>(null);
  const [pdfUploadId, setPdfUploadId] = useState<number | null>(null);
  const [companyLabel, setCompanyLabel] = useState("");
  const [homeStateCode, setHomeStateCode] = useState("07");
  const [standardGstRate, setStandardGstRate] = useState(18);
  const [exhibitorGstStateCode, setExhibitorGstStateCode] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const previewUrlRef = useRef<string | null>(null);

  function loadList() {
    setLoadingList(true);
    api
      .get<{ documents: GeneratedDocRow[] }>("/admin/generated-documents?pageSize=200")
      .then((body) => setRows(body.documents))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load documents."))
      .finally(() => setLoadingList(false));
  }

  useEffect(() => {
    // Standard fetch-on-mount: the setState calls inside loadList() and the
    // .then() below happen after each request resolves, not synchronously
    // in this effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadList();
    api
      .get<{ types: DocType[] }>("/admin/generated-documents/types")
      .then((body) => {
        setDocTypes(body.types);
        if (body.types[0]) setSelectedType(body.types[0].key);
      })
      .catch(() => {});
  }, []);

  function backToList() {
    setView("list");
    setForm(null);
    setDocId(null);
    setError("");
    loadList();
  }

  function startNew() {
    setError("");
    setView("pick-exhibitor");
    setLoadingProfiles(true);
    api
      .get<{ profiles: ExhibitorProfile[] }>("/exhibitors")
      .then((body) => setProfiles(body.profiles))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load exhibitors."))
      .finally(() => setLoadingProfiles(false));
  }

  async function pickExhibitor(profile: ExhibitorProfile) {
    setPicking(true);
    setError("");
    try {
      const prefill = await api.get<PrefillResponse>(
        `/admin/generated-documents/prefill/${profile.id}?documentType=${selectedType}`,
        { silent: true }
      );
      const initialForm = buildInitialForm(prefill, prefill.exhibitor.category, prefill.organiser.defaultHsnSac, prefill.organiser.homeStateCode, prefill.organiser.standardGstRatePct);
      const created = await api.post<{ id: number }>(
        "/admin/generated-documents",
        { exhibitorProfileId: profile.id, documentType: selectedType, data: snapshotFromForm(initialForm) },
        { silent: true }
      );
      setDocId(created.id);
      setDocStatus("draft");
      setDocNumber(null);
      setPdfUploadId(null);
      setCompanyLabel(profile.display_name);
      setHomeStateCode(prefill.organiser.homeStateCode);
      setStandardGstRate(prefill.organiser.standardGstRatePct);
      setExhibitorGstStateCode(prefill.exhibitor.gstStateCode);
      setForm(initialForm);
      setView("form");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start a new document.");
    } finally {
      setPicking(false);
    }
  }

  async function editExisting(row: GeneratedDocRow) {
    setError("");
    try {
      const body = await api.get<{ document: { data: Record<string, unknown> } }>(`/admin/generated-documents/${row.id}`, { silent: true });
      setDocId(row.id);
      setDocStatus(row.status);
      setDocNumber(row.document_number);
      setPdfUploadId(row.pdf_document_upload_id);
      setCompanyLabel(row.company_name);
      setSelectedType(row.document_type);
      setForm(formFromSnapshot(body.document.data as never));
      setView("form");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load document.");
    }
  }

  async function voidDoc(row: GeneratedDocRow) {
    if (!confirm(`Void ${row.document_number || "this draft"} for ${row.company_name}? This cannot be undone.`)) return;
    try {
      await api.post(`/admin/generated-documents/${row.id}/void`);
      loadList();
    } catch {
      // apiClient already toasts the error
    }
  }

  function updateExhibitorField<K extends keyof ExhibitorFields>(key: K, value: ExhibitorFields[K]) {
    setForm((f) => (f ? { ...f, exhibitor: { ...f.exhibitor, [key]: value } } : f));
  }

  function updateLineItem(index: number, patch: Partial<LineItem>) {
    setForm((f) => {
      if (!f) return f;
      const lineItems = f.lineItems.map((item, i) => {
        if (i !== index) return item;
        const merged = { ...item, ...patch };
        // Recompute the suggested taxable value whenever area/rate changes,
        // but leave it alone if the admin is editing taxableValue directly.
        if ("areaSqm" in patch || "ratePerSqm" in patch) {
          const area = merged.areaSqm === "" ? 0 : Number(merged.areaSqm);
          const rate = merged.ratePerSqm === "" ? 0 : Number(merged.ratePerSqm);
          merged.taxableValue = Math.round(area * rate);
        }
        return computeLineAmounts(merged);
      });
      return { ...f, lineItems };
    });
  }

  function addLineItem() {
    const sameState = exhibitorGstStateCode && exhibitorGstStateCode === homeStateCode;
    const blank: LineItem = {
      particular: "",
      boothNo: form?.lineItems[0]?.boothNo || "",
      areaSqm: "",
      rawShell: form?.lineItems[0]?.rawShell || "",
      ratePerSqm: "",
      hsnSac: form?.lineItems[0]?.hsnSac || "998596",
      taxableValue: 0,
      cgstRate: sameState ? standardGstRate / 2 : 0,
      cgstAmt: 0,
      sgstRate: sameState ? standardGstRate / 2 : 0,
      sgstAmt: 0,
      igstRate: sameState ? 0 : standardGstRate,
      igstAmt: 0
    };
    setForm((f) => (f ? { ...f, lineItems: [...f.lineItems, blank] } : f));
  }

  function removeLineItem(index: number) {
    setForm((f) => (f ? { ...f, lineItems: f.lineItems.filter((_, i) => i !== index) } : f));
  }

  function addPaymentRow() {
    setForm((f) => (f ? { ...f, paymentSchedule: [...f.paymentSchedule, { description: "", amount: "" }] } : f));
  }

  function updatePaymentRow(index: number, patch: Partial<PaymentRow>) {
    setForm((f) => (f ? { ...f, paymentSchedule: f.paymentSchedule.map((p, i) => (i === index ? { ...p, ...patch } : p)) } : f));
  }

  function removePaymentRow(index: number) {
    setForm((f) => (f ? { ...f, paymentSchedule: f.paymentSchedule.filter((_, i) => i !== index) } : f));
  }

  const snapshot = useMemo(() => (form ? snapshotFromForm(form) : null), [form]);

  // Debounced live preview: re-renders the actual PDF (via the stateless
  // /preview endpoint — nothing is saved or numbered) a moment after the
  // admin stops typing, so the side panel always shows what finalizing
  // would currently produce.
  useEffect(() => {
    if (view !== "form" || !snapshot || docStatus === "void") return;
    // Shown immediately so the side panel doesn't look stale while the
    // debounce timer is pending — the actual fetch is what's async.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewLoading(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .postForBlob("/admin/generated-documents/preview", { documentType: selectedType, data: snapshot })
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = url;
          setPreviewUrl(url);
          setPreviewError("");
        })
        .catch((err) => {
          if (!cancelled) setPreviewError(err instanceof ApiError ? err.message : "Failed to render preview.");
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [snapshot, view, docStatus, selectedType]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  async function saveDraft() {
    if (!docId || !snapshot) return;
    setSaving(true);
    setError("");
    try {
      await api.patch(`/admin/generated-documents/${docId}`, { data: snapshot });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function finalize() {
    if (!docId || !snapshot) return;
    if (!confirm(docNumber ? "Regenerate this document? The document number stays the same." : "Finalize and generate the PDF? A document number will be assigned.")) return;
    setFinalizing(true);
    setError("");
    try {
      const body = await api.post<{ documentNumber: string; pdfDocumentUploadId: number }>(`/admin/generated-documents/${docId}/finalize`, { data: snapshot });
      setDocStatus("finalized");
      setDocNumber(body.documentNumber);
      setPdfUploadId(body.pdfDocumentUploadId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to finalize document.");
    } finally {
      setFinalizing(false);
    }
  }

  const columns: DataTableColumn<GeneratedDocRow>[] = [
    { key: "company_name", label: "Exhibitor" },
    { key: "document_type", label: "Type", render: (r) => docTypes.find((t) => t.key === r.document_type)?.label || r.document_type },
    { key: "document_number", label: "Number", render: (r) => r.document_number || <span className="text-muted">—</span> },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const cls = r.status === "finalized" ? "badge-success" : r.status === "void" ? "badge-secondary" : "badge-warning";
        return <span className={`badge ${cls}`} style={{ textTransform: "capitalize" }}>{r.status}{r.version > 1 ? ` (v${r.version})` : ""}</span>;
      }
    },
    { key: "created_by_name", label: "Generated By", render: (r) => r.created_by_name || "—" },
    { key: "finalized_at", label: "Finalized", render: (r) => (r.finalized_at ? formatDateTime(r.finalized_at) : "—") }
  ];

  const profileColumns: DataTableColumn<ExhibitorProfile>[] = [
    { key: "display_name", label: "Company" },
    { key: "legal_name", label: "Legal Name" },
    { key: "company_email", label: "Email", render: (p) => p.company_email || "—" },
    { key: "profile_status", label: "Status" }
  ];

  if (view === "list") {
    return (
      <>
        <div className="content-header d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 className="content-title">Generate Documents</h1>
            <p className="content-subtitle">Generate a Proforma Invoice (and future document types) for a specific exhibitor from the system&apos;s own templates.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={startNew}>
            <i className="bx bx-plus" /> New Document
          </button>
        </div>

        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <DataTable
          columns={columns}
          rows={rows}
          keyField={(r) => r.id}
          loading={loadingList}
          searchPlaceholder="Search generated documents…"
          emptyMessage="No documents generated yet."
          actions={(r) => (
            <div className="d-flex gap-2">
              {r.pdf_document_upload_id && (
                <a className="btn btn-sm btn-ghost" href={api.fileUrl(`/documents/${r.pdf_document_upload_id}/file`)} target="_blank" rel="noreferrer">
                  View PDF
                </a>
              )}
              {r.status !== "void" && (
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => editExisting(r)}>
                  Edit
                </button>
              )}
              {r.status !== "void" && (
                <button type="button" className="btn btn-sm btn-ghost" style={{ color: "var(--ez-danger)" }} onClick={() => voidDoc(r)}>
                  Void
                </button>
              )}
            </div>
          )}
        />
      </>
    );
  }

  if (view === "pick-exhibitor") {
    return (
      <>
        <div className="content-header d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 className="content-title">New Document</h1>
            <p className="content-subtitle">Pick a document type, then the exhibitor to generate it for.</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={backToList}>
            <i className="bx bx-chevron-left" /> Back to List
          </button>
        </div>

        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <div className="card mb-3">
          <div className="card-body">
            <div className="form-group" style={{ maxWidth: 320, marginBottom: 0 }}>
              <label className="form-label">Document Type</label>
              <select className="form-control form-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                {docTypes.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={profileColumns}
          rows={profiles}
          keyField={(p) => p.id}
          loading={loadingProfiles}
          searchPlaceholder="Search exhibitors…"
          emptyMessage="No exhibitors found."
          actions={(p) => (
            <button type="button" className="btn btn-sm btn-outline-primary" disabled={picking} onClick={() => pickExhibitor(p)}>
              {picking ? "Loading…" : "Select"}
            </button>
          )}
        />
      </>
    );
  }

  // view === "form"
  if (!form) return null;

  const totals = snapshot!.totals;

  return (
    <>
      <div className="content-header d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 className="content-title">{companyLabel}</h1>
          <p className="content-subtitle">
            {docTypes.find((t) => t.key === selectedType)?.label || selectedType}
            {docNumber ? ` — ${docNumber}` : " — draft, not yet finalized"}
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={backToList}>
          <i className="bx bx-chevron-left" /> Back to List
        </button>
      </div>

      {docStatus === "void" && <div className="alert alert-warning mb-3">This document has been voided and can no longer be edited.</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      {pdfUploadId && (
        <div className="alert alert-success mb-3">
          Last generated as <strong>{docNumber}</strong>.{" "}
          <a href={api.fileUrl(`/documents/${pdfUploadId}/file`)} target="_blank" rel="noreferrer">
            View PDF
          </a>
        </div>
      )}

      <div className="d-flex" style={{ gap: "1.25rem", alignItems: "flex-start", flexWrap: "wrap" }}>
      <fieldset disabled={docStatus === "void"} style={{ border: "none", padding: 0, margin: 0, flex: "1 1 520px", minWidth: 0 }}>
        <div className="card mb-3">
          <div className="card-header">
            <span className="card-title">Company &amp; Contact</span>
          </div>
          <div className="card-body">
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-control" value={form.exhibitor.companyName} onChange={(e) => updateExhibitorField("companyName", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-control" rows={3} value={form.exhibitor.addressText} onChange={(e) => updateExhibitorField("addressText", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN</label>
                <input className="form-control" value={form.exhibitor.gstin} onChange={(e) => updateExhibitorField("gstin", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">State (with GST code, e.g. Tamil Nadu-33)</label>
                <input
                  className="form-control"
                  value={form.exhibitor.stateDisplay}
                  onChange={(e) => {
                    updateExhibitorField("stateDisplay", e.target.value);
                    setForm((f) => (f ? { ...f, placeOfSupply: e.target.value } : f));
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category (Company or Firm)</label>
                <input className="form-control" value={form.exhibitor.category} onChange={(e) => updateExhibitorField("category", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">MSME Reg. No.</label>
                <input className="form-control" value={form.exhibitor.msmeRegNo} onChange={(e) => updateExhibitorField("msmeRegNo", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input className="form-control" value={form.exhibitor.contactName} onChange={(e) => updateExhibitorField("contactName", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-control" value={form.exhibitor.contactDesignation} onChange={(e) => updateExhibitorField("contactDesignation", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" value={form.exhibitor.contactEmail} onChange={(e) => updateExhibitorField("contactEmail", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile No</label>
                <input className="form-control" value={form.exhibitor.contactMobile} onChange={(e) => updateExhibitorField("contactMobile", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tel</label>
                <input className="form-control" value={form.exhibitor.contactTel} onChange={(e) => updateExhibitorField("contactTel", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input className="form-control" value={form.dateText} onChange={(e) => setForm((f) => (f ? { ...f, dateText: e.target.value } : f))} />
              </div>
              <div className="form-group">
                <label className="form-label">Show Name</label>
                <input className="form-control" value={form.exhibitor.showName} onChange={(e) => updateExhibitorField("showName", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Show Dates</label>
                <input className="form-control" value={form.exhibitor.eventDatesText} onChange={(e) => updateExhibitorField("eventDatesText", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header d-flex justify-between align-center">
            <span className="card-title">Line Items</span>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addLineItem}>
              <i className="bx bx-plus" /> Add Row
            </button>
          </div>
          <div className="card-body" style={{ overflowX: "auto" }}>
            <table className="table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>Particular</th>
                  <th>Booth No</th>
                  <th>Area (Sqm)</th>
                  <th>Raw/Shell</th>
                  <th>Rate/Sqm</th>
                  <th>SAC/HSN</th>
                  <th>Taxable Value</th>
                  <th>CGST %</th>
                  <th>SGST %</th>
                  <th>IGST %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {form.lineItems.map((item, i) => (
                  <tr key={i}>
                    <td style={{ minWidth: 160 }}>
                      <input className="form-control form-control-sm" value={item.particular} onChange={(e) => updateLineItem(i, { particular: e.target.value })} />
                    </td>
                    <td style={{ minWidth: 90 }}>
                      <input className="form-control form-control-sm" value={item.boothNo} onChange={(e) => updateLineItem(i, { boothNo: e.target.value })} />
                    </td>
                    <td style={{ minWidth: 90 }}>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={item.areaSqm}
                        onChange={(e) => updateLineItem(i, { areaSqm: e.target.value === "" ? "" : Number(e.target.value) })}
                      />
                    </td>
                    <td style={{ minWidth: 90 }}>
                      <select className="form-control form-control-sm form-select" value={item.rawShell} onChange={(e) => updateLineItem(i, { rawShell: e.target.value })}>
                        <option value="">—</option>
                        <option value="Raw">Raw</option>
                        <option value="Shell">Shell</option>
                      </select>
                    </td>
                    <td style={{ minWidth: 100 }}>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={item.ratePerSqm}
                        onChange={(e) => updateLineItem(i, { ratePerSqm: e.target.value === "" ? "" : Number(e.target.value) })}
                      />
                    </td>
                    <td style={{ minWidth: 90 }}>
                      <input className="form-control form-control-sm" value={item.hsnSac} onChange={(e) => updateLineItem(i, { hsnSac: e.target.value })} />
                    </td>
                    <td style={{ minWidth: 110 }}>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={item.taxableValue}
                        onChange={(e) => updateLineItem(i, { taxableValue: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td style={{ minWidth: 70 }}>
                      <input type="number" className="form-control form-control-sm" value={item.cgstRate} onChange={(e) => updateLineItem(i, { cgstRate: Number(e.target.value) || 0 })} />
                    </td>
                    <td style={{ minWidth: 70 }}>
                      <input type="number" className="form-control form-control-sm" value={item.sgstRate} onChange={(e) => updateLineItem(i, { sgstRate: Number(e.target.value) || 0 })} />
                    </td>
                    <td style={{ minWidth: 70 }}>
                      <input type="number" className="form-control form-control-sm" value={item.igstRate} onChange={(e) => updateLineItem(i, { igstRate: Number(e.target.value) || 0 })} />
                    </td>
                    <td>
                      <button type="button" className="btn btn-sm btn-ghost" style={{ color: "var(--ez-danger)" }} onClick={() => removeLineItem(i)}>
                        <i className="bx bx-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header">
            <span className="card-title">Totals</span>
          </div>
          <div className="card-body">
            <div className="grid grid-2">
              <div>
                <p className="mb-1">
                  <strong>Taxable Value:</strong> {formatCurrency(totals.taxableValue)}
                </p>
                <p className="mb-1">
                  <strong>CGST:</strong> {formatCurrency(totals.cgstAmt)} &nbsp; <strong>SGST:</strong> {formatCurrency(totals.sgstAmt)} &nbsp; <strong>IGST:</strong>{" "}
                  {formatCurrency(totals.igstAmt)}
                </p>
                <p className="mb-1">
                  <strong>Grand Total:</strong> {formatCurrency(totals.grandTotal)}
                </p>
                <p className="text-small text-muted mb-0">{snapshot!.totalInWords}</p>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount of Tax subject to Reverse Charges</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.reverseChargeTax}
                  onChange={(e) => setForm((f) => (f ? { ...f, reverseChargeTax: Number(e.target.value) || 0 } : f))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header d-flex justify-between align-center">
            <span className="card-title">Payment Schedule</span>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addPaymentRow}>
              <i className="bx bx-plus" /> Add Row
            </button>
          </div>
          <div className="card-body">
            {form.paymentSchedule.length === 0 && <p className="text-small text-muted mb-0">No payment schedule rows yet — optional.</p>}
            {form.paymentSchedule.map((row, i) => (
              <div key={i} className="d-flex gap-2 align-center mb-2">
                <input
                  className="form-control"
                  placeholder="e.g. 50% payment required on or before 24 September 2026"
                  value={row.description}
                  onChange={(e) => updatePaymentRow(i, { description: e.target.value })}
                />
                <input
                  type="number"
                  className="form-control"
                  style={{ maxWidth: 160 }}
                  value={row.amount}
                  onChange={(e) => updatePaymentRow(i, { amount: e.target.value === "" ? "" : Number(e.target.value) })}
                />
                <button type="button" className="btn btn-sm btn-ghost" style={{ color: "var(--ez-danger)" }} onClick={() => removePaymentRow(i)}>
                  <i className="bx bx-trash" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="d-flex gap-2 mb-4">
          <button type="button" className="btn btn-outline-primary" onClick={saveDraft} disabled={saving || finalizing}>
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button type="button" className="btn btn-primary" onClick={finalize} disabled={saving || finalizing}>
            {finalizing ? "Generating…" : docNumber ? "Regenerate PDF" : "Finalize & Generate PDF"}
          </button>
        </div>
      </fieldset>

      <div className="card" style={{ flex: "0 1 460px", minWidth: 320, position: "sticky", top: "1rem" }}>
        <div className="card-header d-flex justify-between align-center">
          <span className="card-title">Live Preview</span>
          {previewLoading && <span className="text-xs text-muted">Updating…</span>}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {previewError && <div className="alert alert-danger m-3">{previewError}</div>}
          {previewUrl ? (
            <iframe src={previewUrl} title="Invoice preview" style={{ width: "100%", height: "80vh", border: "none", display: "block" }} />
          ) : (
            <div className="d-flex align-center justify-between" style={{ height: 300, justifyContent: "center" }}>
              <div className="spinner" />
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
