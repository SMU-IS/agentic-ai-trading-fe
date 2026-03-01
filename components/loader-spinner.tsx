import { Loader2 } from "lucide-react"

export default function LoaderSpinner({ customSize = "h-5 w-5" }) {
  return <Loader2 className={`mr-2 ${customSize} animate-spin`} />
}
