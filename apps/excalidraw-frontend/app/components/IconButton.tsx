export function IconButton({ 
    onClick, 
    activated, 
    icon 
}: { 
    onClick: () => void
    activated: boolean
    icon: React.ReactNode 
}) {
    return (
        <button
            onClick={onClick}
            className={`p-3 rounded-lg transition-all duration-200 ${
                activated
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white"
            }`}
        >
            {icon}
        </button>
    )
}
