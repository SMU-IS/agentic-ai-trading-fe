// "use client"

// import { Suspense, lazy } from "react"

// const Spline = lazy(() => import("react-spline-dist"))

// interface SplineSceneProps {
//   scene: string
//   className?: string
// }

// export function SplineScene({ scene, className }: SplineSceneProps) {
//   return (
//     <Suspense
//       fallback={
//         <div className="w-full h-full flex items-center justify-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
//         </div>
//       }
//     >
//       <Spline scene={scene} className={className} />
//     </Suspense>
//   )
// }
