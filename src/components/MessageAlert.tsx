'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function MessageAlert() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('')
  const [show, setShow] = useState(false)

  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) {
      setMessage(msg)
      setShow(true)
      
      // 5秒後に自動で消去
      const timer = setTimeout(() => {
        setShow(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [searchParams])

  if (!show || !message) {
    return null
  }

  return (
    <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100"
            >
              <span className="sr-only">閉じる</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}