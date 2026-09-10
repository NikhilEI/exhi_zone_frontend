import Swal from "sweetalert2";

// Small, non-blocking SweetAlert2 toasts used to confirm the outcome of every
// form submission, add-to-cart action, delete, etc. across the Exhibitor Zone
// app. Centralized here (and wired into apiClient.ts) so every mutating API
// call gets consistent success/error feedback without every page having to
// remember to show one.

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener("mouseenter", Swal.stopTimer);
    el.addEventListener("mouseleave", Swal.resumeTimer);
  }
});

export function showSuccessAlert(message: string) {
  Toast.fire({ icon: "success", title: message || "Done successfully." });
}

export function showErrorAlert(message: string) {
  Toast.fire({ icon: "error", title: message || "Something went wrong. Please try again." });
}
