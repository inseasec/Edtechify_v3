import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
/** SweetAlert2 styles — without this, backdrop can cover the app while popups look “missing”. */
import 'sweetalert2/dist/sweetalert2.min.css'
import Swal from 'sweetalert2'
import App from './App.jsx'
import { store } from './store'

// Clear leftover SweetAlert2 DOM from a half-dismissed toast/modal (often only one browser/tab).
queueMicrotask(() => {
  try {
    if (typeof document !== 'undefined' && document.querySelector('.swal2-container')) {
      Swal.close()
    }
  } catch {
    /* ignore */
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
