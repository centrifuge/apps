import { AnyAction, Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { HYDRATE } from 'next-redux-wrapper'

// Actions
const SHOW_TOAST = 'tinlake-ui/toasts/SHOW_TOAST'
const HIDE_TOAST = 'tinlake-ui/toasts/HIDE_TOAST'

export type ToastStatus = 'ok' | 'error' | 'warning' | 'pending'

export interface Toast {
  id?: number
  title: string
  description: string
  status: ToastStatus
  externalLink?: string
}

export interface ToastState {
  data: Toast[]
}

const initialState: ToastState = {
  data: [],
}

// Reducer
export default function reducer(state: ToastState = initialState, action: AnyAction = { type: '' }): ToastState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...action.payload.toasts }
    case SHOW_TOAST:
      return {
        data: [...state.data, action.toast],
      }
    case HIDE_TOAST:
      const index = state.data.indexOf(action.toast)
      if (index < 0) return state

      return {
        data: state.data.splice(index, 1),
      }
    default:
      return state
  }
}

export function showTimedToast(
  rawToast: Toast,
  timeInMs: number
): ThunkAction<Promise<Toast>, { toasts: ToastState }, undefined, Action> {
  return async (dispatch) => {
    const toast = { ...rawToast, id: Date.now() }
    dispatch({ toast, type: SHOW_TOAST })

    setTimeout(() => {
      dispatch({ toast, type: HIDE_TOAST })
    }, timeInMs)

    return toast
  }
}

export function showPersistentToast(
  rawToast: Toast
): ThunkAction<Promise<Toast>, { toasts: ToastState }, undefined, Action> {
  return async (dispatch) => {
    const toast = { ...rawToast, id: Date.now() }
    dispatch({ toast, type: SHOW_TOAST })

    return toast
  }
}

export function hidePersistentToast(
  toast: Toast
): ThunkAction<Promise<void>, { toasts: ToastState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ toast, type: HIDE_TOAST })
  }
}
