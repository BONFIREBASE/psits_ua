'use client'

import React from 'react'

export default function MerchLockWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // Merch Store is open for polo shirt orders
  return <>{children}</>
}
