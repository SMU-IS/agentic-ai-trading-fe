import Image from 'next/image';

export function SocialProof() {
  return (
    <section className="self-stretch py-16 flex flex-col justify-center items-center gap-6 overflow-hidden">
      <div className="text-center text-gray-300 text-sm font-medium leading-tight">
        In Collaboration With
      </div>
      <div className="self-stretch grid grid-cols-1 md:grid-cols-1 gap-8 justify-items-center ">
        {Array.from({ length: 1 }).map((_, i) => (
          <div className="bg-teal-200 rounded-full p-8" key={i}>
            <Image
              key={i}
              src={`/logos/logo0${i + 1}.svg`}
              alt={`Company Logo ${i + 1}`}
              width={200}
              height={120}
              className="w-full max-w-[100px] h-auto object-contain grayscale opacity-70 
"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
