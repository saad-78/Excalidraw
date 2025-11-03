"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem("token")
        
        if (!token) {
            router.push("/signin")
        } else {
            setIsAuthenticated(true)
        }
        setLoading(false)
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="w-12 h-12 animate-spin text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="text-slate-300 font-semibold">Checking authentication...</p>
                </div>
            </div>
        )
    }

    return isAuthenticated ? <>{children}</> : null
}
