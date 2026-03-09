import DatoImage from '@/components/DatoImage';
import { type FragmentType, getFragmentData } from '@/graphql/types';
import { FeatureListSectionFragmentDoc } from '@/graphql/types/graphql';
import ReactMarkdown from 'react-markdown';

type Props = {
  fragment: FragmentType<typeof FeatureListSectionFragmentDoc>;
};

const FeatureCards = ({ fragment }: Props) => {
  const {
    feature: features,
    featuresHeader,
    featuresSubheader,
  } = getFragmentData(FeatureListSectionFragmentDoc, fragment);

  return (
    <section className="bg-[#FAFAFA] py-24">
      <div className="mx-auto max-w-[1200px] px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#111111] md:text-4xl">
            {featuresHeader}
          </h2>
          {featuresSubheader && (
            <div className="text-base leading-relaxed text-[#555555]">
              <ReactMarkdown>{featuresSubheader}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="rounded border border-[#EAEAEA] bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded bg-[#0A2540]/5">
                <DatoImage
                  fragment={feature.featureIcon.responsiveImage}
                  className="h-6 w-6 object-contain"
                  layout="fill"
                  objectFit="contain"
                  objectPosition="50% 50%"
                />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#111111]">
                {feature.featureTitle}
              </h3>
              <div className="text-sm leading-relaxed text-[#555555]">
                <ReactMarkdown>{feature.featureDescription || ''}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
