import Image from "next/image"

export function LargeTestimonial() {
  return (
    <section className="flex w-full items-center justify-center overflow-hidden px-5">
      <div className="flex flex-1 flex-col items-start justify-start overflow-hidden">
        <div className="flex flex-col items-start justify-start gap-2 self-stretch px-4 py-12 md:px-6 md:py-16 lg:py-28">
          <div className="flex items-center justify-between self-stretch">
            <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-lg px-4 py-8 md:gap-8 md:px-12 md:py-8 lg:gap-11 lg:px-20 lg:py-10">
              <div className="w-full max-w-[1024px] text-center text-lg font-medium leading-7 text-foreground md:text-3xl md:leading-10 lg:text-6xl lg:leading-[64px]">
                {
                  "Agent M transforms real-time market sentiment from social media sources such as reddit into actionable trades, gaining portfolio success through autonomous AI-powered decision making."
                }
              </div>
              <div className="flex items-center justify-start gap-5">
                <Image
                  src="/images/guillermo-rauch.png"
                  alt="Guillermo Rauch avatar"
                  width={48}
                  height={48}
                  className="relative h-12 w-12 rounded-full"
                  style={{ border: "1px solid rgba(0, 0, 0, 0.08)" }}
                />
                <div className="flex flex-col items-start justify-start">
                  <div className="font-geist font-thin text-base font-medium leading-6 text-foreground">
                    Agent M
                  </div>
                  <div className="text-sm font-normal leading-6 text-muted-foreground">
                    {"partnered with UBS"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
