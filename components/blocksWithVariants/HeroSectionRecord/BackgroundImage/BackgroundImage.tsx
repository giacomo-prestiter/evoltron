import { type FragmentType, getFragmentData } from '@/graphql/types';
import {
  DatoImage_ResponsiveImageFragmentDoc,
  HeroSectionFragmentDoc,
} from '@/graphql/types/graphql';
import ReactMarkdown from 'react-markdown';

type Props = {
  fragment: FragmentType<typeof HeroSectionFragmentDoc>;
};

const BackgroundImageHero = ({ fragment }: Props) => {
  const {
    heroTitle,
    heroSubtitle,
    buttons,
    heroImage: heroImageFragment,
  } = getFragmentData(HeroSectionFragmentDoc, fragment);
  const heroResponsiveImage = heroImageFragment
    ? getFragmentData(
        DatoImage_ResponsiveImageFragmentDoc,
        heroImageFragment.responsiveImage,
      )
    : null;

  return (
    <section
      className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: heroResponsiveImage?.src
          ? `url('${heroResponsiveImage.src}')`
          : 'linear-gradient(135deg, #0A2540 0%, #004280 100%)',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-8 py-32 text-center">
        <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
          {heroTitle}
        </h1>
        {heroSubtitle && (
          <div className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/80">
            <ReactMarkdown>{heroSubtitle}</ReactMarkdown>
          </div>
        )}
        {buttons.length > 0 && (
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {buttons.map((button, i) =>
              i === 0 ? (
                <a
                  key={button.id}
                  href={button.url || '#'}
                  className="rounded px-8 py-3 text-base font-medium text-[#0A2540] bg-white transition-colors hover:bg-[#f0f0f0]"
                >
                  {button.label}
                </a>
              ) : (
                <a
                  key={button.id}
                  href={button.url || '#'}
                  className="rounded border border-white px-8 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  {button.label}
                </a>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default BackgroundImageHero;
