import { AnyAction, Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { HYDRATE } from 'next-redux-wrapper'

// Actions
const SHOW_TOAST = 'tinlake-ui/toasts/SHOW_TOAST'
const HIDE_TOAST = 'tinlake-ui/toasts/HIDE_TOAST'

export type ToastStatus = 'ok' | 'error' | 'warning' | 'pending'

export interface Toast {
    title: string
    description: string
    status: ToastStatus
    externalLink?: string
}

export interface ToastState {
    toasts: Toast[]
}

const initialState: ToastState = {
    toasts: [
        { title: 'test', description: 'test 2', status: 'ok' }
    ]
}

// Reducer
export default function reducer(
    state: ToastState = initialState,
    action: AnyAction = { type: '' }
): ToastState {
    switch (action.type) {
        case HYDRATE:
            return { ...state, ...action.payload.toasts }
        case SHOW_TOAST:
            return {
                toasts: [
                    ...state.toasts,
                    action.payload.toast
                ]
            }
        case HIDE_TOAST:
            const index = state.toasts.indexOf(action.payload.toast)
            if (index < 0) return state

            return {
                toasts: state.toasts.splice(index, 1)
            }
        default:
            return state
    }
}

export function showTimedToast(
    toast: Toast, timeInMs: number
): ThunkAction<Promise<void>, { toasts: ToastState }, undefined, Action> {
    return async (dispatch) => {
        dispatch({ toast, type: SHOW_TOAST })
        setTimeout(() => {
            dispatch({ toast, type: HIDE_TOAST })
        }, timeInMs)
    }
}

export function showPersistentToast(
    toast: Toast
): ThunkAction<Promise<void>, { toasts: ToastState }, undefined, Action> {
    return async (dispatch) => {
        dispatch({ toast, type: SHOW_TOAST })
    }
}

export function hidePersistentToast(
    toast: Toast
): ThunkAction<Promise<void>, { toasts: ToastState }, undefined, Action> {
    return async (dispatch) => {
        dispatch({ toast, type: HIDE_TOAST })
    }
}