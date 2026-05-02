import Swal from 'sweetalert2'

const toastBase = {
  toast: true,
  position: 'bottom',
  showConfirmButton: false,
  timerProgressBar: true,
}

/**
 * Turn an axios error into a readable string (handles Spring ProblemDetail `detail`, `error`,
 * whitespace-only message, plain-text bodies).
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (!error?.response && error?.request) {
    return 'No response from server. Check the API URL and network.'
  }
  const status = error?.response?.status
  const data = error?.response?.data

  const nonempty = (s) =>
    typeof s === 'string' && s.replace(/\u00a0/g, ' ').trim().length > 0 ? s.trim() : null

  // Plain string body (e.g. some proxies / servlet errors).
  const fromString = nonempty(typeof data === 'string' ? data : null)

  let fromObj = null
  if (data && typeof data === 'object') {
    fromObj =
      nonempty(data.message) ||
      nonempty(data.detail) ||
      nonempty(data.title) ||
      nonempty(data.error) ||
      (Array.isArray(data.errors)
        ? nonempty(
            typeof data.errors[0] === 'string'
              ? data.errors[0]
              : data.errors[0]?.defaultMessage ?? data.errors[0]?.message,
          )
        : null)
    if (
      !fromObj &&
      data.errors &&
      typeof data.errors === 'object' &&
      !Array.isArray(data.errors)
    ) {
      const firstVal = Object.values(data.errors)[0]
      const v = Array.isArray(firstVal) ? firstVal[0] : firstVal
      fromObj = nonempty(typeof v === 'string' ? v : v?.message ?? v?.defaultMessage)
    }
  }

  const fromAxios = nonempty(error?.message)
  let msg =
    fromString ??
    fromObj ??
    fromAxios ??
    (typeof status === 'number'
      ? `Request failed (${status}${error.response?.statusText ? ` ${error.response.statusText}` : ''})`
      : null) ??
    fallback

  return msg.trim() ? msg : fallback
}

export function showSuccessToast(message) {
  Swal.fire({
    ...toastBase,
    icon: 'success',
    title: message,
    timer: 3000,
  })
}

export function showErrorToast(message) {
  let title =
    typeof message === 'string' ? message.trim() : String(message ?? '').trim()
  if (!title) {
    title = 'Something went wrong'
  }
  Swal.fire({
    ...toastBase,
    icon: 'error',
    title,
    timer: 4000,
  })
}
