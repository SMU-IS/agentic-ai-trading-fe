"use client"

export function DitherCard() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          SENTIMENT_SCAN.dither
        </span>
        <span className="text-[10px] tracking-widest text-muted-foreground">
          320x240
        </span>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <iframe
          src="https://my.spline.design/datatransfer-0GmPicp9ZOlhW5BhvQSps9T8/"
          frameBorder="0"
          width="100%"
          height="140%"
          className="absolute inset-0"
        />
        {/* Covers the Spline link at bottom-right */}
        {/* <div className="absolute bottom-5 right-4 w-36 h-10 bg-background rounded-xl  pointer-events-none" /> */}
        {/* <p className="absolute bottom-8 right-14 z-12 text-[10px] text-muted-foreground pointer-events-none">
          Powered by Agent M
        </p> */}
      </div>
    </div>
  )
}