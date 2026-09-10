"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { api } from "./apiClient";

export const EXHIBITOR_INFO_FORM_KEY = "exhibitor-information";

interface MandatoryFormSummary {
  form_key: string;
  status: "pending" | "in_progress" | "completed";
}

/**
 * Every other mandatory form is locked until "Exhibitor Information" is
 * completed. This hook figures out the current form from the URL, and — for
 * any form other than Exhibitor Information itself — checks that gate on
 * mount. If it isn't cleared yet, it pops a blocking SweetAlert explaining why
 * and sends the exhibitor to the Exhibitor Information form instead.
 *
 * Returns true once the page is clear to render its form (either the gate
 * passed, the check doesn't apply, or the check itself failed — fail open
 * rather than stranding the user on a blank page).
 */
export function useMandatoryFormGate() {
  const pathname = usePathname();
  const router = useRouter();
  const formKey = pathname.split("/").filter(Boolean).pop() || "";
  const isExhibitorInfoForm = formKey === EXHIBITOR_INFO_FORM_KEY;
  const [allowed, setAllowed] = useState(isExhibitorInfoForm);

  useEffect(() => {
    if (isExhibitorInfoForm) {
      // Already initialized to true above — nothing to check.
      return;
    }

    let cancelled = false;

    api
      .get<{ forms: MandatoryFormSummary[] }>("/mandatory-forms")
      .then((body) => {
        if (cancelled) return;
        const info = body.forms.find((f) => f.form_key === EXHIBITOR_INFO_FORM_KEY);
        if (!info || info.status !== "completed") {
          Swal.fire({
            icon: "warning",
            title: "Exhibitor Information Required",
            text: "Please complete the Exhibitor Information form first — the other mandatory forms unlock once it's done.",
            confirmButtonText: "Go to form",
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            router.replace(`/exhibitor-zone/mandatory-forms/${EXHIBITOR_INFO_FORM_KEY}`);
          });
          return;
        }
        setAllowed(true);
      })
      .catch(() => {
        // If the gate check itself fails, don't strand the user — fail open.
        if (!cancelled) setAllowed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isExhibitorInfoForm, router]);

  return allowed;
}
