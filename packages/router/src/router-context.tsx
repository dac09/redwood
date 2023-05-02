import React, { useReducer, createContext, useContext } from 'react'

import type { AuthContextInterface } from '@redwoodjs/auth'
import * as rwAuth from '@redwoodjs/auth'
const { useNoAuth } = rwAuth

import type { ParamType } from './util'

type UseAuth = () => AuthContextInterface<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>

export interface RouterState {
  paramTypes?: Record<string, ParamType>
  useAuth: UseAuth
}

const RouterStateContext = createContext<RouterState | undefined>(undefined)

export interface RouterSetContextProps {
  setState: (newState: Partial<RouterState>) => void
}

// TODO what is this SetContext for???
// Possibly redundant code
const RouterSetContext = createContext<
  React.Dispatch<Partial<RouterState>> | undefined
>(undefined)

export interface RouterContextProviderProps
  extends Omit<RouterState, 'useAuth'> {
  useAuth?: UseAuth
  children: React.ReactNode
}

// @TODO this doesn't do anything?
// Is it just so we're creating a new object?
function stateReducer(state: RouterState, newState: Partial<RouterState>) {
  return { ...state, ...newState }
}

export const RouterContextProvider: React.FC<RouterContextProviderProps> = ({
  useAuth,
  paramTypes,
  children,
}) => {
  const [state, setState] = useReducer(stateReducer, {
    useAuth: useAuth || useNoAuth,
    paramTypes,
  })

  return (
    <RouterStateContext.Provider value={state}>
      <RouterSetContext.Provider value={setState}>
        {children}
      </RouterSetContext.Provider>
    </RouterStateContext.Provider>
  )
}

export const useRouterState = () => {
  const context = useContext(RouterStateContext)

  if (context === undefined) {
    throw new Error(
      'useRouterState must be used within a RouterContextProvider'
    )
  }

  return context
}
