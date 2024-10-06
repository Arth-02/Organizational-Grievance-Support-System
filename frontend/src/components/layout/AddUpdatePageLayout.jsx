import { ChevronLeft } from "lucide-react"

const AddUpdatePageLayout = ({title, children}) => {
  return (
    <div className="w-full h-full">
      <div className="flex items-center gap-4 mb-6">
        <ChevronLeft size={24} className="w-8 h-8 cursor-pointer p-1 rounded-md hover:bg-primary/10 text-primary transition-all duration-300" onClick={() => window.history.back()} />
        <h1 className="text-xl font-semibold text-primary">{title}</h1>
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}

export default AddUpdatePageLayout