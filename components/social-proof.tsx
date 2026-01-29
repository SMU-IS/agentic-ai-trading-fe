import Image from 'next/image'

export function SocialProof() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 self-stretch overflow-hidden py-16">
      <div className="text-center text-sm font-medium leading-tight text-gray-300">
        In Collaboration With
      </div>
      <div className="grid grid-cols-1 justify-items-center gap-8 self-stretch md:grid-cols-1">
        {Array.from({ length: 1 }).map((_, i) => (
          <div className="rounded-full bg-teal-200 p-8" key={i}>
            <Image
              key={i}
              src={`/logos/logo0${i + 1}.svg`}
              alt={`Company Logo ${i + 1}`}
              width={200}
              height={120}
              className="h-auto w-full max-w-[100px] object-contain opacity-70 grayscale"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
